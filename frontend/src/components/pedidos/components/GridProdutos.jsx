import React, { useEffect, useRef } from 'react';
import produtoService from '../../../services/produtosService';

const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
const slug = (texto) => normalizar(texto).replace(/[^a-z0-9]+/g, '-');

const iconeCategoria = (categoria = '') => {
  const nome = normalizar(categoria);
  if (nome.includes('pizza')) return 'fa-pizza-slice';
  if (nome.includes('lanche') || nome.includes('hamb')) return 'fa-burger';
  if (nome.includes('bebida') || nome.includes('refri') || nome.includes('suco')) return 'fa-glass-water';
  if (nome.includes('aca')) return 'fa-bowl-food';
  if (nome.includes('doce') || nome.includes('sobremesa')) return 'fa-cake-candles';
  if (nome.includes('combo')) return 'fa-tags';
  if (nome.includes('picole')) return 'fa-candy-cane';
  return 'fa-ice-cream';
};

const CardProduto = ({ produto, onClick }) => {
  const imagemUrl = produtoService.getImagemUrl(produto.imagem);
  const abrir = () => onClick(produto);
  return (
    <div
      className="gm-product"
      onClick={abrir}
      role="button"
      tabIndex={0}
      data-testid={`product-card-${produto.id}`}
      aria-label={`Adicionar ${produto.nome}, ${formatarPreco(produto.preco)}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } }}
    >
      <div className="gm-product-media">
        {imagemUrl && <img src={imagemUrl} alt={produto.nome} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />}
        <i className={`fas ${iconeCategoria(produto.categoria_nome)}`} aria-hidden="true" />
        <span className="gm-product-code">#{produto.id}</span>
      </div>
      <div className="gm-product-info">
        <span className="gm-product-name">{produto.nome}</span>
        {produto.descricao && <span className="gm-product-desc">{produto.descricao}</span>}
        <div className="gm-product-foot">
          <strong className="gm-money">{formatarPreco(produto.preco)}</strong>
          <span className="gm-product-add" aria-hidden="true"><i className="fas fa-plus" /></span>
        </div>
      </div>
    </div>
  );
};

const GridProdutos = ({
  produtos, categorias, categoriaAtiva, busca, codigoBusca,
  onCategoriaChange, onBuscaChange, onCodigoChange, onBuscarPorCodigo, onProdutoClick
}) => {
  const buscaRef = useRef(null);
  useEffect(() => {
    const buscar = (event) => {
      if (event.key === 'F2' && !document.querySelector('[role="dialog"], .modal-overlay, .modal-produto-overlay')) {
        event.preventDefault(); buscaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', buscar);
    return () => window.removeEventListener('keydown', buscar);
  }, []);

  const limparFiltros = () => { onBuscaChange(''); onCodigoChange(''); onCategoriaChange(''); buscaRef.current?.focus(); };

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = !categoriaAtiva || produto.categoria_nome === categoriaAtiva;
    const matchBusca = !normalizar(busca) || normalizar(`${produto.nome} ${produto.descricao || ''}`).includes(normalizar(busca));
    const matchCodigo = !codigoBusca || String(produto.id) === codigoBusca.trim();
    return matchCategoria && matchBusca && matchCodigo;
  });

  const contarCategoria = (cat) => produtos.filter(p => p.categoria_nome === cat).length;

  return (
    <section className="gm-catalog" data-testid="product-catalog">
      <div className="gm-catalog-search">
        <div className="gm-field gm-field-grow">
          <label htmlFor="gm-busca-produto">Buscar produto <kbd>F2</kbd></label>
          <div className="gm-input-icon">
            <i className="fas fa-search" aria-hidden="true" />
            <input
              id="gm-busca-produto"
              ref={buscaRef}
              type="search"
              aria-label="Buscar produto por nome ou descrição"
              placeholder="Nome ou descrição, ex.: açaí, casquinha…"
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              data-testid="search-product-input"
            />
          </div>
        </div>
        <div className="gm-field gm-field-code">
          <label htmlFor="gm-codigo-produto">Código</label>
          <div className="gm-input-action">
            <input
              id="gm-codigo-produto"
              type="text"
              aria-label="Código do produto"
              placeholder="Ex.: 12"
              inputMode="numeric"
              value={codigoBusca}
              onChange={(e) => onCodigoChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onBuscarPorCodigo(); }}
              data-testid="product-code-input"
            />
            <button className="gm-btn gm-btn-soft" onClick={onBuscarPorCodigo} aria-label="Adicionar por código" data-testid="add-by-code-button">
              <i className="fas fa-arrow-turn-down fa-rotate-90" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="gm-chips" aria-label="Filtrar produtos por categoria">
        <button aria-pressed={categoriaAtiva === ''} className="gm-chip" onClick={() => onCategoriaChange('')} data-testid="category-tab-todos">
          <i className="fas fa-border-all" aria-hidden="true" /> Todos <span className="gm-count">{produtos.length}</span>
        </button>
        {categorias.map((categoria) => (
          <button key={categoria} aria-pressed={categoriaAtiva === categoria} className="gm-chip" onClick={() => onCategoriaChange(categoria)} title={categoria} data-testid={`category-tab-${slug(categoria)}`}>
            <i className={`fas ${iconeCategoria(categoria)}`} aria-hidden="true" /> {categoria} <span className="gm-count">{contarCategoria(categoria)}</span>
          </button>
        ))}
      </div>

      <div className="gm-catalog-head">
        <h3>{categoriaAtiva || 'Todos os produtos'} <span role="status">{produtosFiltrados.length} disponíveis</span></h3>
        {(busca || codigoBusca || categoriaAtiva) && <button className="gm-link" onClick={limparFiltros} data-testid="clear-filters-button">Limpar filtros</button>}
      </div>

      <div className="gm-catalog-scroll">
        {produtosFiltrados.length === 0 ? (
          <div className="gm-empty compact" data-testid="products-empty">
            <span className="gm-empty-icon"><i className="fas fa-search" aria-hidden="true" /></span>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente buscar com outro termo ou outra categoria.</p>
          </div>
        ) : (
          <div className="gm-products-grid">
            {produtosFiltrados.map((produto) => <CardProduto key={produto.id} produto={produto} onClick={onProdutoClick} />)}
          </div>
        )}
      </div>
    </section>
  );
};

export default GridProdutos;
