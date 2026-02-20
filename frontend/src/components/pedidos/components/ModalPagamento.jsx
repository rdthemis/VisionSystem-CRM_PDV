// src/components/Pedidos/components/ModalPagamento.jsx
// 💳 COMPONENTE: Modal para finalizar pedido com pagamento

import React, { useState, useEffect } from 'react';

/**
 * Modal completo de pagamento
 * Permite escolher forma de pagamento, parcelamento, etc
 */
const ModalPagamento = ({
  isOpen,                    // Se o modal está aberto
  onClose,                   // Função para fechar
  pedidoAtual,              // Dados do pedido
  clientePedido,            // Nome do cliente
  clienteCadastrado,        // Cliente selecionado (se houver)
  carrinho,                 // Itens do pedido
  totalPedido,              // Valor total
  onProcessar               // Função para processar pagamento
}) => {

  // ========================================
  // 📦 ESTADOS
  // ========================================
  
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorPago, setValorPago] = useState('');
  const [valorTroco, setValorTroco] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [parcelamento, setParcelamento] = useState({
    parcelas: 1,
    valorParcela: 0
  });
  const [loading, setLoading] = useState(false);

  // ========================================
  // 💳 FORMAS DE PAGAMENTO
  // ========================================
  
  const formasPagamento = [
    {
      id: 'dinheiro',
      nome: 'Dinheiro',
      icone: 'fas fa-money-bill-wave',
      cor: '#28a745',
      requiresValue: true,
      allowsChange: true
    },
    {
      id: 'cartao_credito',
      nome: 'Cartão de Crédito',
      icone: 'fas fa-credit-card',
      cor: '#007bff',
      requiresValue: false,
      allowsChange: false,
      allowsParcelamento: true
    },
    {
      id: 'cartao_debito',
      nome: 'Cartão de Débito',
      icone: 'fas fa-credit-card',
      cor: '#6f42c1',
      requiresValue: false,
      allowsChange: false
    },
    {
      id: 'pix',
      nome: 'PIX',
      icone: 'fas fa-qrcode',
      cor: '#fd7e14',
      requiresValue: false,
      allowsChange: false
    },
    {
      id: 'prazo',
      nome: 'A Prazo',
      icone: 'fas fa-calendar-alt',
      cor: '#dc3545',
      requiresValue: false,
      allowsChange: false,
      requiresObservation: true,
      needsClienteCadastrado: true
    }
  ];

  // ========================================
  // 🔧 FUNÇÕES
  // ========================================

  /**
   * Formata valor em reais
   */
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  /**
   * Calcula o troco automaticamente
   */
  const calcularTroco = (valorRecebido) => {
    const pago = parseFloat(valorRecebido) || 0;
    const troco = Math.max(0, pago - totalPedido);
    setValorTroco(troco);
  };

  /**
   * Calcula valor das parcelas
   */
  const calcularParcelas = (numParcelas) => {
    const valorParcela = totalPedido / numParcelas;
    setParcelamento({
      parcelas: numParcelas,
      valorParcela: valorParcela
    });
  };

  /**
   * Verifica se cliente é cadastrado
   */
  const isClienteCadastrado = () => {
    return !!(clienteCadastrado && clienteCadastrado.id);
  };

  /**
   * Valida e processa o pagamento
   */
  const handleProcessar = async () => {
    const formaSelecionada = formasPagamento.find(f => f.id === formaPagamento);
    
    // Validações
    if (formaSelecionada.requiresValue) {
      const valorPagoNum = parseFloat(valorPago) || 0;
      if (valorPagoNum < totalPedido) {
        alert('Valor pago não pode ser menor que o total');
        return;
      }
    }

    if (formaSelecionada.requiresObservation && !observacoes.trim()) {
      alert('Informe as observações para pagamento a prazo');
      return;
    }

    if (formaSelecionada.needsClienteCadastrado && !isClienteCadastrado()) {
      alert('Para pagamento a prazo é necessário selecionar um cliente cadastrado!');
      return;
    }

    // Preparar dados
    const dadosPagamento = {
      formaPagamento,
      valorTotal: totalPedido,
      valorPago: formaSelecionada.requiresValue ? parseFloat(valorPago) : totalPedido,
      valorTroco,
      observacoes,
      parcelamento: formaSelecionada.allowsParcelamento ? parcelamento : null
    };

    setLoading(true);
    try {
      await onProcessar(dadosPagamento);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reseta estados ao abrir
   */
  useEffect(() => {
    if (isOpen) {
      setFormaPagamento('dinheiro');
      setValorPago(totalPedido.toFixed(2));
      setValorTroco(0);
      setObservacoes('');
      setParcelamento({ parcelas: 1, valorParcela: 0 });
    }
  }, [isOpen, totalPedido]);

  /**
   * Calcula troco quando muda valor pago
   */
  useEffect(() => {
    if (formaPagamento === 'dinheiro' && valorPago) {
      calcularTroco(valorPago);
    }
  }, [valorPago, formaPagamento]);

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-pagamento" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================
            CABEÇALHO
        ======================================== */}
        <div className="modal-header">
          <h3>
            <i className="fas fa-credit-card"></i>
            Finalizar Pedido
          </h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          
          {/* ========================================
              RESUMO DO PEDIDO
          ======================================== */}
          <div className="pagamento-resumo">
            <h4>Resumo do Pedido</h4>
            <div className="resumo-info">
              <div className="resumo-linha">
                <span>Pedido:</span>
                <span><strong>{pedidoAtual?.id || 'Novo'}</strong></span>
              </div>
              <div className="resumo-linha">
                <span>Cliente:</span>
                <span><strong>{clientePedido || 'Balcão'}</strong></span>
              </div>
              <div className="resumo-linha">
                <span>Itens:</span>
                <span><strong>{carrinho.length}</strong></span>
              </div>
              <div className="resumo-linha resumo-total">
                <span>Total a Pagar:</span>
                <span><strong>{formatarPreco(totalPedido)}</strong></span>
              </div>
            </div>
          </div>

          {/* ========================================
              FORMAS DE PAGAMENTO
          ======================================== */}
          <div className="formas-pagamento">
            <h4>Forma de Pagamento</h4>
            <div className="pagamento-grid">
              {formasPagamento.map((forma) => {
                // Não mostrar "A Prazo" se cliente não for cadastrado
                if (forma.needsClienteCadastrado && !isClienteCadastrado()) {
                  return null;
                }

                return (
                  <div
                    key={forma.id}
                    className={`pagamento-opcao ${formaPagamento === forma.id ? 'selecionada' : ''}`}
                    onClick={() => setFormaPagamento(forma.id)}
                    style={{ '--cor-forma': forma.cor }}
                  >
                    <div className="pagamento-icone">
                      <i className={forma.icone}></i>
                    </div>
                    <div className="pagamento-nome">{forma.nome}</div>
                    <div className="pagamento-check">
                      <i className={`fas ${formaPagamento === forma.id ? 'fa-check-circle' : 'fa-circle'}`}></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================
              DETALHES DO PAGAMENTO
          ======================================== */}
          <div className="pagamento-detalhes">
            
            {/* Valor recebido (apenas para dinheiro) */}
            {formasPagamento.find(f => f.id === formaPagamento)?.requiresValue && (
              <div className="pagamento-valor">
                <label>Valor Recebido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  className="pagamento-input"
                  autoFocus
                />
              </div>
            )}

            {/* Troco */}
            {formasPagamento.find(f => f.id === formaPagamento)?.allowsChange && valorTroco > 0 && (
              <div className="pagamento-troco">
                <div className="troco-info">
                  <i className="fas fa-coins"></i>
                  <span>Troco a devolver:</span>
                  <strong>{formatarPreco(valorTroco)}</strong>
                </div>
              </div>
            )}

            {/* Parcelamento (apenas para cartão de crédito) */}
            {formasPagamento.find(f => f.id === formaPagamento)?.allowsParcelamento && (
              <div className="pagamento-parcelamento">
                <label>Parcelamento</label>
                <div className="parcelamento-opcoes">
                  {[1, 2, 3, 4, 5, 6].map((parcela) => (
                    <button
                      key={parcela}
                      className={`parcela-btn ${parcelamento.parcelas === parcela ? 'ativa' : ''}`}
                      onClick={() => calcularParcelas(parcela)}
                    >
                      {parcela}x
                      {parcela > 1 && (
                        <small>{formatarPreco(totalPedido / parcela)}</small>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {(formasPagamento.find(f => f.id === formaPagamento)?.requiresObservation || 
              formaPagamento === 'prazo') && (
              <div className="pagamento-obs">
                <label>
                  Observações {formaPagamento === 'prazo' ? '*' : ''}
                </label>
                <textarea
                  placeholder={
                    formaPagamento === 'prazo'
                      ? 'Informe o prazo, condições, etc...'
                      : 'Observações adicionais (opcional)...'
                  }
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="pagamento-textarea"
                  rows="3"
                />
              </div>
            )}
          </div>

          {/* ========================================
              RESUMO FINAL
          ======================================== */}
          <div className="pagamento-resumo-final">
            <div className="resumo-final-linha">
              <span>Forma de Pagamento:</span>
              <span>
                <strong>
                  {formasPagamento.find(f => f.id === formaPagamento)?.nome}
                </strong>
              </span>
            </div>

            {formaPagamento === 'cartao_credito' && parcelamento.parcelas > 1 && (
              <div className="resumo-final-linha">
                <span>Parcelamento:</span>
                <span>
                  <strong>
                    {parcelamento.parcelas}x de {formatarPreco(parcelamento.valorParcela)}
                  </strong>
                </span>
              </div>
            )}

            <div className="resumo-final-linha total">
              <span>Valor Total:</span>
              <span><strong>{formatarPreco(totalPedido)}</strong></span>
            </div>
          </div>
        </div>

        {/* ========================================
            RODAPÉ COM BOTÕES
        ======================================== */}
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          
          <button
            className="btn-confirmar-pagamento"
            onClick={handleProcessar}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processando...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPagamento;