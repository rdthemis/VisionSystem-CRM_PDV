import React, { useState, useEffect } from 'react';
import { contasReceberService } from '../services/contasReceberService';
import { clientesService } from '../services/clientesService';
import { recibosService } from '../services/recibosService'; // NOVO: Import do serviço de recibos

const ContasReceber = () => {
    const [contas, setContas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
    const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false); // NOVO: Modal do recibo
    const [contaEditando, setContaEditando] = useState(null);
    const [contaPagamento, setContaPagamento] = useState(null);
    const [reciboGerado, setReciboGerado] = useState(null); // NOVO: Dados do recibo gerado
    const [resumoFinanceiro, setResumoFinanceiro] = useState(null);

    const [paginacao, setPaginacao] = useState({
        total: 0,
        por_pagina: 10,
        pagina_atual: 1,
        total_paginas: 1
    });

    // Filtros
    const [filtros, setFiltros] = useState({
        cliente_id: '',
        status: '',
        data_vencimento_inicio: '',
        data_vencimento_fim: '',
        descricao: '',
        ordenacao: 'data_vencimento',
        direcao: 'ASC'
    });

    // Dados do formulário de conta
    const [formData, setFormData] = useState({
        cliente_id: '',
        descricao: '',
        numero_documento: '',
        valor_original: '',
        data_vencimento: '',
        data_emissao: new Date().toISOString().split('T')[0],
        observacoes: '',
        forma_pagamento: '',
        banco: '',
        agencia: '',
        conta: ''
    });

    // Dados do formulário de pagamento
    const [formPagamento, setFormPagamento] = useState({
        valor_pago: '',
        valor_desconto: '0',
        valor_juros: '0',
        valor_multa: '0',
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: '',
        observacoes: '',
        banco: '',
        agencia: '',
        conta: '',
        cheque: ''
    });

    const statusOptions = [
        { value: '', label: 'Todos' },
        { value: 'pendente', label: 'Pendente' },
        { value: 'pago', label: 'Pago' },
        { value: 'vencido', label: 'Vencido' },
        { value: 'cancelado', label: 'Cancelado' }
    ];

    const formasPagamento = [
        'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX',
        'Transferência Bancária', 'Boleto', 'Cheque', 'Outros'
    ];

    // Carregar dados iniciais
    useEffect(() => {
        carregarContas();
        carregarClientes();
        carregarResumo();
    }, []);

    // NOVO: Função para visualizar recibo
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

    // NOVO: Função para imprimir recibo
    const imprimirRecibo = (reciboId) => {
        const token = localStorage.getItem('token');

        if (!token) {
            setErro('Token de autenticação não encontrado');
            return;
        }

        const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/recibos/${reciboId}/imprimir?token=${encodeURIComponent(token)}`;
        window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    };

    // Carregar contas
    const carregarContas = async (novaPagina = null) => {
        setLoading(true);
        setErro('');

        try {
            const filtrosComPaginacao = {
                ...filtros,
                limite: paginacao.por_pagina,
                pagina: novaPagina || paginacao.pagina_atual
            };

            const resultado = await contasReceberService.listar(filtrosComPaginacao);

            if (resultado.success) {
                setContas(resultado.data);
                setPaginacao(resultado.pagination);
            } else {
                setErro(resultado.message || 'Erro ao carregar contas');
            }
        } catch (error) {
            setErro('Erro de conexão ao carregar contas');
        } finally {
            setLoading(false);
        }
    };

    // Carregar clientes para select
    const carregarClientes = async () => {
        try {
            const resultado = await clientesService.buscarParaSelect('', 100);
            if (resultado.success) {
                setClientes(resultado.data);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    // Carregar resumo financeiro
    const carregarResumo = async () => {
        try {
            const resultado = await contasReceberService.obterResumo();
            if (resultado.success) {
                setResumoFinanceiro(resultado.data);
            }
        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
        }
    };

    // Aplicar filtros
    const aplicarFiltros = () => {
        setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
        carregarContas(1);
    };

    // Limpar filtros
    const limparFiltros = () => {
        setFiltros({
            cliente_id: '',
            status: '',
            data_vencimento_inicio: '',
            data_vencimento_fim: '',
            descricao: '',
            ordenacao: 'data_vencimento',
            direcao: 'ASC'
        });
        setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
        setTimeout(() => carregarContas(1), 100);
    };

    // Nova conta
    const novaConta = () => {
        setContaEditando(null);
        setFormData({
            cliente_id: '',
            descricao: '',
            numero_documento: '',
            valor_original: '',
            data_vencimento: '',
            data_emissao: new Date().toISOString().split('T')[0],
            observacoes: '',
            forma_pagamento: '',
            banco: '',
            agencia: '',
            conta: ''
        });
        setMostrarModal(true);
    };

    // Editar conta
    const editarConta = async (id) => {
        setLoading(true);
        try {
            const resultado = await contasReceberService.buscarPorId(id);
            if (resultado.success) {
                setContaEditando(id);
                setFormData(resultado.data);
                setMostrarModal(true);
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao carregar dados da conta');
        } finally {
            setLoading(false);
        }
    };

    // Salvar conta
    const salvarConta = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            let resultado;

            if (contaEditando) {
                resultado = await contasReceberService.atualizar(contaEditando, formData);
            } else {
                resultado = await contasReceberService.criar(formData);
            }

            if (resultado.success) {
                setSucesso(resultado.message);
                setMostrarModal(false);
                carregarContas();
                carregarResumo();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao salvar conta');
        } finally {
            setLoading(false);
        }
    };

    // Cancelar conta
    const cancelarConta = async (id, descricao) => {
        if (!window.confirm(`Tem certeza que deseja cancelar a conta "${descricao}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const resultado = await contasReceberService.cancelar(id);
            if (resultado.success) {
                setSucesso(resultado.message);
                carregarContas();
                carregarResumo();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao cancelar conta');
        } finally {
            setLoading(false);
        }
    };

    // Abrir modal de pagamento
    const abrirModalPagamento = (conta) => {
        setContaPagamento(conta);
        setFormPagamento({
            valor_pago: (conta.valor_original - conta.valor_recebido).toFixed(2),
            valor_desconto: '0',
            valor_juros: '0',
            valor_multa: '0',
            data_pagamento: new Date().toISOString().split('T')[0],
            forma_pagamento: '',
            observacoes: '',
            banco: '',
            agencia: '',
            conta: '',
            cheque: ''
        });
        setMostrarModalPagamento(true);
    };

    // MODIFICADO: Adicionar pagamento (com verificação de recibo)
    const adicionarPagamento = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await contasReceberService.adicionarPagamento(contaPagamento.id, formPagamento);

            if (resultado.success) {
                // Fechar modal de pagamento
                setMostrarModalPagamento(false);

                // Verificar se um recibo foi gerado
                if (resultado.data.recibo && resultado.data.recibo.id) {
                    // NOVO: Mostrar modal do recibo
                    setReciboGerado({
                        ...resultado.data.recibo,
                        cliente_nome: contaPagamento.cliente_nome,
                        valor_pago: formPagamento.valor_pago,
                        data_recebimento: contaPagamento.data_pagamento,
                        forma_pagamento: formPagamento.forma_pagamento
                    });
                    setMostrarModalRecibo(true);
                    setSucesso(`${resultado.message} - Recibo ${resultado.data.recibo.numero_recibo} gerado automaticamente!`);
                } else {
                    // Se não gerou recibo, mostrar mensagem normal
                    setSucesso(resultado.message);
                    if (resultado.data.recibo_erro) {
                        console.warn('Erro ao gerar recibo:', resultado.data.recibo_erro);
                    }
                }

                // Recarregar dados
                carregarContas();
                carregarResumo();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao registrar pagamento');
        } finally {
            setLoading(false);
        }
    };

    // Formatação de valores
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    const formatarData = (data) => {
        if (!data) return '-';
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pago': return '#28a745';
            case 'pendente': return '#007bff';
            case 'vencido': return '#dc3545';
            case 'cancelado': return '#6c757d';
            default: return '#333';
        }
    };

    const calcularDiasVencimento = (dataVencimento) => {
        const hoje = new Date();
        const vencimento = new Date(dataVencimento + 'T00:00:00');
        const diferenca = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

        if (diferenca < 0) return `${Math.abs(diferenca)} dias em atraso`;
        if (diferenca === 0) return 'Vence hoje';
        if (diferenca <= 7) return `Vence em ${diferenca} dias`;
        return `Vence em ${diferenca} dias`;
    };

    return (
        <div className="contas-receber-container">
            <div className="contas-header">
                <h1>💰 Contas a Receber</h1>
                <button
                    onClick={novaConta}
                    className="btn-primary"
                    disabled={loading}
                >
                    ➕ Nova Conta
                </button>
            </div>

            {/* Mensagens */}
            {erro && (
                <div className="alert alert-error">
                    ⚠️ {erro}
                </div>
            )}

            {sucesso && (
                <div className="alert alert-success">
                    ✅ {sucesso}
                </div>
            )}

            {/* Resumo Financeiro */}
            {resumoFinanceiro && (
                <div className="resumo-financeiro">
                    <h3>📊 Resumo Financeiro</h3>
                    <div className="resumo-cards">
                        <div className="resumo-card">
                            <div className="card-value">{resumoFinanceiro.total_contas || 0}</div>
                            <div className="card-label">Total de Contas</div>
                        </div>
                        <div className="resumo-card">
                            <div className="card-value">{formatarMoeda(resumoFinanceiro.valor_total)}</div>
                            <div className="card-label">Valor Total</div>
                        </div>
                        <div className="resumo-card pendente">
                            <div className="card-value">{formatarMoeda(resumoFinanceiro.valor_pendente)}</div>
                            <div className="card-label">A Receber</div>
                        </div>
                        <div className="resumo-card vencido">
                            <div className="card-value">{formatarMoeda(resumoFinanceiro.valor_vencido)}</div>
                            <div className="card-label">Em Atraso</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="filtros-card">
                <h3>🔍 Filtros</h3>
                <div className="filtros-grid">
                    <div className="campo">
                        <label>Cliente:</label>
                        <select
                            value={filtros.cliente_id}
                            onChange={(e) => setFiltros(prev => ({ ...prev, cliente_id: e.target.value }))}
                        >
                            <option value="">Todos os clientes</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id}
                                    value={cliente.id}>
                                    {cliente.nome}
                                </option>
                            ))
                            }
                        </select >
                    </div >

                    <div className="campo">
                        <label>Status:</label>
                        <select
                            value={filtros.status}
                            onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="campo">
                        <label>Vencimento (De):</label>
                        <input
                            type="date"
                            value={filtros.data_vencimento_inicio}
                            onChange={(e) => setFiltros(prev => ({ ...prev, data_vencimento_inicio: e.target.value }))}
                        />
                    </div>

                    <div className="campo">
                        <label>Vencimento (Até):</label>
                        <input
                            type="date"
                            value={filtros.data_vencimento_fim}
                            onChange={(e) => setFiltros(prev => ({ ...prev, data_vencimento_fim: e.target.value }))}
                        />
                    </div>

                    <div className="campo">
                        <label>Descrição:</label>
                        <input
                            type="text"
                            value={filtros.descricao}
                            onChange={(e) => setFiltros(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Buscar por descrição..."
                        />
                    </div>
                </div >

                <div className="filtros-acoes">
                    <button onClick={aplicarFiltros} className="btn-secondary">
                        🔍 Filtrar
                    </button>
                    <button onClick={limparFiltros} className="btn-outline">
                        🗑️ Limpar
                    </button>
                </div>
            </div >

            {/* Lista de Contas */}
            < div className="contas-lista" >
                {loading && <div className="loading">🔄 Carregando...</div>}

                {
                    !loading && contas.length === 0 && (
                        <div className="empty-state">
                            <p>📋 Nenhuma conta a receber encontrada</p>
                            <button onClick={novaConta} className="btn-primary">
                                ➕ Cadastrar Primeira Conta
                            </button>
                        </div>
                    )
                }

                {
                    !loading && contas.length > 0 && (
                        <>
                            <div className="contas-table">
                                <div className="table-header">
                                    <div>Cliente</div>
                                    <div>Descrição</div>
                                    <div>Valor</div>
                                    <div>Vencimento</div>
                                    <div>Status</div>
                                    <div>Ações</div>
                                </div>

                                {contas.map(conta => (
                                    <div key={conta.id} className="table-row">
                                        <div className="conta-cliente">
                                            <strong>{conta.cliente_nome}</strong>
                                            {conta.cliente_documento && (
                                                <small>{conta.cliente_documento}</small>
                                            )}
                                        </div>

                                        <div className="conta-descricao">
                                            <strong>{conta.descricao}</strong>
                                            {conta.numero_documento && (
                                                <small>Doc: {conta.numero_documento}</small>
                                            )}
                                        </div>

                                        <div className="conta-valor">
                                            <div className="valor-original">
                                                {formatarMoeda(conta.valor_original)}
                                            </div>
                                            {conta.valor_recebido > 0 && (
                                                <small className="valor-recebido">
                                                    Recebido: {formatarMoeda(conta.valor_recebido)}
                                                </small>
                                            )}
                                            {conta.valor_pendente > 0 && (
                                                <small className="valor-pendente">
                                                    Pendente: {formatarMoeda(conta.valor_pendente)}
                                                </small>
                                            )}
                                        </div>

                                        <div className="conta-vencimento">
                                            <div>{formatarData(conta.data_vencimento)}</div>
                                            <small className={conta.status === 'vencido' ? 'text-danger' : ''}>
                                                {calcularDiasVencimento(conta.data_vencimento)}
                                            </small>
                                        </div>

                                        <div>
                                            <span
                                                className="badge"
                                                style={{ backgroundColor: getStatusColor(conta.status), color: 'white' }}
                                            >
                                                {conta.status_texto}
                                            </span>
                                        </div>

                                        <div className="acoes">
                                            {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                                                <button
                                                    onClick={() => abrirModalPagamento(conta)}
                                                    className="btn-small btn-success"
                                                    title="Receber"
                                                >
                                                    💰
                                                </button>
                                            )}

                                            {conta.status !== 'pago' && (
                                                <button
                                                    onClick={() => editarConta(conta.id)}
                                                    className="btn-small btn-secondary"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                            )}

                                            {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                                                <button
                                                    onClick={() => cancelarConta(conta.id, conta.descricao)}
                                                    className="btn-small btn-danger"
                                                    title="Cancelar"
                                                >
                                                    ❌
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Paginação */}
                            {paginacao.total_paginas > 1 && (
                                <div className="paginacao">
                                    <button
                                        onClick={() => carregarContas(paginacao.pagina_atual - 1)}
                                        disabled={paginacao.pagina_atual === 1}
                                        className="btn-outline btn-small"
                                    >
                                        ⬅️ Anterior
                                    </button>

                                    <span>
                                        Página {paginacao.pagina_atual} de {paginacao.total_paginas}
                                        ({paginacao.total} contas)
                                    </span>

                                    <button
                                        onClick={() => carregarContas(paginacao.pagina_atual + 1)}
                                        disabled={paginacao.pagina_atual === paginacao.total_paginas}
                                        className="btn-outline btn-small"
                                    >
                                        Próxima ➡️
                                    </button>
                                </div>
                            )}
                        </>
                    )
                }
            </div >

            {/* Modal de Cadastro/Edição */}
            {
                mostrarModal && (
                    <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
                        <div className="modal-content large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>
                                    {contaEditando ? '✏️ Editar Conta' : '➕ Nova Conta a Receber'}
                                </h2>
                                <button
                                    onClick={() => setMostrarModal(false)}
                                    className="btn-close"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={salvarConta} className="conta-form">
                                <div className="form-section">
                                    <h3>📋 Dados da Conta</h3>

                                    <div className="form-row">
                                        <div className="campo">
                                            <label>Cliente: *</label>
                                            <select
                                                value={formData.cliente_id}
                                                onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value }))}
                                                required
                                            >
                                                <option value="">Selecione o cliente</option>
                                                {clientes.map(cliente => (
                                                    <option key={cliente.id} value={cliente.id}>
                                                        {cliente.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="campo">
                                            <label>Valor: *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.valor_original}
                                                onChange={(e) => setFormData(prev => ({ ...prev, valor_original: e.target.value }))}
                                                required
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="campo span-2">
                                            <label>Descrição: *</label>
                                            <input
                                                type="text"
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                                                required
                                                placeholder="Descrição da conta a receber"
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Número do Documento:</label>
                                            <input
                                                type="text"
                                                value={formData.numero_documento}
                                                onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                                                placeholder="NF, Pedido, etc."
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="campo">
                                            <label>Data de Emissão:</label>
                                            <input
                                                type="date"
                                                value={formData.data_emissao}
                                                onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Data de Vencimento: *</label>
                                            <input
                                                type="date"
                                                value={formData.data_vencimento}
                                                onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                                                required
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Forma de Pagamento:</label>
                                            <select
                                                value={formData.forma_pagamento}
                                                onChange={(e) => setFormData(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                                            >
                                                <option value="">Selecione</option>
                                                {formasPagamento.map(forma => (
                                                    <option key={forma} value={forma}>{forma}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="campo">
                                            <label>Banco:</label>
                                            <input
                                                type="text"
                                                value={formData.banco}
                                                onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
                                                placeholder="Nome do banco"
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Agência:</label>
                                            <input
                                                type="text"
                                                value={formData.agencia}
                                                onChange={(e) => setFormData(prev => ({ ...prev, agencia: e.target.value }))}
                                                placeholder="Agência"
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Conta:</label>
                                            <input
                                                type="text"
                                                value={formData.conta}
                                                onChange={(e) => setFormData(prev => ({ ...prev, conta: e.target.value }))}
                                                placeholder="Conta"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="campo span-full">
                                            <label>Observações:</label>
                                            <textarea
                                                value={formData.observacoes}
                                                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                                                rows="3"
                                                placeholder="Observações sobre a conta..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setMostrarModal(false)} className="btn-outline">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '🔄 Salvando...' : (contaEditando ? '💾 Atualizar' : '💾 Salvar')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal de Pagamento */}
            {
                mostrarModalPagamento && contaPagamento && (
                    <div className="modal-overlay" onClick={() => setMostrarModalPagamento(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>💰 Registrar Pagamento</h2>
                                <button
                                    onClick={() => setMostrarModalPagamento(false)}
                                    className="btn-close"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="conta-info">
                                <h4>📋 Informações da Conta</h4>
                                <p><strong>Cliente:</strong> {contaPagamento.cliente_nome}</p>
                                <p><strong>Descrição:</strong> {contaPagamento.descricao}</p>
                                <p><strong>Valor Original:</strong> {formatarMoeda(contaPagamento.valor_original)}</p>
                                <p><strong>Valor Recebido:</strong> {formatarMoeda(contaPagamento.valor_recebido)}</p>
                                <p><strong>Valor Pendente:</strong> {formatarMoeda(contaPagamento.valor_pendente)}</p>
                            </div>

                            <form onSubmit={adicionarPagamento} className="pagamento-form">
                                <div className="form-section">
                                    <h3>💳 Dados do Pagamento</h3>

                                    <div className="form-row">
                                        <div className="campo">
                                            <label>Valor Pago: *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formPagamento.valor_pago}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, valor_pago: e.target.value }))}
                                                required
                                                max={contaPagamento.valor_pendente}
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Data do Pagamento: *</label>
                                            <input
                                                type="date"
                                                value={formPagamento.data_pagamento}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, data_pagamento: e.target.value }))}
                                                required
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Forma de Pagamento: *</label>
                                            <select
                                                value={formPagamento.forma_pagamento}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                                                required
                                            >
                                                <option value="">Selecione</option>
                                                {formasPagamento.map(forma => (
                                                    <option key={forma} value={forma}>{forma}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="campo">
                                            <label>Desconto:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formPagamento.valor_desconto}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, valor_desconto: e.target.value }))}
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Juros:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formPagamento.valor_juros}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, valor_juros: e.target.value }))}
                                            />
                                        </div>

                                        <div className="campo">
                                            <label>Multa:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formPagamento.valor_multa}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, valor_multa: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="campo span-full">
                                            <label>Observações:</label>
                                            <textarea
                                                value={formPagamento.observacoes}
                                                onChange={(e) => setFormPagamento(prev => ({ ...prev, observacoes: e.target.value }))}
                                                rows="2"
                                                placeholder="Observações sobre o pagamento..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setMostrarModalPagamento(false)} className="btn-outline">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-success">
                                        {loading ? '🔄 Registrando...' : '💰 Registrar Pagamento'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* NOVO: Modal do Recibo Gerado */}
            {
                mostrarModalRecibo && reciboGerado && (
                    <div className="modal-overlay" onClick={() => setMostrarModalRecibo(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>🎉 Recibo Gerado com Sucesso!</h2>
                                <button
                                    onClick={() => setMostrarModalRecibo(false)}
                                    className="btn-close"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="recibo-success-content">
                                <div className="success-icon">
                                    <div className="icon-circle">✅</div>
                                    <h3>Pagamento registrado e recibo gerado!</h3>
                                </div>

                                <div className="recibo-info">
                                    <div className="recibo-details">
                                        <h4>📋 Dados do Recibo</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Número:</span>
                                                <span className="detail-value">{reciboGerado.numero_recibo}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Cliente:</span>
                                                <span className="detail-value">{reciboGerado.cliente_nome}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Valor:</span>
                                                <span className="detail-value valor">{formatarMoeda(reciboGerado.valor_pago)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Data:</span>
                                                <span className="detail-value">{formatarData(reciboGerado.data_pagamento)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Forma de Pagamento:</span>
                                                <span className="detail-value">{reciboGerado.forma_pagamento}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="recibo-actions">
                                    <h4>🎯 O que deseja fazer agora?</h4>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => visualizarRecibo(reciboGerado.id)}
                                            className="btn-action btn-view"
                                        >
                                            <span className="btn-icon">👁️</span>
                                            <div className="btn-text">
                                                <strong>Visualizar Recibo</strong>
                                                <small>Ver recibo em nova janela</small>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => imprimirRecibo(reciboGerado.id)}
                                            className="btn-action btn-print"
                                        >
                                            <span className="btn-icon">🖨️</span>
                                            <div className="btn-text">
                                                <strong>Imprimir Recibo</strong>
                                                <small>Abrir para impressão</small>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setMostrarModalRecibo(false);
                                                // Aqui você pode navegar para a tela de recibos se tiver
                                                // onNavigate && onNavigate('recibos');
                                            }}
                                            className="btn-action btn-manage"
                                        >
                                            <span className="btn-icon">🧾</span>
                                            <div className="btn-text">
                                                <strong>Ver Todos os Recibos</strong>
                                                <small>Ir para tela de recibos</small>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        onClick={() => setMostrarModalRecibo(false)}
                                        className="btn-outline"
                                    >
                                        ✅ Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .contas-receber-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .contas-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .contas-header h1 {
                    margin: 0;
                    color: #333;
                }

                .alert {
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .alert-error {
                    background: #fee;
                    color: #c53030;
                    border: 1px solid #fed7d7;
                }

                .alert-success {
                    background: #f0fff4;
                    color: #276749;
                    border: 1px solid #9ae6b4;
                }

                .resumo-financeiro {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .resumo-financeiro h3 {
                    margin: 0 0 16px 0;
                    color: #333;
                }

                .resumo-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }

                .resumo-card {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    text-align: center;
                    border-left: 4px solid #007bff;
                }

                .resumo-card.pendente {
                    border-left-color: #ffc107;
                }

                .resumo-card.vencido {
                    border-left-color: #dc3545;
                }

                .card-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 4px;
                }

                .card-label {
                    font-size: 14px;
                    color: #666;
                }

                .filtros-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .filtros-card h3 {
                    margin: 0 0 16px 0;
                    color: #333;
                }

                .filtros-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .campo {
                    display: flex;
                    flex-direction: column;
                }

                .campo label {
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: #555;
                }

                .campo input,
                .campo select,
                .campo textarea {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .campo input:focus,
                .campo select:focus,
                .campo textarea:focus {
                    outline: none;
                    border-color: #3182ce;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
                }

                .filtros-acoes {
                    display: flex;
                    gap: 12px;
                }

                .btn-primary {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-primary:hover {
                    background: #2c5aa0;
                }

                .btn-primary:disabled {
                    background: #a0aec0;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: #4a5568;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-secondary:hover {
                    background: #2d3748;
                }

                .btn-success {
                    background: #38a169;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-success:hover {
                    background: #2f855a;
                }

                .btn-outline {
                    background: transparent;
                    color: #4a5568;
                    border: 1px solid #cbd5e0;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-outline:hover {
                    background: #f7fafc;
                }

                .btn-small {
                    padding: 6px 10px;
                    font-size: 12px;
                }

                .btn-danger {
                    background: #e53e3e;
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .btn-danger:hover {
                    background: #c53030;
                }

                .contas-lista {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .contas-table {
                    overflow-x: auto;
                }

                .table-header {
                    display: grid;
                    grid-template-columns: 2fr 2fr 1.5fr 1.5fr 1fr 120px;
                    gap: 16px;
                    padding: 12px 0;
                    border-bottom: 2px solid #e2e8f0;
                    font-weight: 600;
                    color: #4a5568;
                }

                .table-row {
                    display: grid;
                    grid-template-columns: 2fr 2fr 1.5fr 1.5fr 1fr 120px;
                    gap: 16px;
                    padding: 16px 0;
                    border-bottom: 1px solid #e2e8f0;
                    align-items: center;
                }

                .table-row:hover {
                    background: #f7fafc;
                }

                .conta-cliente strong,
                .conta-descricao strong {
                    display: block;
                }

                .conta-cliente small,
                .conta-descricao small {
                    color: #666;
                    font-size: 12px;
                }

                .valor-original {
                    font-weight: bold;
                    color: #333;
                }

                .valor-recebido {
                    color: #38a169;
                }

                .valor-pendente {
                    color: #e53e3e;
                }

                .text-danger {
                    color: #e53e3e;
                }

                .badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .acoes {
                    display: flex;
                    gap: 8px;
                }

                .paginacao {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }

                .modal-content.large {
                    max-width: 800px;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .modal-header h2 {
                    margin: 0;
                    color: #333;
                }

                .btn-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                }

                .btn-close:hover {
                    color: #333;
                }

                .conta-form,
                .pagamento-form {
                    padding: 20px;
                }

                .form-section {
                    margin-bottom: 24px;
                }

                .form-section h3 {
                    margin: 0 0 16px 0;
                    color: #4a5568;
                    font-size: 16px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .span-2 {
                    grid-column: span 2;
                }

                .span-full {
                    grid-column: 1 / -1;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }

                .conta-info {
                    background: #f8f9fa;
                    padding: 16px;
                    margin: 0 20px 20px 20px;
                    border-radius: 8px;
                    border-left: 4px solid #3182ce;
                }

                .conta-info h4 {
                    margin: 0 0 12px 0;
                    color: #333;
                }

                .conta-info p {
                    margin: 4px 0;
                    font-size: 14px;
                }

                /* NOVO: Estilos para o modal de recibo */
                .recibo-success-content {
                    padding: 20px;
                }

                .success-icon {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .icon-circle {
                    width: 80px;
                    height: 80px;
                    background: #f0fff4;
                    border: 4px solid #38a169;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    margin: 0 auto 16px;
                    animation: bounceIn 0.6s ease-out;
                }

                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }

                .success-icon h3 {
                    margin: 0;
                    color: #276749;
                    font-size: 20px;
                }

                .recibo-info {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .recibo-details h4 {
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 16px;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }

                .detail-label {
                    font-weight: 500;
                    color: #666;
                }

                .detail-value {
                    font-weight: 600;
                    color: #333;
                }

                .detail-value.valor {
                    color: #38a169;
                    font-size: 18px;
                }

                .recibo-actions {
                    margin-bottom: 24px;
                }

                .recibo-actions h4 {
                    margin: 0 0 16px 0;
                    color: #333;
                    text-align: center;
                }

                .action-buttons {
                    display: grid;
                    gap: 12px;
                }

                .btn-action {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    border: 2px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    width: 100%;
                }

                .btn-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .btn-view {
                    background: #3182ce;
                    color: white;
                }

                .btn-view:hover {
                    background: #2c5aa0;
                }

                .btn-print {
                    background: #38a169;
                    color: white;
                }

                .btn-print:hover {
                    background: #2f855a;
                }

                .btn-manage {
                    background: #805ad5;
                    color: white;
                }

                .btn-manage:hover {
                    background: #6b46c1;
                }

                .btn-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .btn-text {
                    flex: 1;
                }

                .btn-text strong {
                    display: block;
                    font-size: 16px;
                    margin-bottom: 4px;
                }

                .btn-text small {
                    display: block;
                    opacity: 0.8;
                    font-size: 14px;
                }

                .modal-footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }

                @media (max-width: 768px) {
                    .contas-receber-container {
                        padding: 10px;
                    }

                    .contas-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: stretch;
                    }

                    .filtros-grid {
                        grid-template-columns: 1fr;
                    }

                    .resumo-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .table-header {
                        display: none;
                    }

                    .table-row {
                        display: block;
                        padding: 16px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        margin-bottom: 12px;
                    }

                    .modal-content {
                        width: 95%;
                        margin: 20px;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .span-2,
                    .span-full {
                        grid-column: auto;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .paginacao {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .detail-grid {
                        grid-template-columns: 1fr;
                    }

                    .detail-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 4px;
                    }
                }
            `}</style>
        </div >
    );
};

export default ContasReceber;