import React, { useState } from 'react';
import ItemCarrinho from '../ItemCarrinho';
import ModalTransferencia from './ModalTransferencia';

const formatarPreco = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(String(valor).replace(',', '.')) || 0);

const AcaoSecundaria = ({ icone, label, onClick, disabled, testId }) => (
  <button className="gm-action" onClick={onClick} disabled={disabled} data-testid={testId}>
    <i className={icone} aria-hidden="true" /><span>{label}</span>
  </button>
);

const PainelCarrinho = ({
  pedidoAtual, clientePedido, carrinho, totais, dadosEntrega, onAbrirEntrega, onLimparEntrega,
  loadingPedido, onClienteChange, onBuscarCliente, onCancelar, onEditarItem, onAlterarQuantidade,
  onIncrementarQuantidade, onDecrementarQuantidade, onImprimir, onContaConsumo, onPagar,
  buscarPedidos, onTransferir,
}) => {
  const [modalTransferenciaVisivel, setModalTransferenciaVisivel] = useState(false);
  const totalComEntrega = totais.totalPagar + (dadosEntrega?.taxa_entrega || 0);
  const valorPago = Number(pedidoAtual?.valor_pago || 0);
  const vazio = carrinho.length === 0;

  return (
    <aside className="gm-cart" data-testid="cart-panel">
      <div className="gm-cart-head">
        <div>
          <h3>Resumo da comanda</h3>
          <span data-testid="cart-items-count">{carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</span>
        </div>
        <button className="gm-icon-btn danger" title="Cancelar comanda" aria-label="Cancelar comanda" onClick={onCancelar} disabled={loadingPedido} data-testid="cancel-comanda-button">
          <i className="fa-solid fa-trash" aria-hidden="true" />
        </button>
      </div>

      <div className="gm-field">
        <label htmlFor="gm-cliente-comanda">Cliente <small>opcional</small></label>
        <div className="gm-input-action">
          <input
            id="gm-cliente-comanda"
            type="text"
            value={clientePedido}
            onChange={(e) => onClienteChange(e.target.value)}
            aria-label="Nome do cliente da comanda"
            placeholder="Nome para chamar no balcão"
            disabled={loadingPedido}
            data-testid="cart-client-input"
          />
          <button className="gm-btn gm-btn-soft" title="Selecionar cliente" aria-label="Selecionar cliente" onClick={onBuscarCliente} disabled={loadingPedido} data-testid="select-client-button">
            <i className="fas fa-address-book" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="gm-cart-items">
        {vazio ? (
          <div className="gm-empty compact" data-testid="cart-empty">
            <span className="gm-empty-icon"><i className="fas fa-basket-shopping" aria-hidden="true" /></span>
            <h3>Nenhum item adicionado</h3>
            <p>Toque em um produto do catálogo para começar.</p>
          </div>
        ) : carrinho.map((item, index) => (
          <ItemCarrinho
            key={item._id}
            item={item}
            index={index}
            onEditar={onEditarItem}
            onAlterarQuantidade={onAlterarQuantidade}
            onIncrementar={onIncrementarQuantidade}
            onDecrementar={onDecrementarQuantidade}
          />
        ))}
      </div>

      <div className="gm-totals" data-testid="cart-totals">
        <div className="gm-total-row"><span>Subtotal</span><span className="gm-money">{formatarPreco(totais.totalItens)}</span></div>
        {dadosEntrega && (
          <div className="gm-total-row">
            <span><i className="fas fa-motorcycle" aria-hidden="true" /> Taxa de entrega</span>
            <span className="gm-money">
              {formatarPreco(dadosEntrega.taxa_entrega)}
              <button className="gm-mini-x" onClick={onLimparEntrega} title="Remover entrega" aria-label="Remover entrega" data-testid="remove-delivery-button">
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </span>
          </div>
        )}
        {valorPago > 0 && (
          <div className="gm-total-row"><span>Total da comanda</span><span className="gm-money">{formatarPreco(totalComEntrega)}</span></div>
        )}
        {valorPago > 0 && (
          <div className="gm-total-row paid"><span>Já pago</span><span className="gm-money">− {formatarPreco(valorPago)}</span></div>
        )}
        <div className="gm-total-row grand">
          <span>{valorPago > 0 ? 'Saldo a receber' : 'Total a pagar'}</span>
          <strong className="gm-money" data-testid="cart-total">{formatarPreco(totalComEntrega - valorPago)}</strong>
        </div>
      </div>

      <div className="gm-actions-grid">
        <AcaoSecundaria icone="fas fa-receipt" label="Conta" onClick={onContaConsumo} disabled={vazio} testId="cart-conta-button" />
        <AcaoSecundaria icone="fas fa-right-left" label="Transferir" onClick={() => setModalTransferenciaVisivel(true)} disabled={vazio || !pedidoAtual?.id} testId="cart-transfer-button" />
        <AcaoSecundaria icone="fas fa-motorcycle" label={dadosEntrega ? 'Editar entrega' : 'Entrega'} onClick={onAbrirEntrega} testId="cart-delivery-button" />
        <AcaoSecundaria icone="fas fa-print" label="Imprimir" onClick={onImprimir} testId="cart-print-button" />
      </div>

      <button className="gm-pay-btn" onClick={onPagar} disabled={vazio || loadingPedido} data-testid="cart-pay-button">
        <span><i className="fas fa-wallet" aria-hidden="true" /> {loadingPedido ? 'Aguarde…' : valorPago > 0 ? 'Receber saldo' : 'Ir para pagamento'}</span>
        <strong className="gm-money">{formatarPreco(totalComEntrega - valorPago)}</strong>
      </button>

      <ModalTransferencia
        visible={modalTransferenciaVisivel}
        pedidoAtual={pedidoAtual}
        carrinho={carrinho}
        onFechar={() => setModalTransferenciaVisivel(false)}
        onTransferir={onTransferir}
        buscarPedidos={buscarPedidos}
      />
    </aside>
  );
};

export default PainelCarrinho;
