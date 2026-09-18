// src/components/pedidos/components/GridProdutos.jsx
// 🍕 COMPONENTE: Grade de produtos com imagens, categorias e busca

import React from 'react';
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

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = !categoriaAtiva || produto.categoria_nome === categoriaAtiva;
    const matchBusca = !busca || produto.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCodigo = !codigoBusca || produto.id.toString() === codigoBusca;
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
      <div className="categorias-tabs">
        <button
          className={`categoria-tab ${categoriaAtiva === "" ? "active" : ""}`}
          onClick={() => onCategoriaChange("")}
        >
          <span aria-hidden="true">▦</span> Todos
        </button>
        
        {categorias.map((categoria) => (
          <button
            key={categoria}
            className={`categoria-tab ${categoriaAtiva === categoria ? "active" : ""}`}
            onClick={() => onCategoriaChange(categoria)}
          >
            <span aria-hidden="true">{iconeCategoria(categoria)}</span> {categoria}
          </button>
        ))}
      </div>

      <div className="produtos-section-title">
        <h3>Todos os produtos</h3>
        <span>{produtosFiltrados.length} disponíveis</span>
      </div>

      {/* ── BARRA DE BUSCA ── */}
      <div className="busca-produtos">
        <div className="busca-controls">
          <div className="busca-input-group">
            <i className="fas fa-search busca-icon"></i>
            <input
              type="text"
              placeholder="Busca pelo nome do produto"
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              className="busca-produto-input"
            />
          </div>
          
          <input
            type="text"
            placeholder="Código"
            value={codigoBusca}
            onChange={(e) => onCodigoChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="codigo-input"
          />
          
          <button className="btn-busca" onClick={onBuscarPorCodigo}>
            Buscar
          </button>
        </div>
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
                    {/* <span className="produto-adicionar"><i className="fas fa-plus"></i> Adicionar</span> */}
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
