// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import './ForgotPassword.css';

function ForgotPassword({ onBackToLogin }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [emailEnviado, setEmailEnviado] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setErro('Email é obrigatório');
            return;
        }

        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            const resultado = await apiService.solicitarRecuperacaoSenha(email);

            if (resultado.success) {
                setSucesso(resultado.message);
                setEmailEnviado(true);
            } else {
                setErro(resultado.message || 'Erro ao enviar email');
            }
        } catch (error) {
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTentarNovamente = () => {
        setEmailEnviado(false);
        setEmail('');
        setSucesso('');
        setErro('');
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <h1>🔐 Esqueci minha senha</h1>
                    {!emailEnviado ? (
                        <p>Digite seu email para receber instruções de recuperação</p>
                    ) : (
                        <p>Instruções enviadas!</p>
                    )}
                </div>

                {!emailEnviado ? (
                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Digite seu email cadastrado"
                                disabled={loading}
                                autoComplete="email"
                                required
                            />
                        </div>

                        {erro && (
                            <div className="error-message">
                                ⚠️ {erro}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? '📧 Enviando...' : '📧 Enviar Instruções'}
                        </button>
                    </form>
                ) : (
                    <div className="success-content">
                        <div className="success-message">
                            ✅ {sucesso}
                        </div>

                        <div className="email-sent-info">
                            <h3>📬 Próximos passos:</h3>
                            <ol>
                                <li>Verifique sua caixa de entrada</li>
                                <li>Procure por um email de <strong>Sistema de Gestão</strong></li>
                                <li>Clique no link de recuperação</li>
                                <li>Crie sua nova senha</li>
                            </ol>

                            <div className="help-info">
                                <h4>📋 Não recebeu o email?</h4>
                                <ul>
                                    <li>Verifique a pasta de spam/lixo eletrônico</li>
                                    <li>Aguarde alguns minutos e recarregue a caixa</li>
                                    <li>Verifique se o email está correto</li>
                                    <li>O link expira em <strong>1 hora</strong></li>
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={handleTentarNovamente}
                            className="retry-button"
                            disabled={loading}
                        >
                            🔄 Tentar com outro email
                        </button>
                    </div>
                )}

                <div className="forgot-password-footer">
                    <button
                        onClick={onBackToLogin}
                        className="back-button"
                        disabled={loading}
                    >
                        ← Voltar para Login
                    </button>

                    <div className="help-contact">
                        <p>
                            <strong>Precisa de ajuda?</strong><br />
                            Entre em contato com o suporte
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;