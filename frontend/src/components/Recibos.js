import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { recibosService } from '../services/recibosService';
import { emailService } from '../services/emailService';
import { whatsappService } from '../services/whatsappService';

function Recibos({ onVoltar }) {
    // ===========================================
    // 1. ESTADOS (State Variables)
    // ===========================================

    // Estados principais da aplicação
    const [recibos, setRecibos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    // Estados para controle de modais
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalEmail, setMostrarModalEmail] = useState(false);
    const [mostrarModalWhatsapp, setMostrarModalWhatsapp] = useState(false);
    const [reciboSelecionado, setReciboSelecionado] = useState(null);
    const [reciboParaEmail, setReciboParaEmail] = useState(null);
    const [reciboParaWhatsapp, setReciboParaWhatsapp] = useState(null);

    // Estados para filtros de busca
    const [filtros, setFiltros] = useState({
        cliente_id: '',
        data_inicio: '',
        data_fim: '',
        forma_pagamento: '',
        limite: 10,
        pagina: 1
    });

    // Estados para formulário de novo recibo
    const [novoRecibo, setNovoRecibo] = useState({
        cliente_id: '',
        descricao: '',
        valor_liquido: '',
        data_emissao: new Date().toISOString().split('T')[0],
        data_pagamento: '',
        forma_pagamento: 'dinheiro',
        observacoes: ''
    });

    // Estados para envio de email
    const [emailData, setEmailData] = useState({
        email: '',
        nome: ''
    });

    // Estados para envio de WhatsApp
    const [whatsappData, setWhatsappData] = useState({
        telefone: '',
        nome: ''
    });

    // ===========================================
    // 2. CONSTANTES E CONFIGURAÇÕES
    // ===========================================

    // Opções de forma de pagamento
    const formasPagamento = [
        { value: 'dinheiro', label: '💵 Dinheiro' },
        { value: 'pix', label: '📱 PIX' },
        { value: 'cartao_debito', label: '💳 Cartão de Débito' },
        { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
        { value: 'transferencia', label: '🏦 Transferência' },
        { value: 'boleto', label: '📄 Boleto' },
        { value: 'cheque', label: '📝 Cheque' }
    ];

    // ===========================================
    // 3. EFFECTS (useEffect)
    // ===========================================

    // Carregar dados quando o componente inicia
    useEffect(() => {
        carregarClientes();
    }, []);

    // Carregar recibos quando filtros mudam
    useEffect(() => {
        carregarRecibos();
    }, [filtros.cliente_id, filtros.data_inicio, filtros.data_fim, filtros.forma_pagamento, filtros.limite, filtros.pagina]);

    // ===========================================
    // 4. FUNÇÕES DE CARREGAMENTO DE DADOS
    // ===========================================

    // Função para carregar recibos
    const carregarRecibos = async () => {
        try {
            setLoading(true);
            setErro('');

            console.log('🔍 Carregando recibos com filtros:', filtros);
            const resultado = await recibosService.listar(filtros);

            if (resultado.success) {
                setRecibos(resultado.data || []);
                console.log('✅ Recibos carregados:', resultado.data?.length || 0);
            } else {
                setErro(resultado.message || 'Erro ao carregar recibos');
                console.error('❌ Erro na resposta:', resultado);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar recibos:', error);
            setErro('Erro de conexão ao carregar recibos');
        } finally {
            setLoading(false);
        }
    };

    // Função para carregar clientes para o select
    const carregarClientes = async () => {
        try {
            const resultado = await apiService.get('/clientes/search?limite=100');
            if (resultado.success) {
                setClientes(resultado.data || []);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    // ===========================================
    // 5. FUNÇÕES DE AÇÕES PRINCIPAIS
    // ===========================================

    // Função para criar novo recibo
    const criarRecibo = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setErro('');
            setSucesso('');

            // Validações básicas
            if (!novoRecibo.cliente_id) {
                setErro('Selecione um cliente');
                return;
            }
            if (!novoRecibo.descricao.trim()) {
                setErro('Digite a descrição do recibo');
                return;
            }
            if (!novoRecibo.valor_liquido || parseFloat(novoRecibo.valor_liquido) <= 0) {
                setErro('Digite um valor válido');
                return;
            }

            const resultado = await recibosService.criar({
                ...novoRecibo,
                valor_liquido: parseFloat(novoRecibo.valor_liquido)
            });

            if (resultado.success) {
                setSucesso('Recibo criado com sucesso!');
                setMostrarModal(false);

                // Limpar formulário
                setNovoRecibo({
                    cliente_id: '',
                    descricao: '',
                    valor_liquido: '',
                    data_emissao: new Date().toISOString().split('T')[0],
                    data_pagamento: '',
                    forma_pagamento: 'dinheiro',
                    observacoes: ''
                });

                // Recarregar lista
                carregarRecibos();
            } else {
                setErro(resultado.message || 'Erro ao criar recibo');
            }
        } catch (error) {
            console.error('Erro ao criar recibo:', error);
            setErro('Erro de conexão ao criar recibo');
        } finally {
            setLoading(false);
        }
    };

    // Função para cancelar recibo
    const cancelarRecibo = async (reciboId) => {
        if (!window.confirm('Tem certeza que deseja cancelar este recibo?')) {
            return;
        }

        try {
            const resultado = await recibosService.cancelar(reciboId);
            if (resultado.success) {
                setSucesso('Recibo cancelado com sucesso!');
                carregarRecibos();
            } else {
                setErro(resultado.message || 'Erro ao cancelar recibo');
            }
        } catch (error) {
            console.error('Erro ao cancelar recibo:', error);
            setErro('Erro ao cancelar recibo');
        }
    };

    // ===========================================
    // 6. FUNÇÕES DE VISUALIZAÇÃO E IMPRESSÃO
    // ===========================================

    // Função para imprimir recibo
    const imprimirRecibo = (reciboId) => {
        // Pegar token do localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            setErro('Token de autenticação não encontrado');
            return;
        }

        // Passar token como parâmetro na URL
        const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/recibos/${reciboId}/imprimir?token=${encodeURIComponent(token)}`;
        window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    };

    // Função para visualizar recibo
    const visualizarRecibo = async (reciboId) => {
        try {
            const response = await recibosService.visualizar(reciboId);
            if (response.success) {
                const novaJanela = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
                novaJanela.document.write(response.html);
                novaJanela.document.close();
            } else {
                setErro('Erro ao visualizar recibo');
            }
        } catch (error) {
            console.error('Erro ao visualizar recibo:', error);
            setErro('Erro ao visualizar recibo');
        }
    };

    // ===========================================
    // 7. FUNÇÕES DE EMAIL
    // ===========================================

    // Função para abrir modal de envio de email
    const abrirModalEmail = (recibo) => {
        setReciboParaEmail(recibo);
        setEmailData({
            email: '',
            nome: recibo.cliente_nome
        });
        setMostrarModalEmail(true);
    };

    // Função para enviar recibo por email
    const enviarReciboPorEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await emailService.enviarRecibo(
                reciboParaEmail.id,
                emailData.email,
                emailData.nome
            );

            if (resultado.success) {
                setSucesso('Recibo enviado por email com sucesso!');
                setMostrarModalEmail(false);
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao enviar recibo por email:', error);
            setErro('Erro ao enviar recibo por email');
        } finally {
            setLoading(false);
        }
    };

    // ===========================================
    // 8. FUNÇÕES DE WHATSAPP
    // ===========================================

    // Função para abrir modal de envio de WhatsApp
    const abrirModalWhatsapp = (recibo) => {
        setReciboParaWhatsapp(recibo);
        setWhatsappData({
            telefone: '',
            nome: recibo.cliente_nome
        });
        setMostrarModalWhatsapp(true);
    };

    // Função para enviar recibo por WhatsApp
    const enviarReciboPorWhatsapp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            // Limpar telefone (remover caracteres especiais)
            const telefoneNumeros = whatsappData.telefone.replace(/\D/g, '');

            const resultado = await whatsappService.enviarRecibo(
                reciboParaWhatsapp.id,
                telefoneNumeros,
                whatsappData.nome
            );

            if (resultado.success) {
                setSucesso('Recibo enviado por WhatsApp com sucesso!');
                setMostrarModalWhatsapp(false);
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao enviar recibo por WhatsApp:', error);
            setErro('Erro ao enviar recibo por WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    // Função para formatar telefone enquanto digita
    const formatarTelefone = (valor) => {
        // Remove tudo que não é número
        const numeros = valor.replace(/\D/g, '');

        // Aplica a máscara (xx) xxxxx-xxxx
        if (numeros.length <= 2) {
            return numeros;
        } else if (numeros.length <= 7) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        } else if (numeros.length <= 11) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        } else {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
        }
    };

    // ===========================================
    // 9. FUNÇÕES UTILITÁRIAS
    // ===========================================

    // Função para formatar moeda
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    // Função para formatar data
    const formatarData = (data) => {
        if (!data) return '-';
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    };

    // ===========================================
    // 10. RENDER (Interface do Usuário)
    // ===========================================

    return (
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>

                {/* ========== HEADER ========== */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#333' }}>🧾 Recibos</h1>
                        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                            Gerenciar recibos de pagamento
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setMostrarModal(true)}
                            style={{
                                background: '#38a169',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            ➕ Novo Recibo
                        </button>
                        
                        <button
                            onClick={onVoltar}
                            style={{
                                background: '#666',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            ⬅️ Voltar
                        </button>
                       
                    </div>
                </div>

                {/* ========== MENSAGENS ========== */}
                {erro && (
                    <div style={{
                        background: '#fee',
                        color: '#c53030',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #fed7d7'
                    }}>
                        ⚠️ {erro}
                    </div>
                )}

                {sucesso && (
                    <div style={{
                        background: '#f0fff4',
                        color: '#276749',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #9ae6b4'
                    }}>
                        ✅ {sucesso}
                    </div>
                )}

                {/* ========== FILTROS ========== */}
                <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#555' }}>🔍 Filtros</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Cliente:
                            </label>
                            <select
                                value={filtros.cliente_id}
                                onChange={(e) => setFiltros(prev => ({ ...prev, cliente_id: e.target.value, pagina: 1 }))}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            >
                                <option value="">Todos os clientes</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Forma de Pagamento:
                            </label>
                            <select
                                value={filtros.forma_pagamento}
                                onChange={(e) => setFiltros(prev => ({ ...prev, forma_pagamento: e.target.value, pagina: 1 }))}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            >
                                <option value="">Todas as formas</option>
                                {formasPagamento.map(forma => (
                                    <option key={forma.value} value={forma.value}>
                                        {forma.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Data Início:
                            </label>
                            <input
                                type="date"
                                value={filtros.data_inicio}
                                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value, pagina: 1 }))}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Data Fim:
                            </label>
                            <input
                                type="date"
                                value={filtros.data_fim}
                                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value, pagina: 1 }))}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                        <button
                            onClick={() => {
                                setFiltros({
                                    cliente_id: '',
                                    data_inicio: '',
                                    data_fim: '',
                                    forma_pagamento: '',
                                    limite: 10,
                                    pagina: 1
                                });
                            }}
                            style={{
                                background: '#e2e8f0',
                                color: '#4a5568',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            🗑️ Limpar Filtros
                        </button>
                    </div>
                </div>

                {/* ========== LOADING ========== */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        🔄 Carregando recibos...
                    </div>
                )}

                {/* ========== LISTA DE RECIBOS ========== */}
                {!loading && (
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0'
                    }}>
                        {recibos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                📄 Nenhum recibo encontrado
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f7fafc' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            Número
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            Cliente
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            Descrição
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            Valor
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            Data Emissão
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            Forma Pagamento
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recibos.map(recibo => (
                                        <tr key={recibo.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#3182ce' }}>
                                                    #{recibo.numero_recibo}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {recibo.cliente_nome}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{
                                                    maxWidth: '200px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {recibo.descricao}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#38a169' }}>
                                                {formatarMoeda(recibo.valor_liquido)}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {formatarData(recibo.data_emissao)}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {formasPagamento.find(f => f.value === recibo.forma_pagamento)?.label || recibo.forma_pagamento}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => visualizarRecibo(recibo.id)}
                                                        style={{
                                                            background: '#3182ce',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Visualizar e imprimir recibo"
                                                    >
                                                        🖨️ Imprimir
                                                    </button>
                                                    <button
                                                        onClick={() => abrirModalEmail(recibo)}
                                                        style={{
                                                            background: '#3182ce',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Enviar por email"
                                                    >
                                                        📧 Email
                                                    </button>
                                                    <button
                                                        onClick={() => abrirModalWhatsapp(recibo)}
                                                        style={{
                                                            background: '#25d366',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Enviar por WhatsApp"
                                                    >
                                                        📱 WhatsApp
                                                    </button>
                                                    <button
                                                        onClick={() => cancelarRecibo(recibo.id)}
                                                        style={{
                                                            background: '#e53e3e',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Cancelar recibo"
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ========== MODAL NOVO RECIBO ========== */}
                {mostrarModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '30px',
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>➕ Novo Recibo</h2>

                            <form onSubmit={criarRecibo}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '20px'
                                }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                            Cliente: *
                                        </label>
                                        <select
                                            value={novoRecibo.cliente_id}
                                            onChange={(e) => setNovoRecibo(prev => ({ ...prev, cliente_id: e.target.value }))}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            <option value="">Selecione um cliente</option>
                                            {clientes.map(cliente => (
                                                <option key={cliente.id} value={cliente.id}>
                                                    {cliente.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                            Valor: *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={novoRecibo.valor_liquido}
                                            onChange={(e) => setNovoRecibo(prev => ({ ...prev, valor_liquido: e.target.value }))}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px'
                                            }}
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                            Data de Emissão: *
                                        </label>
                                        <input
                                            type="date"
                                            value={novoRecibo.data_emissao}
                                            onChange={(e) => setNovoRecibo(prev => ({ ...prev, data_emissao: e.target.value }))}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                            Data do Pagamento:
                                        </label>
                                        <input
                                            type="date"
                                            value={novoRecibo.data_pagamento}
                                            onChange={(e) => setNovoRecibo(prev => ({ ...prev, data_pagamento: e.target.value }))}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                            Forma de Pagamento: *
                                        </label>
                                        <select
                                            value={novoRecibo.forma_pagamento}
                                            onChange={(e) => setNovoRecibo(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            {formasPagamento.map(forma => (
                                                <option key={forma.value} value={forma.value}>
                                                    {forma.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                        Descrição: *
                                    </label>
                                    <textarea
                                        value={novoRecibo.descricao}
                                        onChange={(e) => setNovoRecibo(prev => ({ ...prev, descricao: e.target.value }))}
                                        required
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            resize: 'vertical'
                                        }}
                                        placeholder="Descreva os serviços ou produtos..."
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                        Observações:
                                    </label>
                                    <textarea
                                        value={novoRecibo.observacoes}
                                        onChange={(e) => setNovoRecibo(prev => ({ ...prev, observacoes: e.target.value }))}
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            resize: 'vertical'
                                        }}
                                        placeholder="Observações adicionais (opcional)..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarModal(false)}
                                        style={{
                                            background: '#e2e8f0',
                                            color: '#4a5568',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ❌ Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            background: '#38a169',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? '⏳ Criando...' : '✅ Criar Recibo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========== MODAL DE EMAIL ========== */}
                {mostrarModalEmail && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '30px',
                            width: '90%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>📧 Enviar Recibo por Email</h2>

                            {/* Info do recibo */}
                            <div style={{
                                background: '#f0f8ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '20px'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
                                    Recibo #{reciboParaEmail?.numero_recibo}
                                </h4>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Cliente:</strong> {reciboParaEmail?.cliente_nome}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Valor:</strong> {formatarMoeda(reciboParaEmail?.valor_liquido)}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Data:</strong> {formatarData(reciboParaEmail?.data_emissao)}
                                </p>
                            </div>

                            <form onSubmit={enviarReciboPorEmail}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                        Nome do Destinatário: *
                                    </label>
                                    <input
                                        type="text"
                                        value={emailData.nome}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, nome: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                        placeholder="Nome de quem vai receber"
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                        Email: *
                                    </label>
                                    <input
                                        type="email"
                                        value={emailData.email}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                        placeholder="exemplo@email.com"
                                    />
                                </div>

                                {/* Preview do email */}
                                <div style={{
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📋 Preview do Email:</h4>
                                    <div style={{
                                        background: 'white',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        borderLeft: '4px solid #3b82f6',
                                        fontSize: '14px'
                                    }}>
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Para:</strong> {emailData.nome || '[Nome]'} ({emailData.email || '[email]'})
                                        </p>
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Assunto:</strong> Recibo de Pagamento #{reciboParaEmail?.numero_recibo}
                                        </p>
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Anexo:</strong> recibo_{reciboParaEmail?.numero_recibo}.pdf
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarModalEmail(false)}
                                        style={{
                                            background: '#e2e8f0',
                                            color: '#4a5568',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ❌ Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            background: '#3182ce',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? '⏳ Enviando...' : '📧 Enviar Email'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========== MODAL DE WHATSAPP ========== */}
                {mostrarModalWhatsapp && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '30px',
                            width: '90%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>📱 Enviar Recibo por WhatsApp</h2>

                            {/* Info do recibo */}
                            <div style={{
                                background: '#e8f5e8',
                                border: '1px solid #25d366',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '20px'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#25d366' }}>
                                    Recibo #{reciboParaWhatsapp?.numero_recibo}
                                </h4>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Cliente:</strong> {reciboParaWhatsapp?.cliente_nome}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Valor:</strong> {formatarMoeda(reciboParaWhatsapp?.valor_liquido)}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Data:</strong> {formatarData(reciboParaWhatsapp?.data_emissao)}
                                </p>
                            </div>

                            <form onSubmit={enviarReciboPorWhatsapp}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                        Nome do Destinatário: *
                                    </label>
                                    <input
                                        type="text"
                                        value={whatsappData.nome}
                                        onChange={(e) => setWhatsappData(prev => ({ ...prev, nome: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                        placeholder="Nome de quem vai receber"
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                        Telefone (WhatsApp): *
                                    </label>
                                    <input
                                        type="tel"
                                        value={whatsappData.telefone}
                                        onChange={(e) => setWhatsappData(prev => ({
                                            ...prev,
                                            telefone: formatarTelefone(e.target.value)
                                        }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px'
                                        }}
                                        placeholder="(11) 99999-9999"
                                        maxLength={15}
                                    />
                                    <small style={{ color: '#666', fontSize: '12px' }}>
                                        Digite apenas números. Formato: (xx) xxxxx-xxxx
                                    </small>
                                </div>

                                {/* Preview da mensagem */}
                                <div style={{
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📋 Preview da Mensagem:</h4>
                                    <div style={{
                                        background: '#25d366',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}>
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Para:</strong> {whatsappData.nome || '[Nome]'} ({whatsappData.telefone || '[telefone]'})
                                        </p>
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Mensagem:</strong> Olá! Segue em anexo o recibo #{reciboParaWhatsapp?.numero_recibo}
                                        </p>
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Anexo:</strong> recibo_{reciboParaWhatsapp?.numero_recibo}.pdf
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarModalWhatsapp(false)}
                                        style={{
                                            background: '#e2e8f0',
                                            color: '#4a5568',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ❌ Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            background: '#25d366',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? '⏳ Enviando...' : '📱 Enviar WhatsApp'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Recibos;