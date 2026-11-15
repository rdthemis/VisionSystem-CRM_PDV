import React, { useState, useEffect } from 'react';
import { ehProdutoPorPeso, arredondarQuantidadePeso } from '../../utils/produtoPorPeso';

const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
const parar = (e) => e.stopPropagation();

const ItemCarrinho = ({ item, index, onEditar, onAlterarQuantidade, onIncrementar, onDecrementar }) => {
  const porPeso = ehProdutoPorPeso(item.categoria_nome);

  const formatarQuantidade = (quantidade) => {
    const valor = Number(quantidade);
    if (!Number.isFinite(valor)) return quantidade ?? '';
    return porPeso ? String(valor) : String(Math.round(valor));
  };

  const [quantidadeTemp, setQuantidadeTemp] = useState(() => formatarQuantidade(item.quantidade));

  useEffect(() => {
    setQuantidadeTemp(formatarQuantidade(item.quantidade));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.quantidade]);

  const aplicarQuantidade = () => {
    const minimo = porPeso ? 0.001 : 1;
    let nova = parseFloat(quantidadeTemp);
    if (isNaN(nova) || nova < minimo) nova = minimo;
    nova = porPeso ? arredondarQuantidadePeso(nova) : Math.round(nova);
    setQuantidadeTemp(nova);
    onAlterarQuantidade(index, nova);
  };

  const adicionais = Array.isArray(item.adicionais) ? item.adicionais : [];

  return (
    <div className="gm-cart-item" onClick={() => onEditar(index)} title="Clique para editar este item" data-testid={`cart-item-${index}`}>
      <div className="gm-cart-item-main">
        <button className="gm-cart-item-name" onClick={(e) => { parar(e); onEditar(index); }} aria-label={`Editar ${item.produto_nome}`} data-testid={`cart-item-edit-${index}`}>
          {item.produto_nome}
          <small>{formatarPreco(item.preco_produto)} {porPeso ? '/ kg' : 'cada'} · <u>editar</u></small>
        </button>
        <strong className="gm-money gm-cart-item-total" data-testid={`cart-item-subtotal-${index}`}>{formatarPreco(item.subtotal)}</strong>
      </div>

      {adicionais.length > 0 && (
        <div className="gm-tags">
          {adicionais.flatMap((adicional, idx) =>
            Array.from({ length: adicional.quantidade || 1 }, (_, i) => (
              <span key={`${idx}-${i}`} className="gm-tag">
                + {adicional.nome}{adicional.preco > 0 && <b> {formatarPreco(adicional.preco)}</b>}
              </span>
            ))
          )}
        </div>
      )}

      {item.observacoes && <p className="gm-cart-item-note"><i className="far fa-comment" aria-hidden="true" /> {item.observacoes}</p>}

      <div className="gm-stepper" onClick={parar}>
        <button onClick={(e) => { parar(e); onDecrementar(index); }} aria-label={`Diminuir quantidade de ${item.produto_nome}`} title="Diminuir quantidade" data-testid={`cart-item-decrease-${index}`}>
          <i className="fas fa-minus" aria-hidden="true" />
        </button>
        <input
          type="text"
          aria-label={`Quantidade de ${item.produto_nome}`}
          inputMode={porPeso ? 'decimal' : 'numeric'}
          value={quantidadeTemp}
          onChange={(e) => setQuantidadeTemp(e.target.value.replace(',', '.'))}
          onBlur={aplicarQuantidade}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          onClick={parar}
          onFocus={(e) => { parar(e); e.target.select(); }}
          title={porPeso ? 'Quantidade em kg (até 3 casas decimais)' : 'Quantidade inteira'}
          data-testid={`cart-item-qty-${index}`}
        />
        <button onClick={(e) => { parar(e); onIncrementar(index); }} aria-label={`Aumentar quantidade de ${item.produto_nome}`} title="Aumentar quantidade" data-testid={`cart-item-increase-${index}`}>
          <i className="fas fa-plus" aria-hidden="true" />
        </button>
        <span className="gm-stepper-unit">{porPeso ? 'kg' : 'un.'}</span>
      </div>
    </div>
  );
};

export default ItemCarrinho;
