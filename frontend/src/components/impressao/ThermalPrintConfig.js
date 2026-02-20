// src/components/impressao/ThermalPrintConfig.js
// Componente para configurar impressora térmica

import React, { useState, useEffect } from 'react';
import printService from '../../services/printService';

function ThermalPrintConfig({ isOpen, onClose, onConfigSalva }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [config, setConfig] = useState({
        tipo: 'termica',
        conectarAutomatico: true,
        cortarPapel: true
    });
    const [mensagem, setMensagem] = useState('');
    const [tipoMensagem, setTipoMensagem] = useState('info');

    useEffect(() => {
        if (isOpen) {
            carregarStatus();
        }
    }, [isOpen]);

    const carregarStatus = () => {
        const statusAtual = printService.verificarStatusTermica();
        setStatus(statusAtual);
        setConfig({
            tipo: statusAtual.configuracao.tipo,
            conectarAutomatico: statusAtual.configuracao.conectarAutomatico,
            cortarPapel: statusAtual.configuracao.cortarPapel
        });
    };

    const handleConectar = async () => {
        setLoading(true);
        setMensagem('Conectando com impressora térmica...');
        setTipoMensagem('info');

        try {
            const resultado = await printService.conectarImpressoraTermica();

            if (resultado.success) {
                setMensagem('✅ Impressora térmica conectada com sucesso!');
                setTipoMensagem('success');
                carregarStatus();
            } else {
                setMensagem(`❌ Erro: ${resultado.message}`);
                setTipoMensagem('error');
            }
        } catch (error) {
            setMensagem(`❌ Erro ao conectar: ${error.message}`);
            setTipoMensagem('error');
        } finally {
            setLoading(false);
        }
    };

    const handleDesconectar = async () => {
        setLoading(true);
        setMensagem('Desconectando impressora...');

        try {
            const resultado = await printService.desconectarImpressoraTermica();

            if (resultado.success) {
                setMensagem('🔌 Impressora desconectada');
                setTipoMensagem('info');
                carregarStatus();
            } else {
                setMensagem(`❌ Erro: ${resultado.message}`);
                setTipoMensagem('error');
            }
        } catch (error) {
            setMensagem(`❌ Erro ao desconectar: ${error.message}`);
            setTipoMensagem('error');
        } finally {
            setLoading(false);
        }
    };

    const handleTestar = async () => {
        setLoading(true);
        setMensagem('Executando teste de impressão...');
        setTipoMensagem('info');

        try {
            const resultado = await printService.testarImpressoraTermica();

            if (resultado.success) {
                setMensagem('✅ Teste realizado com sucesso! Verifique a impressora.');
                setTipoMensagem('success');
            } else {
                setMensagem(`❌ Erro no teste: ${resultado.message}`);
                setTipoMensagem('error');
            }
        } catch (error) {
            setMensagem(`❌ Erro no teste: ${error.message}`);
            setTipoMensagem('error');
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarConfig = () => {
        printService.configurarImpressora(config.tipo, {
            conectarAutomatico: config.conectarAutomatico,
            cortarPapel: config.cortarPapel
        });

        setMensagem('✅ Configurações salvas com sucesso!');
        setTipoMensagem('success');

        if (onConfigSalva) {
            onConfigSalva(config);
        }

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔥</div>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
                        Configuração Impressora Térmica
                    </h2>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Configure e teste sua impressora térmica
                    </p>
                </div>

                {/* Status Atual */}
                {status && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: status.conectada ? '#d4edda' : '#f8d7da',
                        borderRadius: '8px',
                        border: `1px solid ${status.conectada ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                            📊 Status Atual
                        </h4>
                        <div style={{ fontSize: '14px' }}>
                            <div><strong>Conexão:</strong> {status.conectada ? '✅ Conectada' : '❌ Desconectada'}</div>
                            <div><strong>Dispositivo:</strong> {status.tipo_dispositivo}</div>
                            <div><strong>Tipo:</strong> {status.configuracao.tipo}</div>
                        </div>
                    </div>
                )}

                {/* Mensagem de Status */}
                {mensagem && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '12px',
                        backgroundColor: tipoMensagem === 'success' ? '#d4edda' :
                            tipoMensagem === 'error' ? '#f8d7da' : '#cce7ff',
                        color: tipoMensagem === 'success' ? '#155724' :
                            tipoMensagem === 'error' ? '#721c24' : '#004085',
                        borderRadius: '6px',
                        border: `1px solid ${tipoMensagem === 'success' ? '#c3e6cb' :
                            tipoMensagem === 'error' ? '#f5c6cb' : '#99d3ff'}`,
                        fontSize: '14px'
                    }}>
                        {mensagem}
                    </div>
                )}

                {/* Configurações */}
                <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>⚙️ Configurações</h4>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Tipo de Impressora:
                        </label>
                        <select
                            value={config.tipo}
                            onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="comum">Impressora Comum (Browser)</option>
                            <option value="termica">Impressora Térmica (ESC/POS)</option>
                        </select>
                    </div>

                    {config.tipo === 'termica' && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={config.conectarAutomatico}
                                        onChange={(e) => setConfig({ ...config, conectarAutomatico: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '14px' }}>Conectar automaticamente ao imprimir</span>
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={config.cortarPapel}
                                        onChange={(e) => setConfig({ ...config, cortarPapel: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '14px' }}>Cortar papel automaticamente</span>
                                </label>
                            </div>
                        </>
                    )}
                </div>

                {/* Botões de Ação */}
                {config.tipo === 'termica' && (
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🔧 Ações</h4>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleConectar}
                                disabled={loading || (status && status.conectada)}
                                style={{
                                    background: status && status.conectada ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: loading || (status && status.conectada) ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: loading || (status && status.conectada) ? 0.6 : 1
                                }}
                            >
                                🔌 {status && status.conectada ? 'Conectada' : 'Conectar'}
                            </button>

                            <button
                                onClick={handleDesconectar}
                                disabled={loading || (status && !status.conectada)}
                                style={{
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: loading || (status && !status.conectada) ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: loading || (status && !status.conectada) ? 0.6 : 1
                                }}
                            >
                                🔌 Desconectar
                            </button>

                            <button
                                onClick={handleTestar}
                                disabled={loading}
                                style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                🧪 Testar Impressão
                            </button>
                        </div>
                    </div>
                )}

                {/* Instruções */}
                <div style={{
                    marginBottom: '25px',
                    padding: '15px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📋 Instruções</h4>
                    <div style={{ fontSize: '13px', color: '#856404' }}>
                        <p style={{ margin: '0 0 8px 0' }}>
                            <strong>Para Impressora Térmica:</strong>
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Conecte a impressora via USB</li>
                            <li>Clique em "Conectar" para estabelecer conexão</li>
                            <li>Use "Testar Impressão" para verificar funcionamento</li>
                            <li>Configure as opções conforme necessário</li>
                        </ul>
                        <p style={{ margin: '8px 0 0 0' }}>
                            <strong>Fallback:</strong> Se a impressão térmica falhar, o sistema usa automaticamente a impressão comum.
                        </p>
                    </div>
                </div>

                {/* Botões Finais */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSalvarConfig}
                        disabled={loading}
                        style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: loading ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? '⏳' : '✅'}
                        {loading ? 'Processando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ThermalPrintConfig;