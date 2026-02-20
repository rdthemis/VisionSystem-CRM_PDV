// ModalFechamento.jsx - Modal para fechamento do caixa
import React, { useState } from 'react';
import caixaService from '../../../services/caixaService';

const ModalFechamento = ({ caixaData, onFechar, onCancelar, loading }) => {
    const [observacoes, setObservacoes] = useState('');

    const handleFechar = () => {
        if (window.confirm('Tem certeza que deseja fechar o caixa? Esta ação não pode ser desfeita.')) {
            onFechar(observacoes);
        }
    };

    return (
        <div className="caixa-fechamento">
            <h3>
                <i className="fas fa-lock"></i>
                Fechar Caixa
            </h3>

            <div className="fechamento-resumo">
                <div className="fechamento-info">
                    <p>
                        <i className="fas fa-info-circle"></i>
                        Ao fechar o caixa, você finalizará o expediente atual.
                    </p>
                    <p>
                        Verifique se todos os movimentos foram registrados corretamente.
                    </p>
                </div>

                <div className="fechamento-totais">
                    <div className="fechamento-linha">
                        <span>Saldo inicial:</span>
                        <span>{caixaService.formatarMoeda(caixaData.saldo_inicial)}</span>
                    </div>
                    <div className="fechamento-linha">
                        <span>Total de entradas:</span>
                        <span className="valor-entrada">
                            +{caixaService.formatarMoeda(caixaData.total_entradas)}
                        </span>
                    </div>
                    <div className="fechamento-linha">
                        <span>Total de saídas:</span>
                        <span className="valor-saida">
                            -{caixaService.formatarMoeda(caixaData.total_saidas)}
                        </span>
                    </div>
                    <div className="fechamento-linha fechamento-total">
                        <span><strong>Saldo final:</strong></span>
                        <span>
                            <strong>{caixaService.formatarMoeda(caixaData.saldo_atual)}</strong>
                        </span>
                    </div>
                    <div className="fechamento-linha">
                        <span>Total de movimentos:</span>
                        <span>{caixaData.total_movimentos}</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Observações (opcional)</label>
                    <textarea
                        placeholder="Adicione observações sobre o fechamento..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="form-textarea"
                        rows="3"
                    />
                </div>
            </div>

            <div className="fechamento-actions">
                <button
                    className="btn-cancelar"
                    onClick={onCancelar}
                    disabled={loading}
                >
                    <i className="fas fa-times"></i>
                    Cancelar
                </button>
                <button
                    className="btn-fechar-caixa"
                    onClick={handleFechar}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Fechando...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-lock"></i>
                            Confirmar Fechamento
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ModalFechamento;
