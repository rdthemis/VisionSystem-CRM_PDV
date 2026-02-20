import React, { useState, useEffect } from 'react';
import { clientesService } from '../services/clientesService';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null);
    const [paginacao, setPaginacao] = useState({
        total: 0,
        por_pagina: 10,
        pagina_atual: 1,
        total_paginas: 1
    });

    // Filtros
    const [filtros, setFiltros] = useState({
        nome: '',
        tipo_pessoa: '',
        cidade: '',
        uf: '',
        ordenacao: 'nome',
        direcao: 'ASC'
    });

    // Dados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        razao_social: '',
        nome_fantasia: '',
        tipo_pessoa: 'fisica',
        cpf_cnpj: '',
        rg_ie: '',
        email: '',
        telefone: '',
        celular: '',
        whatsapp: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        limite_credito: '0.00',
        prazo_pagamento_padrao: '30',
        desconto_padrao: '0.00',
        observacoes: ''
    });

    // Estados UF brasileiros
    const ufs = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // Carregar clientes
    const carregarClientes = async (novaPagina = null) => {
        setLoading(true);
        setErro('');

        try {
            const filtrosComPaginacao = {
                ...filtros,
                limite: paginacao.por_pagina,
                pagina: novaPagina || paginacao.pagina_atual
            };

            const resultado = await clientesService.listar(filtrosComPaginacao);

            if (resultado.success) {
                setClientes(resultado.data);
                setPaginacao(resultado.pagination);
            } else {
                setErro(resultado.message || 'Erro ao carregar clientes');
            }
        } catch (error) {
            setErro('Erro de conexão ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    // Carregar na inicialização
    useEffect(() => {
        carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Aplicar filtros
    const aplicarFiltros = () => {
        setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
        carregarClientes(1);
    };

    // Limpar filtros
    const limparFiltros = () => {
        setFiltros({
            nome: '',
            tipo_pessoa: '',
            cidade: '',
            uf: '',
            ordenacao: 'nome',
            direcao: 'ASC'
        });
        setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
        setTimeout(() => carregarClientes(1), 100);
    };

    // Abrir modal para novo cliente
    const novoCliente = () => {
        setClienteEditando(null);
        setFormData({
            nome: '',
            razao_social: '',
            nome_fantasia: '',
            tipo_pessoa: 'fisica',
            cpf_cnpj: '',
            rg_ie: '',
            email: '',
            telefone: '',
            celular: '',
            whatsapp: '',
            cep: '',
            endereco: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: '',
            limite_credito: '0.00',
            prazo_pagamento_padrao: '30',
            desconto_padrao: '0.00',
            observacoes: ''
        });
        setMostrarModal(true);
    };

    // Editar cliente
    const editarCliente = async (id) => {
        setLoading(true);
        try {
            const resultado = await clientesService.buscarPorId(id);
            if (resultado.success) {
                setClienteEditando(id);
                setFormData(resultado.data);
                setMostrarModal(true);
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao carregar dados do cliente');
        } finally {
            setLoading(false);
        }
    };

    // Salvar cliente
    const salvarCliente = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            let resultado;

            if (clienteEditando) {
                resultado = await clientesService.atualizar(clienteEditando, formData);
            } else {
                resultado = await clientesService.criar(formData);
            }

            if (resultado.success) {
                setSucesso(resultado.message);
                setMostrarModal(false);
                carregarClientes();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao salvar cliente');
        } finally {
            setLoading(false);
        }
    };

    // Desativar cliente
    const desativarCliente = async (id, nome) => {
        if (!window.confirm(`Tem certeza que deseja desativar o cliente "${nome}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const resultado = await clientesService.desativar(id);
            if (resultado.success) {
                setSucesso(resultado.message);
                carregarClientes();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao desativar cliente');
        } finally {
            setLoading(false);
        }
    };

    // Buscar CEP
    const buscarCEP = async () => {
        if (!formData.cep || formData.cep.length < 8) return;

        setLoading(true);
        try {
            const resultado = await clientesService.buscarCEP(formData.cep);
            if (resultado.success) {
                setFormData(prev => ({
                    ...prev,
                    endereco: resultado.data.endereco,
                    bairro: resultado.data.bairro,
                    cidade: resultado.data.cidade,
                    uf: resultado.data.uf
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formatar CPF/CNPJ conforme tipo
    const formatarDocumento = (valor) => {
        if (formData.tipo_pessoa === 'fisica') {
            return clientesService.formatarCPF(valor);
        } else {
            return clientesService.formatarCNPJ(valor);
        }
    };

    return (
        <div className="clientes-container">
            <div className="clientes-header">
                <h1>👥 Gestão de Clientes</h1>
                <button
                    onClick={novoCliente}
                    className="btn-primary"
                    disabled={loading}
                >
                    ➕ Novo Cliente
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

            {/* Filtros */}
            <div className="filtros-card">
                <h3>🔍 Filtros</h3>
                <div className="filtros-grid">
                    <div className="campo">
                        <label>Nome/Razão Social:</label>
                        <input
                            type="text"
                            value={filtros.nome}
                            onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Digite o nome..."
                        />
                    </div>

                    <div className="campo">
                        <label>Tipo:</label>
                        <select
                            value={filtros.tipo_pessoa}
                            onChange={(e) => setFiltros(prev => ({ ...prev, tipo_pessoa: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            <option value="fisica">Pessoa Física</option>
                            <option value="juridica">Pessoa Jurídica</option>
                        </select>
                    </div>

                    <div className="campo">
                        <label>Cidade:</label>
                        <input
                            type="text"
                            value={filtros.cidade}
                            onChange={(e) => setFiltros(prev => ({ ...prev, cidade: e.target.value }))}
                            placeholder="Digite a cidade..."
                        />
                    </div>

                    <div className="campo">
                        <label>UF:</label>
                        <select
                            value={filtros.uf}
                            onChange={(e) => setFiltros(prev => ({ ...prev, uf: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            {ufs.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="filtros-acoes">
                    <button onClick={aplicarFiltros} className="btn-secondary">
                        🔍 Filtrar
                    </button>
                    <button onClick={limparFiltros} className="btn-outline">
                        🗑️ Limpar
                    </button>
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="clientes-lista">
                {loading && <div className="loading">🔄 Carregando...</div>}

                {!loading && clientes.length === 0 && (
                    <div className="empty-state">
                        <p>📋 Nenhum cliente encontrado</p>
                        <button onClick={novoCliente} className="btn-primary">
                            ➕ Cadastrar Primeiro Cliente
                        </button>
                    </div>
                )}

                {!loading && clientes.length > 0 && (
                    <>
                        <div className="clientes-table">
                            <div className="table-header">
                                <div>Nome</div>
                                <div>Tipo</div>
                                <div>CPF/CNPJ</div>
                                <div>Email</div>
                                <div>Cidade</div>
                                <div>Ações</div>
                            </div>

                            {clientes.map(cliente => (
                                <div key={cliente.id} className="table-row">
                                    <div className="cliente-nome">
                                        <strong>{cliente.nome}</strong>
                                        {cliente.razao_social && cliente.razao_social !== cliente.nome && (
                                            <small>{cliente.razao_social}</small>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`badge ${cliente.tipo_pessoa === 'fisica' ? 'badge-blue' : 'badge-green'}`}>
                                            {cliente.tipo_pessoa_texto}
                                        </span>
                                    </div>
                                    <div>{cliente.cpf_cnpj || '-'}</div>
                                    <div>{cliente.email || '-'}</div>
                                    <div>{cliente.cidade ? `${cliente.cidade}/${cliente.uf}` : '-'}</div>
                                    <div className="acoes">
                                        <button
                                            onClick={() => editarCliente(cliente.id)}
                                            className="btn-small btn-secondary"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => desativarCliente(cliente.id, cliente.nome)}
                                            className="btn-small btn-danger"
                                            title="Desativar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Paginação */}
                        {paginacao.total_paginas > 1 && (
                            <div className="paginacao">
                                <button
                                    onClick={() => carregarClientes(paginacao.pagina_atual - 1)}
                                    disabled={paginacao.pagina_atual === 1}
                                    className="btn-outline btn-small"
                                >
                                    ⬅️ Anterior
                                </button>

                                <span>
                                    Página {paginacao.pagina_atual} de {paginacao.total_paginas}
                                    ({paginacao.total} clientes)
                                </span>

                                <button
                                    onClick={() => carregarClientes(paginacao.pagina_atual + 1)}
                                    disabled={paginacao.pagina_atual === paginacao.total_paginas}
                                    className="btn-outline btn-small"
                                >
                                    Próxima ➡️
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de Cadastro/Edição */}
            {mostrarModal && (
                <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {clienteEditando ? '✏️ Editar Cliente' : '➕ Novo Cliente'}
                            </h2>
                            <button
                                onClick={() => setMostrarModal(false)}
                                className="btn-close"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={salvarCliente} className="cliente-form">
                            {/* Dados Básicos */}
                            <div className="form-section">
                                <h3>📋 Dados Básicos</h3>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Tipo de Pessoa: *</label>
                                        <select
                                            value={formData.tipo_pessoa}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tipo_pessoa: e.target.value }))}
                                            required
                                        >
                                            <option value="fisica">Pessoa Física</option>
                                            <option value="juridica">Pessoa Jurídica</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>
                                            {formData.tipo_pessoa === 'fisica' ? 'Nome Completo:' : 'Razão Social:'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nome}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                            required
                                            placeholder={formData.tipo_pessoa === 'fisica' ? 'Digite o nome completo' : 'Digite a razão social'}
                                        />
                                    </div>

                                    {formData.tipo_pessoa === 'juridica' && (
                                        <div className="campo">
                                            <label>Nome Fantasia:</label>
                                            <input
                                                type="text"
                                                value={formData.nome_fantasia}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                                                placeholder="Digite o nome fantasia"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>{formData.tipo_pessoa === 'fisica' ? 'CPF:' : 'CNPJ:'}</label>
                                        <input
                                            type="text"
                                            value={formData.cpf_cnpj}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                cpf_cnpj: formatarDocumento(e.target.value)
                                            }))}
                                            placeholder={formData.tipo_pessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>{formData.tipo_pessoa === 'fisica' ? 'RG:' : 'Inscrição Estadual:'}</label>
                                        <input
                                            type="text"
                                            value={formData.rg_ie}
                                            onChange={(e) => setFormData(prev => ({ ...prev, rg_ie: e.target.value }))}
                                            placeholder={formData.tipo_pessoa === 'fisica' ? 'Digite o RG' : 'Digite a IE'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contato */}
                            <div className="form-section">
                                <h3>📞 Contato</h3>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Email:</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Telefone:</label>
                                        <input
                                            type="text"
                                            value={formData.telefone}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                telefone: clientesService.formatarTelefone(e.target.value)
                                            }))}
                                            placeholder="(11) 3333-4444"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Celular:</label>
                                        <input
                                            type="text"
                                            value={formData.celular}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                celular: clientesService.formatarTelefone(e.target.value)
                                            }))}
                                            placeholder="(11) 99999-8888"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>WhatsApp:</label>
                                        <input
                                            type="text"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                whatsapp: clientesService.formatarTelefone(e.target.value)
                                            }))}
                                            placeholder="(11) 99999-8888"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="form-section">
                                <h3>📍 Endereço</h3>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>CEP:</label>
                                        <input
                                            type="text"
                                            value={formData.cep}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                cep: clientesService.formatarCEP(e.target.value)
                                            }))}
                                            onBlur={buscarCEP}
                                            placeholder="00000-000"
                                        />
                                    </div>

                                    <div className="campo span-2">
                                        <label>Endereço:</label>
                                        <input
                                            type="text"
                                            value={formData.endereco}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                                            placeholder="Rua, Avenida, etc."
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Número:</label>
                                        <input
                                            type="text"
                                            value={formData.numero}
                                            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                                            placeholder="123"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Complemento:</label>
                                        <input
                                            type="text"
                                            value={formData.complemento}
                                            onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                                            placeholder="Apto, Sala, etc."
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Bairro:</label>
                                        <input
                                            type="text"
                                            value={formData.bairro}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                                            placeholder="Nome do bairro"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Cidade:</label>
                                        <input
                                            type="text"
                                            value={formData.cidade}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                                            placeholder="Nome da cidade"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>UF:</label>
                                        <select
                                            value={formData.uf}
                                            onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value }))}
                                        >
                                            <option value="">Selecione</option>
                                            {ufs.map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Dados Comerciais */}
                            <div className="form-section">
                                <h3>💰 Dados Comerciais</h3>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Limite de Crédito:</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.limite_credito}
                                            onChange={(e) => setFormData(prev => ({ ...prev, limite_credito: e.target.value }))}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Prazo Pagamento (dias):</label>
                                        <input
                                            type="number"
                                            value={formData.prazo_pagamento_padrao}
                                            onChange={(e) => setFormData(prev => ({ ...prev, prazo_pagamento_padrao: e.target.value }))}
                                            placeholder="30"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Desconto Padrão (%):</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.desconto_padrao}
                                            onChange={(e) => setFormData(prev => ({ ...prev, desconto_padrao: e.target.value }))}
                                            placeholder="0.00"
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
                                            placeholder="Observações sobre o cliente..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setMostrarModal(false)} className="btn-outline">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? '🔄 Salvando...' : (clienteEditando ? '💾 Atualizar' : '💾 Salvar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .clientes-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .clientes-header {
          display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
        }

        .clientes-header h1 {
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

        .clientes-lista {
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

        .clientes-table {
          overflow-x: auto;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 2fr 1.5fr 100px;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #4a5568;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 2fr 1.5fr 100px;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #e2e8f0;
          align-items: center;
        }

        .table-row:hover {
          background: #f7fafc;
        }

        .cliente-nome strong {
          display: block;
        }

        .cliente-nome small {
          color: #666;
          font-size: 12px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge-blue {
          background: #ebf8ff;
          color: #3182ce;
        }

        .badge-green {
          background: #f0fff4;
          color: #38a169;
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
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
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

        .cliente-form {
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

        @media (max-width: 768px) {
          .clientes-container {
            padding: 10px;
          }

          .clientes-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .filtros-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
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
        }
      `}</style>
        </div>
    );
};

export default Clientes;