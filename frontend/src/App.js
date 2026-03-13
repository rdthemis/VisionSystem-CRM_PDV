import React, { useState, useEffect } from 'react';
import authService from './services/authService';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import SimpleResetPassword from './components/SimpleResetPassword';
import Clientes from './components/Clientes';
import ContasReceber from './components/ContasReceber';
import Relatorios from './components/Relatorios';
import Recibos from './components/Recibos';
import Configuracoes from './components/Configuracoes';
import ModuloPdv from "./components/ModuloPdv";

function App() {
    // Estados principais
    const [logado, setLogado] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [telaAtual, setTelaAtual] = useState('login'); // 'login', 'dashboard', 'forgot-password', 'clientes', 'contas-receber', 'modulo-pdv'

    useEffect(() => {
        // Inicializar sistema de auth
        authService.initialize();
    }, []);

    // Verificar se já está logado ao carregar a página
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setLogado(true);
            setTelaAtual('dashboard');
        }
        setCarregando(false);
    }, []);

    // 🆕 LISTENER PARA FECHAMENTO DE CAIXA
    useEffect(() => {
        const handleCaixaFechado = () => {
            console.log('📢 App - Evento caixaFechado recebido');
            setTelaAtual('dashboard');
            localStorage.removeItem('caixa_fechado');
        };

        // Listener para evento customizado
        window.addEventListener('voltarDashboard', handleCaixaFechado);

        // Cleanup
        return () => {
            window.removeEventListener('voltarDashboard', handleCaixaFechado);
        };
    }, []);

    
    // Função de login
    const handleLogin = (dadosUsuario) => {
        console.log('Login bem-sucedido:', dadosUsuario);
        setLogado(true);
        setTelaAtual('dashboard');
    };
    
    // Função de logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLogado(false);
        setTelaAtual('login');
    };
    
    // Função de navegação
    const handleNavigate = (novaTela) => {
        console.log('🔄 Navegando de', telaAtual, 'para', novaTela);
        setTelaAtual(novaTela);
    };
    
    // 🆕 FUNÇÃO ESPECÍFICA PARA VOLTAR AO DASHBOARD
    const handleVoltarDashboard = () => {
        console.log('🏠 App - handleVoltarDashboard chamado');
        console.log('🏠 App - Voltando para dashboard de:', telaAtual);
        setTelaAtual('dashboard');
    };
    
    useSessionTimeout(30);
    
    // Loading inicial
    if (carregando) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                🔄 Carregando...
            </div>
        );
    }
    
    // DEBUG - Mostrar estado atual
    console.log('🐛 Estado atual:', { logado, telaAtual });
    
    return (
        <div className="App">
            {/* DEBUG INFO */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    background: "#333",
                    color: "white",
                    padding: "5px 10px",
                    fontSize: "12px",
                    zIndex: 9999,
                }}
            >
                🐛 {logado ? "Logado" : "Não logado"} | Tela: {telaAtual}
            </div>

            {/* TELA DE LOGIN */}
            {!logado && telaAtual === "login" && (
                <Login
                    onLogin={handleLogin}
                    onForgotPassword={() => setTelaAtual("forgot-password")}
                />
            )}

            {/* TELA DE ESQUECI SENHA */}
            {!logado && telaAtual === "forgot-password" && (
                <ForgotPassword onBack={() => setTelaAtual("login")} />
            )}

            {/* TELA DE REDEFINIR SENHA */}
            {!logado && telaAtual === "reset-password" && (
                <SimpleResetPassword onBack={() => setTelaAtual("login")} />
            )}

            {/* TELA DO DASHBOARD */}
            {logado && telaAtual === "dashboard" && (
                <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} />
            )}

            {/* 🆕 TELA DO MÓDULO PDV */}
            {logado && telaAtual === "modulo-pdv" && (
                <ModuloPdv onVoltar={handleVoltarDashboard} />
            )}

            {/* TELA DE CLIENTES */}
            {logado && telaAtual === "clientes" && (
                <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
                    <div
                        style={{
                            padding: "10px 20px",
                            background: "#fff",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        <button
                            onClick={handleVoltarDashboard}
                            style={{
                                background: "none",
                                border: "1px solid #3182ce",
                                color: "#3182ce",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "8px 16px",
                                borderRadius: "6px",
                            }}
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <h2 style={{ margin: 0, color: "#333" }}>👥 Clientes</h2>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "#e53e3e",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            🚪 Sair
                        </button>
                    </div>
                    <Clientes />
                </div>
            )}

            {/* TELA DE CONTAS A RECEBER */}
            {logado && telaAtual === "contas-receber" && (
                <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
                    <div
                        style={{
                            padding: "10px 20px",
                            background: "#fff",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        <button
                            onClick={handleVoltarDashboard}
                            style={{
                                background: "none",
                                border: "1px solid #ff1a1a",
                                color: "#ff1a1a",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "8px 16px",
                                borderRadius: "6px",
                            }}
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <h2 style={{ margin: 0, color: "#333" }}>💰 Contas a Receber</h2>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "#e53e3e",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            🚪 Sair
                        </button>
                    </div>
                    <ContasReceber />
                </div>
            )}

            {/* TELA DE RELATÓRIOS */}
            {logado && telaAtual === "relatorios" && (
                <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
                    <div
                        style={{
                            padding: "10px 20px",
                            background: "#fff",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        <button
                            onClick={handleVoltarDashboard}
                            style={{
                                background: "none",
                                border: "1px solid #805ad5",
                                color: "#805ad5",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "8px 16px",
                                borderRadius: "6px",
                            }}
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <h2 style={{ margin: 0, color: "#333" }}>📊 Relatórios</h2>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "#e53e3e",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            🚪 Sair
                        </button>
                    </div>
                    <Relatorios />
                </div>
            )}

            {/* TELA DE RECIBOS */}
            {logado && telaAtual === "recibos" && (
                <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
                    <div
                        style={{
                            padding: "10px 20px",
                            background: "#fff",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        <button
                            onClick={handleVoltarDashboard}
                            style={{
                                background: "none",
                                border: "1px solid #38a169",
                                color: "#38a169",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "8px 16px",
                                borderRadius: "6px",
                            }}
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <h2 style={{ margin: 0, color: "#333" }}>🧾 Recibos</h2>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "#e53e3e",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            🚪 Sair
                        </button>
                    </div>
                    <Recibos />
                </div>
            )}

            {/* TELA DE CONFIGURAÇÕES */}
            {logado && telaAtual === "configuracoes" && (
                <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
                    <div
                        style={{
                            padding: "10px 20px",
                            background: "#fff",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        <button
                            onClick={handleVoltarDashboard}
                            style={{
                                background: "none",
                                border: "1px solid #d69e2e",
                                color: "#d69e2e",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "8px 16px",
                                borderRadius: "6px",
                            }}
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <h2 style={{ margin: 0, color: "#333" }}>⚙️ Configurações</h2>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "#e53e3e",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            🚪 Sair
                        </button>
                    </div>
                    <Configuracoes />
                </div>
            )}
        </div>
    );
}

export default App;