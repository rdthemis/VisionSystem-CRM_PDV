// FormularioAbertura.jsx - Formulário de abertura do caixa
import React, { useState } from 'react';

const FormularioAbertura = ({ onAbrir, loading }) => {
    const [valorInicial, setValorInicial] = useState('');

    const handleAbrir = () => {
        const valor = parseFloat(valorInicial) || 0;
        if (valor < 0) {
            alert('O valor inicial não pode ser negativo');
            return;
        }
        onAbrir(valor);
        setValorInicial('');
    };

    return (
        <div className="caixa-fechado">
            <div className="caixa-fechado-content">
                <i className="fas fa-lock"></i>
                <h3>Caixa Fechado</h3>
                <p>Abra o caixa para começar a registrar movimentos</p>

                <div className="form-group">
                    <label>Valor inicial para abertura (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="form-input"
                        value={valorInicial}
                        onChange={(e) => setValorInicial(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAbrir();
                            }
                        }}
                    />
                </div>

                <button 
                    className="btn-abrir-caixa"
                    onClick={handleAbrir}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Abrindo...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-unlock"></i>
                            Abrir Caixa
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default FormularioAbertura;
