/**
 * ComandaPreview - Componente de visualização e impressão da comanda
 * 
 * Mostra um preview estilizado da comanda e permite enviar para
 * a impressora térmica Bematech via USB.
 * 
 * Props:
 *   pedido    - Dados completos do pedido (objeto)
 *   onPrint   - Callback após impressão bem-sucedida
 *   onClose   - Callback para fechar o preview
 *   config    - Configurações da empresa (opcional)
 * 
 * @example
 * <ComandaPreview
 *   pedido={dadosPedido}
 *   onPrint={() => Logger.info('Impresso!', {info: "Impresso!"})}
 *   onClose={() => setShowPreview(false)}
 * />
 */

import React, { useState, useMemo } from 'react';
import { usePrintComanda } from '../hooks/usePrintComanda';
import './ComandaPreview.css';
import Logger from '../utils/Logger';

// ── Configurações padrão da empresa ───────────────────────────────
const CONFIG_PADRAO = {
    nome_empresa: 'SORVETES GELATTO MANNIA',
    endereco:     'Corumbataí do Sul - PR',
    telefone:     '',
    cnpj:         '',
};

// ── Labels dos tipos de pedido ────────────────────────────────────
const TIPO_LABELS = {
    delivery        :   {texto: 'DELIVERY' },
    drive_thru      :   {texto: 'DRIVE-THRU' },
    local           :   {texto: 'CONSUMO LOCAL' },
    entrega_gratis  :   {texto: 'DELIVERY' },
    centro          :   {texto: 'DELIVERY' },
    bairro_proximo  :   {texto: 'DELIVERY' },
    bairro_distante :   {texto: 'DELIVERY' },
    zona_rural      :   {texto: 'DELIVERY' },
    mesa            :   {texto: 'MESA' },
};

// ── Funções utilitárias ───────────────────────────────────────────
const formatarValor = (valor) => {
    return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
};

const calcularSubtotalItem = (item) => {
    const base = (item.quantidade || 1) * (item.preco || 0);
    return base;
};

const calcularSubtotalItemAdc = (add, item) => {
    const base = (item.quantidade || 1) * (add.preco || 0);
    return base;
};

// ── Componente Principal ──────────────────────────────────────────
export default function ComandaPreview({ pedido, onPrint, onClose, config }) {
    const empresa = { ...CONFIG_PADRAO, ...config };
    const { imprimir, imprimindo, erro, sucesso, limpar } = usePrintComanda();
    const [copias, setCopias] = useState(1);

    // Cálculos dos totais
    const totais = useMemo(() => {
        const subtotal = (pedido?.itens || []).reduce(
            (sum, item) => sum + calcularSubtotalItem(item), 0);
        const adicionais = (pedido?.itens || []).reduce(
            (sum, item) => sum + (item.adicionais || []).reduce(
                (addSum, add) => addSum + calcularSubtotalItemAdc(add, item), 0), 0);
        const subtotalTotal = subtotal + adicionais;
        const entrega  = Number(pedido?.taxa_entrega || 0);
        const entrega2  = pedido?.taxa_entrega || 0;
        const desconto = Number(pedido?.desconto || 0);
        const total    = subtotalTotal + entrega - desconto;

        return { subtotal, subtotalTotal, entrega, desconto, total, entrega2 };
    }, [pedido]);

    // Handler de impressão
    const handleImprimir = async () => {
        limpar();
        const resultado = await imprimir({
            ...pedido,
            copias,
            tipo_impressao: 'conta'  // ← marca como conta do cliente
        });
        if (resultado.success && onPrint) {
            onPrint(pedido);
        }
    };

    if (!pedido) return null;


    const tipo = TIPO_LABELS[pedido.tipo_entrega] || TIPO_LABELS['local'];

    return (
        <div className="comanda-overlay">
            <div className="comanda-modal">

                {/* ── Header do modal ──────────────────────────── */}
                <div className="comanda-modal-header">
                    <h2>📋 Preview da Comanda</h2>
                    <button className="comanda-btn-fechar" onClick={onClose} title="Fechar">
                        ✕
                    </button>
                </div>

                {/* ── Preview da comanda (estilo bobina) ────────── */}
                <div className="comanda-bobina-container">
                    <div className="comanda-bobina">

                        {/* Cabeçalho */}
                        <div className="comanda-cabecalho">
                            <h3 className="comanda-empresa">{empresa.nome_empresa}</h3>
                            {empresa.endereco && <p>{empresa.endereco}</p>}
                            {empresa.telefone && <p>Fone: {empresa.telefone}</p>}
                        </div>

                        <div className="comanda-sep-dupla" />

                        {/* Número da comanda */}
                        <div className="comanda-numero">
                            COMANDA # {pedido.numero || '---'}
                        </div>
                        <div className="comanda-data">
                            {new Date().toLocaleString('pt-BR')}
                        </div>

                        {/* Tipo do pedido */}
                        <div className="comanda-tipo">
                            <span className="comanda-tipo-badge">
                                {tipo.icon} {tipo.texto}
                                {pedido.tipo === 'mesa' && pedido.mesa ? ` ${pedido.mesa}` : ''}
                            </span>
                        </div>

                        <div className="comanda-sep" />

                        {/* Cliente */}
                        <div className="comanda-cliente">
                            {pedido.cliente && (
                                <p><strong>Cliente:</strong> {pedido.cliente}</p>
                            )}
                            {pedido.telefone && (
                                <p><strong>Fone:</strong> {pedido.telefone}</p>
                            )}
                            {pedido.endereco_entrega && (
                                <p><strong>Endereço: </strong> {pedido.endereco_entrega}</p>   
                            )}
                        </div>

                        <div className="comanda-sep" />

                        {/* Cabeçalho dos itens */}
                        <div className="comanda-itens-header">
                            <span className="col-qtd">QTD</span>
                            <span className="col-desc">DESCRIÇÃO</span>
                            <span className="col-valor">VALOR</span>
                        </div>
                        <div className="comanda-sep" />

                        {/* Itens */}
                        <div className="comanda-itens">
                            {(pedido.itens || []).map((item, idx) => (
                                <div key={idx} className="comanda-item">
                                    {/* Linha principal */}
                                    <div className="comanda-item-linha">
                                        <span className="col-qtd">{item.quantidade}x</span>
                                        <span className="col-desc">{item.nome}</span>
                                        <span className="col-valor">
                                            {formatarValor(calcularSubtotalItem(item))}
                                        </span>
                                    </div>

                                    {/* Valor unitário quando qtd > 1 */}
                                    {item.quantidade > 1 && (
                                        <div className="comanda-item-detalhe">
                                            (un: {formatarValor(item.preco)})
                                        </div>
                                    )}

                                    {/* Adicionais */}
                                    {(item.adicionais || []).map((add, addIdx) => (
                                        <div>
                                            <div key={addIdx} className="comanda-item-adicional">
                                                <span>+ {add.nome}</span>
                                                {add.preco > 0 && (
                                                    <span>{formatarValor(calcularSubtotalItemAdc(add, item))}</span>
                                                )}
                                            </div>
                                            <div>
                                                {/* Valor unitário quando qtd adicionais > 1 */}
                                                {item.quantidade > 1 && (
                                                    <span className="comanda-item-detalhe">
                                                        (un: {formatarValor(add.preco)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                        
                                    {/* Observação do item */}
                                    {item.observacao && (
                                        <div className="comanda-item-obs">
                                            OBS: {item.observacoes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="comanda-sep" />

                        {/* Totais */}
                        <div className="comanda-totais">
                            <div className="comanda-total-linha">
                                <span>SUBTOTAL:</span>
                                <span>{formatarValor(totais.subtotalTotal)}</span>
                            </div>

                            {totais.entrega > 0 && (
                                <div className="comanda-total-linha">
                                    <span>ENTREGA:</span>
                                    <span>{formatarValor(totais.entrega)}</span>
                                </div>
                            )}

                            {totais.desconto > 0 && (
                                <div className="comanda-total-linha comanda-desconto">
                                    <span>DESCONTO:</span>
                                    <span>-{formatarValor(totais.desconto)}</span>
                                </div>
                            )}

                            <div className="comanda-sep-dupla" />

                            <div className="comanda-total-linha comanda-total-final">
                                <span>TOTAL:</span>
                                <span>{formatarValor(totais.total)}</span>
                            </div>

                            <div className="comanda-sep-dupla" />
                        </div>

                        {/* Pagamento */}
                        {pedido.pagamento && (
                            <div className="comanda-pagamento">
                                <div className="comanda-total-linha">
                                    <strong>PAGAMENTO:</strong>
                                    <strong>{pedido.pagamento.toUpperCase()}</strong>
                                </div>

                                {pedido.pagamento.toLowerCase() === 'dinheiro' && pedido.troco_para > 0 && (
                                    <>
                                        <div className="comanda-total-linha">
                                            <span>Valor recebido:</span>
                                            <span>{formatarValor(pedido.troco_para)}</span>
                                        </div>
                                        <div className="comanda-total-linha comanda-troco">
                                            <strong>TROCO:</strong>
                                            <strong>{formatarValor(pedido.troco_para - totais.total)}</strong>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Observação geral */}
                        {pedido.observacao && (
                            <>
                                <div className="comanda-sep" />
                                <div className="comanda-obs-geral">
                                    <strong>OBSERVAÇÕES:</strong>
                                    <p>{pedido.observacoes}</p>
                                </div>
                            </>
                        )}

                        {/* Rodapé */}
                        <div className="comanda-rodape">
                            <p>Obrigado pela preferência!</p>
                            <p>{empresa.nome_empresa}</p>
                        </div>
                    </div>
                </div>

                {/* ── Controles de impressão ────────────────────── */}
                <div className="comanda-controles">

                    {/* Feedback de status */}
                    {erro && (
                        <div className="comanda-status comanda-status-erro">
                            ❌ {erro}
                        </div>
                    )}
                    {sucesso && (
                        <div className="comanda-status comanda-status-sucesso">
                            ✅ Comanda impressa com sucesso!
                        </div>
                    )}

                    <div className="comanda-acoes">
                        {/* Seletor de cópias */}
                        <div className="comanda-copias">
                            <label htmlFor="copias">Cópias:</label>
                            <select
                                id="copias"
                                value={copias}
                                onChange={(e) => setCopias(Number(e.target.value))}
                                disabled={imprimindo}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                            </select>
                        </div>

                        {/* Botões */}
                        <button
                            className="comanda-btn comanda-btn-cancelar"
                            onClick={onClose}
                            disabled={imprimindo}
                        >
                            Cancelar
                        </button>

                        <button
                            className="comanda-btn comanda-btn-imprimir"
                            onClick={handleImprimir}
                            disabled={imprimindo}
                        >
                            {imprimindo ? (
                                <>
                                    <span className="comanda-spinner" />
                                    Imprimindo...
                                </>
                            ) : (
                                <>🖨️ Imprimir Comanda</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
