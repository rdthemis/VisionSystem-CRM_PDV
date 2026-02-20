// src/components/ConfiguracaoImpressao.js
// Menu dedicado para configurações de impressão no PDV

import React, { useState, useEffect } from 'react';
import printService from '../services/printService';
import ThermalPrintConfig from './impressao/ThermalPrintConfig';
import PrintAdjustmentPanel from './impressao/PrintAdjustmentPanel';

function ConfiguracaoImpressao() {
    const [activeTab, setActiveTab] = useState('geral');
    const [showThermalConfig, setShowThermalConfig] = useState(false);
    const [showAdjustments, setShowAdjustments] = useState(false);
    const [status, setStatus] = useState(null);
    const [configuracoes, setConfiguracoes] = useState({
        estabelecimento: {
            nome: localStorage.getItem('estabelecimento_nome') || '',
            endereco: localStorage.getItem('estabelecimento_endereco') || '',
            telefone: localStorage.getItem('estabelecimento_telefone') || '',
            cnpj: localStorage.getItem('estabelecimento_cnpj') || '',
            email: localStorage.getItem('estabelecimento_email') || ''
        },
        impressao: {
            imprimirComandaAuto: localStorage.getItem('imprimir_comanda_auto') === 'true',
            imprimirReciboAuto: localStorage.getItem('imprimir_recibo_auto') === 'true',
            imprimirRelatorioAuto: localStorage.getItem('imprimir_relatorio_auto') === 'true',
            tipoImpressora: localStorage.getItem('impressora_tipo') || 'comum'
        }
    });
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        carregarStatus();
    }, []);

    const carregarStatus = () => {
        const statusAtual = printService.verificarStatusTermica();
        setStatus(statusAtual);
    };

    const handleSalvarEstabelecimento = () => {
        printService.configurarEstabelecimento(configuracoes.estabelecimento);
        setMensagem('✅ Dados do estabelecimento salvos com sucesso!');
        setTimeout(() => setMensagem(''), 3000);
    };

    const handleSalvarImpressao = () => {
        // Salvar configurações de impressão
        Object.keys(configuracoes.impressao).forEach(key => {
            localStorage.setItem(
                key === 'tipoImpressora' ? 'impressora_tipo' : `${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`,
                configuracoes.impressao[key]
            );
        });

        printService.configurarImpressora(configuracoes.impressao.tipoImpressora);
        setMensagem('✅ Configurações de impressão salvas com sucesso!');
        setTimeout(() => setMensagem(''), 3000);
    };

    const handleTesteImpressao = async (tipo) => {
        try {
            setMensagem(`🧪 Executando teste de ${tipo}...`);

            let resultado;
            switch (tipo) {
                case 'comanda':
                    const dadosComanda = {
                        numero: 'TESTE-001',
                        cliente: 'Teste de Comanda',
                        mesa: '5',
                        itens: [
                            { quantidade: 1, nome: 'Hambúrguer Teste', observacoes: 'Sem cebola' },
                            { quantidade: 2, nome: 'Refrigerante Teste' }
                        ],
                        observacoes: 'Esta é uma comanda de teste'
                    };
                    resultado = await printService.imprimirComanda(dadosComanda);
                    break;

                case 'recibo':
                    const dadosRecibo = {
                        numero: 'TESTE-001',
                        cliente: 'Cliente Teste',
                        itens: [
                            { quantidade: 1, nome: 'Produto Teste', valor_total: 15.50 },
                            { quantidade: 2, nome: 'Outro Produto', valor_total: 20.00 }
                        ],
                        total: 35.50,
                        forma_pagamento: 'Dinheiro',
                        valor_pago: 40.00,
                        troco: 4.50
                    };
                    resultado = await printService.imprimirReciboVenda(dadosRecibo);
                    break;

                default:
                    throw new Error('Tipo de teste não suportado');
            }

            setMensagem(`✅ Teste de ${tipo} executado com sucesso!`);
        } catch (error) {
            setMensagem(`❌ Erro no teste de ${tipo}: ${error.message}`);
        }
    };

    const tabs = [
        { id: 'geral', nome: '🏪 Estabelecimento', icone: '🏪' },
        { id: 'impressao', nome: '🖨️ Impressão', icone: '🖨️' },
        { id: 'termica', nome: '🔥 Térmica', icone: '🔥' },
        { id: 'testes', nome: '🧪 Testes', icone: '🧪' }
    ];

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "800px",
                margin: "0 auto",
                overflowX: "hidden",
                overflowxscroll: "auto",
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: "30px", textAlign: "center" }}>
                <h1 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "28px" }}>
                    ⚙️ Configuração de Impressão
                </h1>
                <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
                    Configure dados do estabelecimento, impressoras e teste as
                    funcionalidades
                </p>
            </div>

            {/* Mensagem de Status */}
            {mensagem && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "12px 16px",
                        backgroundColor: mensagem.includes("❌") ? "#f8d7da" : "#d4edda",
                        color: mensagem.includes("❌") ? "#721c24" : "#155724",
                        borderRadius: "8px",
                        border: `1px solid ${mensagem.includes("❌") ? "#f5c6cb" : "#c3e6cb"
                            }`,
                        fontSize: "14px",
                        textAlign: "center",
                    }}
                >
                    {mensagem}
                </div>
            )}

            {/* Tabs */}
            <div style={{ marginBottom: "30px" }}>
                <div
                    style={{
                        display: "flex",
                        borderBottom: "2px solid #e9ecef",
                        marginBottom: "20px",
                        overflowX: "auto",
                    }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: activeTab === tab.id ? "#007bff" : "transparent",
                                color: activeTab === tab.id ? "white" : "#666",
                                border: "none",
                                padding: "12px 20px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                borderRadius: "8px 8px 0 0",
                                marginRight: "4px",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span style={{ fontSize: "16px" }}>{tab.icone}</span>
                            {tab.nome}
                        </button>
                    ))}
                </div>

                {/* Conteúdo das Tabs */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "25px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #e9ecef",
                    }}
                >
                    {/* Tab Estabelecimento */}
                    {activeTab === "geral" && (
                        <div>
                            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
                                🏪 Dados do Estabelecimento
                            </h3>

                            <div style={{ display: "grid", gap: "15px" }}>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        Nome do Estabelecimento *
                                    </label>
                                    <input
                                        type="text"
                                        value={configuracoes.estabelecimento.nome}
                                        onChange={(e) =>
                                            setConfiguracoes({
                                                ...configuracoes,
                                                estabelecimento: {
                                                    ...configuracoes.estabelecimento,
                                                    nome: e.target.value,
                                                },
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ccc",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="Ex: Lanchonete do João"
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "2fr 1fr",
                                        gap: "15px",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "5px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            Endereço
                                        </label>
                                        <input
                                            type="text"
                                            value={configuracoes.estabelecimento.endereco}
                                            onChange={(e) =>
                                                setConfiguracoes({
                                                    ...configuracoes,
                                                    estabelecimento: {
                                                        ...configuracoes.estabelecimento,
                                                        endereco: e.target.value,
                                                    },
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ccc",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                                boxSizing: "border-box",
                                            }}
                                            placeholder="Ex: Rua das Flores, 123"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "5px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            Telefone
                                        </label>
                                        <input
                                            type="text"
                                            value={configuracoes.estabelecimento.telefone}
                                            onChange={(e) =>
                                                setConfiguracoes({
                                                    ...configuracoes,
                                                    estabelecimento: {
                                                        ...configuracoes.estabelecimento,
                                                        telefone: e.target.value,
                                                    },
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ccc",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                                boxSizing: "border-box",
                                            }}
                                            placeholder="(44) 99999-9999"
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "15px",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "5px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            CNPJ
                                        </label>
                                        <input
                                            type="text"
                                            value={configuracoes.estabelecimento.cnpj}
                                            onChange={(e) =>
                                                setConfiguracoes({
                                                    ...configuracoes,
                                                    estabelecimento: {
                                                        ...configuracoes.estabelecimento,
                                                        cnpj: e.target.value,
                                                    },
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ccc",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                                boxSizing: "border-box",
                                            }}
                                            placeholder="00.000.000/0001-00"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "5px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={configuracoes.estabelecimento.email}
                                            onChange={(e) =>
                                                setConfiguracoes({
                                                    ...configuracoes,
                                                    estabelecimento: {
                                                        ...configuracoes.estabelecimento,
                                                        email: e.target.value,
                                                    },
                                                })
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ccc",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                                boxSizing: "border-box",
                                            }}
                                            placeholder="contato@lanchonete.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "25px", textAlign: "right" }}>
                                <button
                                    onClick={handleSalvarEstabelecimento}
                                    style={{
                                        background: "#28a745",
                                        color: "white",
                                        border: "none",
                                        padding: "12px 24px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    💾 Salvar Dados do Estabelecimento
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab Impressão */}
                    {activeTab === "impressao" && (
                        <div>
                            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
                                🖨️ Configurações de Impressão
                            </h3>

                            <div style={{ display: "grid", gap: "20px" }}>
                                {/* Tipo de Impressora */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "8px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        Tipo de Impressora
                                    </label>
                                    <select
                                        value={configuracoes.impressao.tipoImpressora}
                                        onChange={(e) =>
                                            setConfiguracoes({
                                                ...configuracoes,
                                                impressao: {
                                                    ...configuracoes.impressao,
                                                    tipoImpressora: e.target.value,
                                                },
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ccc",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <option value="comum">
                                            🖨️ Impressora Comum (via navegador)
                                        </option>
                                        <option value="termica">
                                            🔥 Impressora Térmica (ESC/POS)
                                        </option>
                                    </select>
                                </div>

                                {/* Impressão Automática */}
                                <div>
                                    <h4 style={{ margin: "0 0 12px 0", color: "#333" }}>
                                        Impressão Automática
                                    </h4>

                                    <div style={{ display: "grid", gap: "10px" }}>
                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={configuracoes.impressao.imprimirComandaAuto}
                                                onChange={(e) =>
                                                    setConfiguracoes({
                                                        ...configuracoes,
                                                        impressao: {
                                                            ...configuracoes.impressao,
                                                            imprimirComandaAuto: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            <span>
                                                📋 Imprimir comanda automaticamente ao finalizar
                                                pedido
                                            </span>
                                        </label>

                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={configuracoes.impressao.imprimirReciboAuto}
                                                onChange={(e) =>
                                                    setConfiguracoes({
                                                        ...configuracoes,
                                                        impressao: {
                                                            ...configuracoes.impressao,
                                                            imprimirReciboAuto: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            <span>
                                                🧾 Imprimir recibo automaticamente ao processar
                                                pagamento
                                            </span>
                                        </label>

                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    configuracoes.impressao.imprimirRelatorioAuto
                                                }
                                                onChange={(e) =>
                                                    setConfiguracoes({
                                                        ...configuracoes,
                                                        impressao: {
                                                            ...configuracoes.impressao,
                                                            imprimirRelatorioAuto: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            <span>
                                                📊 Perguntar sobre relatório ao fechar caixa
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "25px", textAlign: "right" }}>
                                <button
                                    onClick={handleSalvarImpressao}
                                    style={{
                                        background: "#28a745",
                                        color: "white",
                                        border: "none",
                                        padding: "12px 24px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    💾 Salvar Configurações de Impressão
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab Térmica */}
                    {activeTab === "termica" && (
                        <div>
                            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
                                🔥 Configuração Impressora Térmica
                            </h3>

                            {/* Status */}
                            {status && (
                                <div
                                    style={{
                                        marginBottom: "20px",
                                        padding: "15px",
                                        backgroundColor: status.conectada ? "#d4edda" : "#f8d7da",
                                        borderRadius: "8px",
                                        border: `1px solid ${status.conectada ? "#c3e6cb" : "#f5c6cb"
                                            }`,
                                    }}
                                >
                                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                                        📊 Status da Impressora
                                    </h4>
                                    <div style={{ fontSize: "14px" }}>
                                        <div>
                                            <strong>Conexão:</strong>{" "}
                                            {status.conectada ? "✅ Conectada" : "❌ Desconectada"}
                                        </div>
                                        <div>
                                            <strong>Dispositivo:</strong> {status.tipo_dispositivo}
                                        </div>
                                        <div>
                                            <strong>Tipo Configurado:</strong>{" "}
                                            {status.configuracao.tipo}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botões de Ação */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "15px",
                                }}
                            >
                                <button
                                    onClick={() => setShowThermalConfig(true)}
                                    style={{
                                        background: "#007bff",
                                        color: "white",
                                        border: "none",
                                        padding: "15px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        textAlign: "center",
                                    }}
                                >
                                    🔌 Conectar e Configurar
                                </button>

                                <button
                                    onClick={() => setShowAdjustments(true)}
                                    style={{
                                        background: "#ffc107",
                                        color: "#333",
                                        border: "none",
                                        padding: "15px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        textAlign: "center",
                                    }}
                                >
                                    🔧 Ajustes de Formatação
                                </button>
                            </div>

                            {/* Informações */}
                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "15px",
                                    backgroundColor: "#fff3cd",
                                    borderRadius: "8px",
                                    border: "1px solid #ffeaa7",
                                }}
                            >
                                <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>
                                    💡 Dicas para Impressora Térmica
                                </h4>
                                <ul
                                    style={{
                                        margin: 0,
                                        paddingLeft: "20px",
                                        color: "#856404",
                                        fontSize: "13px",
                                    }}
                                >
                                    <li>Conecte a impressora via USB antes de configurar</li>
                                    <li>Use Chrome ou Edge para melhor compatibilidade</li>
                                    <li>Teste a conexão antes de usar em produção</li>
                                    <li>
                                        Configure os ajustes de formatação conforme necessário
                                    </li>
                                    <li>
                                        O sistema usará impressão comum como fallback se falhar
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Tab Testes */}
                    {activeTab === "testes" && (
                        <div>
                            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
                                🧪 Testes de Impressão
                            </h3>

                            <div style={{ display: "grid", gap: "20px" }}>
                                {/* Teste de Comanda */}
                                <div
                                    style={{
                                        padding: "20px",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8f9fa",
                                    }}
                                >
                                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                                        📋 Teste de Comanda
                                    </h4>
                                    <p
                                        style={{
                                            margin: "0 0 15px 0",
                                            fontSize: "14px",
                                            color: "#666",
                                        }}
                                    >
                                        Imprime uma comanda de exemplo para testar formatação e
                                        funcionalidade.
                                    </p>
                                    <button
                                        onClick={() => handleTesteImpressao("comanda")}
                                        style={{
                                            background: "#17a2b8",
                                            color: "white",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        📋 Testar Comanda
                                    </button>
                                </div>

                                {/* Teste de Recibo */}
                                <div
                                    style={{
                                        padding: "20px",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8f9fa",
                                    }}
                                >
                                    <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                                        🧾 Teste de Recibo
                                    </h4>
                                    <p
                                        style={{
                                            margin: "0 0 15px 0",
                                            fontSize: "14px",
                                            color: "#666",
                                        }}
                                    >
                                        Imprime um recibo de venda de exemplo com valores e troco.
                                    </p>
                                    <button
                                        onClick={() => handleTesteImpressao("recibo")}
                                        style={{
                                            background: "#28a745",
                                            color: "white",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        🧾 Testar Recibo
                                    </button>
                                </div>

                                {/* Informações de Teste */}
                                <div
                                    style={{
                                        padding: "15px",
                                        backgroundColor: "#e7f3ff",
                                        borderRadius: "8px",
                                        border: "1px solid #b3d9ff",
                                    }}
                                >
                                    <h4 style={{ margin: "0 0 10px 0", color: "#0066cc" }}>
                                        📝 Sobre os Testes
                                    </h4>
                                    <div style={{ fontSize: "13px", color: "#0066cc" }}>
                                        <p style={{ margin: "0 0 8px 0" }}>
                                            <strong>Os testes usam:</strong> Dados fictícios
                                            pré-definidos para verificar formatação
                                        </p>
                                        <p style={{ margin: "0 0 8px 0" }}>
                                            <strong>Tipo de impressora:</strong> Usa a configuração
                                            atual ({configuracoes.impressao.tipoImpressora})
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong>Fallback:</strong> Se impressão térmica falhar,
                                            usa impressão comum automaticamente
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modais */}
            <ThermalPrintConfig
                isOpen={showThermalConfig}
                onClose={() => {
                    setShowThermalConfig(false);
                    carregarStatus();
                }}
                onConfigSalva={() => {
                    carregarStatus();
                    setMensagem("✅ Configuração térmica salva com sucesso!");
                }}
            />

            <PrintAdjustmentPanel
                isOpen={showAdjustments}
                onClose={() => setShowAdjustments(false)}
            />
        </div>
    );
}

export default ConfiguracaoImpressao;