// FiltrosPeriodo.jsx - Filtros de período para movimentos
import React from 'react';

const FiltrosPeriodo = ({ filtroData, setFiltroData, periodoCustom, setPeriodoCustom }) => {
    return (
        <div className="filtros-data">
            <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="filtro-select"
            >
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
                <option value="custom">Período Personalizado</option>
            </select>

            {filtroData === 'custom' && (
                <div className="periodo-custom">
                    <input
                        type="date"
                        value={periodoCustom.inicio}
                        onChange={(e) => setPeriodoCustom(prev => ({
                            ...prev,
                            inicio: e.target.value
                        }))}
                        className="data-input"
                    />
                    <span>até</span>
                    <input
                        type="date"
                        value={periodoCustom.fim}
                        onChange={(e) => setPeriodoCustom(prev => ({
                            ...prev,
                            fim: e.target.value
                        }))}
                        className="data-input"
                    />
                </div>
            )}
        </div>
    );
};

export default FiltrosPeriodo;
