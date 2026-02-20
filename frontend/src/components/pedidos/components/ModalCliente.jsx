// src/components/Pedidos/components/ModalCliente.jsx
// 👤 COMPONENTE: Modal para buscar e selecionar clientes

import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

/**
 * Modal de busca de clientes cadastrados
 * Permite buscar por nome e selecionar cliente
 */
const ModalCliente = ({
  isOpen,                    // Se o modal está aberto
  onClose,                   // Função para fechar
  onSelecionar,              // Função quando seleciona um cliente
  onPular,                   // Função para pular seleção (novo pedido)
  aguardandoNovoPedido,      // Se está criando novo pedido
  clienteService             // Service de clientes
}) => {

  // ========================================
  // 📦 ESTADOS
  // ========================================
  
  const [termoBusca, setTermoBusca] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [nomeAvulso, setNomeAvulso] = useState(''); // 🆕 Para digitar manualmente

  // ========================================
  // 🔧 FUNÇÕES
  // ========================================

  /**
   * Busca clientes no backend
   */
  const buscarClientes = async (termo) => {
    try {
      setLoading(true);
      setErro('');

      let resultado;
      
      if (termo.length >= 2) {
        // Busca por nome
        resultado = await clienteService.buscarParaSelect(termo);
      } else {
        // Carrega todos se busca vazia
        resultado = await clienteService.buscarParaSelect('', 20);
      }

      // Normalizar resposta
      if (Array.isArray(resultado)) {
        setClientes(resultado);
      } else if (resultado?.data && Array.isArray(resultado.data)) {
        setClientes(resultado.data);
      } else {
        setClientes([]);
      }

    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setErro('Erro ao buscar clientes. Tente novamente.');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Versão com debounce para não fazer muitas requisições
   */
  const buscarClientesDebounced = useCallback(
    debounce((termo) => {
      buscarClientes(termo);
    }, 300),
    []
  );

  /**
   * Handler quando muda o texto de busca
   */
  const handleBuscaChange = (valor) => {
    setTermoBusca(valor);
    buscarClientesDebounced(valor);
  };

  /**
   * Handler quando seleciona um cliente
   */
  const handleSelecionar = (cliente) => {
    onSelecionar(cliente);
    onClose();
  };
  
  /**
   * 🆕 Continuar com nome digitado manualmente (cliente avulso)
   */
  const handleContinuarComAvulso = () => {
    if (!nomeAvulso.trim()) {
      alert('Digite o nome do cliente ou clique em "Continuar sem cliente"');
      return;
    }
    
    // Criar objeto de cliente avulso (sem ID)
    const clienteAvulso = {
      nome: nomeAvulso.trim()
    };
    
    onSelecionar(clienteAvulso);
    onClose();
  };

  /**
   * Carrega clientes iniciais ao abrir
   */
  useEffect(() => {
    if (isOpen) {
      setTermoBusca('');
      setNomeAvulso(''); // 🆕 Limpar nome avulso
      buscarClientes('');
    }
  }, [isOpen]);

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-clientes" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================
            CABEÇALHO
        ======================================== */}
        <div className="modal-header">
          <h3>
            <i className="fas fa-users"></i>
            {aguardandoNovoPedido ? 'Novo Pedido - Selecione o Cliente' : 'Selecionar Cliente'}
          </h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          
          {/* ========================================
              CAMPO DE BUSCA
          ======================================== */}
          <div className="busca-modal-container">
            <div className="busca-input-group">
              <i className="fas fa-search busca-icon"></i>
              <input
                type="text"
                placeholder="Buscar cliente cadastrado..."
                value={termoBusca}
                onChange={(e) => handleBuscaChange(e.target.value)}
                className="busca-modal-input"
                autoFocus
              />
            </div>
          </div>

          {/* ========================================
              🆕 CAMPO PARA NOME AVULSO
          ======================================== */}
          {aguardandoNovoPedido && (
            <div className="nome-avulso-container">
              <div className="nome-avulso-header">
                <span>ou digite o nome do cliente:</span>
              </div>
              <div className="nome-avulso-input-group">
                <i className="fas fa-user busca-icon"></i>
                <input
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={nomeAvulso}
                  onChange={(e) => setNomeAvulso(e.target.value)}
                  className="busca-modal-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && nomeAvulso.trim()) {
                      handleContinuarComAvulso();
                    }
                  }}
                />
              </div>
              {nomeAvulso.trim() && (
                <button 
                  className="btn-continuar-avulso"
                  onClick={handleContinuarComAvulso}
                >
                  <i className="fas fa-arrow-right"></i>
                  Continuar com "{nomeAvulso}"
                </button>
              )}
            </div>
          )}

          {/* ========================================
              LISTA DE CLIENTES
          ======================================== */}
          <div className="clientes-modal-lista">
            
            {/* Loading */}
            {loading && (
              <div className="loading-clientes">
                <i className="fas fa-spinner fa-spin"></i>
                Carregando clientes...
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="erro-clientes">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{erro}</p>
              </div>
            )}

            {/* Mensagem quando vazio */}
            {!loading && !erro && clientes.length === 0 && (
              <div className="sem-clientes-modal">
                <i className="fas fa-users"></i>
                <p>
                  {termoBusca.length === 0
                    ? 'Digite para buscar clientes...'
                    : termoBusca.length < 2
                    ? 'Digite pelo menos 2 caracteres'
                    : 'Nenhum cliente encontrado'}
                </p>
                {termoBusca.length >= 2 && (
                  <small>Tente buscar com outro termo</small>
                )}
              </div>
            )}

            {/* Lista de clientes */}
            {!loading && !erro && clientes.length > 0 && (
              <>
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="cliente-modal-item"
                    onClick={() => handleSelecionar(cliente)}
                  >
                    <div className="cliente-modal-info">
                      <div className="cliente-modal-nome">
                        <i className="fas fa-user"></i>
                        {cliente.nome}
                      </div>
                      
                      {cliente.telefone && (
                        <div className="cliente-modal-telefone">
                          <i className="fas fa-phone"></i>
                          {cliente.telefone}
                        </div>
                      )}
                      
                      {cliente.email && (
                        <div className="cliente-modal-email">
                          <i className="fas fa-envelope"></i>
                          {cliente.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="cliente-modal-arrow">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ========================================
            RODAPÉ
        ======================================== */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          
          {/* 🆕 Botão para continuar sem cliente */}
          {aguardandoNovoPedido && onPular && (
            <button 
              className="btn-pular-cliente" 
              onClick={onPular}
              title="Continuar sem selecionar cliente agora"
            >
              <i className="fas fa-forward"></i>
              Continuar sem cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalCliente;