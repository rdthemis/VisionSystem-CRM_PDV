// src/components/Pedidos/components/FormularioPedido.jsx
// 📝 COMPONENTE: Tela completa de criar/editar pedido

import React, { useState } from 'react';
import GridProdutos from './GridProdutos';
import PainelCarrinho from './PainelCarrinho';

/**
 * Tela completa para criar ou editar um pedido
 * Divide a tela em duas partes: produtos (esquerda) e carrinho (direita)
 * 
 * @param {Object} props - Todas as propriedades necessárias
 */
const FormularioPedido = ({
  // Dados
  produtos,
  categorias,
  pedidoAtual,
  clientePedido,
  carrinho,
  totais,
  
  // Estados de busca/filtro
  categoriaAtiva,
  busca,
  codigoBusca,
  
  // Estados de loading
  loadingPedido,
  
  // Handlers de busca
  onCategoriaChange,
  onBuscaChange,
  onCodigoChange,
  onBuscarPorCodigo,
  
  // Handlers do cliente
  onClienteChange,
  onBuscarCliente,
  
  // Handlers do carrinho
  onProdutoClick,
  onEditarItem,
  onEditandoItem,
  onAlterarQuantidade,
  onIncrementarQuantidade,    // 🆕 ADICIONAR
  onDecrementarQuantidade,    // 🆕 ADICIONAR
  buscarPedidos,      // ✅ ADICIONAR
  onTransferir,       // ✅ ADICIONAR
  dadosEntrega,
  onAbrirEntrega,
  onLimparEntrega,
  
  // Handlers de ações
  onVoltar,
  onCancelar,
  onImprimir,
  onContaConsumo,   // 🆕 Handler para conta de consumo
  onFinalizar,
  onPagar
}) => {

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  const [painelMobile, setPainelMobile] = useState('produtos');
  const formatar = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <div className={`pdv-venda painel-${painelMobile}`}>
      <div className="pdv-venda-toolbar">
        <button className="pdv-back" onClick={onVoltar} disabled={loadingPedido}><i className="fas fa-arrow-left" aria-hidden="true" /> Comandas</button>
        <div><h2>{pedidoAtual?.id ? `Comanda #${pedidoAtual.id}` : 'Nova comanda'}</h2><span>{clientePedido || 'Atendimento no balcão'}</span></div>
        <span className="pdv-sale-status">{loadingPedido ? 'Atualizando…' : 'Em atendimento'}</span>
      </div>
      <div className="pdv-mobile-tabs" aria-label="Painéis da venda">
        <button aria-pressed={painelMobile === 'produtos'} onClick={() => setPainelMobile('produtos')}>Produtos</button>
        <button aria-pressed={painelMobile === 'comanda'} onClick={() => setPainelMobile('comanda')}>Comanda ({carrinho.length})</button>
      </div>
      <div className="novo-pedido-layout">
      
      {/* ========================================
          SEÇÃO DE PRODUTOS (ESQUERDA)
      ======================================== */}
      <GridProdutos
        produtos={produtos}
        categorias={categorias}
        categoriaAtiva={categoriaAtiva}
        busca={busca}
        codigoBusca={codigoBusca}
        onCategoriaChange={onCategoriaChange}
        onBuscaChange={onBuscaChange}
        onCodigoChange={onCodigoChange}
        onBuscarPorCodigo={onBuscarPorCodigo}
        onProdutoClick={onProdutoClick}
      />

      {/* ========================================
          PAINEL DO CARRINHO (DIREITA)
      ======================================== */}
      <PainelCarrinho
        pedidoAtual={pedidoAtual}
        clientePedido={clientePedido}
        carrinho={carrinho}
        totais={totais}
        loadingPedido={loadingPedido}
        onClienteChange={onClienteChange}
        onBuscarCliente={onBuscarCliente}
        onVoltar={onVoltar}
        onCancelar={onCancelar}
        onEditarItem={onEditarItem}
        onEditandoItem={onEditandoItem}
        onAlterarQuantidade={onAlterarQuantidade}
        onIncrementarQuantidade={onIncrementarQuantidade}    // 🆕 ADICIONAR
        onDecrementarQuantidade={onDecrementarQuantidade}    // 🆕 ADICIONAR
        buscarPedidos={buscarPedidos}    // ✅ ADICIONAR
        onTransferir={onTransferir}      // ✅ ADICIONAR
        onContaConsumo={onContaConsumo}
        onImprimir={onImprimir}
        onFinalizar={onFinalizar}
        onPagar={onPagar}
        dadosEntrega={dadosEntrega}
        onAbrirEntrega={onAbrirEntrega}
        onLimparEntrega={onLimparEntrega}
      />
      </div>
      {painelMobile === 'produtos' && carrinho.length > 0 && <button className="pdv-mobile-summary" onClick={() => setPainelMobile('comanda')}><span>Ver comanda · {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</span><strong>{formatar(totais.totalPagar + Number(dadosEntrega?.taxa_entrega || 0))} →</strong></button>}
    </div>
  );
};

export default FormularioPedido;
