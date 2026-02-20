// src/components/impressao/PrintAdjustmentPanel.js
// Painel para ajustar configurações de impressão em tempo real

import React, { useState } from 'react';
import thermalPrintService from "../../services/thermalPrintService.js";

function PrintAdjustmentPanel({ isOpen, onClose }) {
    const [config, setConfig] = useState({
        densidade: 'normal',
        tamanhoFonte: 'normal',
        corteAutomatico: true,
        linhasAvanco: 3,
        larguraLinha: 32
    });
    const [testando, setTestando] = useState(false);
    const [resultado, setResultado] = useState('');

    // No PrintAdjustmentPanel.js, adicione este estado:
    const [testesCorte] = useState([
        { id: 'feed_cut', nome: 'Avança e Corta (Padrão)', desc: 'Mais comum' },
        { id: 'full', nome: 'Corte Total', desc: 'Corte completo' },
        { id: 'partial', nome: 'Corte Parcial', desc: 'Corte parcial' },
        { id: 'alt1', nome: 'Alternativo 1', desc: 'ESC/POS variant 1' },
        { id: 'alt2', nome: 'Alternativo 2', desc: 'ESC/POS variant 2' },
        { id: 'alt3', nome: 'Alternativo 3', desc: 'ESC/POS variant 3' },
        { id: 'alt4', nome: 'Alternativo 4', desc: 'ESC/POS variant 4' }
    ]);

    const handleTestar = async () => {
        setTestando(true);
        setResultado('Enviando teste...');

        try {
            // Aplicar configurações ao serviço
            thermalPrintService.configurarImpressao(config);

            // Executar teste
            const response = await thermalPrintService.testarConfiguracoes();

            if (response.success) {
                setResultado('✅ Teste enviado! Verifique a impressora.');
            } else {
                setResultado(`❌ Erro: ${response.message}`);
            }
        } catch (error) {
            setResultado(`❌ Erro: ${error.message}`);
        } finally {
            setTestando(false);
        }
    };

    const handleSalvar = () => {
        // Salvar configurações no localStorage
        localStorage.setItem('thermal_print_config', JSON.stringify(config));

        // Aplicar ao serviço
        thermalPrintService.configurarImpressao(config);

        setResultado('✅ Configurações salvas com sucesso!');

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const presetConfigs = {
        economico: {
            densidade: 'clara',
            tamanhoFonte: 'pequena',
            corteAutomatico: true,
            linhasAvanco: 2,
            larguraLinha: 32
        },
        normal: {
            densidade: 'normal',
            tamanhoFonte: 'normal',
            corteAutomatico: true,
            linhasAvanco: 3,
            larguraLinha: 32
        },
        destacado: {
            densidade: 'escura',
            tamanhoFonte: 'grande',
            corteAutomatico: true,
            linhasAvanco: 4,
            larguraLinha: 30
        }
    };

    const aplicarPreset = (preset) => {
        setConfig(presetConfigs[preset]);
        setResultado(`Preset "${preset}" aplicado`);
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
                padding: '25px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔧</div>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                        Ajustes de Impressão Térmica
                    </h2>
                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>
                        Configure e teste a formatação da impressora
                    </p>
                </div>

                {/* Presets Rápidos */}
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>
                        🎯 Presets Rápidos
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => aplicarPreset('economico')}
                            style={{
                                background: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            💡 Econômico
                        </button>
                        <button
                            onClick={() => aplicarPreset('normal')}
                            style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            ⚖️ Normal
                        </button>
                        <button
                            onClick={() => aplicarPreset('destacado')}
                            style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🔥 Destacado
                        </button>
                    </div>
                </div>

                {/* Configurações Detalhadas */}
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px' }}>
                        ⚙️ Configurações Personalizadas
                    </h4>

                    {/* Densidade */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Intensidade da Impressão:
                        </label>
                        <select
                            value={config.densidade}
                            onChange={(e) => setConfig({ ...config, densidade: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="clara">🌕 Clara (econômica)</option>
                            <option value="normal">⚖️ Normal (padrão)</option>
                            <option value="escura">🔥 Escura (destacada)</option>
                        </select>
                    </div>

                    {/* Tamanho da Fonte */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Tamanho da Fonte:
                        </label>
                        <select
                            value={config.tamanhoFonte}
                            onChange={(e) => setConfig({ ...config, tamanhoFonte: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="pequena">📝 Pequena (mais conteúdo)</option>
                            <option value="normal">📄 Normal (padrão)</option>
                            <option value="grande">📋 Grande (mais legível)</option>
                        </select>
                    </div>

                    {/* Largura da Linha */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Largura da Linha: {config.larguraLinha} caracteres
                        </label>
                        <input
                            type="range"
                            min="28"
                            max="35"
                            value={config.larguraLinha}
                            onChange={(e) => setConfig({ ...config, larguraLinha: parseInt(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                            <span>Estreita</span>
                            <span>Larga</span>
                        </div>
                    </div>

                    {/* Linhas de Avanço */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Espaço Antes do Corte: {config.linhasAvanco} linhas
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="6"
                            value={config.linhasAvanco}
                            onChange={(e) => setConfig({ ...config, linhasAvanco: parseInt(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                            <span>Pouco</span>
                            <span>Muito</span>
                        </div>
                    </div>

                    {/* Corte Automático */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <input
                                type="checkbox"
                                checked={config.corteAutomatico}
                                onChange={(e) => setConfig({ ...config, corteAutomatico: e.target.checked })}
                            />
                            <span>✂️ Cortar papel automaticamente</span>
                        </label>
                    </div>
                </div>
                {/* Testes de Corte */}
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>
                        ✂️ Teste de Corte de Papel
                    </h4>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
                        Teste diferentes comandos de corte para encontrar o que funciona com sua impressora:
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '8px'
                    }}>
                        {testesCorte.map(teste => (
                            <button
                                key={teste.id}
                                onClick={async () => {
                                    setTestando(true);
                                    setResultado(`Testando corte: ${teste.nome}...`);

                                    try {
                                        const response = await thermalPrintService.testarCorte(teste.id);
                                        setResultado(response.success ?
                                            `✅ ${teste.nome} enviado!` :
                                            `❌ Erro: ${response.message}`
                                        );
                                    } catch (error) {
                                        setResultado(`❌ Erro: ${error.message}`);
                                    } finally {
                                        setTestando(false);
                                    }
                                }}
                                disabled={testando}
                                style={{
                                    background: testando ? '#e9ecef' : '#f8f9fa',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    cursor: testando ? 'not-allowed' : 'pointer',
                                    fontSize: '11px',
                                    textAlign: 'left',
                                    opacity: testando ? 0.5 : 1
                                }}
                                title={teste.desc}
                            >
                                <div style={{ fontWeight: 'bold' }}>{teste.nome}</div>
                                <div style={{ color: '#6c757d' }}>{teste.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resultado */}
                {resultado && (
                    <div style={{
                        marginBottom: '15px',
                        padding: '8px 12px',
                        backgroundColor: resultado.includes('❌') ? '#f8d7da' : '#d4edda',
                        color: resultado.includes('❌') ? '#721c24' : '#155724',
                        borderRadius: '4px',
                        fontSize: '13px',
                        border: `1px solid ${resultado.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
                    }}>
                        {resultado}
                    </div>
                )}

                {/* Botões de Ação */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <button
                            onClick={handleTestar}
                            disabled={testando}
                            style={{
                                background: testando ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: testando ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                flex: 1,
                                opacity: testando ? 0.6 : 1
                            }}
                        >
                            {testando ? '⏳ Testando...' : '🧪 Testar Configuração'}
                        </button>
                    </div>

                    <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                        💡 Use "Testar" para ver o resultado antes de salvar
                    </div>
                </div>

                {/* Botões Finais */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSalvar}
                        style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        ✅ Salvar e Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PrintAdjustmentPanel;