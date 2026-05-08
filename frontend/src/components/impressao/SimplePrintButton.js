// src/components/impressao/SimplePrintButton.js
// 🖨️ Botões de impressão simplificados - VERSÃO REFATORADA
// ✅ Lógica de conexão removida (delegada ao printService)
// ✅ Código mais limpo e reutilizável

import React, { useState, useEffect } from 'react';
import printService from '../../services/printService';
import Logger from '../../utils/Logger';

function SimplePrintButton({
    tipo,
    dados,
    texto,
    icone = '🖨️',
    cor = '#28a745',
    tamanho = 'medium',
    onSucesso,
    onErro,
    className = '',
    style = {},
    desabilitado = false
}) {
    const [imprimindo, setImprimindo] = useState(false);
    const [conectado, setConectado] = useState(false);
    const isTermica = printService.isTermica();

    const estilos = {
        small: { padding: '6px 12px', fontSize: '12px' },
        medium: { padding: '10px 16px', fontSize: '14px' },
        large: { padding: '12px 20px', fontSize: '16px' }
    };

    // ========================================
    // 🔌 MONITORAMENTO DE CONEXÃO
    // ========================================
    
    useEffect(() => {
        if (!isTermica) {
            setConectado(true); // Impressora comum sempre "conectada"
            return;
        }

        // Escutar mudanças de status da térmica
        const handleStatusChange = (event) => {
            setConectado(event.detail.conectado);
        };

        window.addEventListener('status-impressora-mudou', handleStatusChange);

        // Verificar status inicial
        const status = printService.verificarStatusTermica();
        setConectado(status.conectada);

        return () => {
            window.removeEventListener('status-impressora-mudou', handleStatusChange);
        };
    }, [isTermica]);

    // ========================================
    // 🖨️ IMPRESSÃO
    // ========================================
    
    const handleImprimir = async () => {
        if (imprimindo || !dados) return;

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

    // ========================================
    // 👁️ PREVIEW
    // ========================================
    
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
            alert(`Erro no preview: ${error.message}`);
        }
    };

    // ========================================
    // 🔌 CONECTAR IMPRESSORA TÉRMICA
    // ========================================
    
    const handleConectar = async () => {
        if (!isTermica) return;

        try {
            const sucesso = await printService.conectarViaInterface();
            
            if (!sucesso) {
                alert('Não foi possível conectar. Verifique se a impressora está ligada.');
            }
        } catch (erro) {
            Logger.error('Erro ao conectar:', {erro: erro});
            alert('Erro ao conectar impressora');
        }
    };

    // ========================================
    // 🎨 RENDERIZAÇÃO
    // ========================================
    
    const podeImprimir = dados && !imprimindo && !desabilitado && (conectado || !isTermica);

    return (
        <div className={`simple-print-container ${className}`} style={{ display: 'flex', gap: '8px', alignItems: 'center', ...style }}>
            
            {/* Botão Principal de Impressão */}
            <button
                onClick={handleImprimir}
                disabled={!podeImprimir}
                style={{
                    background: !podeImprimir ? '#6c757d' : (imprimindo ? '#6c757d' : cor),
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: !podeImprimir ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: !podeImprimir ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    ...estilos[tamanho]
                }}
                title={imprimindo ? 'Imprimindo...' : `Imprimir ${tipo}`}
            >
                {imprimindo ? '⏳' : icone}
                {imprimindo ? 'Imprimindo...' : texto}

                {/* Indicador de tipo de impressora */}
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

            {/* Botão de Preview */}
            <button
                onClick={handlePreview}
                disabled={!dados || desabilitado}
                style={{
                    background: 'transparent',
                    color: cor,
                    border: `1px solid ${cor}`,
                    borderRadius: '6px',
                    cursor: (!dados || desabilitado) ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: (!dados || desabilitado) ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    padding: '6px 10px',
                    fontSize: '12px'
                }}
                title={`Visualizar ${tipo} antes de imprimir`}
            >
                👁️
            </button>

            {/* Botão de Conectar (só para térmica desconectada) */}
            {isTermica && !conectado && (
                <button
                    onClick={handleConectar}
                    style={{
                        background: '#ffc107',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        padding: '6px 10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s ease'
                    }}
                    title="Conectar impressora térmica"
                >
                    🔌 Conectar
                </button>
            )}
        </div>
    );
}

// ========================================
// 🎯 COMPONENTES ESPECÍFICOS
// ========================================

export const SimpleComandaPrintButton = ({ pedido, onSucesso, onErro, ...props }) => (
    <SimplePrintButton
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

export const SimpleReciboPrintButton = ({ venda, onSucesso, onErro, ...props }) => (
    <SimplePrintButton
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

export const SimpleRelatorioPrintButton = ({ caixa, onSucesso, onErro, ...props }) => (
    <SimplePrintButton
        tipo="relatorio"
        dados={caixa}
        texto="Relatório"
        icone="📊"
        cor="#6c757d"
        onSucesso={onSucesso}
        onErro={onErro}
        {...props}
    />
);

// ========================================
// 📟 INDICADOR DE TIPO DE IMPRESSORA
// ========================================

export const PrinterTypeIndicator = () => {
    const isTermica = printService.isTermica();
    const [conectado, setConectado] = useState(false);

    useEffect(() => {
        if (!isTermica) return;

        const handleStatusChange = (event) => {
            setConectado(event.detail.conectado);
        };

        window.addEventListener('status-impressora-mudou', handleStatusChange);

        const status = printService.verificarStatusTermica();
        setConectado(status.conectada);

        return () => {
            window.removeEventListener('status-impressora-mudou', handleStatusChange);
        };
    }, [isTermica]);

    return (
        <div style={{
            position: 'fixed',
            top: '70px',
            right: '20px',
            background: isTermica ? (conectado ? '#28a745' : '#dc3545') : '#6c757d',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: 998,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
            {isTermica ? (conectado ? '🔥' : '🔌') : '🖨️'}
            {isTermica ? (conectado ? 'Térmica OK' : 'Térmica Desconectada') : 'Comum'}
        </div>
    );
};

export default SimplePrintButton;
