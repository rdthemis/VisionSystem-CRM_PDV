import React, { useState } from 'react';

// Componente Modal de Abertura de Caixa
function ModalAberturaCaixa({ isOpen, onClose, onAbrirCaixa, loading }) {
    const [saldoInicial, setSaldoInicial] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const saldo = parseFloat(saldoInicial) || 0;
        onAbrirCaixa(saldo, observacoes);
    };

    const handleReset = () => {
        setSaldoInicial('');
        setObservacoes('');
    };

    if (!isOpen) return null;

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
                padding: '30px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
                {/* Header do Modal */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>💰</div>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
                        Abertura de Caixa
                    </h2>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        É necessário abrir o caixa antes de acessar o PDV
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            💵 Saldo Inicial (opcional)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={saldoInicial}
                            onChange={(e) => setSaldoInicial(e.target.value)}
                            placeholder="Ex: 100.00"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <small style={{ color: '#666', fontSize: '12px' }}>
                            Deixe em branco ou 0 se não houver dinheiro inicial
                        </small>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            📝 Observações (opcional)
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Ex: Abertura do turno da manhã..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Botões */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                handleReset();
                                onClose();
                            }}
                            disabled={loading}
                            style={{
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            ❌ Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                opacity: loading ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? '⏳' : '✅'}
                            {loading ? 'Abrindo...' : 'Abrir Caixa'}
                        </button>
                    </div>
                </form>

                {/* Informação adicional */}
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '8px',
                    border: '1px solid #b3d9ff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>💡</span>
                        <div>
                            <strong style={{ color: '#0066cc', fontSize: '13px' }}>Dica:</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#0066cc' }}>
                                O saldo inicial é o dinheiro que você tem no caixa para dar troco.
                                Pode ser R$ 0,00 se você não tiver dinheiro inicial.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalAberturaCaixa;