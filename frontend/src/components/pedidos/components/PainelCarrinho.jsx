// src/components/Pedidos/components/PainelCarrinho.jsx
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
  onFinalizar,
  onVincular,
  onPagar,
  buscarPedidos,      // 🆕 Para o modal de transferência
  onTransferir,       // 🆕 Callback de transferência
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

      {/* 🚚 SEÇÃO DE ENTREGA - ADICIONAR AQUI */}
    <div className="carrinho-entrega-section">
      {dadosEntrega ? (
        // ENTREGA CONFIGURADA
        <div className="entrega-configurada">
          <div className="entrega-info">
            <div className="entrega-header">
              <i className="fas fa-truck"></i>
              <strong>Entrega Configurada</strong>
            </div>
            <div className="entrega-detalhes">
              <div className="entrega-linha">
                <span className="entrega-label">Zona:</span>
                <span className="entrega-valor">{dadosEntrega.zona_nome}</span>
              </div>
              <div className="entrega-linha">
                <span className="entrega-label">Taxa:</span>
                <span className="entrega-taxa">
                  R$ {dadosEntrega.taxa_entrega.toFixed(2)}
                </span>
              </div>
              <div className="entrega-linha endereco">
                <span className="entrega-label">Endereço:</span>
                <span className="entrega-endereco">
                  {dadosEntrega.endereco_entrega}
                </span>
              </div>
            </div>
          </div>
          <button
            className="btn-limpar-entrega"
            onClick={onLimparEntrega}
            title="Remover entrega"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ) : (
        // ENTREGA NÃO CONFIGURADA - BOTÃO
        <button
          className="btn-configurar-entrega"
          onClick={onAbrirEntrega}
          disabled={carrinho.length === 0}
        >
          <i className="fas fa-truck"></i>
          Configurar Entrega
        </button>
      )}
    </div>

    {/* TOTAIS - MODIFICAR PARA INCLUIR TAXA */}
    <div className="carrinho-totais">
      <div className="total-linha">
        <span>Subtotal:</span>
        <span>R$ {totais.totalItens.toFixed(2)}</span>
      </div>

      {/* 🚚 MOSTRAR TAXA DE ENTREGA SE HOUVER */}
      {dadosEntrega && (
        <div className="total-linha taxa-entrega">
          <span>Taxa de Entrega:</span>
          <span>R$ {dadosEntrega.taxa_entrega.toFixed(2)}</span>
        </div>
      )}

      <div className="total-linha total-final">
        <span>TOTAL A PAGAR:</span>
        <span>R$ {totalComEntrega.toFixed(2)}</span>
      </div>
    </div>

      {/* ── TOTAIS ── */}
      <div className="pedido-totais">
        <div className="total-linha">
          <span>Total dos itens</span>
          <span>{formatarPreco(totais.totalItens)}</span>
        </div>
        <div className="total-linha total-final">
          <span>Total a pagar</span>
          <span>{formatarPreco(totais.totalPagar)}</span>
        </div>
      </div>

      {/* ── BOTÕES DE AÇÃO ── */}
      <div className="pedido-botoes">
        <div className="botoes-secundarios">

          {/* 🆕 CONTA */}
          <button
            className="btn-acao"
            onClick={() => setModalContaVisivel(true)}
            disabled={carrinho.length === 0}
            title="Ver conta do cliente"
          >
            <i className="fas fa-receipt"></i>
            <span>Conta</span>
          </button>

          {/* 🆕 TRANSFERÊNCIA */}
          <button
            className="btn-acao"
            onClick={() => setModalTransferenciaVisivel(true)}
            disabled={carrinho.length === 0 || !pedidoAtual?.id}
            title="Transferir itens para outra comanda"
          >
            <i className="fas fa-exchange-alt"></i>
            <span>Transferência</span>
          </button>

          <button className="btn-acao" onClick={onVincular}>
            <i className="fas fa-link"></i>
            <span>Vincular</span>
          </button>

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

      {/* ========================================
          MODAIS
      ======================================== */}

      {/* Modal Conta */}
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

      {/* Modal Transferência */}
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
