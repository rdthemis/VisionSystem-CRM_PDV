// src/components/Pedidos/ModalProduto.jsx
// 📝 COMPONENTE SEPARADO: Modal de seleção de produto com adicionais

import React, { useState, useEffect } from 'react';
import AdicionaisGrid from '../AdicionaisGrid';
import adicionaisService from '../../services/adicionaisService';

/**
 * Modal para adicionar/editar produto no pedido
 * Mostra apenas adicionais da mesma categoria do produto
 */
const ModalProduto = ({ 
  isOpen,              // Boolean: controla se modal está aberto
  onClose,             // Function: função para fechar o modal
  produto,             // Object: produto selecionado
  onConfirmar,         // Function: função chamada ao confirmar
  modoEdicao = false,  // Boolean: se está editando item existente
  dadosIniciais = {}   // Object: dados do item sendo editado
}) => {
  // ========================================
  // 📦 ESTADOS DO COMPONENTE
  // ========================================
  
  // Inicializar com dados existentes se for edição
  const [quantidade, setQuantidade] = useState(dadosIniciais?.quantidade || 1);
  const [adicionaisDisponiveis, setAdicionaisDisponiveis] = useState([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState(dadosIniciais?.adicionais || []);
  const [observacoes, setObservacoes] = useState(dadosIniciais?.observacoes || '');
  const [loading, setLoading] = useState(false);

  // ========================================
  // 🔄 EFEITOS (useEffect)
  // ========================================

  /**
   * EFEITO 1: Carregar adicionais quando produto muda
   * Busca apenas adicionais da categoria do produto
   */
  useEffect(() => {
    if (produto && produto.categoria_id) {
      carregarAdicionaisPorCategoria(produto.categoria_id);
    }
  }, [produto]);

  /**
   * EFEITO 2: Resetar estados ao abrir modal
   * Garante que dados anteriores não persistam
   */
 useEffect(() => {
  if (isOpen) {
    if (modoEdicao && dadosIniciais) {
      // Carregar dados existentes
      setQuantidade(dadosIniciais.quantidade || 1);
      setAdicionaisSelecionados(dadosIniciais.adicionais || []);
      setObservacoes(dadosIniciais.observacoes || '');
    } else {
      // Resetar tudo
      resetarEstados();
    }
  }
}, [isOpen, modoEdicao, dadosIniciais]);
  
  
  /**
   * EFEITO 3: 
   * Garante que adicionais sejam carregados
   */
  useEffect(() => {
  if (modoEdicao && dadosIniciais?.adicionais && adicionaisDisponiveis.length > 0) {
    console.log('🔄 Restaurando adicionais após carregar disponíveis');
    
    // Filtrar apenas adicionais que existem nos disponíveis
    const adicionaisValidos = dadosIniciais.adicionais.filter(adicionalItem => 
      adicionaisDisponiveis.some(disponivel => disponivel.id === adicionalItem.id)
    );
    
    if (adicionaisValidos.length > 0) {
      setAdicionaisSelecionados(adicionaisValidos);
      console.log('✅ Adicionais restaurados:', adicionaisValidos);
    }
  }
}, [adicionaisDisponiveis, modoEdicao]);

  // ========================================
  // 🔧 FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Carrega adicionais filtrados por categoria
   * Só mostra adicionais da mesma categoria do produto
   */
  const carregarAdicionaisPorCategoria = async (categoriaId) => {
    try {
      setLoading(true);
      console.log(`📦 Buscando adicionais da categoria ${categoriaId}...`);
      
      const adicionais = await adicionaisService.buscarPorCategoria(categoriaId);
      
      // Filtrar apenas adicionais ativos
      const adicionaisAtivos = adicionais.filter(ad => ad.ativo);
      
      console.log(`✅ ${adicionaisAtivos.length} adicionais encontrados`);
      setAdicionaisDisponiveis(adicionaisAtivos);
      
    } catch (error) {
      console.error('❌ Erro ao carregar adicionais:', error);
      setAdicionaisDisponiveis([]);
      alert('Erro ao carregar adicionais: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reseta todos os estados para valores iniciais
   */
  const resetarEstados = () => {
    setQuantidade(1);
    setAdicionaisSelecionados([]);
    setObservacoes('');
  };

  /**
   * Aumenta ou diminui a quantidade
   */
  const alterarQuantidade = (operacao) => {
    if (operacao === 'aumentar') {
      setQuantidade(prev => prev + 1);
    } else if (operacao === 'diminuir' && quantidade > 1) {
      setQuantidade(prev => prev - 1);
    }
  };

  /**
   * Adiciona ou remove um adicional da seleção
   */
  const toggleAdicional = (adicional) => {
    setAdicionaisSelecionados(prev => {
      // Verifica se adicional já está selecionado
      const jaExiste = prev.find(item => item.id === adicional.id);
      
      if (jaExiste) {
        // Remove o adicional
        return prev.filter(item => item.id !== adicional.id);
      } else {
        // Adiciona o adicional
        return [...prev, adicional];
      }
    });
  };

  /**
   * Calcula o preço total (produto + adicionais) * quantidade
   */
  const calcularTotal = () => {
    if (!produto) return 0;

    // Preço base do produto
    const precoBase = parseFloat(produto.preco);
    
    // Soma dos adicionais
    const precoAdicionais = adicionaisSelecionados.reduce((total, adicional) => {
      return total + parseFloat(adicional.preco);
    }, 0);

    // Total = (base + adicionais) * quantidade
    return (precoBase + precoAdicionais) * quantidade;
  };

  /**
   * Confirma a seleção e envia dados para o componente pai
   */
  const confirmar = () => {
    if (!produto) return;

    // Calcula preço unitário (produto + adicionais)
    const precoUnitario = parseFloat(produto.preco) + 
      adicionaisSelecionados.reduce((total, ad) => total + parseFloat(ad.preco), 0);

    // Monta objeto com dados do item
    const itemCompleto = {
      produto_id: produto.id,
      produto_nome: produto.nome,
      quantidade: quantidade,
      preco_unitario: precoUnitario,
      preco_produto: produto.preco,
      subtotal: calcularTotal(),
      adicionais: adicionaisSelecionados,
      observacoes: observacoes
    };

    console.log('✅ Item confirmado:', itemCompleto);
    
    // Chama função do componente pai
    onConfirmar(itemCompleto);
    
    // Fecha o modal
    onClose();
  };

  /**
   * Formata preço para exibição
   */
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  if (!isOpen || !produto) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-produto" onClick={(e) => e.stopPropagation()}>
        
        {/* CABEÇALHO */}
        <div className="modal-header">
          <h3>
            {modoEdicao ? 'Editar Item: ' : ''}
            {produto.nome}
          </h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          
          {/* INFORMAÇÕES DO PRODUTO */}
          <div className="produto-info-modal">
            <div className="produto-preco-base">
              Preço base: {formatarPreco(produto.preco)}
            </div>
            <div className="produto-categoria">
              Categoria: {produto.categoria_nome}
            </div>
          </div>

          {/* QUANTIDADE */}
          <div className="quantidade-modal-section">
            <h4>Quantidade</h4>
            <div className="quantidade-modal-control">
              <button 
                className="btn-qty-modal"
                onClick={() => alterarQuantidade('diminuir')}
                disabled={quantidade <= 1}
              >
                -
              </button>
              <span className="quantidade-modal-display">{quantidade}</span>
              <button 
                className="btn-qty-modal"
                onClick={() => alterarQuantidade('aumentar')}
              >
                +
              </button>
            </div>
          </div>

          {/* ADICIONE AQUI O COMPONENTE */}
            <AdicionaisGrid
                adicionaisDisponiveis={adicionaisDisponiveis}
                adicionaisSelecionados={adicionaisSelecionados}
                onAdicionaisChange={setAdicionaisSelecionados}
                observacoes={observacoes}
                onObservacoesChange={setObservacoes}
            />

          {/* ADICIONAIS FILTRADOS POR CATEGORIA 
          <div className="adicionais-modal-section">
            <h4>
              Adicionais 
              {loading && <i className="fas fa-spinner fa-spin" style={{marginLeft: '10px'}}></i>}
            </h4>
            
            {loading ? (
              <div className="loading-adicionais">Carregando adicionais...</div>
            ) : adicionaisDisponiveis.length === 0 ? (
              <div className="sem-adicionais">
                Nenhum adicional disponível para {produto.categoria_nome}
              </div>
            ) : (
              <div className="adicionais-modal-grid">
                {adicionaisDisponiveis.map(adicional => (
                  <div
                    key={adicional.id}
                    className={`adicional-modal-item ${
                      adicionaisSelecionados.find(item => item.id === adicional.id) 
                        ? 'selecionado' 
                        : ''
                    }`}
                    onClick={() => toggleAdicional(adicional)}
                  >
                    <div className="adicional-modal-info">
                      <div className="adicional-modal-nome">{adicional.nome}</div>
                      <div className="adicional-modal-preco">
                        + {formatarPreco(adicional.preco)}
                      </div>
                    </div>
                    <div className="adicional-modal-check">
                      <i className={`fas ${
                        adicionaisSelecionados.find(item => item.id === adicional.id)
                          ? 'fa-check-circle'
                          : 'fa-circle'
                      }`}></i>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>*/}

          {/* OBSERVAÇÕES */}
          <div className="observacoes-modal-section">
            <h4>Observações</h4>
            <textarea
              className="observacoes-modal-input"
              placeholder="Adicione observações especiais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* RESUMO */}
          <div className="resumo-modal-section">
            <div className="resumo-modal-linha">
              <span>Produto ({quantidade}x)</span>
              <span>{formatarPreco(produto.preco * quantidade)}</span>
            </div>
            
            {adicionaisSelecionados.length > 0 && (
              <div className="resumo-modal-linha">
                <span>Adicionais ({quantidade}x)</span>
                <span>
                  {formatarPreco(
                    adicionaisSelecionados.reduce((total, ad) => 
                      total + parseFloat(ad.preco), 0
                    ) * quantidade
                  )}
                </span>
              </div>
            )}
            
            <div className="resumo-modal-linha resumo-modal-total">
              <span>Total</span>
              <span>{formatarPreco(calcularTotal())}</span>
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={confirmar}>
            {modoEdicao ? 'Salvar Alterações' : 'Adicionar ao Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalProduto;