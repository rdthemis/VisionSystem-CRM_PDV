// src/utils/pedidosUtils.js
// 🛠️ UTILITÁRIOS: Funções auxiliares reutilizáveis para pedidos

/**
 * ========================================
 * 💰 FORMATAÇÕES MONETÁRIAS
 * ========================================
 */

/**
 * Formata valor para moeda brasileira
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado (ex: "R$ 10,50")
 */
export const formatarPreco = (valor) => {
    if (valor === null || valor === undefined) return 'R$ 0,00';

    const numero = parseFloat(valor);
    if (isNaN(numero)) return 'R$ 0,00';

    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Remove formatação de moeda e retorna apenas o número
 * @param {string} valorFormatado - Valor formatado (ex: "R$ 10,50")
 * @returns {number} Valor numérico
 */
export const parsearPreco = (valorFormatado) => {
    if (!valorFormatado) return 0;

    // Remove tudo exceto números, vírgula e ponto
    const apenasNumeros = valorFormatado
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.');

    return parseFloat(apenasNumeros) || 0;
};

/**
 * ========================================
 * 📅 FORMATAÇÕES DE DATA/HORA
 * ========================================
 */

/**
 * Formata data para padrão brasileiro
 * @param {Date|string} data - Data a ser formatada
 * @returns {string} Data formatada (ex: "25/12/2024")
 */
export const formatarData = (data) => {
    if (!data) return '-';

    const dataObj = data instanceof Date ? data : new Date(data);

    if (isNaN(dataObj.getTime())) return '-';

    return dataObj.toLocaleDateString('pt-BR');
};

/**
 * Formata data e hora para padrão brasileiro
 * @param {Date|string} data - Data/hora a ser formatada
 * @returns {string} Data e hora formatada (ex: "25/12/2024 14:30")
 */
export const formatarDataHora = (data) => {
    if (!data) return '-';

    const dataObj = data instanceof Date ? data : new Date(data);

    if (isNaN(dataObj.getTime())) return '-';

    return dataObj.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Formata apenas a hora
 * @param {Date|string} data - Data/hora
 * @returns {string} Hora formatada (ex: "14:30")
 */
export const formatarHora = (data) => {
    if (!data) return '-';

    const dataObj = data instanceof Date ? data : new Date(data);

    if (isNaN(dataObj.getTime())) return '-';

    return dataObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * ========================================
 * 📊 CÁLCULOS DE PEDIDO
 * ========================================
 */

/**
 * Calcula o subtotal de um item (quantidade * preço unitário)
 * @param {number} quantidade - Quantidade do item
 * @param {number} precoUnitario - Preço unitário
 * @returns {number} Subtotal
 */
export const calcularSubtotal = (quantidade, precoUnitario) => {
    const qtd = parseFloat(quantidade) || 0;
    const preco = parseFloat(precoUnitario) || 0;
    return qtd * preco;
};

/**
 * Calcula o total de adicionais
 * @param {Array} adicionais - Array de adicionais selecionados
 * @returns {number} Total dos adicionais
 */
export const calcularTotalAdicionais = (adicionais) => {
    if (!Array.isArray(adicionais)) return 0;

    return adicionais.reduce((total, adicional) => {
        return total + (parseFloat(adicional.preco) || 0);
    }, 0);
};

/**
 * Calcula o preço unitário total (produto + adicionais)
 * @param {number} precoProduto - Preço do produto
 * @param {Array} adicionais - Array de adicionais
 * @returns {number} Preço unitário total
 */
export const calcularPrecoUnitarioTotal = (precoProduto, adicionais) => {
    const precoBase = parseFloat(precoProduto) || 0;
    const totalAdicionais = calcularTotalAdicionais(adicionais);
    return precoBase + totalAdicionais;
};

/**
 * Calcula totais do carrinho
 * @param {Array} carrinho - Array de itens do carrinho
 * @returns {Object} { totalItens, totalPagar, quantidadeItens }
 */
export const calcularTotaisCarrinho = (carrinho) => {
    if (!Array.isArray(carrinho) || carrinho.length === 0) {
        return {
            totalItens: 0,
            totalPagar: 0,
            quantidadeItens: 0
        };
    }

    const totalItens = carrinho.reduce((total, item) => {
        return total + (parseFloat(item.subtotal) || 0);
    }, 0);

    const quantidadeItens = carrinho.reduce((total, item) => {
        return total + (parseInt(item.quantidade) || 0);
    }, 0);

    return {
        totalItens,
        totalPagar: totalItens, // Pode adicionar taxas, descontos aqui
        quantidadeItens
    };
};

/**
 * ========================================
 * ✅ VALIDAÇÕES
 * ========================================
 */

/**
 * Valida se o pedido tem dados mínimos necessários
 * @param {Object} pedido - Dados do pedido
 * @returns {Object} { valido: boolean, erros: string[] }
 */
export const validarPedido = (pedido) => {
    const erros = [];

    // Validar cliente
    if (!pedido.cliente_nome || pedido.cliente_nome.trim() === '') {
        erros.push('Nome do cliente é obrigatório');
    }

    // Validar itens
    if (!pedido.itens || !Array.isArray(pedido.itens) || pedido.itens.length === 0) {
        erros.push('O pedido deve ter pelo menos um item');
    }

    // Validar cada item
    if (Array.isArray(pedido.itens)) {
        pedido.itens.forEach((item, index) => {
            if (!item.produto_id) {
                erros.push(`Item ${index + 1}: Produto é obrigatório`);
            }

            if (!item.quantidade || item.quantidade <= 0) {
                erros.push(`Item ${index + 1}: Quantidade deve ser maior que zero`);
            }

            if (!item.preco_unitario || item.preco_unitario <= 0) {
                erros.push(`Item ${index + 1}: Preço deve ser maior que zero`);
            }
        });
    }

    // Validar total
    if (!pedido.total || pedido.total <= 0) {
        erros.push('Total do pedido deve ser maior que zero');
    }

    return {
        valido: erros.length === 0,
        erros
    };
};

/**
 * ========================================
 * 🔧 MANIPULAÇÃO DE STRINGS
 * ========================================
 */

/**
 * Gera um número de pedido único
 * @returns {string} Número do pedido (ex: "PED2024123115305")
 */
export const gerarNumeroPedido = () => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');

    return `PED${ano}${mes}${dia}${hora}${minuto}${segundo}`;
};

/**
 * Trunca texto se exceder o limite
 * @param {string} texto - Texto a ser truncado
 * @param {number} limite - Limite de caracteres
 * @returns {string} Texto truncado
 */
export const truncarTexto = (texto, limite = 50) => {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
};

/**
 * ========================================
 * 📱 UTILITÁRIOS DE UI
 * ========================================
 */

/**
 * Copia texto para a área de transferência
 * @param {string} texto - Texto a ser copiado
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const copiarParaClipboard = async (texto) => {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (error) {
        console.error('Erro ao copiar:', error);

        // Fallback para navegadores mais antigos
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        return true;
    }
};

/**
 * Exibe confirmação customizada
 * @param {string} mensagem - Mensagem de confirmação
 * @returns {boolean} true se confirmado
 */
export const confirmar = (mensagem) => {
    return window.confirm(mensagem);
};

/**
 * Exibe alerta customizado
 * @param {string} mensagem - Mensagem do alerta
 * @param {string} tipo - Tipo do alerta ('success', 'error', 'warning', 'info')
 */
export const exibirAlerta = (mensagem, tipo = 'info') => {
    // Aqui você pode integrar com uma biblioteca de toast/notificação
    // Por enquanto, usa alert nativo

    const prefixos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const prefixo = prefixos[tipo] || prefixos.info;
    alert(`${prefixo} ${mensagem}`);
};

/**
 * ========================================
 * 🔄 CONVERSÕES DE DADOS
 * ========================================
 */

/**
 * Converte item do pedido para formato de envio à API
 * @param {Object} item - Item do carrinho
 * @returns {Object} Item formatado para API
 */
export const formatarItemParaAPI = (item) => {
    return {
        produto_id: parseInt(item.produto_id),
        quantidade: parseInt(item.quantidade),
        preco_unitario: parseFloat(item.preco_unitario),
        subtotal: parseFloat(item.subtotal),
        adicionais: JSON.stringify(item.adicionais || []),
        observacoes: item.observacoes || ''
    };
};

/**
 * Converte pedido completo para formato de envio à API
 * @param {Object} pedido - Dados do pedido
 * @returns {Object} Pedido formatado para API
 */
export const formatarPedidoParaAPI = (pedido) => {
    return {
        ...pedido,
        total: parseFloat(pedido.total),
        itens: pedido.itens.map(formatarItemParaAPI)
    };
};

// ========================================
// 📤 EXPORTAÇÃO DEFAULT
// ========================================

export default {
    // Formatações
    formatarPreco,
    parsearPreco,
    formatarData,
    formatarDataHora,
    formatarHora,

    // Cálculos
    calcularSubtotal,
    calcularTotalAdicionais,
    calcularPrecoUnitarioTotal,
    calcularTotaisCarrinho,

    // Validações
    validarPedido,

    // Strings
    gerarNumeroPedido,
    truncarTexto,

    // UI
    copiarParaClipboard,
    confirmar,
    exibirAlerta,

    // Conversões
    formatarItemParaAPI,
    formatarPedidoParaAPI
};