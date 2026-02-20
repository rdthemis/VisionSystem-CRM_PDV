// DiagnosticoImpressora.js
// Componente para diagnosticar e configurar a impressora térmica

import React, { useState, useEffect } from 'react';
import thermalPrintService from '../services/thermalPrintService'; // ajuste o caminho conforme necessário

const DiagnosticoImpressora = () => {
    const [resultado, setResultado] = useState('');
    const [status, setStatus] = useState(null);
    const [testando, setTestando] = useState(false);
    const [etapaAtual, setEtapaAtual] = useState('');

    // Carrega status inicial
    useEffect(() => {
        carregarStatus();
    }, []);

    const carregarStatus = () => {
        const statusAtual = thermalPrintService.obterStatusDetalhado();
        setStatus(statusAtual);
    };

    // 1. FUNÇÃO PARA EXECUTAR DIAGNÓSTICO - CORRIGIDA
    const executarDiagnostico = async () => {
        setTestando(true);
        setResultado('');
        setEtapaAtual('Verificando portas autorizadas...');

        try {
            console.clear();
            console.log('🚀 INICIANDO DIAGNÓSTICO DA IMPRESSORA');
            console.log('═══════════════════════════════════════');

            // 🔧 CHAMAR DIAGNÓSTICO SEM TENTAR CONEXÃO (evita user gesture)
            const diagnostico = await thermalPrintService.diagnosticarConexao(false);

            let mensagem = '';

            if (diagnostico.success) {
                mensagem = '✅ DIAGNÓSTICO CONCLUÍDO!\n\n';

                if (diagnostico.hasAuthorizedPorts) {
                    mensagem += '📟 Encontradas impressoras já autorizadas!\n';
                    mensagem += 'Use o botão "Conectar" para testar a conexão.\n\n';
                } else {
                    mensagem += '⚠️ Nenhuma impressora autorizada encontrada.\n';
                    mensagem += 'Use o botão "Conectar" para selecionar sua impressora.\n\n';
                }

                if (diagnostico.vendorId) {
                    mensagem += `📋 Informações salvas:\n`;
                    mensagem += `• VendorId: 0x${diagnostico.vendorId}\n`;
                    mensagem += `• ProductId: 0x${diagnostico.productId}\n\n`;
                }

                mensagem += '📋 Detalhes:\n';
                diagnostico.details.forEach(detalhe => {
                    mensagem += `• ${detalhe}\n`;
                });

            } else {
                mensagem = `❌ DIAGNÓSTICO FALHOU\n\n`;
                mensagem += `${diagnostico.message}\n\n`;

                if (diagnostico.needsUserGesture) {
                    mensagem += '💡 SOLUÇÃO:\n';
                    mensagem += 'Use o botão "Conectar" para selecionar sua impressora.\n';
                    mensagem += 'O navegador exige que esta ação seja feita através de um clique.\n\n';
                }

                if (diagnostico.details.length > 0) {
                    mensagem += 'Detalhes:\n';
                    diagnostico.details.forEach(detalhe => {
                        mensagem += `• ${detalhe}\n`;
                    });
                }
            }

            setResultado(mensagem);

        } catch (erro) {
            let mensagemErro = `❌ Erro durante diagnóstico: ${erro.message}\n\n`;

            if (erro.message.includes('user gesture')) {
                mensagemErro += '💡 SOLUÇÃO:\n';
                mensagemErro += 'Use o botão "Conectar" para autorizar o acesso à impressora.\n';
                mensagemErro += 'O navegador exige que esta ação seja feita através de um clique do usuário.';
            }

            setResultado(mensagemErro);
        } finally {
            setTestando(false);
            setEtapaAtual('');
            carregarStatus();
        }
    };

    // 2. FUNÇÃO PARA TESTE COMPLETO - CORRIGIDA
    const executarTesteCompleto = async () => {
        setTestando(true);
        setResultado('');

        try {
            setEtapaAtual('Executando diagnóstico...');

            // Primeiro, diagnóstico sem conexão
            const diagnostico = await thermalPrintService.diagnosticarConexao(false);

            let mensagem = '🧪 TESTE COMPLETO INICIADO\n\n';
            mensagem += '1️⃣ Diagnóstico: ';

            if (diagnostico.success) {
                mensagem += '✅ Passou\n';
                if (diagnostico.hasAuthorizedPorts) {
                    mensagem += '   • Impressoras autorizadas encontradas\n';
                } else {
                    mensagem += '   • Nenhuma impressora autorizada (normal na primeira vez)\n';
                }
            } else {
                mensagem += '❌ Falhou\n';
                mensagem += `   • ${diagnostico.message}\n`;
            }

            // Segundo, tentar conectar
            setEtapaAtual('Tentando conectar...');
            mensagem += '\n2️⃣ Conexão: ';

            try {
                const conectado = await thermalPrintService.conectar();
                if (conectado) {
                    mensagem += '✅ Conectado com sucesso\n';

                    // Terceiro, teste de impressão
                    setEtapaAtual('Testando impressão...');
                    mensagem += '\n3️⃣ Impressão: ';

                    const pedidoTeste = {
                        numero: 'TESTE-COMPLETO-' + Date.now(),
                        cliente: 'Teste Automático',
                        mesa: '99',
                        itens: [
                            {
                                quantidade: 1,
                                nome: 'TESTE COMPLETO DO SISTEMA',
                                observacoes: 'Teste executado automaticamente'
                            }
                        ],
                        observacoes: 'Se você conseguir ler isto, todo o sistema está funcionando perfeitamente!'
                    };

                    const escpos = thermalPrintService.gerarComandaESCPOS(pedidoTeste);
                    const impressao = await thermalPrintService.enviarParaImpressora(escpos, 'teste-completo');

                    if (impressao.success) {
                        mensagem += '✅ Teste enviado com sucesso\n';
                        mensagem += '\n🎉 TESTE COMPLETO PASSOU!\n';
                        mensagem += 'Verifique se a comanda foi impressa corretamente.';
                    } else {
                        mensagem += '❌ Falha no teste de impressão\n';
                    }
                } else {
                    mensagem += '❌ Falha na conexão\n';
                }
            } catch (conexaoErro) {
                mensagem += `❌ Erro: ${conexaoErro.message}\n`;

                if (conexaoErro.message.includes('user gesture')) {
                    mensagem += '\n💡 Para conectar automaticamente, autorize sua impressora primeiro:\n';
                    mensagem += '1. Clique em "Conectar"\n';
                    mensagem += '2. Selecione sua impressora\n';
                    mensagem += '3. Execute este teste novamente';
                }
            }

            setResultado(mensagem);

        } catch (erro) {
            setResultado(`❌ Erro durante teste completo: ${erro.message}`);
        } finally {
            setTestando(false);
            setEtapaAtual('');
            carregarStatus();
        }
    };

    // 3. FUNÇÃO PARA CONECTAR DIRETAMENTE - CORRIGIDA
    const conectarImpressora = async () => {
        setTestando(true);
        setEtapaAtual('Conectando...');

        try {
            // Primeiro, tentar diagnóstico COM conexão (user gesture permitido)
            setEtapaAtual('Selecionando impressora...');
            const diagnostico = await thermalPrintService.diagnosticarConexao(true);

            if (diagnostico.success) {
                setEtapaAtual('Estabelecendo conexão...');
                const conectado = await thermalPrintService.conectar();

                if (conectado) {
                    let mensagem = '✅ IMPRESSORA CONECTADA COM SUCESSO!\n\n';

                    if (diagnostico.vendorId) {
                        mensagem += `📟 Dispositivo identificado:\n`;
                        mensagem += `• VendorId: 0x${diagnostico.vendorId}\n`;
                        mensagem += `• ProductId: 0x${diagnostico.productId}\n`;

                        if (diagnostico.baudRateRecomendado) {
                            mensagem += `• Baudrate: ${diagnostico.baudRateRecomendado}\n`;
                        }
                        mensagem += '\n';
                    }

                    mensagem += '🎯 Próximos passos:\n';
                    mensagem += '• Use "Teste de Impressão" para verificar funcionamento\n';
                    mensagem += '• Sua impressora agora está autorizada para uso futuro\n';
                    mensagem += '• O sistema vai reconectá-la automaticamente na próxima vez';

                    setResultado(mensagem);
                } else {
                    setResultado('❌ Falha ao estabelecer conexão.\n\nVerifique se a impressora está ligada e o cabo USB conectado.');
                }
            } else {
                let mensagem = `❌ ${diagnostico.message}\n\n`;

                if (diagnostico.details.length > 0) {
                    mensagem += 'Detalhes:\n';
                    diagnostico.details.forEach(detalhe => {
                        mensagem += `• ${detalhe}\n`;
                    });
                }

                setResultado(mensagem);
            }

        } catch (erro) {
            let mensagemErro = `❌ Erro ao conectar: ${erro.message}\n\n`;

            if (erro.message.includes('user gesture')) {
                mensagemErro += '⚠️ Este erro não deveria acontecer aqui.\n';
                mensagemErro += 'Tente atualizar a página e conectar novamente.';
            } else if (erro.name === 'NotFoundError') {
                mensagemErro += '💡 Nenhuma impressora foi selecionada.\n';
                mensagemErro += 'Tente novamente e selecione sua impressora na lista.';
            } else {
                mensagemErro += '🔧 Sugestões:\n';
                mensagemErro += '• Verifique se a impressora está ligada\n';
                mensagemErro += '• Confirme se o cabo USB está conectado\n';
                mensagemErro += '• Tente usar outro cabo USB\n';
                mensagemErro += '• No Windows, instale o driver do fabricante';
            }

            setResultado(mensagemErro);
        } finally {
            setTestando(false);
            setEtapaAtual('');
            carregarStatus();
        }
    };

    // 4. FUNÇÃO PARA DESCONECTAR
    const desconectarImpressora = async () => {
        setTestando(true);
        setEtapaAtual('Desconectando...');

        try {
            await thermalPrintService.desconectar();
            setResultado('✅ Impressora desconectada com sucesso!');
        } catch (erro) {
            setResultado(`⚠️ Desconexão realizada (com avisos): ${erro.message}`);
        } finally {
            setTestando(false);
            setEtapaAtual('');
            carregarStatus();
        }
    };

    // 5. FUNÇÃO PARA IMPRIMIR TESTE
    const imprimirTeste = async () => {
        setTestando(true);
        setEtapaAtual('Imprimindo teste...');

        try {
            const pedidoTeste = {
                numero: 'TESTE-' + new Date().getTime(),
                cliente: 'Cliente de Teste',
                mesa: 'Mesa 01',
                itens: [
                    {
                        quantidade: 1,
                        nome: 'X-Burger Teste',
                        observacoes: 'Sem cebola - TESTE'
                    },
                    {
                        quantidade: 2,
                        nome: 'Coca-Cola 350ml'
                    }
                ],
                observacoes: 'Esta é uma impressão de teste do sistema PDV. Se você consegue ler isto, sua impressora está funcionando perfeitamente!'
            };

            const escpos = thermalPrintService.gerarComandaESCPOS(pedidoTeste);
            const resultado = await thermalPrintService.enviarParaImpressora(escpos, 'teste-impressao');

            if (resultado.success) {
                setResultado('✅ Teste de impressão enviado!\n\nVerifique se a comanda foi impressa corretamente.');
            } else {
                setResultado('❌ Falha no teste de impressão.\n\nVerifique a conexão e tente conectar novamente.');
            }

        } catch (erro) {
            setResultado(`❌ Erro na impressão: ${erro.message}`);
        } finally {
            setTestando(false);
            setEtapaAtual('');
            carregarStatus();
        }
    };

    return (
        <div style={{
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                    🖨️ Diagnóstico da Impressora Térmica
                </h1>
                <p style={{ margin: 0, opacity: 0.9 }}>
                    Use esta ferramenta para configurar e testar sua impressora
                </p>
            </div>

            {/* STATUS ATUAL */}
            {status && (
                <div style={{
                    background: status.conectada ? '#d4edda' : '#f8d7da',
                    color: status.conectada ? '#155724' : '#721c24',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${status.conectada ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>
                        {status.conectada ? '🟢 Status: CONECTADA' : '🔴 Status: DESCONECTADA'}
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        fontSize: '14px'
                    }}>
                        <div><strong>Estado:</strong> {status.estado}</div>
                        <div><strong>Tipo:</strong> {status.tipoConexao}</div>
                        <div><strong>Vendor ID:</strong> {status.vendorId}</div>
                        <div><strong>Product ID:</strong> {status.productId}</div>
                        <div><strong>Porta Legível:</strong> {status.portaLegivel ? 'Sim' : 'Não'}</div>
                        <div><strong>Porta Escrevível:</strong> {status.portaEscrevivel ? 'Sim' : 'Não'}</div>
                        <div><strong>Keep-Alive:</strong> {status.keepAliveAtivo ? 'Ativo' : 'Inativo'}</div>
                        <div><strong>Tentativas:</strong> {status.tentativasConexao}/{status.maxTentativas}</div>
                    </div>
                </div>
            )}

            {/* BOTÕES DE AÇÃO */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={executarDiagnostico}
                    disabled={testando}
                    style={{
                        padding: '15px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: testando ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: testando ? 0.6 : 1
                    }}
                >
                    🔍 Executar Diagnóstico
                </button>

                <button
                    onClick={conectarImpressora}
                    disabled={testando || status?.conectada}
                    style={{
                        padding: '15px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: status?.conectada ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (testando || status?.conectada) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: (testando || status?.conectada) ? 0.6 : 1
                    }}
                >
                    🔌 Conectar
                </button>

                <button
                    onClick={desconectarImpressora}
                    disabled={testando || !status?.conectada}
                    style={{
                        padding: '15px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: !status?.conectada ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (testando || !status?.conectada) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: (testando || !status?.conectada) ? 0.6 : 1
                    }}
                >
                    🔌 Desconectar
                </button>

                <button
                    onClick={imprimirTeste}
                    disabled={testando || !status?.conectada}
                    style={{
                        padding: '15px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: !status?.conectada ? '#6c757d' : '#fd7e14',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (testando || !status?.conectada) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: (testando || !status?.conectada) ? 0.6 : 1
                    }}
                >
                    🖨️ Teste de Impressão
                </button>

                <button
                    onClick={executarTesteCompleto}
                    disabled={testando}
                    style={{
                        padding: '15px 20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: testando ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: testando ? 0.6 : 1,
                        gridColumn: 'span 2'
                    }}
                >
                    🧪 Teste Completo (Diagnóstico + Conexão + Impressão)
                </button>
            </div>

            {/* INDICADOR DE PROGRESSO */}
            {testando && etapaAtual && (
                <div style={{
                    background: '#e3f2fd',
                    color: '#1565c0',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    border: '1px solid #bbdefb'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '3px solid #f3f3f3',
                            borderTop: '3px solid #1565c0',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span><strong>{etapaAtual}</strong></span>
                    </div>
                </div>
            )}

            {/* RESULTADO */}
            {resultado && (
                <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
                        📊 Resultado:
                    </h3>
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        margin: 0,
                        padding: '15px',
                        background: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef',
                        overflow: 'auto',
                        maxHeight: '400px'
                    }}>
                        {resultado}
                    </pre>
                </div>
            )}

            {/* INSTRUÇÕES ATUALIZADAS */}
            <div style={{
                background: '#fff3cd',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>
                    📋 Como resolver o erro "user gesture":
                </h3>

                <div style={{
                    background: '#fef7e0',
                    padding: '15px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #f4e4bc'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#8b5a00' }}>
                        🚨 Por que acontece o erro "user gesture"?
                    </h4>
                    <p style={{ margin: 0, color: '#8b5a00', lineHeight: '1.5' }}>
                        O navegador exige que a solicitação de acesso à impressora seja feita através de um clique do usuário por segurança.
                        Não é possível fazer isso automaticamente.
                    </p>
                </div>

                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                    ✅ PASSO A PASSO CORRETO:
                </h4>

                <ol style={{ color: '#856404', lineHeight: '1.6', marginBottom: '15px' }}>
                    <li><strong>Conecte sua impressora</strong> via cabo USB ao computador</li>
                    <li><strong>Clique em "Diagnóstico"</strong> para verificar portas já autorizadas</li>
                    <li><strong>Clique em "Conectar"</strong> para selecionar sua impressora (primeira vez)</li>
                    <li><strong>Selecione sua impressora</strong> na janela que abrir</li>
                    <li><strong>Use "Teste de Impressão"</strong> para verificar funcionamento</li>
                    <li><strong>Para próximas vezes</strong>, a impressora já estará autorizada</li>
                </ol>

                <div style={{
                    background: '#e7f3ff',
                    padding: '15px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #b3d9ff'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>
                        💡 Diferença entre os botões:
                    </h4>
                    <ul style={{ margin: 0, color: '#0066cc', lineHeight: '1.5' }}>
                        <li><strong>"Diagnóstico":</strong> Apenas verifica portas já autorizadas (sem solicitar nova)</li>
                        <li><strong>"Conectar":</strong> Abre janela para você selecionar a impressora (autoriza nova)</li>
                        <li><strong>"Teste Completo":</strong> Executa diagnóstico + conecta + imprime (se autorizada)</li>
                    </ul>
                </div>

                <div style={{ marginTop: '15px', padding: '10px', background: '#fef7e0', borderRadius: '4px' }}>
                    <strong>⚠️ Problemas comuns e soluções:</strong>
                    <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                        <li><strong>Erro "user gesture":</strong> Use o botão "Conectar" (não o diagnóstico)</li>
                        <li><strong>Impressora não aparece:</strong> Verifique cabo USB e drivers</li>
                        <li><strong>Falha na conexão:</strong> Tente outro cabo USB ou porta</li>
                        <li><strong>No Windows:</strong> Pode precisar instalar driver do fabricante</li>
                        <li><strong>No Linux:</strong> Adicione seu usuário ao grupo 'dialout'</li>
                        <li><strong>Use sempre HTTPS ou localhost</strong> - Web Serial API não funciona em HTTP</li>
                    </ul>
                </div>

                <div style={{
                    background: '#d4edda',
                    padding: '15px',
                    borderRadius: '4px',
                    marginTop: '15px',
                    border: '1px solid #c3e6cb'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>
                        🎯 Sequência ideal para primeira configuração:
                    </h4>
                    <div style={{ color: '#155724', lineHeight: '1.5' }}>
                        <strong>1.</strong> Diagnóstico → <strong>2.</strong> Conectar → <strong>3.</strong> Teste de Impressão → <strong>4.</strong> Pronto!
                    </div>
                </div>
            </div>

            {/* CSS para animação */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default DiagnosticoImpressora;