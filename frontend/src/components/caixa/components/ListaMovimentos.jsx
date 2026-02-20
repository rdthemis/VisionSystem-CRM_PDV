// ListaMovimentos.jsx - Lista de movimentos do caixa
import React from 'react';
import caixaService from '../../../services/caixaService';

const ListaMovimentos = ({ movimentos, loading, caixaAberto }) => {
    if (loading) {
        return (
            <div className="loading-caixa">
                <i className="fas fa-spinner fa-spin"></i>
                Carregando movimentos...
            </div>
        );
    }

    if (!Array.isArray(movimentos) || movimentos.length === 0) {
        return (
            <div className="sem-movimentos">
                <i className="fas fa-inbox"></i>
                <p>Nenhum movimento encontrado</p>
                <small>
                    {!caixaAberto 
                        ? 'Abra o caixa para começar a registrar movimentos'
                        : 'Use as abas acima para registrar movimentos'
                    }
                </small>
            </div>
        );
    }

    return (
        <div className="movimentos-lista">
            {movimentos.map(movimento => (
                <div key={movimento.id} className={`movimento-item ${movimento.tipo}`}>
                    <div className="movimento-info">
                        <div className="movimento-principal">
                            <strong>{movimento.descricao}</strong>
                            <span className="movimento-categoria">
                                {movimento.categoria}
                            </span>
                        </div>
                        <div className="movimento-detalhes">
                            <span className="movimento-usuario">
                                <i className="fas fa-user"></i>
                                {movimento.usuario_nome || 'Sistema'}
                            </span>
                            <span className="movimento-data">
                                <i className="fas fa-calendar"></i>
                                {new Date(movimento.data_movimento).toLocaleDateString('pt-BR')}
                                {' às '}
                                {new Date(movimento.data_movimento).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="movimento-valor">
                        <span className={`valor-badge ${movimento.tipo}`}>
                            {movimento.tipo === 'entrada' ? '+' : '-'}
                            {caixaService.formatarMoeda(movimento.valor)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ListaMovimentos;
