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

  return (
    <div className="produtos-area">
      
      {/* ── ABAS DE CATEGORIAS ── */}
      <div className="categorias-tabs">
        <button
          className={`categoria-tab ${categoriaAtiva === "" ? "active" : ""}`}
          onClick={() => onCategoriaChange("")}
        >
          Todos
        </button>
        
        {categorias.map((categoria) => (
          <button
            key={categoria}
            className={`categoria-tab ${categoriaAtiva === categoria ? "active" : ""}`}
            onClick={() => onCategoriaChange(categoria)}
          >
            {categoria}
          </button>
        ))}
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
              const thumbUrl = produtoService.getThumbUrl(produto.imagem);
              
              return (
                <div
                  key={produto.id}
                  className={`produto-item ${thumbUrl? 'com-imagem' : ''}`}
                  onClick={() => onProdutoClick(produto)}
                >
                  {/* 📸 Thumbnail do produto */}
                  {thumbUrl? (
                    <div className="produto-item-thumb">
                      <img
                        src={thumbUrl}
                        alt={produto.nome}
                        loading="lazy"
                        onError={(e) => {
                          // Se a imagem falhar, esconde e mostra só texto
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="produto-item-icon">
                      <i className="fas fa-ice-cream"></i>
                    </div>
                  )}

                  <div className="produto-item-info">
                    <div className="produto-nome">{produto.nome}</div>
                    <div className="produto-preco">
                      {formatarPreco(produto.preco)}
                    </div>
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
