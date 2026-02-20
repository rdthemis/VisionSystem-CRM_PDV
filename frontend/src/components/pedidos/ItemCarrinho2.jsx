// src/components/Pedidos/ItemCarrinho.jsx
// 🛒 COMPONENTE: Exibe um item do carrinho com opções de editar/remover

import React from 'react';

/**
 * Componente que representa um item individual do carrinho
 * Permite editar quantidade, editar detalhes e remover
 * 
 * @param {Object} props - Propriedades do componente
 */
const ItemCarrinho = ({
  item,                    // Dados do item
  index,                   // Índice no array do carrinho
  onEditar,                // Função para editar o item
  onRemover,               // Função para remover o item
  onAlterarQuantidade      // Função para alterar quantidade
}) => {
  
  // ========================================
  // 🔧 FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Formata preço para exibição em reais
   */
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  /**
   * Previne propagação de eventos (evita abrir modal ao clicar em botões)
   */
  const pararPropagacao = (e) => {
    e.stopPropagation();
  };

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  return (
    <div 
      className="pedido-item pedido-item-editavel"
      onClick={() => onEditar(index)}
      title="Clique para editar este item"
    >
      {/* CONTROLES DE QUANTIDADE */}
      <div className="item-quantidade-control">
        <button
          className="btn-qty-small"
          onClick={(e) => {
            pararPropagacao(e);
            onAlterarQuantidade(index, item.quantidade - 1);
          }}
          title="Diminuir quantidade"
        >
          -
        </button>
        
        <span className="quantidade">{item.quantidade}</span>
        
        <button
          className="btn-qty-small"
          onClick={(e) => {
            pararPropagacao(e);
            onAlterarQuantidade(index, item.quantidade + 1);
          }}
          title="Aumentar quantidade"
        >
          +
        </button>
      </div>

      {/* DETALHES DO ITEM */}
      <div className="item-detalhes">
        {/* Nome do produto com ícone de edição */}
        <div className="item-nome">
          {item.produto_nome} - {formatarPreco(item.preco_produto)}
          <span className="item-edit-hint">
            <i className="fas fa-edit"></i>
          </span>
        </div>

        {/* Adicionais (se houver) */}
        {/**
        {item.adicionais && 
          Array.isArray(item.adicionais) && 
          item.adicionais?.length > 0 && (
            <div className="item-adicionais">
              {item.adicionais.map((adicional, idx) => (
                <span key={idx} className="adicional-tag">
                  {adicional.quantidade > 1 && (
                    <strong>{adicional.quantidade}x </strong>
                  )}
                  + {adicional.nome}
                  {adicional.preco > 0 && (
                    <strong className="adicional-preco">
                      {' '}(R$ {adicional.preco.toFixed(2)})
                    </strong>
                  )}
                </span>
              ))}
            </div>
          )
        }
        */}
        {/* Adicionais (se houver) */}
        {item.adicionais && 
          Array.isArray(item.adicionais) && 
          item.adicionais?.length > 0 && (
            <div className="item-adicionais">
              {item.adicionais.flatMap((adicional, idx) => 
                // Cria um array com o adicional repetido 'quantidade' vezes
                Array.from({ length: adicional.quantidade || 1 }, (_, i) => (
                  <span key={`${idx}-${i}`} className="adicional-tag">
                    + {adicional.nome}
                    {adicional.preco > 0 && (
                    <strong className="adicional-preco">
                      {' '}(R$ {adicional.preco.toFixed(2)})
                    </strong>
                  )}
                  </span>
                ))
              )}
            </div>
          )
        }

        {/* Observações (se houver) */}
        {item.observacoes && (
          <div className="item-observacoes">
            <i className="fas fa-comment"></i> {item.observacoes}
          </div>
        )}
      </div>

      {/* AÇÕES (Valor e Remover) */}
      <div className="item-actions">
        <div className="item-valor">
          {formatarPreco(item.subtotal)}
        </div>
        
        <button
          className="btn-remove-item"
          onClick={(e) => {
            pararPropagacao(e);
            onRemover(index);
          }}
          title="Remover item"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default ItemCarrinho;