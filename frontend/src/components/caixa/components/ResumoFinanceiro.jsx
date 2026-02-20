// ResumoFinanceiro.jsx - Cards de resumo financeiro
import React from 'react';
import caixaService from '../../../services/caixaService';

const ResumoFinanceiro = ({ caixaData }) => {
    return (
        <div className="caixa-resumo-cards">
            <div className="resumo-card inicial">
                <div className="resumo-icone">
                    <i className="fas fa-play-circle"></i>
                </div>
                <div className="resumo-conteudo">
                    <span className="resumo-label">Saldo Inicial</span>
                    <span className="resumo-valor">
                        {caixaService.formatarMoeda(caixaData.saldo_inicial)}
                    </span>
                </div>
            </div>

            <div className="resumo-card entradas">
                <div className="resumo-icone">
                    <i className="fas fa-arrow-up"></i>
                </div>
                <div className="resumo-conteudo">
                    <span className="resumo-label">Total Entradas</span>
                    <span className="resumo-valor">
                        +{caixaService.formatarMoeda(caixaData.total_entradas)}
                    </span>
                </div>
            </div>

            <div className="resumo-card saidas">
                <div className="resumo-icone">
                    <i className="fas fa-arrow-down"></i>
                </div>
                <div className="resumo-conteudo">
                    <span className="resumo-label">Total Saídas</span>
                    <span className="resumo-valor">
                        -{caixaService.formatarMoeda(caixaData.total_saidas)}
                    </span>
                </div>
            </div>

            <div className="resumo-card saldo-final">
                <div className="resumo-icone">
                    <i className="fas fa-wallet"></i>
                </div>
                <div className="resumo-conteudo">
                    <span className="resumo-label">Saldo Final</span>
                    <span className="resumo-valor">
                        {caixaService.formatarMoeda(caixaData.saldo_atual)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ResumoFinanceiro;
