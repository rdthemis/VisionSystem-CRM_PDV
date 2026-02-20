// CaixaHeader.jsx - Header do módulo Caixa
import React from 'react';
import caixaService from '../../../services/caixaService';

const CaixaHeader = ({ caixaData }) => {
    return (
        <div className="caixa-header">
            <div className="caixa-title">
                <h2>
                    <i className="fas fa-cash-register"></i>
                    Controle de Caixa
                </h2>
                <div className="caixa-data">
                    {new Date().toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            <div className="caixa-status-header">
                <div className={`caixa-status-badge ${caixaData.status}`}>
                    {caixaData.caixa_aberto ? (
                        <>
                            <i className="fas fa-unlock"></i>
                            Caixa Aberto
                        </>
                    ) : (
                        <>
                            <i className="fas fa-lock"></i>
                            Caixa Fechado
                        </>
                    )}
                </div>
                <div className="caixa-saldo-header">
                    <span>Saldo Atual</span>
                    <strong>
                        {caixaService.formatarMoeda(caixaData.saldo_atual)}
                    </strong>
                </div>
            </div>
        </div>
    );
};

export default CaixaHeader;
