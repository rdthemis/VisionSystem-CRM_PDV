import React, { useState, useEffect } from 'react';
import './AdicionaisGrid.css';

const AdicionaisGrid = ({ 
    adicionaisDisponiveis = [], 
    adicionaisSelecionados = [],
    onAdicionaisChange,
    observacoes = '',
    onObservacoesChange 
}) => {
    const [selecionados, setSelecionados] = useState(adicionaisSelecionados);

    useEffect(() => {
        setSelecionados(adicionaisSelecionados);
    }, [adicionaisSelecionados]);

    // Verifica se um adicional está selecionado
    const isAdicionalSelecionado = (adicionalId) => {
        return selecionados.some(item => item.id === adicionalId);
    };

    // Obtém a quantidade de um adicional selecionado
    const getQuantidadeAdicional = (adicionalId) => {
        const adicional = selecionados.find(item => item.id === adicionalId);
        return adicional ? adicional.quantidade : 0;
    };

    // Toggle de seleção do adicional
    const toggleAdicional = (adicional) => {
        let novosSelecionados;

        if (isAdicionalSelecionado(adicional.id)) {
            // Remove o adicional
            novosSelecionados = selecionados.filter(item => item.id !== adicional.id);
        } else {
            // Adiciona o adicional com quantidade 1
            novosSelecionados = [
                ...selecionados,
                {
                    id: adicional.id,
                    nome: adicional.nome,
                    preco: parseFloat(adicional.preco),
                    quantidade: 1
                }
            ];
        }

        setSelecionados(novosSelecionados);
        if (onAdicionaisChange) {
            onAdicionaisChange(novosSelecionados);
        }
    };

    // Incrementar quantidade
    const incrementarQuantidade = (adicionalId, e) => {
        e.stopPropagation(); // Evita que o click no botão acione o toggle
        
        const novosSelecionados = selecionados.map(item => {
            if (item.id === adicionalId) {
                return { ...item, quantidade: item.quantidade + 1 };
            }
            return item;
        });

        setSelecionados(novosSelecionados);
        if (onAdicionaisChange) {
            onAdicionaisChange(novosSelecionados);
        }
    };

    // Decrementar quantidade
    const decrementarQuantidade = (adicionalId, e) => {
        e.stopPropagation(); // Evita que o click no botão acione o toggle
        
        const novosSelecionados = selecionados.map(item => {
            if (item.id === adicionalId && item.quantidade > 1) {
                return { ...item, quantidade: item.quantidade - 1 };
            }
            return item;
        }).filter(item => item.quantidade > 0);

        setSelecionados(novosSelecionados);
        if (onAdicionaisChange) {
            onAdicionaisChange(novosSelecionados);
        }
    };

    // Formatar valor monetário
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    return (
        <div className="adicionais-container">
            {/* Seção de Adicionais */}
            <div className="adicionais-section">
                <h3 className="adicionais-titulo">
                    <i className="fas fa-plus-circle"></i>
                    Adicionais
                </h3>
                
                {adicionaisDisponiveis.length === 0 ? (
                    <div className="adicionais-vazio">
                        <i className="fas fa-info-circle"></i>
                        <p>Nenhum adicional disponível</p>
                    </div>
                ) : (
                    <div className="adicionais-grid">
                        {adicionaisDisponiveis.map((adicional) => {
                            const selecionado = isAdicionalSelecionado(adicional.id);
                            const quantidade = getQuantidadeAdicional(adicional.id);

                            return (
                                <div
                                    key={adicional.id}
                                    className={`adicional-card ${selecionado ? 'selecionado' : ''}`}
                                    onClick={() => toggleAdicional(adicional)}
                                >
                                    {/* Checkbox de seleção */}
                                    <div className="adicional-checkbox">
                                        <i className={`fas ${selecionado ? 'fa-check-circle' : 'fa-circle'}`}></i>
                                    </div>

                                    {/* Conteúdo do card */}
                                    <div className="adicional-conteudo">
                                        <div className="adicional-nome">{adicional.nome}</div>
                                        <div className="adicional-preco">
                                            {formatarMoeda(adicional.preco)}
                                        </div>
                                    </div>

                                    {/* Controles de quantidade (só aparece se selecionado) */}
                                    {selecionado && (
                                        <div className="adicional-quantidade">
                                            <button
                                                type="button"
                                                className="btn-quantidade menos"
                                                onClick={(e) => decrementarQuantidade(adicional.id, e)}
                                            >
                                                <i className="fas fa-minus"></i>
                                            </button>
                                            <span className="quantidade-valor">{quantidade}</span>
                                            <button
                                                type="button"
                                                className="btn-quantidade mais"
                                                onClick={(e) => incrementarQuantidade(adicional.id, e)}
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Seção de Observações 
            <div className="observacoes-section">
                <h3 className="observacoes-titulo">
                    <i className="fas fa-comment-dots"></i>
                    Observações do Item
                </h3>
                <textarea
                    className="observacoes-textarea"
                    placeholder="Adicione observações sobre o produto (ex: sem cebola, ponto da carne, etc.)"
                    value={observacoes}
                    onChange={(e) => onObservacoesChange && onObservacoesChange(e.target.value)}
                    rows={4}
                />
            </div>

            */}
            {/* Resumo dos Adicionais Selecionados */}
            {selecionados.length > 0 && (
                <div className="adicionais-resumo">
                    <h4 className="resumo-titulo">
                        <i className="fas fa-list-ul"></i>
                        Adicionais Selecionados ({selecionados.length})
                    </h4>
                    <div className="resumo-lista">
                        {selecionados.map((adicional) => (
                            <div key={adicional.id} className="resumo-item">
                                <div className="resumo-info">
                                    <span className="resumo-nome">
                                        {adicional.quantidade}x {adicional.nome}
                                    </span>
                                    <span className="resumo-preco">
                                        {formatarMoeda(adicional.preco * adicional.quantidade)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn-remover"
                                    onClick={() => toggleAdicional(adicional)}
                                    title="Remover adicional"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="resumo-total">
                        <strong>Total dos Adicionais:</strong>
                        <strong className="total-valor">
                            {formatarMoeda(
                                selecionados.reduce(
                                    (total, item) => total + (item.preco * item.quantidade),
                                    0
                                )
                            )}
                        </strong>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdicionaisGrid;
