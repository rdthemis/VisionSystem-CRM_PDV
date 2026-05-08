// src/components/Login.js
import React, { useState } from 'react';
import apiService from '../services/apiService';
import Logger from '../utils/Logger';

function Login({ onLogin, onForgotPassword }) {
    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Limpar erro quando usuário começar a digitar
        if (erro) setErro('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        try {
            Logger.info('Tentando fazer login com:', {info: "Usando login: e-mail"});

            const resultado = await apiService.login(formData.email, formData.senha);

            Logger.debug('Resultado do login:', {debug: resultado.data});

            if (resultado.success) {
                Logger.info('Login bem-sucedido!', {info: "Success"});

                // Chamar a função onLogin passada como prop
                if (onLogin && typeof onLogin === 'function') {
                    onLogin(resultado.data);
                } else {
                    Logger.error('onLogin não foi fornecido ou não é uma função', {erro: resultado.data});
                }
            } else {
                Logger.error('Login falhou:', {erro: resultado.message});
                setErro(resultado.message || 'Credenciais inválidas');
            }
        } catch (error) {
            Logger.error('Erro no processo de login:', {erro: error});
            setErro(error.message || 'Erro de conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Logger.info('Redirecionando para esqueci senha', {info: "Redirecionando"});
        if (onForgotPassword && typeof onForgotPassword === 'function') {
            onForgotPassword();
        } else {
            Logger.warn('onForgotPassword', {warn: "Não foi fornecido como prop"});
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>🔐 Login</h1>
                    <p>Acesse sua conta</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Digite seu email"
                            disabled={loading}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="senha">Senha:</label>
                        <div className="password-input">
                            <input
                                type={mostrarSenha ? 'text' : 'password'}
                                id="senha"
                                name="senha"
                                value={formData.senha}
                                onChange={handleChange}
                                placeholder="Digite sua senha"
                                disabled={loading}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                disabled={loading}
                                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {mostrarSenha ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {erro && (
                        <div className="error-message">
                            ⚠️ {erro}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading || !formData.email || !formData.senha}
                    >
                        {loading ? '🔄 Entrando...' : '🚀 Entrar'}
                    </button>

                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="forgot-password-link"
                        disabled={loading}
                    >
                        🔐 Esqueci minha senha
                    </button>
                </form>

                {/* Dados para teste */}
                {/* <div className="test-info">
                    <h4>🧪 Dados para teste:</h4>
                    <p><strong>Email:</strong> admin@teste.com</p>
                    <p><strong>Senha:</strong> 123456</p>
                    <small>Use estes dados para testar o sistema</small>
                </div> */}

                <div className="login-footer">
                    <p>Sistema de Gestão - 2025</p>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }

                .login-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    width: 100%;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .login-header h1 {
                    margin: 0 0 8px 0;
                    color: #333;
                    font-size: 28px;
                    font-weight: 600;
                }

                .login-header p {
                    margin: 0;
                    color: #666;
                    font-size: 16px;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    margin-bottom: 6px;
                    color: #333;
                    font-weight: 500;
                    font-size: 14px;
                }

                .form-group input {
                    padding: 12px 16px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .form-group input:disabled {
                    background: #e9ecef;
                    cursor: not-allowed;
                }

                .password-input {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .password-input input {
                    padding-right: 50px;
                    flex: 1;
                }

                .toggle-password {
                    position: absolute;
                    right: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }

                .toggle-password:hover:not(:disabled) {
                    background: #f1f3f4;
                }

                .toggle-password:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .error-message {
                    background: #fee;
                    color: #c53030;
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid #fed7d7;
                    font-size: 14px;
                    text-align: center;
                }

                .login-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 8px;
                }

                .login-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                }

                .login-button:disabled {
                    background: #a0aec0;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .forgot-password-link {
                    background: none;
                    border: none;
                    color: #667eea;
                    font-size: 14px;
                    cursor: pointer;
                    padding: 8px;
                    text-decoration: underline;
                    transition: color 0.2s ease;
                }

                .forgot-password-link:hover:not(:disabled) {
                    color: #5a67d8;
                }

                .forgot-password-link:disabled {
                    color: #a0aec0;
                    cursor: not-allowed;
                }

                .test-info {
                    margin-top: 24px;
                    padding: 16px;
                    background: #f7fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .test-info h4 {
                    margin: 0 0 8px 0;
                    color: #4a5568;
                    font-size: 14px;
                }

                .test-info p {
                    margin: 4px 0;
                    font-size: 13px;
                    color: #2d3748;
                }

                .test-info small {
                    color: #718096;
                    font-style: italic;
                }

                .login-footer {
                    text-align: center;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                }

                .login-footer p {
                    margin: 0;
                    color: #718096;
                    font-size: 12px;
                }

                @media (max-width: 480px) {
                    .login-container {
                        padding: 16px;
                    }

                    .login-card {
                        padding: 24px;
                    }

                    .login-header h1 {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
}

export default Login;