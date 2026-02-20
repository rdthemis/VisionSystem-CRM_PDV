// src/components/Pedidos/components/ListaPedidos.jsx
// 📋 COMPONENTE: Exibe a lista de pedidos finalizados

import React from 'react';

/**
 * Componente que mostra todos os pedidos finalizados
 * 
 * @param {Array} pedidos - Lista de pedidos
 * @param {Function} onVerDetalhes - Função para ver detalhes de um pedido
 * @param {Function} onEditar - Função para editar um pedido
 * @param {Function} onNovoPedido - Função para criar novo pedido
 */
const ListaPedidos = ({ pedidos, onVerDetalhes, onEditar, onNovoPedido }) => {
  
  // ========================================
  // 🔧 FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Formata a data para exibição brasileira
   */
  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Retorna a classe CSS baseada no status
   */
  const getClasseStatus = (status) => {
    return `pedido-status ${status.toLowerCase().replace(' ', '-')}`;
  };

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  return (
    <div className="lista-pedidos-container">
      
      {/* CABEÇALHO COM BOTÃO DE NOVO PEDIDO */}
      <div className="comandas-header">
        <button 
          className="btn-nova-comanda" 
          onClick={onNovoPedido}
        >
          <i className="fas fa-plus"></i>
          Nova Comanda
        </button>

        <div className="busca-container">
          <i className="fas fa-search busca-icon"></i>
          <input
            type="text"
            placeholder="Procurar pedido"
            className="busca-input"
          />
        </div>
      </div>

      {/* LISTA DE PEDIDOS */}
      <div className="lista-pedidos-finalizados">
        <h3>Pedidos Finalizados ({pedidos.length})</h3>
        
        {pedidos.length === 0 ? (
          // Mensagem quando não há pedidos
          <div className="sem-pedidos">
            <i className="fas fa-inbox"></i>
            <p>Nenhum pedido finalizado ainda</p>
            <small>Clique em "Nova Comanda" para começar</small>
          </div>
        ) : (
          // Grid com os pedidos
          <div className="pedidos-grid">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="pedido-card" onClick={() => onEditar(pedido)}>
                
                {/* Cabeçalho do Card */}
                <div className="pedido-card-header" >
                  <span className="pedido-numero">#{pedido.id}</span>
                  <span className={getClasseStatus(pedido.status)}>
                    {pedido.status}
                  </span>
                </div>
                
                {/* Informações do Pedido */}
                <div className="pedido-card-body">
                  <div className="pedido-cliente">
                    <i className="fas fa-user"></i> 
                    {pedido.cliente_nome || pedido.cliente || 'Cliente não informado'}
                  </div>
                  {/*}
                  <div className="pedido-itens-count">
                    <i className="fas fa-shopping-bag"></i> 
                    {pedido.itens?.length || 0} {(pedido.itens?.length || 0) === 1 ? 'item' : 'itens'}
                  </div>*/}
                  
                  <div className="pedido-data">
                    <i className="fas fa-clock"></i> 
                    {formatarData(pedido.data || pedido.created_at)}
                  </div>
                </div>
                
                {/* Total */}
                <div className="pedido-card-footer">
                  <span className="pedido-total">
                    Total: R$ {pedido.total}
                  </span>
                </div>
                
                {/* Ações
                <div className="pedido-card-actions">
                  <button 
                    className="btn-editar-pedido"
                    onClick={() => onEditar(pedido)}
                    title="Editar pedido"
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  <button 
                    className="btn-ver-detalhes"
                    onClick={() => onVerDetalhes(pedido)}
                    title="Ver detalhes"
                  >
                    <i className="fas fa-eye"></i> Detalhes
                  </button>
                </div>
                */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaPedidos;