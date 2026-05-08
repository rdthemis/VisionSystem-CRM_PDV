import React, { useState, useEffect } from 'react';
import Pedidos from '../components/pedidos/Pedidos.jsx';
import Categorias from './Categorias';
import Produtos from './Produtos';
import Caixa from './caixa'; // Novo import da estrutura modular
import ModalAberturaCaixa from './ModalAberturaCaixa';
import caixaService from '../services/caixaService';
import { apiService } from '../services/apiService';
import MenuToggleButton from '../components/pedidos/components/MenuToggleButton.jsx'
import "./ModuloPdv.css";
import Adicionais from './Adicionais';
import ZonasEntrega from '../components/Configuracoes/ZonasEntrega';      
import Logger from '../utils/Logger'; // Supondo que você tenha um logger para erros e informações

function ModuloPdv({ onVoltar }) {
    const [activeSection, setActiveSection] = useState('pedidos');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // ESTADOS PARA CONTROLE DO CAIXA
    const [showModalCaixa, setShowModalCaixa] = useState(false);
    const [loadingCaixa, setLoadingCaixa] = useState(false);
    const [caixaVerificado, setCaixaVerificado] = useState(false);
    const [mensagemCaixa, setMensagemCaixa] = useState('');

    //Menu está collapsed ou expandido
    const [isExpanded, setIsExpanded] = useState(true);

    // ESTADO PARA CONTROLAR O REFRESH DOS PEDIDOS
    const [refreshPedidosIndicator, setRefreshPedidosIndicator] = useState(false);
    const [refreshPedidos, setRefreshPedidos] = useState(0);
    const [resetPedidosView, setResetPedidosView] = useState(0);


    // VERIFICAR CAIXA AO CARREGAR O COMPONENTE
    useEffect(() => {
        verificarCaixaAberto();
    }, []);

    const verificarCaixaAberto = async () => {
        try {
            Logger.info('Verificando status do caixa...', { info: 'Verificação de caixa' });
            const response = await caixaService.verificarCaixaAberto();

            if (response.success && response.data && response.data.caixa_aberto) {
                Logger.info('Caixa está aberto', { info: 'Caixa aberto' });
                setCaixaVerificado(true);
            } else {
                Logger.info('Nenhum caixa aberto', { info: 'Nenhum caixa aberto' });
                setShowModalCaixa(true);
            }
        } catch (error) {
            Logger.error('Erro ao verificar caixa:', { erro: error });
            setMensagemCaixa('Erro ao verificar status do caixa');
        }
    };

    // FUNÇÃO PARA ABRIR CAIXA
    const abrirCaixa = async (saldoInicial, observacoes) => {
        setLoadingCaixa(true);
        setMensagemCaixa('');

        try {
            const dadosAbertura = {
                saldo_inicial: saldoInicial,
                observacoes_abertura: observacoes || 'Caixa aberto pelo PDV'
            };

            const response = await apiService.post('/caixa', dadosAbertura);

            if (response.success) {
                Logger.info('Caixa aberto com sucesso!', { info: 'Caixa aberto' });
                setShowModalCaixa(false);
                setCaixaVerificado(true);
                setMensagemCaixa('Caixa aberto com sucesso!');

                // Limpar mensagem após alguns segundos
                setTimeout(() => {
                    setMensagemCaixa('');
                }, 1000);
            } else {
                setMensagemCaixa(`Erro ao abrir caixa: ${response.message}`);
            }
        } catch (error) {
            Logger.error('Erro ao abrir caixa:', { erro: error });
            setMensagemCaixa(`Erro ao abrir caixa: ${error.message}`);
        } finally {
            setLoadingCaixa(false);
        }
    };

    // FUNÇÃO PARA FAZER REFRESH DOS PEDIDOS
    const handleRefreshPedidos = async () => {
        Logger.info('Fazendo refresh dos pedidos...', { info: 'Refresh de pedidos' });

        // 🔧 INCREMENTA AMBOS OS CONTADORES
        setRefreshPedidos(prev => prev + 1);
        setRefreshPedidosIndicator(true);
        setResetPedidosView(prev => prev + 1); // ADICIONAR - Força reset da view

        // Salvar antes de sair completamente
        if (activeSection === 'pedidos') {
            await salvarComandaAntesDeSair();
        }
    };

    // CALLBACK QUANDO CAIXA FOR FECHADO
    const handleCaixaFechado = () => {
        Logger.info('Caixa foi fechado, resetando estado...', { info: 'Caixa fechado' });
        setCaixaVerificado(false);
        setActiveSection('pedidos');
    };

    // CALLBACK PARA VOLTAR AO DASHBOARD
    const handleVoltarDashboard = () => {
        Logger.info('Voltando para Dashboard após fechamento de caixa...', { info: 'Voltar para dashboard' });
        if (onVoltar) {
            onVoltar();
        }
    };

    const handleMenuClick = async (sectionId) => {
        if (sectionId === 'voltar') {
            // Salvar antes de sair completamente
            if (activeSection === 'pedidos') {
                await salvarComandaAntesDeSair();
            }
            if (onVoltar) {
                onVoltar();
            }
            return;
        }

        // 🔧 VERIFICAR CAIXA ANTES DE ACESSAR OUTRAS SEÇÕES
        if (!caixaVerificado && sectionId !== 'caixa' && sectionId !== 'config-impressao') {
            setMensagemCaixa('É necessário abrir o caixa antes de acessar esta seção');
            setShowModalCaixa(true);
            return;
        }

        // SALVAR COMANDA ANTES DE SAIR DA SEÇÃO PEDIDOS
        if (activeSection === 'pedidos' && sectionId !== 'pedidos') {
            Logger.info(' Salvando comanda antes de sair da seção pedidos...', { info: 'Salvando comanda' });
            await salvarComandaAntesDeSair();
        }

        // SE CLICAR EM PEDIDOS E JÁ ESTIVER NA SEÇÃO PEDIDOS, FAZER REFRESH
        if (sectionId === 'pedidos' && activeSection === 'pedidos') {
            handleRefreshPedidos();
            setActiveSection(sectionId);
            return;
        }

        // SE MUDAR PARA SEÇÃO PEDIDOS, FAZER REFRESH AUTOMÁTICO
        if (sectionId === 'pedidos') {
            handleRefreshPedidos();
        }

        setActiveSection(sectionId);
    };

    // FUNÇÃO PARA SALVAR COMANDA ANTES DE SAIR
    const salvarComandaAntesDeSair = async () => {
        try {
            // Verifica se há uma comanda em andamento no localStorage ou estado global
            const comandaAtual = localStorage.getItem('comanda_em_andamento');

            if (comandaAtual) {
                const dadosComanda = JSON.parse(comandaAtual);

                // Só salva se tiver itens na comanda
                if (dadosComanda.items && dadosComanda.items.length > 0) {
                    Logger.info(' Salvando comanda automaticamente...', { info: 'Salvando comanda' });

                    // Chama sua API para salvar como rascunho
                    const response = await apiService.post('/comandas/rascunho', {
                        ...dadosComanda,
                        status: 'rascunho',
                        data_criacao: new Date().toISOString()
                    });

                    if (response.success) {
                        Logger.info(' Comanda salva como rascunho!', { info: 'Comanda salva' });
                        setMensagemCaixa('Comanda salva automaticamente');

                        // Remove do localStorage após salvar
                        localStorage.removeItem('comanda_em_andamento');

                        setRefreshPedidosIndicator(false);
                    }
                }
            }
        } catch (error) {
            Logger.error('Erro ao salvar comanda automaticamente:', { error, info: 'Erro ao salvar comanda' });
            setMensagemCaixa('Erro ao salvar comanda automaticamente');
            setTimeout(() => setMensagemCaixa(''), 1000);
        }
    };

    const renderContent = () => {
        // Só renderizar conteúdo se caixa estiver verificado (exceto para seção caixa e config)
        if (!caixaVerificado && activeSection !== 'caixa' && activeSection !== 'config-impressao') {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '50vh',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>💰</div>
                    <h2>Caixa Fechado</h2>
                    <p>É necessário abrir o caixa antes de usar o PDV</p>
                    <button
                        onClick={() => setShowModalCaixa(true)}
                        style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginTop: '20px'
                        }}
                    >
                        🔓 Abrir Caixa
                    </button>
                </div>
            );
        }

        switch (activeSection) {
            case "pedidos":
                return (
                    <Pedidos
                        key={resetPedidosView} // 🆕 ADICIONAR - Força remontagem do componente
                        onNavigateToConfig={() => setActiveSection("config-impressao")}
                    />
                );
            case "caixa":
                return (
                    <Caixa
                        onCaixaAberto={() => setCaixaVerificado(true)}
                        onCaixaFechado={handleCaixaFechado}
                        onVoltarDashboard={handleVoltarDashboard}
                    />
                );
            case "produtos":
                return <Produtos />;
            case "categorias":
                return <Categorias />;
            case "adicionais":
                return <Adicionais />;
            /*case "config-impressao": // 🆕 NOVA SEÇÃO
                return <ConfiguracaoImpressao />;
            case "diagnostico-impressora": // 🆕 NOVA SEÇÃO
                return <DiagnosticoImpressora />;*/
            case "delivery":
                return <ZonasEntrega />
            default:
                return <Pedidos />;
        }
    };

    const menuItems = [
        { id: "pedidos", icon: "fas fa-shopping-cart", label: "Pedidos" },
        { id: "caixa", icon: "fas fa-cash-register", label: "Caixa" },
        { id: "produtos", icon: "fas fa-box", label: "Produtos" },
        { id: "categorias", icon: "fas fa-tags", label: "Categorias" },
        { id: "adicionais", icon: "fas fa-plus", label: "Adicionais" },
        /*{
            id: "config-impressao",
            icon: "fas fa-print",
            label: "Config Impressão",
        }, // 🆕 NOVO
        {
            id: "diagnostico-impressora",
            icon: "fas fa-print",
            label: "Diag Impressora",
        }, // 🆕 NOVO*/
        { id: "delivery", icon: "fas fa-map-marked-alt", label: "Delivery" },
        { id: "voltar", icon: "fas fa-arrow-left", label: "Voltar" },
    ];

    return (
        <>
            <div className="app">
                {/* Sidebar */}
                <nav className={`sidebar ${!isExpanded ? "collapsed" : ""}`}>
                    <div className="sidebar-header">
                        <h2>
                            <i className="fas fa-store"></i>{" "}
                            <span className="sidebar-text">PDV Lanchonete</span>
                        </h2>
                    </div>
                    <ul className="sidebar-menu">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleMenuClick(item.id);
                                    }}
                                    className={activeSection === item.id ? "active" : ""}
                                    title={item.label}
                                    style={{
                                        opacity: (!caixaVerificado && item.id !== 'caixa' && item.id !== 'voltar') ? 0.5 : 1
                                    }}
                                >

                                    <i className={item.icon}></i>
                                    <span className="sidebar-text">{item.label}</span>
                                    {/*🆕 INDICADOR VISUAL DE REFRESH PARA PEDIDOS 
                                    {item.id === 'pedidos' && activeSection === 'pedidos' && (
                                        <small style={{
                                            fontSize: '10px',
                                            color: '#28a745',
                                            marginLeft: '5px'
                                        }}>
                                            🔄
                                        </small>
                                    )}
                                     */}
                                </a>
                                {/*// 5. 🔧 ATUALIZAR o estilo do menu para destacar config-impressao
                                // No JSX onde você renderiza os menuItems, adicione estilo especial:
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleMenuClick(item.id);
                                    }}
                                    className={activeSection === item.id ? "active" : ""}
                                    title={item.label}
                                    style={{
                                        opacity: (!caixaVerificado && item.id !== 'caixa' && item.id !== 'voltar' && item.id !== 'config-impressao') ? 0.5 : 1,
                                        // 🆕 Destacar config-impressao
                                        ...(item.id === 'config-impressao' ? {
                                            background: activeSection === item.id ? '#ff6b35' : 'rgba(255, 107, 53, 0.1)',
                                            borderLeft: '3px solid #ff6b35'
                                        } : {})
                                    }}
                                >
                                    <i className={item.icon}></i>
                                    <span className="sidebar-text">{item.label}</span>
                                </a>*/}
                            </li>
                        ))}
                    </ul>

                    {/* 🆕 INDICADOR DE STATUS DO CAIXA */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '10px',
                        right: '10px',
                        padding: '10px',
                        background: caixaVerificado ? '#d4edda' : '#f8d7da',
                        color: caixaVerificado ? '#155724' : '#721c24',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textAlign: 'center'
                    }}>
                        {caixaVerificado ? '✅ Caixa Aberto' : '❌ Caixa Fechado'}
                    </div>
                </nav>

                {/* Main Content */}
                <main className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
                    {/* Header */}
                    <header className="header">
                        <div className="header-left">
                            {/* 🆕 Botão hambúrguer apenas para mobile */}
                            <button
                                className="mobile-menu-btn"
                                onClick={() => {
                                    document.querySelector('.sidebar').classList.toggle('show');
                                }}
                            >
                                <i className="fas fa-bars"></i>
                            </button>
                            <h1 id="page-title">
                                {menuItems.find((item) => item.id === activeSection)?.label || "PDV"}
                            </h1>

                            {/* 🆕 BOTÃO DE REFRESH NA HEADER (apenas para pedidos) 
                            {activeSection === 'pedidos' && caixaVerificado && (
                                <button
                                    onClick={handleRefreshPedidos}
                                    style={{
                                        background: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginLeft: '15px',
                                        fontSize: '14px'
                                    }}
                                    title="Atualizar pedidos"
                                >
                                    <i className="fas fa-sync-alt"></i> Atualizar
                                </button>
                            )}
                            */}
                        </div>
                    </header>

                    {/* 🆕 MENSAGEM DE STATUS */}
                    {mensagemCaixa && (
                        <div style={{
                            background: mensagemCaixa.includes('Erro') ? '#f8d7da' : '#d1edff',
                            color: mensagemCaixa.includes('Erro') ? '#721c24' : '#0c5460',
                            padding: '12px 20px',
                            margin: '10px',
                            borderRadius: '8px',
                            border: `1px solid ${mensagemCaixa.includes('Erro') ? '#f5c6cb' : '#bee5eb'}`,
                            textAlign: 'center'
                        }}>
                            {mensagemCaixa}
                        </div>
                    )}

                    {/* Content */}
                    <div className="content">{renderContent()}</div>
                        <MenuToggleButton
                            isExpanded={isExpanded}
                            onToggle={() => {
                            setIsExpanded(!isExpanded);
                            setSidebarCollapsed(!sidebarCollapsed);
                        }}
                    />
                </main>
            </div>

            {/* 🆕 MODAL DE ABERTURA DE CAIXA */}
            <ModalAberturaCaixa
                isOpen={showModalCaixa}
                onClose={() => {
                    setShowModalCaixa(false);
                    if (!caixaVerificado && onVoltar) {
                        // Se não tem caixa aberto e usuário fechar modal, voltar para dashboard
                        onVoltar();
                    }
                }}
                onAbrirCaixa={abrirCaixa}
                loading={loadingCaixa}
            />
        </>
    );
}

export default ModuloPdv;