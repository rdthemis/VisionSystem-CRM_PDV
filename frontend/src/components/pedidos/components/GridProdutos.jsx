// src/components/pedidos/components/GridProdutos.jsx
// 🍕 COMPONENTE: Grade de produtos com imagens, categorias e busca

import React, { useEffect, useRef } from 'react';
import produtoService from '../../../services/produtosService';

const GridProdutos = ({
  produtos,
  categorias,
  categoriaAtiva,
  busca,
  codigoBusca,
  onCategoriaChange,
  onBuscaChange,
  onCodigoChange,
  onBuscarPorCodigo,
  onProdutoClick
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
  const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const limparFiltros = () => { onBuscaChange(''); onCodigoChange(''); onCategoriaChange(''); buscaRef.current?.focus(); };

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = !categoriaAtiva || produto.categoria_nome === categoriaAtiva;
    const matchBusca = !normalizar(busca) || normalizar(`${produto.nome} ${produto.descricao || ''}`).includes(normalizar(busca));
    const matchCodigo = !codigoBusca || String(produto.id) === codigoBusca.trim();
    return matchCategoria && matchBusca && matchCodigo;
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onBuscarPorCodigo();
    }
  };

  const iconeCategoria = (categoria = '') => {
    const nome = categoria.toLowerCase();
    if (nome.includes('pizza')) return '🍕';
    if (nome.includes('lanche') || nome.includes('hamb')) return '🍔';
    if (nome.includes('bebida') || nome.includes('refri')) return '🥤';
    if (nome.includes('aça')) return '🍨';
    if (nome.includes('doce') || nome.includes('sobremesa')) return '🧁';
    if (nome.includes('combo')) return '🏷️';
    return '🍦';
  };

  return (
    <div className="produtos-area">
      <div className="produtos-area-heading">
        <div>
          <span className="produtos-area-eyebrow">Catálogo</span>
          <h2>Selecione os produtos</h2>
        </div>
        <span className="produtos-area-count">{produtosFiltrados.length} itens</span>
      </div>
      
      {/* ── ABAS DE CATEGORIAS ── */}
      <div className="categorias-tabs" aria-label="Filtrar produtos por categoria">
        <button
          aria-pressed={categoriaAtiva === ""}
          className={`categoria-tab ${categoriaAtiva === "" ? "active" : ""}`}
          onClick={() => onCategoriaChange("")}
        >
          <span aria-hidden="true">▦</span>
          <span className="categoria-tab-label">Todos</span>
        </button>
        
        {categorias.map((categoria) => (
          <button
            key={categoria}
            aria-pressed={categoriaAtiva === categoria}
            className={`categoria-tab ${categoriaAtiva === categoria ? "active" : ""}`}
            onClick={() => onCategoriaChange(categoria)}
            title={categoria}
          >
            <span aria-hidden="true">{iconeCategoria(categoria)}</span>
            <span className="categoria-tab-label">{categoria}</span>
          </button>
        ))}
      </div>

      <div className="produtos-section-title">
        <h3>{categoriaAtiva || 'Todos os produtos'}</h3>
        <span role="status">{produtosFiltrados.length} disponíveis</span>
      </div>

      {/* ── BARRA DE BUSCA ── */}
      <div className="busca-produtos">
        <div className="busca-controls">
          <div className="busca-input-group">
            <i className="fas fa-search busca-icon"></i>
            <input
              ref={buscaRef}
              type="search"
              aria-label="Buscar produto por nome ou descrição"
              placeholder="Buscar produto por nome ou descrição (F2)"
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              className="busca-produto-input"
            />
          </div>
          
          <input
            type="text"
            aria-label="Código do produto"
            placeholder="Código"
            inputMode="numeric"
            value={codigoBusca}
            onChange={(e) => onCodigoChange(e.target.value)}
            onKeyDown={handleKeyPress}
            className="codigo-input"
          />
          
          <button className="btn-busca" onClick={onBuscarPorCodigo}>
            Adicionar por código
          </button>
        </div>
        {(busca || codigoBusca || categoriaAtiva) && <button className="pdv-clear-filters" onClick={limparFiltros}>Limpar filtros</button>}
      </div>

      {/* ── GRID DE PRODUTOS ── */}
      <div className="produtos-scroll-area">
        <div className="produtos-grid">
          
          {produtosFiltrados.length === 0 ? (
            <div className="sem-produtos">
              <i className="fas fa-search"></i>
              <p>Nenhum produto encontrado</p>
              <small>Tente buscar com outro termo</small>
            </div>
          ) : (
            produtosFiltrados.map((produto) => {
              const imagemUrl = produtoService.getImagemUrl(produto.imagem);
              
              return (
                <div
                  key={produto.id}
                  className={`produto-item ${imagemUrl? 'com-imagem' : ''}`}
                  onClick={() => onProdutoClick(produto)}
                  role="button"
                  aria-label={`Adicionar ${produto.nome}, ${formatarPreco(produto.preco)}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onProdutoClick(produto);
                    }
                  }}
                >
                  {/* 📸 Thumbnail do produto */}
                  {imagemUrl? (
                    <div className="produto-item-thumb">
                      <img
                        src={imagemUrl}
                        alt={produto.nome}
                        loading="lazy"
                        onError={(e) => {
                          // Se a imagem falhar, esconde e mostra só texto
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                    {/*
                    <div className="produto-item-icon">
                      <i className="fas fa-ice-cream"></i>
                    </div>
                    */}
                    </div>
                  )}

                  <div className="produto-item-info">
                    <div className="produto-nome">{produto.nome}</div>
                    <div className="produto-preco">
                      {formatarPreco(produto.preco)}
                    </div>
<span className="produto-adicionar"><i className="fas fa-plus" aria-hidden="true"></i> Adicionar</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GridProdutos;
