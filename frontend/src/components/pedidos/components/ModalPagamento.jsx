import React, { useState, useEffect } from 'react';

const FORMAS_PAGAMENTO = [
  { id: 'dinheiro', nome: 'Dinheiro', descricao: 'Calcula o troco', icone: 'fas fa-money-bill-wave', requiresValue: true, allowsChange: true },
  { id: 'pix', nome: 'PIX', descricao: 'Transferência instantânea', icone: 'fas fa-qrcode' },
  { id: 'cartao_debito', nome: 'Cartão de Débito', descricao: 'À vista na maquininha', icone: 'fas fa-credit-card' },
  { id: 'cartao_credito', nome: 'Cartão de Crédito', descricao: 'À vista ou em até 6x', icone: 'far fa-credit-card', allowsParcelamento: true },
  { id: 'prazo', nome: 'A Prazo', descricao: 'Lança na conta do cliente', icone: 'fas fa-calendar-alt', requiresObservation: true, needsClienteCadastrado: true }
];

const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
const paraNumero = (valor) => {
  const texto = String(valor ?? '').trim();
  const normalizado = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto;
  return parseFloat(normalizado) || 0;
};
const fmt = (n) => Number(n || 0).toFixed(2).replace('.', ',');

const sugestoesDinheiro = (valor) => {
  if (valor <= 0) return [];
  const opcoes = [valor, Math.ceil(valor / 5) * 5, Math.ceil(valor / 10) * 10, Math.ceil(valor / 50) * 50, Math.ceil(valor / 100) * 100];
  return [...new Set(opcoes.map(v => Number(v.toFixed(2))))].slice(0, 5);
};

const CampoValor = ({ id, label, ajuda, value, onChange, testId, autoFocus, destaque }) => (
  <div className={`gm-field ${destaque ? 'gm-field-hero' : ''}`}>
    <label htmlFor={id}>{label}</label>
    <div className="gm-money-input">
      <span aria-hidden="true">R$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9,.]/g, ''))}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        onFocus={(e) => e.target.select()}
        data-testid={testId}
      />
    </div>
    {ajuda && <small className="gm-help">{ajuda}</small>}
  </div>
);

