// src/services/printService.js
// 🖨️ Serviço principal de impressão - VERSÃO REFATORADA E CORRIGIDA
// ✅ Código duplicado removido
// ✅ Templates reutilizáveis
// ✅ Integração com ConfigService
// ✅ FUNÇÕES TÉRMICAS ADICIONADAS - conectarImpressoraTermica, desconectarImpressoraTermica, testarImpressoraTermica

import thermalPrintService from './thermalPrintService';
import configService from './ConfigService';

// ========================================
// 📋 TEMPLATES HTML REUTILIZÁVEIS
// ========================================

const HTMLTemplates = {
    /**
     * Gera o cabeçalho HTML padrão
     */
    getHeader: (titulo = 'Impressão') => {
        const estabelecimento = configService.getEstabelecimento();
        const impressora = configService.getImpressora();

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${impressora.fonte}, monospace;
            font-size: 16px;
            width: ${impressora.largura};
            margin: 0 auto;
            padding: ${impressora.margens};
            background: white;
        }
        
        .cabecalho {
            text-align: center;
            margin-bottom: 5px;
            padding-bottom: 10px;
            border-bottom: 2px dashed #000;
        }
        
        .estabelecimento {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .info-estabelecimento {
            font-size: 12px;
            line-height: 1.4;
            color: #000;
        }
        
        .linha-separadora {
            border-bottom: 1px dashed #000;
            margin: 5px 0;
        }
        
        .secao {
            margin: 5px 0;
        }
        
        .secao-titulo {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 8px;
            padding: 5px;
            background: #f0f0f0;
            border-left: 3px solid #000;
        }
        .secao-titulo-numero-pedido {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
            padding: 5px;
            background: #f0f0f0;
            border-left: 3px solid #000;
        }
        
        .item {
            padding: 8px 0;
            border-bottom: 1px dotted #000;
        }
        
        .item:last-child {
            border-bottom: none;
        }
        
        .item-linha {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        
        .item-descricao {
            font-weight: 600;
            font-size: 20px;
        }
        
        .item-observacao {
            font-size: 16px;
            font-weight: 500;
            color: #000;
            font-style: italic;
            margin-top: 3px;
            padding-left: 10px;
        }

        .item-adicional {
            font-size: 15px;
            color: #000;
            font-style: italic;
            font-weight: 600;
            margin-top: 3px;
            padding-left: 10px;
        }
        
        .totais {
            margin-top: 5px;
            padding-top: 5px;
            border-top: 2px solid #333;
        }
        
        .total-linha {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 16px;
        }
        
        .total-final {
            font-weight: bold;
            font-size: 20px;
            padding: 10px 0;
            margin-top: 5px;
        }
        
        .rodape {
            text-align: center;
            margin-top: 5px;
            padding-top: 10px;
            border-top: 2px dashed #333;
            font-size: 11px;
        }
        
        .agradecimento {
            margin: 5px 0;
            font-weight: bold;
        }
        
        .info-linha {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .info-linha-data-hora {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 14px;
            font-weight: 500;
        }
        
        @media print {
            @page {
                size: ${impressora.largura} auto;
                margin: 0;
            }
            body {
                margin: 0;
                padding: ${impressora.margens};
            }
        }
    </style>
</head>
<body>
    <div class="cabecalho">
        <div class="estabelecimento">${estabelecimento.nome}</div>
        <div class="info-estabelecimento">
            ${estabelecimento.endereco}<br>
            ${estabelecimento.cidade}
        </div>
    </div>
`;
    },

    /**
     * Gera o rodapé HTML padrão
     */
    getFooter: (mensagemExtra = '') => {
        const agora = new Date().toLocaleString('pt-BR');
        return `
    <div class="rodape">
        <div class="agradecimento">Obrigado pela preferência!</div>
        <div>Impresso em: ${agora}</div>
        ${mensagemExtra ? `<div style="margin-top: 5px;">${mensagemExtra}</div>` : ''}
    </div>
</body>
</html>
`;
    },

    /**
     * Formata preço
     */
    formatarPreco: (valor) => {
        return `R$ ${parseFloat(valor || 0).toFixed(2)}`;
    }
};

// ========================================
// 🖨️ SERVIÇO PRINCIPAL
// ========================================

const printService = {

    // 🔧 Obter tipo de impressora configurada
    obterTipoImpressao: () => {
        return configService.get('impressora_tipo');
    },

    // 🔧 Verificar se é térmica
    isTermica: () => {
        return configService.isTermica();
    },

    // ========================================
    // 📄 IMPRESSÃO DE COMANDA
    // ========================================

    /**
    * Imprimir comanda
    */
    imprimirComanda: async (dados) => {
    try {
        console.log('🖨️ Imprimindo comanda:', dados);

        const config = await configService.get('impressao_comanda');
        const impressora = config?.impressora || 'padrao';

        // Construir conteúdo da comanda
        let conteudo = `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ${config?.nome_estabelecimento || 'RESTAURANTE'}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        COMANDA Nº ${dados.numero}
        Data: ${new Date(dados.data).toLocaleString('pt-BR')}
        Cliente: ${dados.cliente || 'Balcão'}
        ${dados.mesa ? `Mesa: ${dados.mesa}` : ''}
        
        ${dados.tipo_pedido === 'entrega' ? '🚚 ENTREGA' : '📍 BALCÃO'}
        `;

        // 🚚 ADICIONAR DADOS DE ENTREGA SE HOUVER
        if (dados.tipo_pedido === 'entrega') {
        conteudo += `
        ──────────────────────────────
        DADOS DE ENTREGA:
        
        Zona: ${dados.zona_entrega || '-'}
        Taxa: R$ ${(dados.taxa_entrega || 0).toFixed(2)}
        
        Endereço:
        ${dados.endereco_entrega || 'Não informado'}
        ──────────────────────────────
        `;
        }

        conteudo += `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ITENS:
        ──────────────────────────────
        `;

        // Itens
        dados.itens.forEach((item, index) => {
        conteudo += `
        ${index + 1}. ${item.nome}
            Qtd: ${item.quantidade}
        `;

        // Adicionais
        if (item.adicionais && item.adicionais.length > 0) {
            conteudo += '   Adicionais:\n';
            item.adicionais.forEach(adicional => {
            conteudo += `   + ${adicional.nome}\n`;
            });
        }

        // Observações
        if (item.observacoes) {
            conteudo += `   Obs: ${item.observacoes}\n`;
        }

        conteudo += '   ──────────────────────────────\n';
        });

        if (dados.observacoes) {
        conteudo += `
        
        OBSERVAÇÕES GERAIS:
        ${dados.observacoes}
        `;
        }

        conteudo += `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ${config?.mensagem_rodape || 'Obrigado pela preferência!'}
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;

        // Abrir janela de impressão
        const janelaImpressao = window.open('', '_blank');
        janelaImpressao.document.write(`
        <html>
            <head>
            <title>Comanda ${dados.numero}</title>
            <style>
                @page { 
                size: 80mm auto; 
                margin: 0; 
                }
                body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 10px;
                white-space: pre-wrap;
                }
                @media print {
                body { margin: 0; }
                }
            </style>
            </head>
            <body>${conteudo}</body>
        </html>
        `);

        janelaImpressao.document.close();
        
        setTimeout(() => {
        janelaImpressao.print();
        }, 250);

        return { success: true };

    } catch (error) {
        console.error('❌ Erro ao imprimir comanda:', error);
        throw error;
    }
    },

    // ============================================
    // ATUALIZAÇÃO: imprimirReciboVenda
    // ============================================

    // Localizar a função imprimirReciboVenda e adicionar dados de entrega:

    imprimirReciboVenda: async (dados) => {
    try {
        console.log('🖨️ Imprimindo recibo:', dados);

        const config = await configService.getConfiguracao('impressao_recibo');

        let conteudo = `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ${config?.nome_estabelecimento || 'RESTAURANTE'}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        RECIBO DE VENDA
        
        Nº: ${dados.numero}
        Data: ${new Date(dados.data).toLocaleString('pt-BR')}
        Cliente: ${dados.cliente || 'Balcão'}
        
        ${dados.tipo_pedido === 'entrega' ? '🚚 ENTREGA' : '📍 BALCÃO'}
        `;

        // 🚚 DADOS DE ENTREGA SE HOUVER
        if (dados.tipo_pedido === 'entrega' && dados.endereco_entrega) {
        conteudo += `
        ──────────────────────────────
        Endereço: ${dados.endereco_entrega}
        Taxa de Entrega: R$ ${(dados.taxa_entrega || 0).toFixed(2)}
        ──────────────────────────────
        `;
        }

        conteudo += `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ITENS:
        ──────────────────────────────
        `;

        // Itens
        let subtotal = 0;
        dados.itens.forEach((item, index) => {
        const valorItem = item.totalItem || (item.quantidade * item.preco);
        subtotal += valorItem;

        conteudo += `
        ${index + 1}. ${item.nome}
            ${item.quantidade} x R$ ${item.preco.toFixed(2)} = R$ ${valorItem.toFixed(2)}
        `;

        if (item.adicionais && item.adicionais.length > 0) {
            item.adicionais.forEach(adicional => {
            conteudo += `   + ${adicional.nome}\n`;
            });
        }
        });

        conteudo += `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        Subtotal: R$ ${subtotal.toFixed(2)}
        `;

        // 🚚 TAXA DE ENTREGA
        if (dados.taxa_entrega > 0) {
        conteudo += `
        Taxa de Entrega: R$ ${dados.taxa_entrega.toFixed(2)}
        `;
        }

        conteudo += `
        ──────────────────────────────
        TOTAL: R$ ${dados.total.toFixed(2)}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        Forma de Pagamento: ${dados.forma_pagamento}
        Valor Pago: R$ ${dados.valor_pago.toFixed(2)}
        Troco: R$ ${dados.troco.toFixed(2)}
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ${config?.mensagem_rodape || 'Obrigado pela preferência!'}
        Volte sempre!
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;

        const janelaImpressao = window.open('', '_blank');
        janelaImpressao.document.write(`
        <html>
            <head>
            <title>Recibo ${dados.numero}</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 10px;
                white-space: pre-wrap;
                }
                @media print { body { margin: 0; } }
            </style>
            </head>
            <body>${conteudo}</body>
        </html>
        `);

        janelaImpressao.document.close();
        
        setTimeout(() => {
        janelaImpressao.print();
        }, 250);

        return { success: true };

    } catch (error) {
        console.error('❌ Erro ao imprimir recibo:', error);
        throw error;
    }
    },

    imprimirComandaTermica: async (pedido) => {
        // Implementação comentada - descomentar quando thermalPrintService estiver pronto
        const statusConexao = await thermalPrintService.obterStatusDetalhado();

        if (!statusConexao.conectada) {
            console.log(`🔄 Reconectando...`);
            await thermalPrintService.conectar();
        }

        const comandosESCPOS = thermalPrintService.gerarComandaESCPOS(pedido);
        return await thermalPrintService.enviarParaImpressora(comandosESCPOS, 'comanda');
        /*
        console.log('⚠️ Impressão térmica ainda não implementada, usando fallback');
        const htmlComanda = printService.gerarHTMLComanda(pedido);
        return await printService.executarImpressao(htmlComanda, 'comanda');*/
    },

    gerarHTMLComanda: (pedido) => {
        const header = HTMLTemplates.getHeader('Comanda de Pedido');

        let html = header;

        // Informações do pedido
        html += `
    <div class="secao">
        <div class="secao-titulo-numero-pedido">COMANDA ${pedido.numero}</div>
        <div class="info-linha">
            <strong>Cliente:</strong>
            <span>${pedido.cliente || 'Balcão'}</span>
        </div>
        <div class="info-linha-data-hora">
            <strong>Data/Hora:</strong>
            <span>${new Date(pedido.data).toLocaleString('pt-BR')}</span>
        </div>
    </div>
    
    <div class="linha-separadora"></div>
`;

        // Itens do pedido
        html += `
    <div class="secao">
        <div class="secao-titulo">ITENS DO PEDIDO</div>
`;

        pedido.itens.forEach(item => {
            html += `
        <div class="item">
            <div class="item-linha">
                <span class="item-descricao">${item.quantidade} ${item.nome}</span>
                ${item.preco ?
                `<div class="item-preco">
                    <strong>${HTMLTemplates.formatarPreco(item.preco * item.quantidade)}</strong> 
                    </div>`
                : ''}
                </div>
                ${item.adicionais.map((adicional) => `
                    <div class="item-adicional">
                        ${adicional.nome}
                    </div>`
                ).join("")}
            ${item.observacoes ? `<div class="item-observacao">Obs: ${item.observacoes}</div>` : ''}
        </div>
`;
        });

        html += `
    </div>
    
    <div class="totais">
        <div class="total-linha total-final">
        ${pedido.total ? 
            `<strong>TOTAL:</strong>
            <strong>${HTMLTemplates.formatarPreco(pedido.total)}</strong>
            ` : ''}
        </div>
    </div>
`;

        html += HTMLTemplates.getFooter('Via da Cozinha');

        return html;
    },

    // ========================================
    // 🧾 IMPRESSÃO DE RECIBO DE VENDA
    // ========================================

    imprimirReciboVenda: async (venda) => {
        try {
            if (printService.isTermica()) {
                console.log('🔥 Usando impressão térmica para recibo');
                return await printService.imprimirReciboTermica(venda);
            } else {
                console.log('🖨️ Usando impressão comum para recibo', venda);
                const htmlRecibo = printService.gerarHTMLRecibo(venda);
                return await printService.executarImpressao(htmlRecibo, 'recibo');
            }
        } catch (error) {
            console.error('❌ Erro ao imprimir recibo:', error);

            // Fallback para impressão comum
            if (printService.isTermica()) {
                console.log('🔄 Fallback: tentando impressão comum...');
                const htmlRecibo = printService.gerarHTMLRecibo(venda);
                return await printService.executarImpressao(htmlRecibo, 'recibo');
            }

            throw error;
        }
    },

    imprimirReciboTermica: async (venda) => {
        // Implementação comentada - descomentar quando thermalPrintService estiver pronto
        const statusConexao = await thermalPrintService.obterStatusDetalhado();

        if (!statusConexao.conectada) {
            console.log(`🔄 Reconectando...`);
            await thermalPrintService.conectar();
        }

        const comandosESCPOS = thermalPrintService.gerarReciboESCPOS(venda);
        return await thermalPrintService.enviarParaImpressora(comandosESCPOS, 'recibo');
        /*
        console.log('⚠️ Impressão térmica de recibo ainda não implementada, usando fallback');
        const htmlRecibo = printService.gerarHTMLRecibo(venda);
        return await printService.executarImpressao(htmlRecibo, 'recibo');*/
    },

    gerarHTMLRecibo: (venda) => {
        const header = HTMLTemplates.getHeader('Recibo de Venda');

        let html = header;

        // Informações da venda
        html += `
    <div class="secao">
        <div class="secao-titulo">RECIBO DE VENDA #${venda.numero}</div>
        <div class="secao-titulo">COMANDA #${venda.id}</div>
        <div class="info-linha">
            <strong>Data:</strong>
            <span>${new Date(venda.data).toLocaleString('pt-BR')}</span>
        </div>
        <div class="info-linha">
            <strong>Cliente:</strong>
            <span>${venda.cliente || 'Não informado'}</span>
        </div>
        <div class="info-linha">
            <strong>Forma de Pagamento:</strong>
            <span>${venda.forma_pagamento || 'Não especificada'}</span>
        </div>
    </div>
    
    <div class="linha-separadora"></div>
`;

        // Itens da venda
        html += `
    <div class="secao">
        <div class="secao-titulo">📦 PRODUTOS</div>
`;

        venda.itens.forEach(item => {
            html += `
        <div class="item">
            <div class="item-linha">
                <span>${item.quantidade}x ${item.nome}</span>
                <span>${HTMLTemplates.formatarPreco(item.preco_produto)}</span>
            </div>
            ${item.adicionais.map((adicional) => `
                    <div class="item-adicional">
                        ${adicional.nome}
                        ${HTMLTemplates.formatarPreco(`${adicional.preco}`)}
                    </div>`
            ).join("")}
            <div class="item-linha" style="font-size: 12px; margin-top: 2px;">
                <span></span>
                <strong>${HTMLTemplates.formatarPreco(item.preco * item.quantidade)}</strong>
            </div>
            ${item.observacoes ? `<div class="item-observacao">Obs: ${item.observacoes}</div>` : ''}
        </div>`;
        });

        html += `
    </div>
`;

        // Totais
        const subtotal = venda.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        const total = subtotal - (venda.desconto || 0);
        const valorPago = parseFloat(venda.valor_pago || total);
        const troco = valorPago - total;

        html += `
    <div class="totais">
        <div class="total-linha">
            <span>Subtotal:</span>
            <span>${HTMLTemplates.formatarPreco(subtotal)}</span>
        </div>
        ${venda.desconto > 0 ? `
        <div class="total-linha" style="color: #28a745;">
            <span>Desconto:</span>
            <span>- ${HTMLTemplates.formatarPreco(venda.desconto)}</span>
        </div>
        ` : ''}
        <div class="total-linha total-final">
            <strong>TOTAL:</strong>
            <strong>${HTMLTemplates.formatarPreco(total)}</strong>
        </div>
        ${venda.forma_pagamento !== 'prazo' ? `
        <div class="linha-separadora"></div>
        <div class="total-linha">
            <span>Valor Pago:</span>
            <span>${HTMLTemplates.formatarPreco(valorPago)}</span>
        </div>
        ${troco > 0 ? `
        <div class="total-linha" style="font-size: 14px;">
            <strong>Troco:</strong>
            <strong>${HTMLTemplates.formatarPreco(troco)}</strong>
        </div>
        ` : ''}
        ` : ''}
    </div>
`;

        html += HTMLTemplates.getFooter('Via do Cliente - Não é documento fiscal');

        return html;
    },

    // ========================================
    // 📊 IMPRESSÃO DE RELATÓRIO DE CAIXA
    // ========================================

    imprimirRelatorioCaixa: async (dadosCaixa) => {
        try {
            const html = printService.gerarHTMLRelatorio(dadosCaixa);
            return await printService.executarImpressao(html, 'relatorio');
        } catch (error) {
            console.error('❌ Erro ao imprimir relatório:', error);
            throw error;
        }
    },

    gerarHTMLRelatorio: (dadosCaixa) => {
        const header = HTMLTemplates.getHeader('Relatório de Caixa');

        let html = header;

        // Calcular totais
        const entradas = dadosCaixa.movimentos?.filter(m => m.tipo === 'entrada') || [];
        const saidas = dadosCaixa.movimentos?.filter(m => m.tipo === 'saida') || [];
        const totalEntradas = entradas.reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);
        const totalSaidas = saidas.reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);
        const saldoFinal = parseFloat(dadosCaixa.saldo_inicial || 0) + totalEntradas - totalSaidas;

        // Informações do caixa
        html += `
    <div class="secao">
        <div class="secao-titulo">📊 RELATÓRIO DE FECHAMENTO DE CAIXA</div>
        <div class="info-linha">
            <strong>Caixa #:</strong>
            <span>${dadosCaixa.id}</span>
        </div>
        <div class="info-linha">
            <strong>Abertura:</strong>
            <span>${new Date(dadosCaixa.data_abertura).toLocaleString('pt-BR')}</span>
        </div>
        <div class="info-linha">
            <strong>Fechamento:</strong>
            <span>${dadosCaixa.data_fechamento ? new Date(dadosCaixa.data_fechamento).toLocaleString('pt-BR') : 'Em andamento'}</span>
        </div>
        <div class="info-linha">
            <strong>Responsável:</strong>
            <span>${dadosCaixa.usuario_abertura_nome || 'N/A'}</span>
        </div>
    </div>
    
    <div class="linha-separadora"></div>
`;

        // Resumo financeiro
        html += `
    <div class="secao">
        <div class="secao-titulo">💰 RESUMO FINANCEIRO</div>
        <div class="totais">
            <div class="total-linha">
                <strong>Saldo Inicial:</strong>
                <strong>${HTMLTemplates.formatarPreco(dadosCaixa.saldo_inicial)}</strong>
            </div>
            <div class="total-linha" style="color: #28a745;">
                <span>Total de Entradas:</span>
                <span>+ ${HTMLTemplates.formatarPreco(totalEntradas)}</span>
            </div>
            <div class="total-linha" style="color: #dc3545;">
                <span>Total de Saídas:</span>
                <span>- ${HTMLTemplates.formatarPreco(totalSaidas)}</span>
            </div>
            <div class="total-linha total-final">
                <strong>SALDO FINAL:</strong>
                <strong>${HTMLTemplates.formatarPreco(saldoFinal)}</strong>
            </div>
        </div>
    </div>
`;

        // Movimentos
        if (entradas.length > 0 || saidas.length > 0) {
            html += `
    <div class="linha-separadora"></div>
    <div class="secao">
        <div class="secao-titulo">📈 MOVIMENTOS (${entradas.length + saidas.length} total)</div>
        <div class="info-linha">
            <span>Entradas: ${entradas.length}</span>
            <span>Saídas: ${saidas.length}</span>
        </div>
    </div>
`;
        }

        html += HTMLTemplates.getFooter('Relatório Interno - Uso Gerencial');

        return html;
    },

    // ========================================
    // 🖨️ FUNÇÕES DE EXECUÇÃO
    // ========================================

    executarImpressao: async (htmlContent, tipo) => {
        return new Promise((resolve, reject) => {
            try {
                const printWindow = window.open('', '_blank', 'width=800,height=600');

                if (!printWindow) {
                    throw new Error('Bloqueador de pop-ups ativo. Permita pop-ups para imprimir.');
                }

                printWindow.document.write(htmlContent);
                printWindow.document.close();

                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        setTimeout(() => {
                            printWindow.close();
                            resolve({ success: true });
                        }, 1000);
                    }, 500);
                };

                printWindow.onerror = (error) => {
                    printWindow.close();
                    reject(new Error('Erro na impressão: ' + error));
                };

            } catch (error) {
                reject(error);
            }
        });
    },

    visualizarImpressao: (htmlContent, tipo) => {
        const previewWindow = window.open('', '_blank', 'width=400,height=600');
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        }
    },

    // ========================================
    // 🔧 CONFIGURAÇÕES E UTILITÁRIOS
    // ========================================

    configurarImpressora: (novoTipo, opcoes = {}) => {
        configService.set('impressora_tipo', novoTipo);

        if (opcoes.conectarAutomatico !== undefined) {
            configService.set('impressora_conectar_auto', opcoes.conectarAutomatico);
        }

        if (opcoes.cortarPapel !== undefined) {
            configService.set('impressora_cortar_papel', opcoes.cortarPapel);
        }

        console.log(`✅ Impressora configurada: ${novoTipo}`);

        // Iniciar monitoramento se mudou para térmica
        if (novoTipo === 'termica') {
            setTimeout(() => {
                printService.iniciarMonitoramentoConexao();
            }, 1000);
        }
    },

    verificarStatusTermica: () => {
        return {
            conectada: thermalPrintService.isConnected,
            tipo_dispositivo: thermalPrintService.device ?
                (thermalPrintService.device === 'fallback' ? 'Fallback' : 'Térmica') : 'Nenhum',
            configuracao: configService.getImpressora()
        };
    },


    iniciarMonitoramentoConexao: () => {
        if (!printService.isTermica()) return;

        console.log('🔄 Iniciando monitoramento de conexão térmica...');

        const verificar = async () => {
            const status = await thermalPrintService.obterStatusDetalhado();

            window.dispatchEvent(new CustomEvent('status-impressora-mudou', {
                detail: { conectado: status.conectado }
            }));
        };

        // Verificar a cada 30 segundos
        setInterval(verificar, 30000);

        // Verificar imediatamente
        verificar();
    },


    conectarViaInterface: async () => {
        if (!printService.isTermica()) {
            console.log('⚠️ Não é impressora térmica');
            return false;
        }

        try {
            const conectado = await thermalPrintService.conectar();

            window.dispatchEvent(new CustomEvent('status-impressora-mudou', {
                detail: { conectado }
            }));

            return conectado;
        } catch (error) {
            console.error('❌ Erro ao conectar:', error);
            return false;
        }
    },

    // ========================================
    // 🔌 FUNÇÕES PARA GERENCIAR IMPRESSORA TÉRMICA
    // ✅ NOVAS FUNÇÕES ADICIONADAS PARA CORRIGIR ERRO
    // ========================================

    /**
     * Conectar impressora térmica via interface do usuário
     */
    conectarImpressoraTermica: async () => {
        if (!printService.isTermica()) {
            console.log('⚠️ Não é impressora térmica');
            return {
                success: false,
                conectado: false,
                message: 'Tipo de impressora configurado não é térmica'
            };
        }

        try {
            console.log('🔌 Conectando impressora térmica via interface do usuário...');
            const conectado = await thermalPrintService.conectar();

            // Disparar evento de mudança de status
            window.dispatchEvent(new CustomEvent('status-impressora-mudou', {
                detail: { conectado }
            }));

            return {
                success: conectado,
                conectado: conectado,
                message: conectado
                    ? '✅ Impressora térmica conectada com sucesso!'
                    : '❌ Falha ao conectar impressora térmica'
            };
        } catch (error) {
            console.error('❌ Erro ao conectar impressora térmica:', error);

            return {
                success: false,
                conectado: false,
                message: `Erro: ${error.message}`,
                error: error
            };
        }
    },

    /**
     * Desconectar impressora térmica
     */
    desconectarImpressoraTermica: async () => {
        if (!printService.isTermica()) {
            console.log('⚠️ Não é impressora térmica');
            return {
                success: false,
                message: 'Tipo de impressora configurado não é térmica'
            };
        }

        try {
            console.log('🔌 Desconectando impressora térmica...');
            const desconectado = await thermalPrintService.desconectar();

            // Disparar evento de mudança de status
            window.dispatchEvent(new CustomEvent('status-impressora-mudou', {
                detail: { conectado: false }
            }));

            return {
                success: desconectado,
                message: desconectado
                    ? '🔌 Impressora térmica desconectada'
                    : '❌ Erro ao desconectar'
            };
        } catch (error) {
            console.error('❌ Erro ao desconectar impressora:', error);

            return {
                success: false,
                message: `Erro: ${error.message}`,
                error: error
            };
        }
    },

    /**
     * Testar impressão térmica
     */
    testarImpressoraTermica: async () => {
        if (!printService.isTermica()) {
            console.log('⚠️ Não é impressora térmica');
            return {
                success: false,
                message: 'Tipo de impressora configurado não é térmica'
            };
        }

        try {
            console.log('🧪 Executando teste de impressão...');

            // Verificar conexão primeiro
            const statusConexao = await thermalPrintService.obterStatusDetalhado();

            if (!statusConexao.conectada) {
                console.log('🔄 Impressora não conectada, tentando conectar...');
                await thermalPrintService.conectar();
            }

            // Gerar comandos de teste simples
            const pedidoTeste = {
                id: 999,
                mesa: 'TESTE',
                itens: [
                    {
                        produto: 'Teste de Impressão',
                        quantidade: 1,
                        preco_unitario: 0.00,
                        observacoes: 'Este é um teste de impressão térmica'
                    }
                ],
                data_pedido: new Date().toISOString(),
                total: 0.00
            };

            // Usar a função de comanda térmica para teste
            const comandosESCPOS = thermalPrintService.gerarComandaESCPOS(pedidoTeste);
            const resultado = await thermalPrintService.enviarParaImpressora(comandosESCPOS, 'teste');

            return {
                success: resultado.success,
                message: resultado.success
                    ? '✅ Teste realizado com sucesso! Verifique a impressora.'
                    : '❌ Falha no teste de impressão'
            };
        } catch (error) {
            console.error('❌ Erro no teste de impressão:', error);

            return {
                success: false,
                message: `Erro no teste: ${error.message}`,
                error: error
            };
        }
    }
};

// Inicializar monitoramento se configurado como térmico
/*
if (configService.isTermica()) {
    setTimeout(() => {
        printService.iniciarMonitoramentoConexao();
    }, 2000);
}
*/

export default printService;