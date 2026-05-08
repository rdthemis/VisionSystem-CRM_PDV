// src/components/impressao/PrintButton.js - Versão atualizada
// Substitua ou atualize seu PrintButton.js existente

import React, { useState } from 'react';
import printService from '../../services/printService';
import ThermalPrintConfig from './ThermalPrintConfig';
import PrintAdjustmentPanel from './PrintAdjustmentPanel';
import Logger from '../../utils/Logger';

function PrintButton({
    tipo,
    dados,
    texto,
    icone = '🖨️',
    cor = '#28a745',
    tamanho = 'medium',
    mostrarPreview = true,
    mostrarConfigTermica = true,
    onSucesso,
    onErro,
    className = '',
    style = {}
}) {
    const [imprimindo, setImprimindo] = useState(false);
    const [showThermalConfig, setShowThermalConfig] = useState(false);
    // Dentro do componente PrintButton, adicione este estado:
    const [showAdjustments, setShowAdjustments] = useState(false);

    const estilos = {
        small: { padding: '6px 12px', fontSize: '12px' },
        medium: { padding: '10px 16px', fontSize: '14px' },
        large: { padding: '12px 20px', fontSize: '16px' }
    };

    const handleImprimir = async () => {
        if (imprimindo) return;

        try {
            setImprimindo(true);
            Logger.debug('Iniciando impressão', {debug: "Iniciando..."});

            let resultado;
            switch (tipo) {
                case 'comanda':
                    resultado = await printService.imprimirComanda(dados);
                    break;
                case 'recibo':
                    resultado = await printService.imprimirReciboVenda(dados);
                    break;
                case 'relatorio':
                    resultado = await printService.imprimirRelatorioCaixa(dados);
                    break;
                default:
                    throw new Error(`Tipo de impressão não suportado: ${tipo}`);
            }

            Logger.info('Impressão realizada com sucesso', {info: "Sucess"});

            if (onSucesso) {
                onSucesso(resultado);
            }

        } catch (error) {
            Logger.error('Erro na impressão', {erro: error});

            if (onErro) {
                onErro(error);
            } else {
                alert(`Erro na impressão: ${error.message}`);
            }
        } finally {
            setImprimindo(false);
        }
    };

    const handlePreview = () => {
        try {
            let htmlContent;
            switch (tipo) {
                case 'comanda':
                    htmlContent = printService.gerarHTMLComanda(dados);
                    break;
                case 'recibo':
                    htmlContent = printService.gerarHTMLRecibo(dados);
                    break;
                case 'relatorio':
                    htmlContent = printService.gerarHTMLRelatorio(dados);
                    break;
                default:
                    throw new Error(`Preview não suportado para: ${tipo}`);
            }

            printService.visualizarImpressao(htmlContent, tipo);
        } catch (error) {
            Logger.error('Erro no preview:', {erro: error});
        }
    };

    // 🆕 Obter informações do tipo de impressora atual
    const tipoImpressora = printService.obterTipoImpressao();
    const isTermica = tipoImpressora === 'termica';

    return (
        <>
            <div className={`print-button-container ${className}`} style={style}>
                {/* Botão Principal de Impressão */}
                <button
                    onClick={handleImprimir}
                    disabled={imprimindo || !dados}
                    style={{
                        background: imprimindo ? '#6c757d' : cor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: imprimindo || !dados ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: imprimindo || !dados ? 0.6 : 1,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        ...estilos[tamanho]
                    }}
                    title={imprimindo ? 'Imprimindo...' : `Imprimir ${tipo} ${isTermica ? '(Térmica)' : '(Comum)'}`}
                >
                    {imprimindo ? '⏳' : icone}
                    {imprimindo ? 'Imprimindo...' : texto}

                    {/* 🆕 Indicador do tipo de impressora */}
                    {isTermica && (
                        <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            background: '#ff6b35',
                            color: 'white',
                            fontSize: '8px',
                            padding: '1px 3px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                        }}>
                            🔥
                        </span>
                    )}
                </button>



                {/* Container dos botões auxiliares */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                    {/* Botão de Preview (se habilitado) */}
                    {mostrarPreview && (
                        <button
                            onClick={handlePreview}
                            disabled={!dados}
                            style={{
                                background: 'transparent',
                                color: cor,
                                border: `1px solid ${cor}`,
                                borderRadius: '6px',
                                cursor: !dados ? 'not-allowed' : 'pointer',
                                fontWeight: '300',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: !dados ? 0.6 : 1,
                                transition: 'all 0.3s ease',
                                padding: '6px 10px',
                                fontSize: '10px'
                            }}
                            title={`Visualizar ${tipo} antes de imprimir`}
                        >
                            👁️ Preview
                        </button>
                    )}

                    {/* 🆕 Botão de Ajustes Finos */}
                    {mostrarConfigTermica && printService.obterTipoImpressao() === 'termica' && (
                        <button
                            onClick={() => setShowAdjustments(true)}
                            style={{
                                background: '#ffc107',
                                color: '#333',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                padding: '6px 10px',
                                fontSize: '12px'
                            }}
                            title="Ajustar formatação da impressão"
                        >
                            🔧 Ajustes
                        </button>
                    )}

                    {/* 🆕 Botão de Configuração Térmica */}
                    {mostrarConfigTermica && (
                        <button
                            onClick={() => setShowThermalConfig(true)}
                            style={{
                                background: isTermica ? '#ff6b35' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                padding: '6px 10px',
                                fontSize: '12px'
                            }}
                            title="Configurar impressora térmica"
                        >
                            {isTermica ? '🔥' : '⚙️'} Config
                        </button>
                    )}
                </div>
            </div>

            {/* 🆕 Modal de Configuração Térmica */}
            <ThermalPrintConfig
                isOpen={showThermalConfig}
                onClose={() => setShowThermalConfig(false)}
                onConfigSalva={(config) => {
                    Logger.debug('Configuração térmica salva:', {debug: config});
                    // Recarregar página para aplicar configurações se necessário
                    // window.location.reload();
                }}
            />
            {/* 🆕 Modal de Ajustes */}
            <PrintAdjustmentPanel
                isOpen={showAdjustments}
                onClose={() => setShowAdjustments(false)}
            />
        </>
    );
}
// Componentes específicos para cada tipo de impressão
export const ComandaPrintButton = ({ pedido, onSucesso, onErro, ...props }) => (
    <PrintButton
        tipo="comanda"
        dados={pedido}
        texto="Comanda"
        icone="📋"
        cor="#17a2b8"
        onSucesso={onSucesso}
        onErro={onErro}
        {...props}
    />
);

export const ReciboPrintButton = ({ venda, onSucesso, onErro, ...props }) => (
    <PrintButton
        tipo="recibo"
        dados={venda}
        texto="Recibo"
        icone="🧾"
        cor="#28a745"
        onSucesso={onSucesso}
        onErro={onErro}
        {...props}
    />
);

export const RelatorioPrintButton = ({ relatorio, onSucesso, onErro, ...props }) => (
    <PrintButton
        tipo="relatorio"
        dados={relatorio}
        texto="Relatório"
        icone="📊"
        cor="#6f42c1"
        onSucesso={onSucesso}
        onErro={onErro}
        {...props}
    />
);

// 🆕 NOVO COMPONENTE: Botão de Configuração Rápida
export const QuickThermalConfigButton = ({ onConfigSalva }) => {
    const [showConfig, setShowConfig] = useState(false);
    const tipoAtual = printService.obterTipoImpressao();

    return (
        <>
            <button
                onClick={() => setShowConfig(true)}
                style={{
                    background: tipoAtual === 'termica' ? '#ff6b35' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500'
                }}
                title={`Configuração atual: ${tipoAtual}`}
            >
                {tipoAtual === 'termica' ? '🔥' : '🖨️'}
                {tipoAtual === 'termica' ? 'Térmica' : 'Comum'}
            </button>

            <ThermalPrintConfig
                isOpen={showConfig}
                onClose={() => setShowConfig(false)}
                onConfigSalva={(config) => {
                    if (onConfigSalva) {
                        onConfigSalva(config);
                    }
                    setShowConfig(false);
                }}
            />
        </>
    );
};

// Componente de configuração rápida
export const PrintConfigButton = ({ onConfigSalva }) => {
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState({
        nome: localStorage.getItem('estabelecimento_nome') || '',
        endereco: localStorage.getItem('estabelecimento_endereco') || '',
        telefone: localStorage.getItem('estabelecimento_telefone') || '',
        tipo_impressora: localStorage.getItem('impressora_tipo') || 'comum'
    });

    const handleSalvarConfig = () => {
        printService.configurarEstabelecimento({
            nome: config.nome,
            endereco: config.endereco,
            telefone: config.telefone
        });

        printService.configurarImpressora(config.tipo_impressora);

        setShowConfig(false);

        if (onConfigSalva) {
            onConfigSalva(config);
        }

        alert('Configurações salvas com sucesso!');
    };

    if (!showConfig) {
        return (
            <button
                onClick={() => setShowConfig(true)}
                style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                ⚙️ Config Impressão
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
                <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
                    ⚙️ Configurar Impressão
                </h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Nome do Estabelecimento:
                    </label>
                    <input
                        type="text"
                        value={config.nome}
                        onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Endereço:
                    </label>
                    <input
                        type="text"
                        value={config.endereco}
                        onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Telefone:
                    </label>
                    <input
                        type="text"
                        value={config.telefone}
                        onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Tipo de Impressora:
                    </label>
                    <select
                        value={config.tipo_impressora}
                        onChange={(e) => setConfig({ ...config, tipo_impressora: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <option value="comum">Impressora Comum</option>
                        <option value="termica">Impressora Térmica</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setShowConfig(false)}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSalvarConfig}
                        style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintButton;