// src/components/Pedidos/components/ModalTransferencia.jsx
// 🔄 MODAL: Transferência de itens entre comandas

import React, { useState, useEffect } from 'react';

/**
 * Modal para transferir itens de uma comanda para outra.
 * Suporta transferência parcial de quantidade e seleção
 * de comanda existente ou criação de nova comanda.
 *
 * @param {Object}   props
 * @param {boolean}  props.visible        - Controla exibição do modal
 * @param {Object}   props.pedidoAtual    - Dados do pedido origem
 * @param {Array}    props.carrinho       - Itens disponíveis para transferir
 * @param {Function} props.onFechar       - Fechar o modal
 * @param {Function} props.onTransferir   - Callback com dados da transferência
 * @param {Function} props.buscarPedidos  - Função para buscar comandas existentes
 */
const ModalTransferencia = ({
  visible,
  pedidoAtual,
  carrinho,
  onFechar,
  onTransferir,
  buscarPedidos,
}) => {
  // ----------------------------------------
  // 📦 ESTADOS
  // ----------------------------------------

  // Itens selecionados: { [_id]: { selecionado: bool, quantidade: number } }
  const [itensSelecionados, setItensSelecionados] = useState({});

  // Destino da transferência
  const [tipoDestino, setTipoDestino] = useState('existente'); // 'existente' | 'nova'
  const [comandaDestino, setComandaDestino] = useState('');
  const [nomeNovaComanda, setNomeNovaComanda] = useState('');

  // Comandas disponíveis
  const [comandasDisponiveis, setComandasDisponiveis] = useState([]);
  const [loadingComandas, setLoadingComandas] = useState(false);
  const [loadingTransferir, setLoadingTransferir] = useState(false);
  const [erro, setErro] = useState('');

  // ----------------------------------------
  // 🔄 EFEITOS
  // ----------------------------------------

  // Ao abrir o modal, carregar comandas e resetar estados
  useEffect(() => {
    if (visible) {
      setItensSelecionados({});
      setTipoDestino('existente');
      setComandaDestino('');
      setNomeNovaComanda('');
      setErro('');
      carregarComandas();
    }
  }, [visible]);

  // ----------------------------------------
  // 🔧 FUNÇÕES
  // ----------------------------------------

  const formatarPreco = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  const carregarComandas = async () => {
    try {
      setLoadingComandas(true);
      const resultado = await buscarPedidos();
      // Filtra a comanda atual para não aparecer como destino
      const outras = (resultado || []).filter(
        (p) => p.id !== pedidoAtual?.id && p.status !== 'fechado'
      );
      setComandasDisponiveis(outras);
    } catch (err) {
      console.error('Erro ao carregar comandas:', err);
    } finally {
      setLoadingComandas(false);
    }
  };

  // Alterna seleção de um item
  const toggleItem = (item) => {
    setItensSelecionados((prev) => {
      const jaTemItem = prev[item._id];
      if (jaTemItem) {
        const novo = { ...prev };
        delete novo[item._id];
        return novo;
      }
      return {
        ...prev,
        [item._id]: {
          selecionado: true,
          quantidade: item.quantidade, // Começa com quantidade total
          quantidadeMax: item.quantidade,
        },
      };
    });
  };

  // Altera a quantidade a transferir de um item
  const alterarQuantidade = (itemId, novaQtd, max) => {
    const qtd = Math.max(1, Math.min(max, parseInt(novaQtd) || 1));
    setItensSelecionados((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantidade: qtd },
    }));
  };

  // Contagem de itens selecionados
  const totalSelecionados = Object.keys(itensSelecionados).length;

  // Validação antes de transferir
  const podeTransferir = () => {
    if (totalSelecionados === 0) return false;
    if (tipoDestino === 'existente' && !comandaDestino) return false;
    if (tipoDestino === 'nova' && !nomeNovaComanda.trim()) return false;
    return true;
  };

  // Monta e envia os dados da transferência
  const handleTransferir = async () => {
    if (!podeTransferir()) return;

    setErro('');
    setLoadingTransferir(true);

    try {
      const itensParaTransferir = Object.entries(itensSelecionados).map(
        ([_id, dados]) => {
          const itemOriginal = carrinho.find((i) => i._id === _id);
          return {
            ...itemOriginal,
            quantidadeTransferir: dados.quantidade,
          };
        }
      );

      await onTransferir({
        pedidoOrigemId: pedidoAtual?.id,
        tipoDestino,
        comandaDestinoId: tipoDestino === 'existente' ? comandaDestino : null,
        nomeNovaComanda: tipoDestino === 'nova' ? nomeNovaComanda.trim() : null,
        itens: itensParaTransferir,
      });

      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao realizar transferência');
    } finally {
      setLoadingTransferir(false);
    }
  };

  if (!visible) return null;

  // ----------------------------------------
  // 🎨 RENDERIZAÇÃO
  // ----------------------------------------

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div
        className="modal-container modal-transferencia"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="modal-header">
          <h2>
            <i className="fas fa-exchange-alt"></i>
            Transferir Itens
          </h2>
          <button className="modal-fechar" onClick={onFechar} title="Fechar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">

          {/* ── PASSO 1: SELECIONAR ITENS ── */}
          <div className="transferencia-secao">
            <h3 className="transferencia-secao-titulo">
              <span className="passo-numero">1</span>
              Selecione os itens para transferir
            </h3>

            {carrinho.length === 0 ? (
              <p className="transferencia-vazio">Nenhum item no carrinho</p>
            ) : (
              <div className="transferencia-itens">
                {carrinho.map((item) => {
                  const selecionado = !!itensSelecionados[item._id];
                  const dadosItem = itensSelecionados[item._id];

                  return (
                    <div
                      key={item._id}
                      className={`transferencia-item ${selecionado ? 'selecionado' : ''}`}
                      onClick={() => toggleItem(item)}
                    >
                      {/* Checkbox visual */}
                      <div className="item-check">
                        <i className={`fas ${selecionado ? 'fa-check-square' : 'fa-square'}`}></i>
                      </div>

                      {/* Info do item */}
                      <div className="item-info">
                        <span className="item-nome">{item.nome}</span>
                        <span className="item-preco">
                          {formatarPreco((item.preco_produto || item.preco) * item.quantidade)}
                        </span>
                      </div>

                      {/* Quantidade a transferir (só aparece quando selecionado e tem mais de 1) */}
                      {selecionado && item.quantidade > 1 && (
                        <div
                          className="item-quantidade-transferir"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="qtd-label">Qtd:</span>
                          <button
                            className="qtd-btn"
                            onClick={() =>
                              alterarQuantidade(
                                item._id,
                                dadosItem.quantidade - 1,
                                item.quantidade
                              )
                            }
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="qtd-valor">
                            {dadosItem.quantidade}/{item.quantidade}
                          </span>
                          <button
                            className="qtd-btn"
                            onClick={() =>
                              alterarQuantidade(
                                item._id,
                                dadosItem.quantidade + 1,
                                item.quantidade
                              )
                            }
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

            {totalSelecionados > 0 && (
              <p className="transferencia-resumo">
                <i className="fas fa-info-circle"></i>
                {totalSelecionados} {totalSelecionados === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
            )}
          </div>

          {/* ── PASSO 2: SELECIONAR DESTINO ── */}
          <div className="transferencia-secao">
            <h3 className="transferencia-secao-titulo">
              <span className="passo-numero">2</span>
              Selecione o destino
            </h3>

            {/* Tipo de destino */}
            <div className="destino-opcoes">
              <label
                className={`destino-opcao ${tipoDestino === 'existente' ? 'ativo' : ''}`}
                onClick={() => setTipoDestino('existente')}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>Comanda existente</span>
              </label>
              <label
                className={`destino-opcao ${tipoDestino === 'nova' ? 'ativo' : ''}`}
                onClick={() => setTipoDestino('nova')}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Nova comanda</span>
              </label>
            </div>

            {/* Comanda existente */}
            {tipoDestino === 'existente' && (
              <div className="destino-campo">
                {loadingComandas ? (
                  <p className="transferencia-loading">
                    <i className="fas fa-spinner fa-spin"></i> Carregando comandas...
                  </p>
                ) : comandasDisponiveis.length === 0 ? (
                  <p className="transferencia-vazio">
                    <i className="fas fa-exclamation-circle"></i>
                    Nenhuma outra comanda aberta encontrada.
                    <br />
                    <small>Utilize a opção "Nova comanda".</small>
                  </p>
                ) : (
                  <select
                    className="destino-select"
                    value={comandaDestino}
                    onChange={(e) => setComandaDestino(e.target.value)}
                  >
                    <option value="">-- Selecione uma comanda --</option>
                    {comandasDisponiveis.map((comanda) => (
                      <option key={comanda.id} value={comanda.id}>
                        #{comanda.id} - {comanda.cliente_nome || 'Sem cliente'}{' '}
                        ({comanda.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Nova comanda */}
            {tipoDestino === 'nova' && (
              <div className="destino-campo">
                <input
                  type="text"
                  className="destino-input"
                  placeholder="Nome do cliente para nova comanda"
                  value={nomeNovaComanda}
                  onChange={(e) => setNomeNovaComanda(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* ERRO */}
          {erro && (
            <div className="transferencia-erro">
              <i className="fas fa-exclamation-triangle"></i>
              {erro}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button
            className="btn-modal-secundario"
            onClick={onFechar}
            disabled={loadingTransferir}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          <button
            className="btn-modal-primario"
            onClick={handleTransferir}
            disabled={!podeTransferir() || loadingTransferir}
          >
            {loadingTransferir ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Transferindo...
              </>
            ) : (
              <>
                <i className="fas fa-exchange-alt"></i>
                Transferir
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalTransferencia;
