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
  valorJaPago = 0,          // Soma de pagamentos já registrados nesta comanda (se houver)
  onProcessar               // Função para processar pagamento
}) => {

  // ========================================
  // 📦 ESTADOS
  // ========================================

  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorPago, setValorPago] = useState('');
  const [valorTroco, setValorTroco] = useState(0);
  const [valorAPagarAgora, setValorAPagarAgora] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [parcelamento, setParcelamento] = useState({
    parcelas: 1,
    valorParcela: 0
  });
  const [loading, setLoading] = useState(false);

  // Formas de pagamento já lançadas nesta sessão do modal (permite dividir
  // o valor a pagar agora entre dinheiro + PIX + cartão, etc, de uma vez só)
  const [pagamentosAdicionados, setPagamentosAdicionados] = useState([]);

  // Saldo ainda devido pela comanda (total - o que já foi pago em parcelas anteriores)
  const saldoDevedor = Math.max(0, (parseFloat(totalPedido) || 0) - (parseFloat(valorJaPago) || 0));

  // Quanto já foi alocado entre as formas de pagamento adicionadas nesta sessão
  const totalJaAlocado = pagamentosAdicionados.reduce((soma, p) => soma + p.valorAPagarAgora, 0);

  // Quanto ainda pode ser alocado (para a forma de pagamento sendo configurada agora)
  const saldoRestanteParaAlocar = Math.max(0, saldoDevedor - totalJaAlocado);

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
   * Calcula o troco automaticamente (sobre o valor a pagar agora, não o total da comanda)
   */
  const calcularTroco = (valorRecebido, valorAlvo) => {
    const pago = parseFloat(valorRecebido) || 0;
    const troco = Math.max(0, pago - (parseFloat(valorAlvo) || 0));
    setValorTroco(troco);
  };

  /**
   * Calcula valor das parcelas (sobre o valor a pagar agora)
   */
  const calcularParcelas = (numParcelas) => {
    const valorParcela = (parseFloat(valorAPagarAgora) || 0) / numParcelas;
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
   * Valida a forma de pagamento sendo configurada agora (o "formulário atual").
   * Usada tanto para adicionar uma forma à lista quanto para confirmar o pagamento.
   * Retorna { valido, erro, item } — item pronto para entrar no array de pagamentos.
   */
  const validarEntradaAtual = () => {
    const formaSelecionada = formasPagamento.find(f => f.id === formaPagamento);
    const valorAgoraNum = parseFloat(String(valorAPagarAgora).replace(',', '.')) || 0;

    if (valorAgoraNum <= 0) {
      return { valido: false, erro: 'Informe um valor a pagar maior que zero' };
    }

    if (valorAgoraNum > saldoRestanteParaAlocar + 0.01) {
      return {
        valido: false,
        erro: `Valor a pagar agora não pode ser maior que o saldo restante a alocar (${formatarPreco(saldoRestanteParaAlocar)})`
      };
    }

    if (formaSelecionada.requiresValue) {
      const valorPagoNum = parseFloat(String(valorPago).replace(',', '.')) || 0;
      if (valorPagoNum < valorAgoraNum) {
        return { valido: false, erro: 'Valor recebido não pode ser menor que o valor a pagar agora' };
      }
    }

    if (formaSelecionada.requiresObservation && !observacoes.trim()) {
      return { valido: false, erro: 'Informe as observações para pagamento a prazo' };
    }

    if (formaSelecionada.needsClienteCadastrado && !isClienteCadastrado()) {
      return { valido: false, erro: 'Para pagamento a prazo é necessário selecionar um cliente cadastrado!' };
    }

    // Duas formas "a prazo" na mesma comanda não fazem sentido (uma única conta a receber)
    if (formaPagamento === 'prazo' && pagamentosAdicionados.some(p => p.formaPagamento === 'prazo')) {
      return { valido: false, erro: 'Já existe um pagamento "A Prazo" adicionado nesta lista' };
    }

    return {
      valido: true,
      item: {
        id: Date.now() + Math.random(),
        formaPagamento,
        nome: formaSelecionada.nome,
        valorAPagarAgora: valorAgoraNum,
        valorPago: formaSelecionada.requiresValue ? parseFloat(String(valorPago).replace(',', '.')) : valorAgoraNum,
        valorTroco: formaSelecionada.allowsChange ? valorTroco : 0,
        observacoes,
        parcelamento: formaSelecionada.allowsParcelamento ? parcelamento : null
      }
    };
  };

  /**
   * Reseta o formulário da forma de pagamento "atual" para configurar a próxima,
   * pré-preenchendo com o saldo que ainda resta alocar
   */
  const resetarFormularioParaRestante = (restante) => {
    setFormaPagamento('dinheiro');
    setValorAPagarAgora(restante > 0 ? restante.toFixed(2) : '');
    setValorPago(restante > 0 ? restante.toFixed(2) : '');
    setValorTroco(0);
    setObservacoes('');
    setParcelamento({ parcelas: 1, valorParcela: restante });
  };

  /**
   * Adiciona a forma de pagamento configurada agora à lista e prepara o
   * formulário para a próxima forma (ex: dinheiro + PIX na mesma comanda)
   */
  const handleAdicionarForma = () => {
    const validacao = validarEntradaAtual();
    if (!validacao.valido) {
      alert(validacao.erro);
      return;
    }

    const novaLista = [...pagamentosAdicionados, validacao.item];
    setPagamentosAdicionados(novaLista);

    const restante = Math.max(0, saldoDevedor - novaLista.reduce((s, p) => s + p.valorAPagarAgora, 0));
    resetarFormularioParaRestante(restante);
  };

  /**
   * Remove uma forma de pagamento já adicionada à lista
   */
  const handleRemoverForma = (id) => {
    const novaLista = pagamentosAdicionados.filter(p => p.id !== id);
    setPagamentosAdicionados(novaLista);

    const restante = Math.max(0, saldoDevedor - novaLista.reduce((s, p) => s + p.valorAPagarAgora, 0));
    resetarFormularioParaRestante(restante);
  };

  /**
   * Valida e processa o(s) pagamento(s).
   * Se houver um valor válido ainda no formulário atual (não adicionado à lista),
   * ele é incluído automaticamente — assim o caso comum (uma única forma) não
   * exige clicar em "Adicionar" antes de confirmar.
   */
  const handleProcessar = async () => {
    let listaFinal = pagamentosAdicionados;
    const valorAgoraNum = parseFloat(String(valorAPagarAgora).replace(',', '.')) || 0;

    if (valorAgoraNum > 0) {
      const validacao = validarEntradaAtual();
      if (!validacao.valido) {
        alert(validacao.erro);
        return;
      }
      listaFinal = [...pagamentosAdicionados, validacao.item];
    } else if (listaFinal.length === 0) {
      alert('Informe um valor a pagar maior que zero');
      return;
    }

    const totalFinal = listaFinal.reduce((s, p) => s + p.valorAPagarAgora, 0);

    setLoading(true);
    try {
      await onProcessar({
        pagamentos: listaFinal,
        valorTotal: totalPedido,
        valorAPagarAgora: totalFinal,
        isPagamentoTotal: totalFinal >= saldoDevedor - 0.01
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler para Enter no input
   */
  const handleQuantidadeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Dispara o blur que vai validar
    }
  };

  /**
   * Previne propagação de eventos (evita abrir modal ao clicar em botões)
   */
  const pararPropagacao = (e) => {
    e.stopPropagation();
  };

  /**
   * Reseta estados ao abrir
   */
  useEffect(() => {
    if (isOpen) {
      const saldo = Math.max(0, (parseFloat(totalPedido) || 0) - (parseFloat(valorJaPago) || 0));
      setPagamentosAdicionados([]);
      setFormaPagamento('dinheiro');
      setValorAPagarAgora(saldo.toFixed(2));
      setValorPago(saldo.toFixed(2));
      setValorTroco(0);
      setObservacoes('');
      setParcelamento({ parcelas: 1, valorParcela: saldo });
    }
  }, [isOpen, totalPedido, valorJaPago]);

  /**
   * Calcula troco quando muda valor pago ou o valor a pagar agora
   */
  useEffect(() => {
    if (formaPagamento === 'dinheiro' && valorPago) {
      calcularTroco(valorPago, valorAPagarAgora);
    }
  }, [valorPago, valorAPagarAgora, formaPagamento]);

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
              <div className="resumo-linha">
                <span>Total da Comanda:</span>
                <span><strong>{formatarPreco(totalPedido)}</strong></span>
              </div>
              {valorJaPago > 0 && (
                <>
                  <div className="resumo-linha">
                    <span>Já Pago:</span>
                    <span><strong>{formatarPreco(valorJaPago)}</strong></span>
                  </div>
                  <div className="resumo-linha resumo-total">
                    <span>Saldo Devedor:</span>
                    <span><strong>{formatarPreco(saldoDevedor)}</strong></span>
                  </div>
                </>
              )}
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

            {/* Formas de pagamento já adicionadas nesta sessão (ex: parte em
                dinheiro + parte em PIX, lançados juntos ao confirmar) */}
            {pagamentosAdicionados.length > 0 && (
              <div className="pagamentos-adicionados-lista">
                {pagamentosAdicionados.map((p) => (
                  <div key={p.id} className="pagamento-item-adicionado">
                    <span className="pagamento-item-nome">{p.nome}</span>
                    <span className="pagamento-item-valor">{formatarPreco(p.valorAPagarAgora)}</span>
                    <button
                      type="button"
                      className="btn-remover-pagamento"
                      onClick={() => handleRemoverForma(p.id)}
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="pagamento-item-restante">
                  <span>Restante a alocar:</span>
                  <strong>{formatarPreco(saldoRestanteParaAlocar)}</strong>
                </div>
              </div>
            )}

            {/* Valor a pagar agora (sempre visível — reduzir esse valor é o que
                caracteriza um pagamento parcial da comanda) */}
            <div className="pagamento-valor">
              <label>Valor a Pagar Agora (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={saldoRestanteParaAlocar}
                placeholder="0,00"
                value={valorAPagarAgora}
                onClick={pararPropagacao}
                onKeyPress={handleQuantidadeKeyPress}
                onChange={(e) => setValorAPagarAgora(e.target.value)}
                className="pagamento-input"
                onFocus={(e) => {
                  pararPropagacao(e);
                  e.target.select(); // Seleciona todo o texto ao focar
                }}
              />
              {parseFloat(valorAPagarAgora) > 0 && parseFloat(valorAPagarAgora) < saldoRestanteParaAlocar - 0.01 && (
                <small className="pagamento-parcial-aviso">
                  Restará {formatarPreco(saldoRestanteParaAlocar - parseFloat(valorAPagarAgora))} em aberto
                  {pagamentosAdicionados.length === 0 ? ' nesta comanda' : ' (adicione outra forma de pagamento ou confirme como pagamento parcial)'}.
                </small>
              )}
              {saldoRestanteParaAlocar > 0.01 && (
                <button
                  type="button"
                  className="btn-adicionar-forma"
                  onClick={handleAdicionarForma}
                >
                  <i className="fas fa-plus"></i> Adicionar outra forma de pagamento
                </button>
              )}
            </div>

            {/* Valor recebido (apenas para dinheiro) */}
            {formasPagamento.find(f => f.id === formaPagamento)?.requiresValue && (
              <div className="pagamento-valor">
                <label>Valor Recebido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorPago}
                  onClick={pararPropagacao}
                  onChange={(e) => setValorPago(e.target.value)}
                  onKeyPress={handleQuantidadeKeyPress}
                  className="pagamento-input"
                   onFocus={(e) => {
                  pararPropagacao(e);
                  e.target.select(); // Seleciona todo o texto ao focar
                }}
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
                        <small>{formatarPreco((parseFloat(valorAPagarAgora) || 0) / parcela)}</small>
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
            {pagamentosAdicionados.map((p) => (
              <div className="resumo-final-linha" key={p.id}>
                <span>{p.nome}:</span>
                <span><strong>{formatarPreco(p.valorAPagarAgora)}</strong></span>
              </div>
            ))}

            {parseFloat(valorAPagarAgora) > 0 && (
              <div className="resumo-final-linha">
                <span>{formasPagamento.find(f => f.id === formaPagamento)?.nome}:</span>
                <span><strong>{formatarPreco(valorAPagarAgora)}</strong></span>
              </div>
            )}

            {formaPagamento === 'cartao_credito' && parcelamento.parcelas > 1 && parseFloat(valorAPagarAgora) > 0 && (
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
              <span>Pagando Agora (total):</span>
              <span>
                <strong>
                  {formatarPreco(totalJaAlocado + (parseFloat(valorAPagarAgora) || 0))}
                </strong>
              </span>
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