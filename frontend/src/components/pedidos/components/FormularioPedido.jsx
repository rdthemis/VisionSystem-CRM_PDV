// src/components/Pedidos/components/FormularioPedido.jsx
// 📝 COMPONENTE: Tela completa de criar/editar pedido

import React from 'react';
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
  onRemoverItem,
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

  return (
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
        onRemoverItem={onRemoverItem}
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
  );
};

export default FormularioPedido;