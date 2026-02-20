// src/components/Pedidos/components/ModalConta.jsx
// 🧾 MODAL: Visualização e impressão da conta do pedido

import React, { useRef } from 'react';

/**
 * Modal que exibe a conta do pedido para o cliente verificar
 * e opcionalmente imprimir.
 *
 * @param {Object}   props
 * @param {boolean}  props.visible        - Controla exibição do modal
 * @param {Object}   props.pedido         - Dados do pedido
 * @param {Array}    props.carrinho       - Itens do carrinho
 * @param {Object}   props.totais         - Totais calculados
 * @param {string}   props.clientePedido  - Nome do cliente
 * @param {Function} props.onFechar       - Fechar o modal
 */
const ModalConta = ({
  visible,
  pedido,
  carrinho,
  totais,
  clientePedido,
  onFechar,
}) => {
  const contaRef = useRef(null);

  if (!visible) return null;

  // ----------------------------------------
  // 🔧 FUNÇÕES AUXILIARES
  // ----------------------------------------

  const formatarPreco = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  const formatarData = () => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ----------------------------------------
  // 🖨️ IMPRESSÃO
  // ----------------------------------------

  const handleImprimir = () => {
    const conteudo = contaRef.current.innerHTML;
    const janela = window.open('', '_blank', 'width=400,height=600');
    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Conta - Pedido #${pedido?.id || 'Novo'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; color: #000; }
          .conta-print { max-width: 300px; margin: 0 auto; }
          .print-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .print-header h2 { font-size: 16px; font-weight: bold; }
          .print-header p { font-size: 11px; }
          .print-info { margin-bottom: 8px; font-size: 11px; }
          .print-info span { display: block; }
          .print-itens { border-top: 1px dashed #000; padding-top: 8px; }
          .print-item { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .print-item .item-nome { flex: 1; }
          .print-item .item-qtd { width: 30px; text-align: center; }
          .print-item .item-preco { width: 70px; text-align: right; }
          .print-obs { font-size: 10px; color: #555; padding-left: 8px; margin-bottom: 4px; font-style: italic; }
          .print-totais { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
          .print-total-linha { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .print-total-final { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
          .print-rodape { text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="conta-print">${conteudo}</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    janela.document.close();
  };

  // ----------------------------------------
  // 🎨 RENDERIZAÇÃO
  // ----------------------------------------

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-container modal-conta" onClick={(e) => e.stopPropagation()}>

        {/* HEADER DO MODAL */}
        <div className="modal-header">
          <h2>
            <i className="fas fa-receipt"></i>
            Conta do Pedido
          </h2>
          <button className="modal-fechar" onClick={onFechar} title="Fechar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* CONTEÚDO DA CONTA (referência para impressão) */}
        <div className="modal-body">
          <div ref={contaRef}>

            {/* CABEÇALHO DA CONTA */}
            <div className="print-header">
              <h2>VisionSystem PDV</h2>
              <p>Conta do Pedido</p>
            </div>

            {/* INFORMAÇÕES DO PEDIDO */}
            <div className="print-info">
              <span><strong>Pedido:</strong> #{pedido?.id || 'Novo'}</span>
              {clientePedido && (
                <span><strong>Cliente:</strong> {clientePedido}</span>
              )}
              <span><strong>Data:</strong> {formatarData()}</span>
            </div>

            {/* LISTA DE ITENS */}
            <div className="print-itens">
              <div className="print-item print-item-header">
                <span className="item-nome"><strong>Item</strong></span>
                <span className="item-qtd"><strong>Qtd</strong></span>
                <span className="item-preco"><strong>Total</strong></span>
              </div>

              {carrinho.map((item, index) => (
                <div key={item._id || index}>
                  <div className="print-item">
                    <span className="item-nome">{item.nome}</span>
                    <span className="item-qtd">{item.quantidade}</span>
                    <span className="item-preco">
                      {formatarPreco((item.preco_produto || item.preco) * item.quantidade)}
                    </span>
                  </div>
                  {item.observacao && (
                    <div className="print-obs">
                      Obs: {item.observacao}
                    </div>
                  )}
                  {item.adicionais && item.adicionais.length > 0 && (
                    <div className="print-obs">
                      + {item.adicionais.map(a => a.nome).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* TOTAIS */}
            <div className="print-totais">
              <div className="print-total-linha">
                <span>Subtotal</span>
                <span>{formatarPreco(totais.totalItens)}</span>
              </div>
              <div className="print-total-linha print-total-final">
                <span>TOTAL A PAGAR</span>
                <span>{formatarPreco(totais.totalPagar)}</span>
              </div>
            </div>

            {/* RODAPÉ */}
            <div className="print-rodape">
              <p>Obrigado pela preferência!</p>
            </div>

          </div>
        </div>

        {/* BOTÕES DO MODAL */}
        <div className="modal-footer">
          <button className="btn-modal-secundario" onClick={onFechar}>
            <i className="fas fa-times"></i>
            Fechar
          </button>
          <button className="btn-modal-primario" onClick={handleImprimir}>
            <i className="fas fa-print"></i>
            Imprimir Conta
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalConta;
