// src/components/Pedidos/components/GridProdutos.jsx
// 🍕 COMPONENTE: Grade de produtos com categorias e busca

import React from 'react';

/**
 * Componente que exibe os produtos disponíveis
 * Permite filtrar por categoria e buscar por nome/código
 * 
 * @param {Object} props - Propriedades do componente
 */
const GridProdutos = ({
  produtos,              // Lista de produtos
  categorias,            // Lista de categorias
  categoriaAtiva,        // Categoria selecionada
  busca,                 // Termo de busca
  codigoBusca,           // Código para buscar
  onCategoriaChange,     // Mudar categoria
  onBuscaChange,         // Mudar busca
  onCodigoChange,        // Mudar código
  onBuscarPorCodigo,     // Buscar por código
  onProdutoClick         // Quando clica em um produto
}) => {

  // ========================================
  // 🔧 FUNÇÕES AUXILIARES
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
   * Filtra produtos baseado em categoria, busca e código
   */
  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = !categoriaAtiva || produto.categoria_nome === categoriaAtiva;
    const matchBusca = !busca || produto.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCodigo = !codigoBusca || produto.id.toString() === codigoBusca;
    return matchCategoria && matchBusca && matchCodigo;
  });

  /**
   * Handler para Enter na busca por código
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onBuscarPorCodigo();
    }
  };

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  return (
    <div className="produtos-area">
      
      {/* ========================================
          ABAS DE CATEGORIAS
      ======================================== */}
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

      {/* ========================================
          BARRA DE BUSCA
      ======================================== */}
      <div className="busca-produtos">
        <div className="busca-controls">
          
          {/* Busca por nome */}
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
          
          {/* Busca por código */}
          <input
            type="text"
            placeholder="Código"
            value={codigoBusca}
            onChange={(e) => onCodigoChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="codigo-input"
          />
          
          <button 
            className="btn-busca" 
            onClick={onBuscarPorCodigo}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* ========================================
          GRID DE PRODUTOS
      ======================================== */}
      <div className="produtos-scroll-area">
        <div className="produtos-grid">
          
          {produtosFiltrados.length === 0 ? (
            // Mensagem quando não encontra produtos
            <div className="sem-produtos">
              <i className="fas fa-search"></i>
              <p>Nenhum produto encontrado</p>
              <small>Tente buscar com outro termo</small>
            </div>
          ) : (
            // Lista de produtos
            produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                className="produto-item"
                onClick={() => onProdutoClick(produto)}
              >
                <div className="produto-nome">{produto.nome}</div>
                <div className="produto-preco">
                  {formatarPreco(produto.preco)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GridProdutos;