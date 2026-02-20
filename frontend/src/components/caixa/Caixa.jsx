// Caixa.jsx - Componente principal refatorado
import React, { useState } from 'react';
import { useCaixa } from './hooks/useCaixa';
import CaixaHeader from './components/CaixaHeader';
import ResumoFinanceiro from './components/ResumoFinanceiro';
import FormularioAbertura from './components/FormularioAbertura';
import FormularioMovimento from './components/FormularioMovimento';
import ListaMovimentos from './components/ListaMovimentos';
import FiltrosPeriodo from './components/FiltrosPeriodo';
import ModalFechamento from './components/ModalFechamento';
import { RelatorioPrintButton } from '../impressao/PrintButton';
import './Caixa.css';

function Caixa({ onCaixaFechado, onVoltarDashboard }) {
    const [viewCaixa, setViewCaixa] = useState('movimentos');

    const {
        caixaData,
        movimentosCaixa,
        loadingCaixa,
        mensagem,
        tipoMensagem,
        filtroData,
        periodoCustom,
        abrirCaixa,
        fecharCaixa,
        adicionarMovimento,
        setFiltroData,
        setPeriodoCustom,
        setMensagem
    } = useCaixa(onCaixaFechado, onVoltarDashboard);

    // Handlers
    const handleAbrirCaixa = async (valorInicial) => {
        const result = await abrirCaixa(valorInicial);
        if (result.success) {
            setViewCaixa('movimentos');
        }
    };

    const handleSalvarMovimento = async (movimento) => {
        const result = await adicionarMovimento(movimento);
        if (result.success) {
            setViewCaixa('movimentos');
        }
    };

    const handleFecharCaixa = async (observacoes) => {
        await fecharCaixa(observacoes);
    };

    return (
        <div className="caixa-container">
            {/* Mensagem de feedback */}
            {mensagem && (
                <div className={`mensagem-feedback ${tipoMensagem}`}>
                    <i className={`fas ${tipoMensagem === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    {mensagem}
                    <button onClick={() => setMensagem('')}>✕</button>
                </div>
            )}

            {/* Header do Caixa */}
            <CaixaHeader caixaData={caixaData} />

            {/* Resumo Financeiro */}
            <ResumoFinanceiro caixaData={caixaData} />

            {/* Navegação */}
            <div className="caixa-nav">
                <button
                    className={`caixa-nav-btn ${viewCaixa === 'movimentos' ? 'active' : ''}`}
                    onClick={() => setViewCaixa('movimentos')}
                >
                    <i className="fas fa-exchange-alt"></i>
                    Movimentos
                </button>
                <button
                    className={`caixa-nav-btn ${viewCaixa === 'entrada' ? 'active' : ''}`}
                    onClick={() => setViewCaixa('entrada')}
                    disabled={!caixaData.caixa_aberto}
                >
                    <i className="fas fa-plus-circle"></i>
                    Nova Entrada
                </button>
                <button
                    className={`caixa-nav-btn ${viewCaixa === 'saida' ? 'active' : ''}`}
                    onClick={() => setViewCaixa('saida')}
                    disabled={!caixaData.caixa_aberto}
                >
                    <i className="fas fa-minus-circle"></i>
                    Nova Saída
                </button>
                <button
                    className={`caixa-nav-btn ${viewCaixa === 'relatorio' ? 'active' : ''}`}
                    onClick={() => setViewCaixa('relatorio')}
                >
                    <i className="fas fa-chart-bar"></i>
                    Relatório
                </button>
                <button
                    className={`caixa-nav-btn ${viewCaixa === 'fechamento' ? 'active' : ''}`}
                    onClick={() => setViewCaixa('fechamento')}
                    disabled={!caixaData.caixa_aberto}
                >
                    <i className="fas fa-lock"></i>
                    Fechar Caixa
                </button>
            </div>

            {/* Conteúdo Principal */}
            <div className="caixa-content">
                {/* Movimentos */}
                {viewCaixa === 'movimentos' && (
                    <div className="caixa-movimentos">
                        <div className="movimentos-header">
                            <h3>Movimentos do Caixa</h3>
                            <FiltrosPeriodo
                                filtroData={filtroData}
                                setFiltroData={setFiltroData}
                                periodoCustom={periodoCustom}
                                setPeriodoCustom={setPeriodoCustom}
                            />
                        </div>

                        {!caixaData.caixa_aberto ? (
                            <FormularioAbertura 
                                onAbrir={handleAbrirCaixa} 
                                loading={loadingCaixa} 
                            />
                        ) : (
                            <ListaMovimentos
                                movimentos={movimentosCaixa}
                                loading={loadingCaixa}
                                caixaAberto={caixaData.caixa_aberto}
                            />
                        )}
                    </div>
                )}

                {/* Formulário de Entrada */}
                {viewCaixa === 'entrada' && (
                    <FormularioMovimento
                        tipo="entrada"
                        onSalvar={handleSalvarMovimento}
                        onCancelar={() => setViewCaixa('movimentos')}
                        loading={loadingCaixa}
                    />
                )}

                {/* Formulário de Saída */}
                {viewCaixa === 'saida' && (
                    <FormularioMovimento
                        tipo="saida"
                        onSalvar={handleSalvarMovimento}
                        onCancelar={() => setViewCaixa('movimentos')}
                        loading={loadingCaixa}
                    />
                )}

                {/* Relatório */}
                {viewCaixa === 'relatorio' && (
                    <div className="caixa-relatorio">
                        <h3>
                            <i className="fas fa-chart-bar"></i>
                            Relatório Financeiro
                        </h3>

                        <div className="relatorio-resumo">
                            <div className="relatorio-card">
                                <h4>Resumo do Período</h4>
                                <div className="resumo-detalhado">
                                    <div className="resumo-linha">
                                        <span>Total de Movimentos:</span>
                                        <strong>{caixaData.total_movimentos}</strong>
                                    </div>
                                    <div className="resumo-linha entrada">
                                        <span>Entradas:</span>
                                        <strong className="valor-positivo">
                                            R$ {caixaData.total_entradas?.toFixed(2)}
                                        </strong>
                                    </div>
                                    <div className="resumo-linha saida">
                                        <span>Saídas:</span>
                                        <strong className="valor-negativo">
                                            R$ {caixaData.total_saidas?.toFixed(2)}
                                        </strong>
                                    </div>
                                    <div className="resumo-linha total">
                                        <span>Saldo Atual:</span>
                                        <strong>R$ {caixaData.saldo_atual?.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="relatorio-actions">
                                <RelatorioPrintButton
                                    tipo="caixa"
                                    dados={{
                                        periodo: filtroData,
                                        saldo_inicial: caixaData.saldo_inicial,
                                        total_entradas: caixaData.total_entradas,
                                        total_saidas: caixaData.total_saidas,
                                        saldo_final: caixaData.saldo_atual,
                                        movimentos: movimentosCaixa
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Fechamento */}
                {viewCaixa === 'fechamento' && (
                    <ModalFechamento
                        caixaData={caixaData}
                        onFechar={handleFecharCaixa}
                        onCancelar={() => setViewCaixa('movimentos')}
                        loading={loadingCaixa}
                    />
                )}
            </div>

            {/* Botão Voltar */}
            <div className="caixa-footer">
                <button 
                    className="btn-voltar" 
                    onClick={onVoltarDashboard}
                >
                    <i className="fas fa-arrow-left"></i>
                    Voltar ao Dashboard
                </button>
            </div>
        </div>
    );
}

export default Caixa;
