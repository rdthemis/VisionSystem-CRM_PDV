import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { backupService } from '../services/backupService';
import { emailService } from '../services/emailService';
import SimplePrintButton from './impressao/SimplePrintButton';

function Configuracoes({ onVoltar }) {
    const [abaAtiva, setAbaAtiva] = useState('usuarios');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    // Estados para usuários
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [novoUsuario, setNovoUsuario] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmar_senha: '',
        tipo: 'funcionario'
    });

    // Estados para configurações do sistema
    const [configuracoes, setConfiguracoes] = useState({
        nome_empresa: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        site: '',
        logo: null
    });

    // Estados para backup
    const [ultimoBackup, setUltimoBackup] = useState(null);
    const [backupsDisponiveis, setBackupsDisponiveis] = useState([]);

    // Estados para integrações
    const [integracoes, setIntegracoes] = useState({
        email: {
            ativo: false,
            smtp_host: '',
            smtp_port: '',
            smtp_user: '',
            smtp_pass: '',
            ssl: true
        },
        whatsapp: {
            ativo: false,
            api_key: '',
            numero: '',
            webhook_url: ''
        }
    });

    const abas = [
        { id: 'usuarios', label: '👥 Usuários', icon: '👥' },
        { id: 'sistema', label: '⚙️ Sistema', icon: '⚙️' },
        { id: 'backup', label: '💾 Backup', icon: '💾' },
        { id: 'integracoes', label: '🔗 Integrações', icon: '🔗' },
        { id: 'impressora', label: '🖨️ Impressora', icon: '🖨️' }
    ];

    useEffect(() => {
        if (abaAtiva === 'usuarios') {
            carregarUsuarios();
        } else if (abaAtiva === 'sistema') {
            carregarConfiguracoes();
        } else if (abaAtiva === 'backup') {
            carregarBackups();
        } else if (abaAtiva === 'integracoes') {
            carregarIntegracoes();
        } 
    }, [abaAtiva]);

    // ==========================================
    // FUNÇÕES DE USUÁRIOS
    // ==========================================

    const carregarUsuarios = async () => {
        try {
            setLoading(true);
            const resultado = await apiService.get('/usuarios');
            if (resultado.success) {
                setUsuarios(resultado.data);
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const abrirModalUsuario = (usuario = null) => {
        if (usuario) {
            setUsuarioEditando(usuario.id);
            setNovoUsuario({
                nome: usuario.nome,
                email: usuario.email,
                senha: '',
                confirmar_senha: '',
                tipo: usuario.tipo
            });
        } else {
            setUsuarioEditando(null);
            setNovoUsuario({
                nome: '',
                email: '',
                senha: '',
                confirmar_senha: '',
                tipo: 'funcionario'
            });
        }
        setMostrarModalUsuario(true);
    };

    const salvarUsuario = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            // Validações
            if (novoUsuario.senha !== novoUsuario.confirmar_senha) {
                setErro('As senhas não coincidem');
                return;
            }

            let resultado;
            if (usuarioEditando) {
                resultado = await apiService.put(`/usuarios/${usuarioEditando}`, novoUsuario);
            } else {
                resultado = await apiService.post('/usuarios', novoUsuario);
            }

            if (resultado.success) {
                setSucesso(resultado.message);
                setMostrarModalUsuario(false);
                carregarUsuarios();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    const desativarUsuario = async (id, nome) => {
        if (!window.confirm(`Tem certeza que deseja desativar o usuário "${nome}"?`)) {
            return;
        }

        try {
            const resultado = await apiService.delete(`/usuarios/${id}`);
            if (resultado.success) {
                setSucesso(resultado.message);
                carregarUsuarios();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao desativar usuário');
        }
    };

    // ==========================================
    // FUNÇÕES DE CONFIGURAÇÕES DO SISTEMA
    // ==========================================

    const carregarConfiguracoes = async () => {
        try {
            setLoading(true);
            const resultado = await apiService.get('/configuracoes');
            if (resultado.success) {
                setConfiguracoes(resultado.data);
            }
        } catch (error) {
            console.log('Configurações não encontradas, usando padrões');
        } finally {
            setLoading(false);
        }
    };

    const salvarConfiguracoes = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await apiService.post('/configuracoes', configuracoes);
            if (resultado.success) {
                setSucesso('Configurações salvas com sucesso!');
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            setErro('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FUNÇÕES DE BACKUP
    // ==========================================

    const carregarBackups = async () => {
        try {
            setLoading(true);
            const resultado = await backupService.listar();
            if (resultado.success) {
                setBackupsDisponiveis(resultado.data);
                setUltimoBackup(resultado.ultimo_backup);
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao carregar backups:', error);
            setErro('Erro ao carregar backups');
        } finally {
            setLoading(false);
        }
    };

    const gerarBackup = async () => {
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await backupService.gerar();
            if (resultado.success) {
                setSucesso('Backup gerado com sucesso!');
                carregarBackups();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao gerar backup:', error);
            setErro('Erro ao gerar backup');
        } finally {
            setLoading(false);
        }
    };

    const baixarBackup = (arquivo) => {
        const resultado = backupService.baixar(arquivo);
        if (!resultado.success) {
            setErro(resultado.message);
        }
    };

    const deletarBackup = async (arquivo) => {
        if (!window.confirm(`Tem certeza que deseja deletar o backup "${arquivo}"?\n\nEsta ação não pode ser desfeita!`)) {
            return;
        }

        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await backupService.deletar(arquivo);
            if (resultado.success) {
                setSucesso('Backup deletado com sucesso!');
                carregarBackups();
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao deletar backup:', error);
            setErro('Erro ao deletar backup');
        } finally {
            setLoading(false);
        }
    };

    const restaurarBackup = async (arquivo) => {
        if (!window.confirm(`Tem certeza que deseja restaurar o backup "${arquivo}"?\n\nISTO IRÁ SOBRESCREVER TODOS OS DADOS ATUAIS!`)) {
            return;
        }

        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await backupService.restaurar(arquivo);
            if (resultado.success) {
                setSucesso('Backup restaurado com sucesso!');
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            setErro('Erro ao restaurar backup');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FUNÇÕES DE INTEGRAÇÕES
    // ==========================================

    const carregarIntegracoes = async () => {
        try {
            setLoading(true);
            const resultado = await emailService.carregarConfiguracoes();
            if (resultado.success) {
                setIntegracoes(prev => ({
                    ...prev,
                    email: resultado.data
                }));
            } else {
                // Se não há configuração, usar valores padrão
                setIntegracoes(prev => ({
                    ...prev,
                    email: {
                        ativo: false,
                        smtp_host: '',
                        smtp_port: 587,
                        smtp_user: '',
                        smtp_pass: '',
                        smtp_secure: 'tls',
                        from_email: '',
                        from_name: 'Sistema CRM'
                    }
                }));
            }
        } catch (error) {
            console.log('Integrações não configuradas');
        } finally {
            setLoading(false);
        }
    };

    const salvarIntegracoes = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await emailService.salvarConfiguracoes(integracoes.email);
            if (resultado.success) {
                setSucesso('Integrações salvas com sucesso!');
            } else {
                setErro(resultado.message);
            }
        } catch (error) {
            console.error('Erro ao salvar integrações:', error);
            setErro('Erro ao salvar integrações');
        } finally {
            setLoading(false);
        }
    };

    const testarIntegracao = async (tipo) => {
        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            if (tipo === 'email') {
                const resultado = await emailService.testar();
                if (resultado.success) {
                    setSucesso(`Teste de email realizado com sucesso!`);
                } else {
                    setErro(resultado.message);
                }
            }
        } catch (error) {
            console.error(`Erro ao testar ${tipo}:`, error);
            setErro(`Erro ao testar ${tipo}`);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================

    const renderUsuarios = () => (
        <div className="secao-content">
            <div className="secao-header">
                <h3>👥 Gestão de Usuários</h3>
                <button onClick={() => abrirModalUsuario()} className="btn-primary">
                    ➕ Novo Usuário
                </button>
            </div>

            {loading && <div className="loading">🔄 Carregando usuários...</div>}

            {!loading && usuarios.length === 0 && (
                <div className="empty-state">
                    <p>👤 Nenhum usuário encontrado</p>
                </div>
            )}

            {!loading && usuarios.length > 0 && (
                <div className="usuarios-grid">
                    {usuarios.map(usuario => (
                        <div key={usuario.id} className="usuario-card">
                            <div className="usuario-avatar">
                                {usuario.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="usuario-info">
                                <h4>{usuario.nome}</h4>
                                <p>{usuario.email}</p>
                                <span className={`badge ${usuario.tipo}`}>
                                    {usuario.tipo === 'admin' ? '🔑 Admin' : '👤 Funcionário'}
                                </span>
                            </div>
                            <div className="usuario-acoes">
                                <button
                                    onClick={() => abrirModalUsuario(usuario)}
                                    className="btn-small btn-secondary"
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => desativarUsuario(usuario.id, usuario.nome)}
                                    className="btn-small btn-danger"
                                    title="Desativar"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSistema = () => (
        <div className="secao-content">
            <h3>⚙️ Configurações do Sistema</h3>

            <form onSubmit={salvarConfiguracoes} className="config-form">
                <div className="form-section">
                    <h4>🏢 Dados da Empresa</h4>
                    <div className="form-row">
                        <div className="campo">
                            <label>Nome da Empresa:</label>
                            <input
                                type="text"
                                value={configuracoes.nome_empresa}
                                onChange={(e) => setConfiguracoes(prev => ({ ...prev, nome_empresa: e.target.value }))}
                                placeholder="Nome da sua empresa"
                            />
                        </div>
                        <div className="campo">
                            <label>CNPJ:</label>
                            <input
                                type="text"
                                value={configuracoes.cnpj}
                                onChange={(e) => setConfiguracoes(prev => ({ ...prev, cnpj: e.target.value }))}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="campo">
                            <label>Telefone:</label>
                            <input
                                type="text"
                                value={configuracoes.telefone}
                                onChange={(e) => setConfiguracoes(prev => ({ ...prev, telefone: e.target.value }))}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div className="campo">
                            <label>Email:</label>
                            <input
                                type="email"
                                value={configuracoes.email}
                                onChange={(e) => setConfiguracoes(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="contato@empresa.com"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="campo span-full">
                            <label>Endereço:</label>
                            <textarea
                                value={configuracoes.endereco}
                                onChange={(e) => setConfiguracoes(prev => ({ ...prev, endereco: e.target.value }))}
                                rows="3"
                                placeholder="Endereço completo da empresa..."
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? '🔄 Salvando...' : '💾 Salvar Configurações'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderBackup = () => (
        <div className="secao-content">
            <h3>💾 Backup e Restore</h3>

            <div className="backup-status">
                <div className="status-card">
                    <h4>📊 Status do Backup</h4>
                    <p>
                        <strong>Último backup:</strong> {ultimoBackup ? new Date(ultimoBackup).toLocaleString('pt-BR') : 'Nunca'}
                    </p>
                    <button onClick={gerarBackup} disabled={loading} className="btn-primary">
                        {loading ? '🔄 Gerando...' : '💾 Gerar Backup Agora'}
                    </button>
                </div>
            </div>

            <div className="backups-lista">
                <h4>📂 Backups Disponíveis</h4>
                {backupsDisponiveis.length === 0 ? (
                    <p>Nenhum backup disponível</p>
                ) : (
                    <div className="backups-grid">
                        {backupsDisponiveis.map((backup, index) => (
                            <div key={index} className="backup-item">
                                <div className="backup-info">
                                    <strong>{backup.nome}</strong>
                                    <small>{new Date(backup.data).toLocaleString('pt-BR')}</small>
                                    <span className="backup-size">{backup.tamanho}</span>
                                </div>
                                <div className="backup-acoes">
                                    <button
                                        onClick={() => baixarBackup(backup.arquivo)}
                                        className="btn-small btn-secondary"
                                        title="Baixar"
                                    >
                                        📥
                                    </button>
                                    <button
                                        onClick={() => restaurarBackup(backup.arquivo)}
                                        className="btn-small btn-warning"
                                        title="Restaurar"
                                    >
                                        🔄
                                    </button>
                                    <button
                                        onClick={() => deletarBackup(backup.arquivo)}
                                        className="btn-small btn-danger"
                                        title="Deletar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderIntegracoes = () => (
        <div className="secao-content">
            <h3>🔗 Integrações</h3>

            <form onSubmit={salvarIntegracoes} className="integracoes-form">
                {/* Email */}
                <div className="integracao-card">
                    <div className="integracao-header">
                        <h4>📧 Configuração de Email</h4>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={integracoes.email.ativo}
                                onChange={(e) => setIntegracoes(prev => ({
                                    ...prev,
                                    email: { ...prev.email, ativo: e.target.checked }
                                }))}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {integracoes.email.ativo && (
                        <div className="integracao-config">
                            <div className="form-row">
                                <div className="campo">
                                    <label>Servidor SMTP: *</label>
                                    <input
                                        type="text"
                                        value={integracoes.email.smtp_host}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            email: { ...prev.email, smtp_host: e.target.value }
                                        }))}
                                        placeholder="smtp.gmail.com"
                                        required
                                    />
                                </div>
                                <div className="campo">
                                    <label>Porta: *</label>
                                    <input
                                        type="number"
                                        value={integracoes.email.smtp_port}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            email: { ...prev.email, smtp_port: e.target.value }
                                        }))}
                                        placeholder="587"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="campo">
                                    <label>Email/Usuário: *</label>
                                    <input
                                        type="email"
                                        value={integracoes.email.smtp_user}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            email: { ...prev.email, smtp_user: e.target.value }
                                        }))}
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                                <div className="campo">
                                    <label>Senha: *</label>
                                    <input
                                        type="password"
                                        value={integracoes.email.smtp_pass}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            email: { ...prev.email, smtp_pass: e.target.value }
                                        }))}
                                        placeholder="Senha do email"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="campo">
                                    <label>Segurança:</label>
                                    <select
                                        value={integracoes.email.smtp_secure}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            email: { ...prev.email, smtp_secure: e.target.value }
                                        }))}
                                    >
                                        <option value="tls">TLS (Recomendado)</option>
                                        <option value="ssl">SSL</option>
                                    </select>
                                </div>
                                <div className="campo">
                                    <label>Nome do Remetente:</label>
                                    <input
                                        type="text"
                                        value={integracoes.email.from_name}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            email: { ...prev.email, from_name: e.target.value }
                                        }))}
                                        placeholder="Sistema CRM"
                                    />
                                </div>
                            </div>

                            <div className="config-help">
                                <h4>📋 Configurações Comuns:</h4>
                                <div className="help-grid">
                                    <div className="help-item">
                                        <strong>Gmail:</strong>smtp.gmail.com:587 (TLS)
                                        <small>⚠️ Use senha de app, não sua senha normal</small>
                                    </div>
                                    <div className="help-item">
                                        <strong>Outlook/Hotmail:</strong>
                                        smtp-mail.outlook.com:587 (TLS)
                                    </div>
                                    <div className="help-item">
                                        <strong>Yahoo:</strong>
                                        smtp.mail.yahoo.com:587 (TLS)
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => testarIntegracao('email')}
                                className="btn-test"
                                disabled={loading}
                            >
                                {loading ? '🔄 Testando...' : '🧪 Testar Email'}
                            </button>
                        </div>
                    )}
                </div>

                {/* WhatsApp */}
                <div className="integracao-card">
                    <div className="integracao-header">
                        <h4>📱 WhatsApp Business</h4>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={integracoes.whatsapp.ativo}
                                onChange={(e) => setIntegracoes(prev => ({
                                    ...prev,
                                    whatsapp: { ...prev.whatsapp, ativo: e.target.checked }
                                }))}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {integracoes.whatsapp.ativo && (
                        <div className="integracao-config">
                            <div className="form-row">
                                <div className="campo">
                                    <label>API Key:</label>
                                    <input
                                        type="text"
                                        value={integracoes.whatsapp.api_key}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            whatsapp: { ...prev.whatsapp, api_key: e.target.value }
                                        }))}
                                        placeholder="Sua API Key do WhatsApp"
                                    />
                                </div>
                                <div className="campo">
                                    <label>Número:</label>
                                    <input
                                        type="text"
                                        value={integracoes.whatsapp.numero}
                                        onChange={(e) => setIntegracoes(prev => ({
                                            ...prev,
                                            whatsapp: { ...prev.whatsapp, numero: e.target.value }
                                        }))}
                                        placeholder="5511999999999"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => testarIntegracao('whatsapp')}
                                className="btn-test"
                            >
                                🧪 Testar WhatsApp
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? '🔄 Salvando...' : '💾 Salvar Integrações'}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* HEADER */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#333' }}>⚙️ Configurações</h1>
                        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                            Gerenciar configurações do sistema
                        </p>
                    </div>
                    {/*
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
                    */}
                </div>

                {/* MENSAGENS */}
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

                {/* ABAS */}
                <div className="tabs-container">
                    <div className="tabs-header">
                        {abas.map(aba => (
                            <button
                                key={aba.id}
                                onClick={() => setAbaAtiva(aba.id)}
                                className={`tab-button ${abaAtiva === aba.id ? 'active' : ''}`}
                            >
                                <span className="tab-icon">{aba.icon}</span>
                                <span className="tab-label">{aba.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="tab-content">
                        {abaAtiva === 'usuarios' && renderUsuarios()}
                        {abaAtiva === 'sistema' && renderSistema()}
                        {abaAtiva === 'backup' && renderBackup()}
                        {abaAtiva === 'integracoes' && renderIntegracoes()}
                    </div>
                </div>
                
                {/* MODAL DE USUÁRIO */}
                {mostrarModalUsuario && (
                    <div className="modal-overlay" onClick={() => setMostrarModalUsuario(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{usuarioEditando ? '✏️ Editar Usuário' : '➕ Novo Usuário'}</h2>
                                <button onClick={() => setMostrarModalUsuario(false)} className="btn-close">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={salvarUsuario} className="usuario-form">
                                <div className="form-row">
                                    <div className="campo">
                                        <label>Nome: *</label>
                                        <input
                                            type="text"
                                            value={novoUsuario.nome}
                                            onChange={(e) => setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))}
                                            required
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div className="campo">
                                        <label>Email: *</label>
                                        <input
                                            type="email"
                                            value={novoUsuario.email}
                                            onChange={(e) => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Senha: {usuarioEditando ? '' : '*'}</label>
                                        <input
                                            type="password"
                                            value={novoUsuario.senha}
                                            onChange={(e) => setNovoUsuario(prev => ({ ...prev, senha: e.target.value }))}
                                            required={!usuarioEditando}
                                            placeholder={usuarioEditando ? 'Deixe em branco para manter' : 'Digite a senha'}
                                        />
                                    </div>
                                    <div className="campo">
                                        <label>Confirmar Senha: {usuarioEditando ? '' : '*'}</label>
                                        <input
                                            type="password"
                                            value={novoUsuario.confirmar_senha}
                                            onChange={(e) => setNovoUsuario(prev => ({ ...prev, confirmar_senha: e.target.value }))}
                                            required={!usuarioEditando}
                                            placeholder="Confirme a senha"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="campo">
                                        <label>Tipo de Usuário: *</label>
                                        <select
                                            value={novoUsuario.tipo}
                                            onChange={(e) => setNovoUsuario(prev => ({ ...prev, tipo: e.target.value }))}
                                            required
                                        >
                                            <option value="funcionario">👤 Funcionário</option>
                                            <option value="admin">🔑 Administrador</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setMostrarModalUsuario(false)} className="btn-outline">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? '🔄 Salvando...' : (usuarioEditando ? '💾 Atualizar' : '💾 Criar')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .tabs-container {
                    margin-top: 20px;
                }

                .tabs-header {
                    display: flex;
                    border-bottom: 2px solid #e2e8f0;
                    margin-bottom: 30px;
                    overflow-x: auto;
                }

                .tab-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    color: #666;
                    border-bottom: 3px solid transparent;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .tab-button:hover {
                    color: #333;
                    background: #f7fafc;
                }

                .tab-button.active {
                    color: #3182ce;
                    border-bottom-color: #3182ce;
                    background: #f0f8ff;
                }

                .tab-icon {
                    font-size: 18px;
                }

                .tab-label {
                    font-size: 14px;
                }

                .tab-content {
                    min-height: 400px;
                }

                .secao-content {
                    padding: 20px 0;
                }

                .secao-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .secao-header h3 {
                    margin: 0;
                    color: #333;
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
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                /* ESTILOS PARA USUÁRIOS */
                .usuarios-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                .usuario-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s ease;
                }

                .usuario-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .usuario-avatar {
                    width: 50px;
                    height: 50px;
                    background: #3182ce;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .usuario-info {
                    flex: 1;
                }

                .usuario-info h4 {
                    margin: 0 0 4px 0;
                    color: #333;
                    font-size: 16px;
                }

                .usuario-info p {
                    margin: 0 0 8px 0;
                    color: #666;
                    font-size: 14px;
                }

                .usuario-acoes {
                    display: flex;
                    gap: 8px;
                }

                .badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .badge.admin {
                    background: #fef3c7;
                    color: #92400e;
                }

                .badge.funcionario {
                    background: #dbeafe;
                    color: #1e40af;
                }

                /* ESTILOS PARA FORMULÁRIOS */
                .config-form,
                .integracoes-form,
                .usuario-form {
                    padding: 20px;
                }

                .form-section {
                    margin-bottom: 32px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #3182ce;
                }

                .form-section h4 {
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 16px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s ease;
                }

                .campo input:focus,
                .campo select:focus,
                .campo textarea:focus {
                    outline: none;
                    border-color: #3182ce;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
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

                /* ESTILOS PARA BACKUP */
                .backup-status {
                    margin-bottom: 32px;
                }

                .status-card {
                    background: #f0f8ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }

                .status-card h4 {
                    margin: 0 0 12px 0;
                    color: #1e40af;
                }

                .status-card p {
                    margin: 0 0 16px 0;
                    color: #374151;
                }

                .backups-lista h4 {
                    margin: 0 0 16px 0;
                    color: #333;
                }

                .backups-grid {
                    display: grid;
                    gap: 12px;
                }

                .backup-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #f8f9fa;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                }

                .backup-info strong {
                    display: block;
                    color: #333;
                    margin-bottom: 4px;
                }

                .backup-info small {
                    color: #666;
                    margin-right: 12px;
                }

                .backup-size {
                    background: #e2e8f0;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #4a5568;
                }

                .backup-acoes {
                    display: flex;
                    gap: 8px;
                }

                /* ESTILOS PARA CONFIGURAÇÕES DE EMAIL */
                .config-help {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .config-help h4 {
                    margin: 0 0 15px 0;
                    color: #495057;
                    font-size: 16px;
                }

                .help-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }

                .help-item {
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 3px solid #007bff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .help-item strong {
                    color: #007bff;
                }

                .help-item small {
                    color: #dc3545;
                    font-weight: 500;
                }
                .integracao-card {
                    background: #f8f9fa;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .integracao-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .integracao-header h4 {
                    margin: 0;
                    color: #333;
                }

                .toggle {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }

                .toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: 0.4s;
                    border-radius: 24px;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.4s;
                    border-radius: 50%;
                }

                input:checked + .slider {
                    background-color: #3182ce;
                }

                input:checked + .slider:before {
                    transform: translateX(26px);
                }

                .integracao-config {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 16px;
                }

                .btn-test {
                    background: #805ad5;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 12px;
                }

                .btn-test:hover {
                    background: #6b46c1;
                }

                /* ESTILOS PARA BOTÕES */
                .btn-primary {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s ease;
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
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .btn-secondary:hover {
                    background: #2d3748;
                }

                .btn-danger {
                    background: #e53e3e;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .btn-danger:hover {
                    background: #c53030;
                }

                .btn-warning {
                    background: #d69e2e;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .btn-warning:hover {
                    background: #b7791f;
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
                    padding: 6px 8px;
                    font-size: 12px;
                }

                /* ESTILOS PARA MODAL */
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
                    max-width: 500px;
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

                /* RESPONSIVIDADE */
                @media (max-width: 768px) {
                    .tabs-header {
                        flex-direction: column;
                    }

                    .tab-button {
                        justify-content: center;
                        padding: 16px;
                    }

                    .secao-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: stretch;
                    }

                    .usuarios-grid {
                        grid-template-columns: 1fr;
                    }

                    .usuario-card {
                        flex-direction: column;
                        text-align: center;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .backup-item {
                        flex-direction: column;
                        gap: 12px;
                        text-align: center;
                    }

                    .integracao-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: center;
                    }

                    .modal-content {
                        width: 95%;
                        margin: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .tab-label {
                        display: none;
                    }

                    .tab-icon {
                        font-size: 20px;
                    }
                }
            `}</style>
        </div>
    );
}

export default Configuracoes;