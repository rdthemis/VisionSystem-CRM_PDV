// FormularioMovimento.jsx - Formulário para adicionar entradas/saídas
import React, { useState } from 'react';
import caixaService from '../../../services/caixaService';

const FormularioMovimento = ({ tipo, onSalvar, onCancelar, loading }) => {
    const [movimento, setMovimento] = useState({
        tipo: tipo,
        valor: '',
        descricao: '',
        categoria: ''
    });

    const handleSubmit = () => {
        if (!movimento.valor || !movimento.descricao || !movimento.categoria) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }
        onSalvar(movimento);
    };

    const handleCancel = () => {
        setMovimento({
            tipo: tipo,
            valor: '',
            descricao: '',
            categoria: ''
        });
        onCancelar();
    };

    return (
        <div className="caixa-form">
            <h3>
                <i className={`fas ${tipo === 'entrada' ? 'fa-plus-circle' : 'fa-minus-circle'}`}></i>
                {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
            </h3>

            <div className="form-row">
                <div className="form-group">
                    <label>Valor (R$) *</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={movimento.valor}
                        onChange={(e) => setMovimento(prev => ({ 
                            ...prev, 
                            valor: e.target.value 
                        }))}
                        className="form-input valor-input"
                    />
                </div>

                <div className="form-group">
                    <label>Categoria *</label>
                    <select
                        value={movimento.categoria}
                        onChange={(e) => setMovimento(prev => ({ 
                            ...prev, 
                            categoria: e.target.value 
                        }))}
                        className="form-select"
                    >
                        <option value="">Selecione uma categoria</option>
                        {caixaService.categorias[tipo].map(cat => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Descrição *</label>
                <textarea
                    placeholder="Descreva o motivo deste movimento..."
                    value={movimento.descricao}
                    onChange={(e) => setMovimento(prev => ({ 
                        ...prev, 
                        descricao: e.target.value 
                    }))}
                    className="form-textarea"
                    rows="4"
                />
            </div>

            <div className="form-actions">
                <button 
                    className="btn-cancelar" 
                    onClick={handleCancel}
                    disabled={loading}
                >
                    <i className="fas fa-times"></i>
                    Cancelar
                </button>
                <button 
                    className={`btn-salvar ${tipo}`}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Processando...
                        </>
                    ) : (
                        <>
                            <i className={`fas ${tipo === 'entrada' ? 'fa-plus' : 'fa-minus'}`}></i>
                            Salvar {tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default FormularioMovimento;
