// src/components/impressao/QuickAdjustButton.js
import React, { useState } from 'react';
import PrintAdjustmentPanel from './PrintAdjustmentPanel';
import printService from '../../services/printService';

export const QuickAdjustButton = () => {
    const [showPanel, setShowPanel] = useState(false);
    const isTermica = printService.obterTipoImpressao() === 'termica';

    if (!isTermica) return null;

    return (
        <>
            <button
                onClick={() => setShowPanel(true)}
                style={{
                    position: 'fixed',
                    bottom: '140px',
                    right: '20px',
                    background: '#ffc107',
                    color: '#333',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    boxShadow: '0 4px 8px rgba(255, 193, 7, 0.3)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Ajustar impressão térmica"
            >
                🔧
            </button>

            <PrintAdjustmentPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
            />
        </>
    );
};