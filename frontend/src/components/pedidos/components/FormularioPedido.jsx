import React, { useState } from 'react';
import GridProdutos from './GridProdutos';
import PainelCarrinho from './PainelCarrinho';

const formatar = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FormularioPedido = (props) => {
  const { pedidoAtual, clientePedido, carrinho, totais, loadingPedido, dadosEntrega, onVoltar } = props;
  const [painelMobile, setPainelMobile] = useState('produtos');
  const totalGeral = totais.totalPagar + Number(dadosEntrega?.taxa_entrega || 0) - Number(pedidoAtual?.valor_pago || 0);

  return (
    <div className={`pdv-venda gm-sale painel-${painelMobile}`} data-testid="sale-screen">
      <div className="gm-sale-toolbar">
        <button className="gm-btn gm-btn-ghost" onClick={onVoltar} disabled={loadingPedido} data-testid="back-to-comandas-button">
          <i className="fas fa-arrow-left" aria-hidden="true" /> Comandas
        </button>
        <div className="gm-sale-title">
          <h2 data-testid="sale-title">{pedidoAtual?.id ? `Comanda #${pedidoAtual.id}` : 'Nova comanda'}</h2>
          <span><i className="fas fa-user" aria-hidden="true" /> {clientePedido || 'Atendimento no balcão'}{dadosEntrega ? ' · Entrega' : ' · Balcão'}</span>
        </div>
        <span className={`gm-live-pill ${loadingPedido ? 'busy' : ''}`} data-testid="sale-status">
          <span className="gm-dot" aria-hidden="true" />{loadingPedido ? 'Atualizando…' : 'Em atendimento'}
        </span>
      </div>

      <div className="gm-mobile-tabs" aria-label="Painéis da venda">
        <button aria-pressed={painelMobile === 'produtos'} onClick={() => setPainelMobile('produtos')} data-testid="mobile-tab-produtos">Produtos</button>
        <button aria-pressed={painelMobile === 'comanda'} onClick={() => setPainelMobile('comanda')} data-testid="mobile-tab-comanda">Comanda ({carrinho.length})</button>
      </div>

      <div className="gm-sale-layout">
        <GridProdutos
          produtos={props.produtos}
          categorias={props.categorias}
          categoriaAtiva={props.categoriaAtiva}
          busca={props.busca}
          codigoBusca={props.codigoBusca}
          onCategoriaChange={props.onCategoriaChange}
          onBuscaChange={props.onBuscaChange}
          onCodigoChange={props.onCodigoChange}
          onBuscarPorCodigo={props.onBuscarPorCodigo}
          onProdutoClick={props.onProdutoClick}
        />
        <PainelCarrinho
          pedidoAtual={pedidoAtual}
          clientePedido={clientePedido}
          carrinho={carrinho}
          totais={totais}
          loadingPedido={loadingPedido}
          onClienteChange={props.onClienteChange}
          onBuscarCliente={props.onBuscarCliente}
          onCancelar={props.onCancelar}
          onEditarItem={props.onEditarItem}
          onAlterarQuantidade={props.onAlterarQuantidade}
          onIncrementarQuantidade={props.onIncrementarQuantidade}
          onDecrementarQuantidade={props.onDecrementarQuantidade}
          buscarPedidos={props.buscarPedidos}
          onTransferir={props.onTransferir}
          onContaConsumo={props.onContaConsumo}
          onImprimir={props.onImprimir}
          onPagar={props.onPagar}
          dadosEntrega={dadosEntrega}
          onAbrirEntrega={props.onAbrirEntrega}
          onLimparEntrega={props.onLimparEntrega}
        />
      </div>

      {painelMobile === 'produtos' && carrinho.length > 0 && (
        <button className="gm-mobile-summary" onClick={() => setPainelMobile('comanda')} data-testid="mobile-view-cart-button">
          <span>Ver comanda · {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</span>
          <strong>{formatar(totalGeral)} →</strong>
        </button>
      )}
    </div>
  );
};

export default FormularioPedido;