const ModalPagamento = ({
  isOpen, onClose, pedidoAtual, clientePedido, clienteCadastrado, carrinho, totalPedido, valorJaPago = 0, onProcessar
}) => {
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorPago, setValorPago] = useState('');
  const [valorAPagarAgora, setValorAPagarAgora] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pagamentosAdicionados, setPagamentosAdicionados] = useState([]);
  const [recebidoEditado, setRecebidoEditado] = useState(false);

  const saldoDevedor = Math.max(0, (parseFloat(totalPedido) || 0) - (parseFloat(valorJaPago) || 0));
  const totalJaAlocado = pagamentosAdicionados.reduce((soma, p) => soma + p.valorAPagarAgora, 0);
  const saldoRestanteParaAlocar = Math.max(0, saldoDevedor - totalJaAlocado);
  const forma = FORMAS_PAGAMENTO.find(f => f.id === formaPagamento);
  const valorAgoraNum = paraNumero(valorAPagarAgora);
  const valorTroco = forma.allowsChange && valorAgoraNum > 0 ? Math.max(0, paraNumero(valorPago) - valorAgoraNum) : 0;
  const faltaReceber = forma.requiresValue ? Math.max(0, valorAgoraNum - paraNumero(valorPago)) : 0;
  const totalPagandoAgora = totalJaAlocado + valorAgoraNum;
  const restaAposConfirmar = Math.max(0, saldoDevedor - totalPagandoAgora);
  const progresso = saldoDevedor > 0 ? Math.min(100, (totalPagandoAgora / saldoDevedor) * 100) : 100;
  const clienteTemCadastro = !!(clienteCadastrado && clienteCadastrado.id);

  useEffect(() => {
    if (isOpen) {
      const saldo = Math.max(0, (parseFloat(totalPedido) || 0) - (parseFloat(valorJaPago) || 0));
      setPagamentosAdicionados([]);
      setFormaPagamento('dinheiro');
      setValorAPagarAgora(fmt(saldo));
      setValorPago(fmt(saldo));
      setRecebidoEditado(false);
      setObservacoes('');
      setParcelas(1);
      setErro('');
    }
  }, [isOpen, totalPedido, valorJaPago]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const fechar = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [isOpen, loading, onClose]);

  useEffect(() => { setErro(''); }, [formaPagamento, valorAPagarAgora, valorPago, observacoes]);

  const validarEntradaAtual = () => {
    if (valorAgoraNum <= 0) return { valido: false, erro: 'Informe um valor a pagar maior que zero.' };
    if (valorAgoraNum > saldoRestanteParaAlocar + 0.01) {
      return { valido: false, erro: `O valor não pode ser maior que o saldo restante (${formatarPreco(saldoRestanteParaAlocar)}).` };
    }
    if (forma.requiresValue && paraNumero(valorPago) < valorAgoraNum) {
      return { valido: false, erro: 'O valor recebido em dinheiro é menor que o valor a pagar.' };
    }
    if (forma.requiresObservation && !observacoes.trim()) return { valido: false, erro: 'Descreva o prazo e as condições do pagamento a prazo.' };
    if (forma.needsClienteCadastrado && !clienteTemCadastro) return { valido: false, erro: 'Para pagamento a prazo é necessário selecionar um cliente cadastrado.' };
    if (formaPagamento === 'prazo' && pagamentosAdicionados.some(p => p.formaPagamento === 'prazo')) {
      return { valido: false, erro: 'Já existe um pagamento "A Prazo" nesta lista.' };
    }
    return {
      valido: true,
      item: {
        id: Date.now() + Math.random(),
        formaPagamento,
        nome: forma.nome,
        valorAPagarAgora: valorAgoraNum,
        valorPago: forma.requiresValue ? paraNumero(valorPago) : valorAgoraNum,
        valorTroco: forma.allowsChange ? valorTroco : 0,
        observacoes,
        parcelamento: forma.allowsParcelamento ? { parcelas, valorParcela: valorAgoraNum / parcelas } : null
      }
    };
  };

  const resetarParaRestante = (lista) => {
    const restante = Math.max(0, saldoDevedor - lista.reduce((s, p) => s + p.valorAPagarAgora, 0));
    const proxima = FORMAS_PAGAMENTO.find(f => !f.needsClienteCadastrado && !lista.some(p => p.formaPagamento === f.id));
    setFormaPagamento(proxima?.id || 'dinheiro');
    setValorAPagarAgora(restante > 0 ? fmt(restante) : '');
    setValorPago(restante > 0 ? fmt(restante) : '');
    setRecebidoEditado(false);
    setObservacoes('');
    setParcelas(1);
  };

  const handleAdicionarForma = () => {
    const validacao = validarEntradaAtual();
    if (!validacao.valido) { setErro(validacao.erro); return; }
    const novaLista = [...pagamentosAdicionados, validacao.item];
    setPagamentosAdicionados(novaLista);
    resetarParaRestante(novaLista);
  };

  const handleRemoverForma = (id) => {
    const novaLista = pagamentosAdicionados.filter(p => p.id !== id);
    setPagamentosAdicionados(novaLista);
    resetarParaRestante(novaLista);
  };

  const handleProcessar = async () => {
    let listaFinal = pagamentosAdicionados;
    if (valorAgoraNum > 0) {
      const validacao = validarEntradaAtual();
      if (!validacao.valido) { setErro(validacao.erro); return; }
      listaFinal = [...pagamentosAdicionados, validacao.item];
    } else if (listaFinal.length === 0) {
      setErro('Informe um valor a pagar maior que zero.');
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
    } catch (e) {
      setErro(e?.message || 'Não foi possível registrar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const selecionarForma = (f) => {
    setFormaPagamento(f.id);
    if (f.requiresValue) { setValorPago(valorAgoraNum > 0 ? fmt(valorAgoraNum) : ''); setRecebidoEditado(false); }
  };

  const alterarValorAgora = (valor) => {
    setValorAPagarAgora(valor);
    if (!recebidoEditado) setValorPago(valor);
  };

  const alterarRecebido = (valor) => {
    setValorPago(valor);
    setRecebidoEditado(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay gm-overlay" onClick={onClose}>
      <div className="gm-modal gm-pay" role="dialog" aria-modal="true" aria-labelledby="pdv-payment-title" onClick={(e) => e.stopPropagation()} data-testid="payment-modal">
        <header className="gm-modal-head">
          <div>
            <span className="gm-eyebrow">Pagamento</span>
            <h3 id="pdv-payment-title">Receber pagamento</h3>
            <p>Comanda #{pedidoAtual?.id || 'nova'} · {clientePedido || 'Balcão'} · {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</p>
          </div>
          <button className="gm-icon-btn" aria-label="Fechar pagamento" onClick={onClose} disabled={loading} data-testid="payment-close-button">
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </header>

        <div className="gm-pay-body">
          <section className="gm-pay-left">
            <div className="gm-balance-card" data-testid="payment-balance-card">
              <div className="gm-balance-main">
                <small>{valorJaPago > 0 ? 'Saldo devedor' : 'Total a receber'}</small>
                <strong className="gm-money" data-testid="payment-saldo-devedor">{formatarPreco(saldoDevedor)}</strong>
              </div>
              {valorJaPago > 0 && (
                <div className="gm-balance-sub">
                  <span>Total da comanda <b className="gm-money">{formatarPreco(totalPedido)}</b></span>
                  <span>Já pago <b className="gm-money">{formatarPreco(valorJaPago)}</b></span>
                </div>
              )}
              <div className="gm-progress" aria-hidden="true"><span style={{ width: `${progresso}%` }} /></div>
              <small className="gm-help">
                {restaAposConfirmar > 0.009
                  ? <>Após confirmar, restará <b>{formatarPreco(restaAposConfirmar)}</b> em aberto (pagamento parcial).</>
                  : 'Valor completo coberto — a comanda será finalizada.'}
              </small>
            </div>

            <div className="gm-step-title"><span>1</span> Escolha a forma de pagamento</div>
            <div className="gm-methods" role="radiogroup" aria-label="Forma de pagamento">
              {FORMAS_PAGAMENTO.map((f) => {
                const bloqueado = f.needsClienteCadastrado && !clienteTemCadastro;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={formaPagamento === f.id}
                    key={f.id}
                    disabled={bloqueado}
                    className={`gm-method method-${f.id} ${formaPagamento === f.id ? 'selected' : ''}`}
                    onClick={() => selecionarForma(f)}
                    title={bloqueado ? 'Selecione um cliente cadastrado para vender a prazo' : f.nome}
                    data-testid={`payment-method-${f.id}`}
                  >
                    <span className="gm-method-icon"><i className={f.icone} aria-hidden="true" /></span>
                    <span className="gm-method-text">
                      <b>{f.nome}</b>
                      <small>{bloqueado ? 'Requer cliente cadastrado' : f.descricao}</small>
                    </span>
                    <i className={`gm-method-check fas ${formaPagamento === f.id ? 'fa-circle-check' : 'fa-circle'}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {pagamentosAdicionados.length > 0 && (
              <div className="gm-split-list" data-testid="payment-split-list">
                <div className="gm-step-title small">Formas já lançadas</div>
                {pagamentosAdicionados.map((p) => (
                  <div key={p.id} className="gm-split-item">
                    <span><i className={FORMAS_PAGAMENTO.find(f => f.id === p.formaPagamento)?.icone} aria-hidden="true" /> {p.nome}</span>
                    <b className="gm-money">{formatarPreco(p.valorAPagarAgora)}</b>
                    <button type="button" className="gm-mini-x" onClick={() => handleRemoverForma(p.id)} aria-label={`Remover ${p.nome}`} data-testid={`payment-split-remove-${p.formaPagamento}`}>
                      <i className="fas fa-times" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="gm-pay-right">
            <div className="gm-step-title"><span>2</span> Informe os valores — {forma.nome}</div>

            <CampoValor
              id="gm-valor-agora"
              label="Valor a pagar agora"
              ajuda={pagamentosAdicionados.length > 0 ? `Restante a lançar: ${formatarPreco(saldoRestanteParaAlocar)}` : 'Diminua o valor para receber só uma parte ou dividir entre formas.'}
              value={valorAPagarAgora}
              onChange={alterarValorAgora}
              testId="payment-amount-now-input"
              destaque
            />
            <div className="gm-quick">
              <button type="button" onClick={() => alterarValorAgora(fmt(saldoRestanteParaAlocar))} data-testid="payment-quick-total">Saldo total</button>
              <button type="button" onClick={() => alterarValorAgora(fmt(saldoRestanteParaAlocar / 2))} data-testid="payment-quick-half">Metade</button>
            </div>

            {forma.requiresValue && (
              <>
                <CampoValor
                  id="gm-valor-recebido"
                  label="Valor recebido do cliente"
                  ajuda="Quanto o cliente entregou em dinheiro."
                  value={valorPago}
                  onChange={alterarRecebido}
                  testId="payment-cash-received-input"
                />
                <div className="gm-quick" aria-label="Valores rápidos em dinheiro">
                  {sugestoesDinheiro(valorAgoraNum).map((v, i) => (
                    <button type="button" key={v} onClick={() => alterarRecebido(fmt(v))} className={paraNumero(valorPago) === v ? 'active' : ''} data-testid={`payment-cash-quick-${i}`}>
                      {i === 0 ? 'Exato' : formatarPreco(v)}
                    </button>
                  ))}
                </div>
                <div className={`gm-change ${faltaReceber > 0 ? 'warn' : ''}`} data-testid="payment-change-display">
                  <i className={`fas ${faltaReceber > 0 ? 'fa-triangle-exclamation' : 'fa-coins'}`} aria-hidden="true" />
                  <span>{faltaReceber > 0 ? 'Faltam receber' : 'Troco a devolver'}</span>
                  <strong className="gm-money">{formatarPreco(faltaReceber > 0 ? faltaReceber : valorTroco)}</strong>
                </div>
              </>
            )}

            {forma.allowsParcelamento && (
              <div className="gm-field">
                <label>Parcelamento</label>
                <div className="gm-installments">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button key={n} type="button" className={parcelas === n ? 'active' : ''} onClick={() => setParcelas(n)} data-testid={`payment-installment-${n}`}>
                      <b>{n}x</b><small>{n === 1 ? 'à vista' : formatarPreco(valorAgoraNum / n)}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formaPagamento === 'pix' && (
              <p className="gm-info"><i className="fas fa-circle-info" aria-hidden="true" /> Confira o comprovante PIX antes de confirmar.</p>
            )}

            <div className="gm-field">
              <label htmlFor="gm-obs-pagamento">
                Observações {forma.requiresObservation ? <em>obrigatório</em> : <small>opcional</small>}
              </label>
              <textarea
                id="gm-obs-pagamento"
                placeholder={forma.requiresObservation ? 'Ex.: vence dia 10, pagar na próxima visita…' : 'Ex.: NSU da maquininha, nome no PIX…'}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows="2"
                data-testid="payment-notes-input"
              />
            </div>

            {saldoRestanteParaAlocar - valorAgoraNum > 0.01 && valorAgoraNum > 0 && (
              <button type="button" className="gm-btn gm-btn-dashed" onClick={handleAdicionarForma} data-testid="payment-add-method-button">
                <i className="fas fa-plus" aria-hidden="true" /> Lançar {formatarPreco(valorAgoraNum)} em {forma.nome} e dividir o restante
              </button>
            )}

            {erro && <div className="gm-alert" role="alert" data-testid="payment-error">{erro}</div>}
          </section>
        </div>

        <footer className="gm-modal-foot">
          <div className="gm-foot-summary">
            <small>Pagando agora</small>
            <strong className="gm-money" data-testid="payment-total-now">{formatarPreco(totalPagandoAgora)}</strong>
            {formaPagamento === 'cartao_credito' && parcelas > 1 && valorAgoraNum > 0 && <small>{parcelas}x de {formatarPreco(valorAgoraNum / parcelas)}</small>}
          </div>
          <button className="gm-btn gm-btn-ghost gm-btn-lg" onClick={onClose} disabled={loading} data-testid="payment-cancel-button">Cancelar <kbd>Esc</kbd></button>
          <button className="gm-btn gm-btn-primary gm-btn-lg gm-btn-confirm" onClick={handleProcessar} disabled={loading} data-testid="confirm-payment-button">
            {loading ? <><i className="fas fa-spinner fa-spin" aria-hidden="true" /> Processando…</> : <><i className="fas fa-check" aria-hidden="true" /> {restaAposConfirmar > 0.009 ? 'Confirmar pagamento parcial' : 'Confirmar pagamento'}</>}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModalPagamento;
