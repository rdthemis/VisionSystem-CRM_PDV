// src/components/pedidos/components/PainelCarrinho.jsx
// 🛒 COMPONENTE: Painel lateral com carrinho e totais

import React, { useState } from 'react';
import ItemCarrinho from '../ItemCarrinho';
import ModalConta from './ModalConta';
import ModalTransferencia from './ModalTransferencia';

const PainelCarrinho = ({
  pedidoAtual,
  clientePedido,
  carrinho,
  totais,
  dadosEntrega,
  onAbrirEntrega,
  onLimparEntrega,
  loadingPedido,
  onClienteChange,
  onBuscarCliente,
  onVoltar,
  onCancelar,
  onEditarItem,
  onRemoverItem,
  onAlterarQuantidade,
  onIncrementarQuantidade,
  onDecrementarQuantidade,
  onImprimir,
  onContaConsumo,
  onFinalizar,
  onVincular,
  onPagar,
  buscarPedidos,
  onTransferir,
}) => {

  // ----------------------------------------
  // 📦 ESTADOS DOS MODAIS
  // ----------------------------------------
  const [modalContaVisivel, setModalContaVisivel] = useState(false);
  const [modalTransferenciaVisivel, setModalTransferenciaVisivel] = useState(false);

  // ----------------------------------------
  // 🔧 FUNÇÕES AUXILIARES
  // ----------------------------------------
  const formatarPreco = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  const totalComEntrega = totais.totalPagar + (dadosEntrega?.taxa_entrega || 0);

  // ----------------------------------------
  // 🎨 RENDERIZAÇÃO
  // ----------------------------------------
  return (
    <div className="pedido-panel">

      {/* ── CABEÇALHO ── */}
      <div className="pedido-header">
        <div className="pedido-info">
          <h3>Pedido: {pedidoAtual?.id || 'Novo Pedido'}</h3>
        </div>
        <div className="pedido-actions">
          <button className="btn-icon" title="Buscar Cliente" onClick={onBuscarCliente} disabled={loadingPedido}>
            <i className="fas fa-user"></i>
          </button>
          <button className="btn-icon" title="Voltar" onClick={onVoltar} disabled={loadingPedido}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <button className="btn-icon" title="Cancelar comanda" onClick={onCancelar} disabled={loadingPedido}>
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      {/* ── CLIENTE ── */}
      <div className="pedido-info-cliente">
        <div className="cliente-input-container">
          <input
            type="text"
            value={clientePedido}
            onChange={(e) => onClienteChange(e.target.value)}
            className="cliente-input"
            placeholder="Nome do cliente"
            disabled={loadingPedido}
          />
        </div>
      </div>

      {/* ── ITENS DO CARRINHO ── */}
      <div className="pedido-itens-scroll">
        <div className="pedido-itens">
          {carrinho.length === 0 ? (
            <div className="sem-itens">
              <i className="fas fa-shopping-cart"></i>
              <p>Nenhum item adicionado</p>
              <small>Clique nos produtos para adicionar</small>
            </div>
          ) : (
            carrinho.map((item, index) => (
              <ItemCarrinho
                key={item._id}
                item={item}
                index={index}
                onEditar={onEditarItem}
                onRemover={onRemoverItem}
                onAlterarQuantidade={onAlterarQuantidade}
                onIncrementar={onIncrementarQuantidade}
                onDecrementar={onDecrementarQuantidade}
              />
            ))
          )}
        </div>
      </div>

      {/* ── TOTAIS ── */}
      <div className="pedido-totais">
        <div className="total-linha">
          <span>Subtotal</span>
          <span>{formatarPreco(totais.totalItens)}</span>
        </div>

        {dadosEntrega && (
          <div className="total-linha taxa-entrega">
            <span>Taxa de Entrega</span>
            <span>{formatarPreco(dadosEntrega.taxa_entrega)}</span>
          
            <button
              className="btn-limpar-entrega"
              onClick={onLimparEntrega}
              title="Remover entrega"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        <div className="total-linha total-final">
          <span>Total a pagar</span>
          <span>{formatarPreco(totalComEntrega)}</span>
        </div>
      </div>

      {/* ── BOTÕES DE AÇÃO ── */}
      <div className="pedido-botoes">
        <div className="botoes-secundarios">

          {/* CONTA */}
          <button
            className="btn-acao"
            onClick={onContaConsumo}
            disabled={carrinho.length === 0}
            title="Ver conta do cliente"
          >
            <i className="fas fa-receipt"></i>
            <span>Conta</span>
          </button>

          {/* TRANSFERÊNCIA */}
          <button
            className="btn-acao"
            onClick={() => setModalTransferenciaVisivel(true)}
            disabled={carrinho.length === 0 || !pedidoAtual?.id}
            title="Transferir itens para outra comanda"
          >
            <i className="fas fa-exchange-alt"></i>
            <span>Transferência</span>
          </button>

          {/* ENTREGA */}
          <button className="btn-acao" onClick={onAbrirEntrega}>
            <i className="fa fa-motorcycle" aria-hidden="true"></i>
            <span>Entrega</span>
          </button>

          {/* IMPRIMIR */}
          <button className="btn-acao" onClick={onImprimir}>
            <i className="fas fa-print"></i>
            <span>Imprimir</span>
          </button>
        </div>

        {/* Botão PAGAR */}
        <button
          className="btn-pagar"
          onClick={onPagar}
          disabled={carrinho.length === 0 || loadingPedido}
        >
          <i className="fas fa-credit-card"></i> PAGAR
        </button>
      </div>

      {/* ── MODAIS ── */}
      <ModalConta
        visible={modalContaVisivel}
        pedido={pedidoAtual}
        carrinho={carrinho}
        totais={totais}
        clientePedido={clientePedido}
        onFechar={() => setModalContaVisivel(false)}
        dadosEntrega={dadosEntrega}
        onAbrirEntrega={onAbrirEntrega}
        onLimparEntrega={onLimparEntrega}
      />

      <ModalTransferencia
        visible={modalTransferenciaVisivel}
        pedidoAtual={pedidoAtual}
        carrinho={carrinho}
        onFechar={() => setModalTransferenciaVisivel(false)}
        onTransferir={onTransferir}
        buscarPedidos={buscarPedidos}
      />
    </div>
  );
};

export default PainelCarrinho;