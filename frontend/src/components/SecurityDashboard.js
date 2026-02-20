// src/components/SecurityDashboard.js
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './SecurityDashboard.css';

function SecurityDashboard() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        carregarEstatisticas();

        // Atualiza a cada 30 segundos
        const interval = setInterval(carregarEstatisticas, 30000);
        return () => clearInterval(interval);
    }, []);

    const carregarEstatisticas = async () => {
        setLoading(true);
        setErro('');

        try {
            const resultado = await apiService.obterEstatisticasSeguranca();
            if (resultado.success) {
                setStats(resultado.data);
            } else {
                setErro('Erro ao carregar estatísticas');
            }
        } catch (error) {
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    };

    const executarLimpeza = async () => {
        setLoading(true);
        setErro('');
        setSucesso('');
        setShowConfirmModal(false);

        try {
            const resultado = await apiService.executarLimpezaSeguranca();
            if (resultado.success) {
                setSucesso(resultado.message);
                carregarEstatisticas(); // Recarrega stats
            } else {
                setErro('Erro na limpeza');
            }
        } catch (error) {
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLimpezaClick = () => {
        setShowConfirmModal(true);
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        return new Date(dataString).toLocaleString('pt-BR');
    };

    const getStatusClass = (success) => {
        return success ? 'status-success' : 'status-failed';
    };

    const calcularTaxaSucesso = () => {
        const { total_attempts, successful_attempts } = stats;
        if (!total_attempts) return 0;
        return ((successful_attempts / total_attempts) * 100).toFixed(1);
    };

    return (
        <div className="security-dashboard">
            <div className="security-header">
                <h2>🔒 Painel de Segurança</h2>
                <div className="security-actions">
                    <button
                        onClick={carregarEstatisticas}
                        disabled={loading}
                        className="refresh-btn"
                    >
                        {loading ? '🔄' : '↻'} Atualizar
                    </button>
                    <button
                        onClick={handleLimpezaClick}
                        disabled={loading}
                        className="cleanup-btn"
                    >
                        🧹 Limpeza
                    </button>
                </div>
            </div>

            {erro && <div className="error-message">⚠️ {erro}</div>}
            {sucesso && <div className="success-message">✅ {sucesso}</div>}

            {loading && !stats.blocked_ips && (
                <div className="loading">Carregando estatísticas...</div>
            )}

            {/* Estatísticas Principais */}
            <div className="stats-grid">
                <div className="stat-card danger">
                    <h3>🚫 IPs Bloqueados</h3>
                    <div className="stat-number">{stats.blocked_ips || 0}</div>
                    <small>Atualmente bloqueados</small>
                </div>

                <div className="stat-card info">
                    <h3>🔑 Tentativas (24h)</h3>
                    <div className="stat-number">{stats.total_attempts || 0}</div>
                    <small>Total de tentativas de login</small>
                </div>

                <div className="stat-card success">
                    <h3>✅ Login Bem-sucedidos</h3>
                    <div className="stat-number">{stats.successful_attempts || 0}</div>
                    <small>Taxa: {calcularTaxaSucesso()}%</small>
                </div>

                <div className="stat-card warning">
                    <h3>❌ Login Falhados</h3>
                    <div className="stat-number">{stats.failed_attempts || 0}</div>
                    <small>Últimas 24 horas</small>
                </div>

                <div className="stat-card primary">
                    <h3>👥 Sessões Ativas</h3>
                    <div className="stat-number">{stats.active_sessions || 0}</div>
                    <small>Usuários conectados</small>
                </div>
            </div>

            {/* Top IPs com Falhas */}
            {stats.top_failed_ips && stats.top_failed_ips.length > 0 && (
                <div className="security-section">
                    <h3>🎯 IPs com Mais Tentativas Falhadas (1h)</h3>
                    <div className="failed-ips-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>Tentativas Falhadas</th>
                                    <th>Risco</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_failed_ips.map((ip, index) => (
                                    <tr key={index} className={ip.failed_count >= 3 ? 'high-risk' : ''}>
                                        <td className="ip-address">{ip.ip_address}</td>
                                        <td className="attempts-count">{ip.failed_count}</td>
                                        <td>
                                            <span className={`risk-badge ${ip.failed_count >= 5 ? 'critical' : ip.failed_count >= 3 ? 'high' : 'medium'}`}>
                                                {ip.failed_count >= 5 ? 'CRÍTICO' : ip.failed_count >= 3 ? 'ALTO' : 'MÉDIO'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tentativas Recentes */}
            {stats.recent_attempts && stats.recent_attempts.length > 0 && (
                <div className="security-section">
                    <h3>📋 Tentativas de Login Recentes</h3>
                    <div className="recent-attempts">
                        {stats.recent_attempts.map((attempt, index) => (
                            <div key={index} className={`attempt-item ${getStatusClass(attempt.success)}`}>
                                <div className="attempt-header">
                                    <span className={`attempt-status ${attempt.success ? 'success' : 'failed'}`}>
                                        {attempt.success ? '✅' : '❌'}
                                        {attempt.success ? 'SUCESSO' : 'FALHOU'}
                                    </span>
                                    <span className="attempt-time">{formatarData(attempt.attempted_at)}</span>
                                </div>
                                <div className="attempt-details">
                                    <div className="attempt-user">
                                        👤 {attempt.usuario_nome || 'Usuário não encontrado'}
                                        <span className="attempt-email">({attempt.email})</span>
                                    </div>
                                    <div className="attempt-ip">
                                        🌐 IP: <span className="ip-highlight">{attempt.ip_address}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de Confirmação */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>🧹 Confirmar Limpeza</h3>
                        <p>
                            Deseja executar a limpeza de dados antigos? Esta ação irá remover:
                        </p>
                        <ul>
                            <li>Tentativas de login com mais de 7 dias</li>
                            <li>IPs desbloqueados automaticamente</li>
                            <li>Tokens de reset expirados</li>
                            <li>Sessões expiradas</li>
                        </ul>
                        <p><strong>Esta ação não pode ser desfeita.</strong></p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="cancel-btn"
                                disabled={loading}
                            >
                                ❌ Cancelar
                            </button>
                            <button
                                onClick={executarLimpeza}
                                className="confirm-btn"
                                disabled={loading}
                            >
                                ✅ Confirmar Limpeza
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Info */}
            <div className="update-info">
                <small>
                    📊 Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                    | 🔄 Atualização automática a cada 30s
                </small>
            </div>
        </div>
    );
}

export default SecurityDashboard;