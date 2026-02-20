import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService'; // seu apiService existente
import caixaService from '../services/caixaService'; // NOVO import
import ModalAberturaCaixa from './ModalAberturaCaixa'; // Importe o modal

function Dashboard({ onLogout, onNavigate }) {
    const [usuario, setUsuario] = useState(null);
    const [estatisticas, setEstatisticas] = useState(null);
    const [loading, setLoading] = useState(true);

  // 🆕 NOVOS ESTADOS PARA CONTROLE DO CAIXA
  const [showModalCaixa, setShowModalCaixa] = useState(false);
  const [loadingCaixa, setLoadingCaixa] = useState(false);
  const [mensagemCaixa, setMensagemCaixa] = useState('');
  
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUsuario(JSON.parse(userData));
        }
        carregarEstatisticas();
    }, []);

    const carregarEstatisticas = async () => {
        try {
            setLoading(true);
            const resultado = await apiService.get('/estatisticas');
            if (resultado.success) {
                setEstatisticas(resultado.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        } finally {
            setLoading(false);
        }
  };
  
  // 🆕 FUNÇÃO PARA VERIFICAR STATUS DO CAIXA
  const verificarCaixaAberto = async () => {
    try {
      const response = await caixaService.verificarCaixaAberto();
      return response.success && response.data && response.data.caixa_aberto;
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
      return false;
    }
  };

  // 🆕 FUNÇÃO PARA ABRIR CAIXA
  const abrirCaixa = async (saldoInicial, observacoes) => {
    setLoadingCaixa(true);
    setMensagemCaixa('');

    try {
      const response = await caixaService.abrirCaixa(saldoInicial, observacoes);

      if (response.success) {
        console.log('✅ Caixa aberto com sucesso!');
        setShowModalCaixa(false);
        setMensagemCaixa('Caixa aberto com sucesso! Redirecionando para PDV...');

        setTimeout(() => {
          onNavigate('modulo-pdv');
        }, 1500);
      } else {
        setMensagemCaixa(`Erro ao abrir caixa: ${response.message}`);
      }
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      setMensagemCaixa(`Erro ao abrir caixa: ${error.message}`);
    } finally {
      setLoadingCaixa(false);
    }
  };

  // 🔧 MODIFICAR A FUNÇÃO DO PDV
  const handleModuloPdvClick = async () => {
    console.log("Verificando caixa antes de acessar PDV...");

    try {
      const caixaAberto = await verificarCaixaAberto();

      if (caixaAberto) {
        console.log("✅ Caixa já está aberto, acessando PDV...");
        onNavigate('modulo-pdv');
      } else {
        console.log("⚠️ Nenhum caixa aberto, solicitando abertura...");
        setShowModalCaixa(true);
      }
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
      alert('Erro ao verificar status do caixa. Tente novamente.');
    }
  };

    const handleClientesClick = () => {
        console.log('Navegando para clientes');
        if (onNavigate) {
            onNavigate('clientes');
        }
    };

    const handleContasReceberClick = () => {
        console.log('Navegando para contas a receber');
        if (onNavigate) {
            onNavigate('contas-receber');
        }
    };
    
    /* const handleModuloPdvClick = () => {
        console.log("Navegando para modulo pdv");
        if (onNavigate) {
            onNavigate("modulo-pdv");
        }
    };
 */
    // NOVA FUNÇÃO: Navegar para relatórios
    const handleRelatoriosClick = () => {
        console.log('Navegando para relatórios');
        if (onNavigate) {
            onNavigate('relatorios');
        }
    };

    const handleRecibosClick = () => {
        console.log('Navegando para recibos');
        if (onNavigate) {
            onNavigate('recibos');
        }
  };
  
    const handleConfiguracoesClick = () => {
      console.log("Navegando para configurações");
      if (onNavigate) {
        onNavigate("configuracoes");
      }
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
      <div
        style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        {/* 🆕 MOSTRAR MENSAGEM DE STATUS DO CAIXA */}
        {mensagemCaixa && (
          <div style={{
            background: mensagemCaixa.includes('Erro') ? '#f8d7da' : '#d1edff',
            color: mensagemCaixa.includes('Erro') ? '#721c24' : '#0c5460',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${mensagemCaixa.includes('Erro') ? '#f5c6cb' : '#bee5eb'}`,
            textAlign: 'center'
          }}>
            {mensagemCaixa}
          </div>
        )}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div>
              <h1 style={{ margin: 0, color: "#333" }}>
                🎛️ Dashboard Administrativo
              </h1>
              <p style={{ margin: "8px 0 0 0", color: "#666" }}>
                Bem-vindo, {usuario ? usuario.nome : "Usuário"}! 👋
              </p>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              🚪 Sair
            </button>
          </div>

          {/* MÓDULOS DO SISTEMA */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ color: "#555", marginBottom: "20px" }}>
              📋 Módulos do Sistema
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Card Modulo PDV - MODIFICADO */}
              <div
                onClick={handleModuloPdvClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#00ff00";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏪</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>PDV</h3>
                <p style={{
                  margin: "0 0 16px 0",
                  color: "#666",
                  fontSize: "14px",
                }}>
                  Ponto de Venda
                </p>
                <span style={{
                  color: "#00ff00",
                  fontWeight: "500",
                  fontSize: "14px",
                }}>
                  Acessar →
                </span>
              </div>
              {/* Card Clientes */}
              <div
                onClick={handleClientesClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#3182ce";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>Clientes</h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Gerenciar cadastro de clientes
                </p>
                <span
                  style={{
                    color: "#3182ce",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Acessar →
                </span>
              </div>

              {/* Card Contas a Receber */}
              <div
                onClick={handleContasReceberClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#ff1a1a";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💰</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                  Contas a Receber
                </h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Controlar recebimentos
                </p>
                <span
                  style={{
                    color: "#ff1a1a",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Acessar →
                </span>
              </div>

              {/* Card Relatórios - AGORA ATIVO! */}
              <div
                onClick={handleRelatoriosClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#805ad5";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                  Relatórios
                </h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Análises e gráficos
                </p>
                <span
                  style={{
                    color: "#805ad5",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Acessar →
                </span>
              </div>

              {/* Card Modulo PDV */}
              {/* <div
                onClick={handleModuloPdvClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#00ff00";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}><h2><i className="fas fa-store"></i> <span className="sidebar-text"></span></h2></div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>PDV</h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Modulo PDV.
                </p>
                <span
                  style={{
                    color: "#00ff00",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Acessar →
                </span>
              </div>
 */}
              {/* Card Recibos */}
              <div
                onClick={handleRecibosClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#38a169";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧾</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>Recibos</h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Gerar e Gerenciar Recibos.
                </p>
                <span
                  style={{
                    color: "#38a169",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Acessar →
                </span>
              </div>

              {/* Card Configurações - AGORA ATIVO! */}
              <div
                onClick={handleConfiguracoesClick}
                style={{
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#d69e2e";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚙️</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                  Configurações
                </h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Configurar sistema
                </p>
                <span
                  style={{
                    color: "#d69e2e",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Acessar →
                </span>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div>
            <h2 style={{ color: "#555", marginBottom: "20px" }}>
              📈 Resumo do Sistema
            </h2>

            {loading && (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                🔄 Carregando estatísticas...
              </div>
            )}

            {!loading && estatisticas && (
              <div>
                {/* Seção Clientes */}
                <div style={{ marginBottom: "30px" }}>
                  <h3
                    style={{
                      color: "#666",
                      marginBottom: "16px",
                      fontSize: "16px",
                    }}
                  >
                    👥 Clientes
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "8px",
                        textAlign: "center",
                        borderLeft: "4px solid #3182ce",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#3182ce",
                        }}
                      >
                        {estatisticas.total_clientes || 0}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Total de Clientes
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "8px",
                        textAlign: "center",
                        borderLeft: "4px solid #38a169",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#38a169",
                        }}
                      >
                        {estatisticas.clientes_hoje || 0}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Cadastrados Hoje
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "8px",
                        textAlign: "center",
                        borderLeft: "4px solid #805ad5",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#805ad5",
                        }}
                      >
                        {estatisticas.clientes_semana || 0}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Cadastrados na Semana
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção Contas a Receber */}
                {estatisticas.contas_receber && (
                  <div style={{ marginBottom: "30px" }}>
                    <h3
                      style={{
                        color: "#666",
                        marginBottom: "16px",
                        fontSize: "16px",
                      }}
                    >
                      💰 Contas a Receber
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "16px",
                          borderRadius: "8px",
                          textAlign: "center",
                          borderLeft: "4px solid #3182ce",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: "#3182ce",
                          }}
                        >
                          {estatisticas.contas_receber.total_contas || 0}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          Total de Contas
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "16px",
                          borderRadius: "8px",
                          textAlign: "center",
                          borderLeft: "4px solid #ffc107",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#f59e0b",
                          }}
                        >
                          {formatarMoeda(
                            estatisticas.contas_receber.valor_pendente
                          )}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          Valor a Receber
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "16px",
                          borderRadius: "8px",
                          textAlign: "center",
                          borderLeft: "4px solid #e53e3e",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#e53e3e",
                          }}
                        >
                          {formatarMoeda(
                            estatisticas.contas_receber.valor_vencido
                          )}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          Contas Vencidas
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção Clientes por Tipo */}
                {estatisticas.clientes_por_tipo &&
                  estatisticas.clientes_por_tipo.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                      <h3
                        style={{
                          color: "#666",
                          marginBottom: "16px",
                          fontSize: "16px",
                        }}
                      >
                        📊 Clientes por Tipo
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        {estatisticas.clientes_por_tipo.map((tipo) => (
                          <div
                            key={tipo.tipo_pessoa}
                            style={{
                              background: "#f8f9fa",
                              padding: "16px",
                              borderRadius: "8px",
                              textAlign: "center",
                              borderLeft: `4px solid ${
                                tipo.tipo_pessoa === "fisica"
                                  ? "#17a2b8"
                                  : "#6f42c1"
                              }`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                color:
                                  tipo.tipo_pessoa === "fisica"
                                    ? "#17a2b8"
                                    : "#6f42c1",
                              }}
                            >
                              {tipo.total}
                            </div>
                            <div style={{ fontSize: "14px", color: "#666" }}>
                              {tipo.tipo_pessoa === "fisica"
                                ? "Pessoa Física"
                                : "Pessoa Jurídica"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Seção Top Estados */}
                {estatisticas.clientes_por_uf &&
                  estatisticas.clientes_por_uf.length > 0 && (
                    <div>
                      <h3
                        style={{
                          color: "#666",
                          marginBottom: "16px",
                          fontSize: "16px",
                        }}
                      >
                        🗺️ Top 5 Estados
                      </h3>
                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "20px",
                          borderRadius: "8px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        {estatisticas.clientes_por_uf
                          .slice(0, 5)
                          .map((uf, index) => (
                            <div
                              key={uf.uf}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom:
                                  index < 4 ? "1px solid #dee2e6" : "none",
                              }}
                            >
                              <span
                                style={{ fontWeight: "500", color: "#333" }}
                              >
                                {uf.uf}
                              </span>
                              <span
                                style={{
                                  background: "#3182ce",
                                  color: "white",
                                  padding: "4px 8px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                }}
                              >
                                {uf.total} clientes
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {!loading && !estatisticas && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#666",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                <p>📊 Não foi possível carregar as estatísticas</p>
                <button
                  onClick={carregarEstatisticas}
                  style={{
                    background: "#3182ce",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginTop: "10px",
                  }}
                >
                  🔄 Tentar Novamente
                </button>
              </div>
            )}
            {/* 🆕 MODAL DE ABERTURA DE CAIXA */}
            <ModalAberturaCaixa
              isOpen={showModalCaixa}
              onClose={() => setShowModalCaixa(false)}
              onAbrirCaixa={abrirCaixa}
              loading={loadingCaixa}
            />
          </div>
        </div>
      </div>
    );
}

export default Dashboard;