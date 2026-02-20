// src/components/Pedidos/ItemCarrinho.jsx
// 🛒 COMPONENTE: Exibe um item do carrinho com opções de editar/remover

import React, { useState, useEffect } from 'react'; // ← ADICIONAR useEffect

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
  onAlterarQuantidade,     // Função para alterar quantidade
  onIncrementar,           // 🆕 Incrementar quantidade
  onDecrementar            // 🆕 Decrementar quantidade
}) => {
  
  // ========================================
  // 📊 ESTADOS LOCAIS
  // ========================================
  
  const [quantidadeTemp, setQuantidadeTemp] = useState(item.quantidade);

  // ========================================
  // 🔄 SINCRONIZAÇÃO DE ESTADO
  // ========================================
  
  /**
   * 🆕 Sincroniza quantidadeTemp quando item.quantidade mudar
   * Isso garante que o input visual acompanhe as mudanças dos botões + e -
   */
  useEffect(() => {
    setQuantidadeTemp(item.quantidade);
  }, [item.quantidade]);

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

  /**
   * Handler para quando o usuário digita no input de quantidade
   */
  const handleQuantidadeChange = (e) => {
    const valor = e.target.value;
    
    // Permite digitar (inclusive string vazia para poder apagar)
    setQuantidadeTemp(valor);
  };

  /**
   * Handler para quando o input perde o foco (blur)
   * Valida e aplica a quantidade
   */
  const handleQuantidadeBlur = () => {
    let novaQuantidade = parseFloat(quantidadeTemp);
    
    // Validações
    if (isNaN(novaQuantidade) || novaQuantidade < 0.01) {
      novaQuantidade = 0.01; // Quantidade mínima
    }
    
    // Arredonda para 2 casas decimais (para peso)
    novaQuantidade = Math.round(novaQuantidade * 100) / 100;
    
    setQuantidadeTemp(novaQuantidade);
    onAlterarQuantidade(index, novaQuantidade);
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
   * Verifica se é categoria que permite quantidade decimal (sorvete)
   */
  const permiteDecimal = () => {
    // Ajuste essas condições conforme suas categorias
    const categoriasComPeso = ['sorvete', 'sorvetes', 'açaí'];
    return categoriasComPeso.some(cat => 
      item.categoria_nome?.toLowerCase().includes(cat)
    );
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
            onDecrementar(index);
          }}
          title="Diminuir quantidade"
        >
          -
        </button>
        
        {/* ✅ INPUT EDITÁVEL DE QUANTIDADE */}
        <input
          type="text"
          className="quantidade-input"
          value={quantidadeTemp}
          onChange={handleQuantidadeChange}
          onBlur={handleQuantidadeBlur}
          onKeyPress={handleQuantidadeKeyPress}
          onClick={pararPropagacao}
          onFocus={(e) => {
            pararPropagacao(e);
            e.target.select(); // Seleciona todo o texto ao focar
          }}
          title={permiteDecimal() ? "Digite a quantidade (kg/unidades)" : "Digite a quantidade"}
        />
        
        <button
          className="btn-qty-small"
          onClick={(e) => {
            pararPropagacao(e);
            onIncrementar(index);
          }}
          title="Aumentar quantidade"
        >
          +
        </button>
        
        {/* ✅ Label indicativa para sorvetes */}
        {permiteDecimal() && (
          <span className="unidade-medida">kg</span>
        )}
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
        {item.adicionais && 
          Array.isArray(item.adicionais) && 
          item.adicionais?.length > 0 && (
            <div className="item-adicionais">
              {item.adicionais.flatMap((adicional, idx) => 
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