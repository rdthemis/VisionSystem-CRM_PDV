// src/components/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import './ResetPassword.css';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [tokenValido, setTokenValido] = useState(false);
    const [dadosUsuario, setDadosUsuario] = useState(null);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [verificandoToken, setVerificandoToken] = useState(true);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            validarToken(tokenFromUrl);
        } else {
            setErro('Token não encontrado na URL');
            setVerificandoToken(false);
        }
    }, [searchParams]);

    const validarToken = async (tokenParam) => {
        setVerificandoToken(true);
        try {
            const resultado = await apiService.validarTokenRecuperacao(tokenParam);

            if (resultado.success) {
                setTokenValido(true);
                setDadosUsuario(resultado.data);
            } else {
                setErro(resultado.message || 'Token inválido ou expirado');
                setTokenValido(false);
            }
        } catch (error) {
            setErro(error.message);
            setTokenValido(false);
        } finally {
            setVerificandoToken(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validações
        if (!senha || !confirmarSenha) {
            setErro('Todos os campos são obrigatórios');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem');
            return;
        }

        if (senha.length < 8) {
            setErro('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await apiService.redefinirSenha(token, senha);

            if (resultado.success) {
                setSucesso(resultado.message);
                // Aguarda 3 segundos e redireciona para login
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setErro(resultado.message || 'Erro ao redefinir senha');
            }
        } catch (error) {
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatarData = (dataString) => {
        return new Date(dataString).toLocaleString('pt-BR');
    };

    // Loading do token
    if (verificandoToken) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <h2>🔍 Verificando token...</h2>
                        <p>Aguarde enquanto validamos seu link de recuperação</p>
                    </div>
                </div>
            </div>
        );
    }

    // Token inválido
    if (!tokenValido) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="error-content">
                        <h1>❌ Link Inválido</h1>
                        <div className="error-message">
                            {erro}
                        </div>
                        <div className="error-info">
                            <h3>Possíveis motivos:</h3>
                            <ul>
                                <li>O link expirou (válido por apenas 1 hora)</li>
                                <li>O link já foi usado</li>
                                <li>O link está incorreto ou corrompido</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="back-button"
                        >
                            ← Voltar para Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Sucesso
    if (sucesso) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="success-content">
                        <h1>✅ Senha Redefinida!</h1>
                        <div className="success-message">
                            {sucesso}
                        </div>
                        <div className="success-info">
                            <h3>🎉 Perfeito!</h3>
                            <p>Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login em alguns segundos.</p>
                            <p>Agora você pode fazer login com sua nova senha.</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="login-button"
                        >
                            🚀 Ir para Login Agora
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Formulário de redefinição
    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <h1>🔑 Redefinir Senha</h1>
                    <p>Crie uma nova senha segura para sua conta</p>
                </div>

                {dadosUsuario && (
                    <div className="user-info">
                        <h3>👤 Conta identificada:</h3>
                        <p><strong>{dadosUsuario.nome}</strong></p>
                        <p>{dadosUsuario.email}</p>
                        <small>Token expira em: {formatarData(dadosUsuario.expires_at)}</small>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="form-group">
                        <label htmlFor="senha">Nova Senha:</label>
                        <div className="password-input">
                            <input
                                type={mostrarSenha ? 'text' : 'password'}
                                id="senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="Digite sua nova senha"
                                disabled={loading}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                disabled={loading}
                            >
                                {mostrarSenha ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {senha && (
                            <PasswordStrengthIndicator
                                password={senha}
                                showRequirements={true}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmarSenha">Confirmar Nova Senha:</label>
                        <input
                            type={mostrarSenha ? 'text' : 'password'}
                            id="confirmarSenha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            placeholder="Digite novamente sua nova senha"
                            disabled={loading}
                            autoComplete="new-password"
                            required
                        />
                        {confirmarSenha && senha && (
                            <div className={`password-match ${senha === confirmarSenha ? 'match' : 'no-match'}`}>
                                {senha === confirmarSenha ? (
                                    <span>✅ Senhas coincidem</span>
                                ) : (
                                    <span>❌ Senhas não coincidem</span>
                                )}
                            </div>
                        )}
                    </div>

                    {erro && (
                        <div className="error-message">
                            ⚠️ {erro}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading || !senha || !confirmarSenha || senha !== confirmarSenha}
                    >
                        {loading ? '🔄 Redefinindo...' : '🔒 Redefinir Senha'}
                    </button>
                </form>

                <div className="reset-password-footer">
                    <button
                        onClick={() => navigate('/login')}
                        className="back-button"
                        disabled={loading}
                    >
                        ← Voltar para Login
                    </button>

                    <div className="security-info">
                        <h4>🛡️ Dicas de segurança:</h4>
                        <ul>
                            <li>Use uma senha forte e única</li>
                            <li>Não compartilhe suas credenciais</li>
                            <li>Considere usar um gerenciador de senhas</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;