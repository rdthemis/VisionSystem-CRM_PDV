import React, { useState, useMemo } from 'react';
const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Componente que mostra todos os pedidos com busca inteligente
 * 
 * Busca por:
 * - Nome do cliente
 * - Número do pedido
 * - Nome dos produtos
 * - Valor do pedido
 */
const ListaPedidos = ({ pedidos, onVerDetalhes, onEditar, onNovoPedido }) => {
  
  // ========================================
  // 📦 ESTADOS
  // ========================================
  
  const [termoBusca, setTermoBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  // ========================================
  // 🔧 FUNÇÃO DE BUSCA
  // ========================================

  /**
   * Filtra pedidos baseado no termo de busca
   * Procura em: cliente, número do pedido, produtos e valor
   */
  const pedidosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) {
      return pedidos.filter((pedido) => filtro === 'todos' || (filtro === 'parcial' ? pedido.status === 'parcial' : pedido.origem === 'cardapio_digital'));
    }

    const termo = normalizar(termoBusca);

    return pedidos.filter(pedido => {
      if (filtro === 'parcial' && pedido.status !== 'parcial') return false;
      if (filtro === 'digital' && pedido.origem !== 'cardapio_digital') return false;
      // 1. Buscar no nome do cliente
      const nomeCliente = normalizar(pedido.cliente_nome || pedido.cliente);
      if (nomeCliente.includes(termo)) {
        return true;
      }

      // 2. Buscar no número do pedido
      const numeroPedido = (pedido.numero_pedido || pedido.id || '').toString().toLowerCase();
      if (numeroPedido.includes(termo)) {
        return true;
      }

      // 3. Buscar nos nomes dos produtos
      if (pedido.itens && Array.isArray(pedido.itens)) {
        const temProduto = pedido.itens.some(item => {
          const nomeProduto = normalizar(item.produto_nome || item.nome);
          return nomeProduto.includes(termo);
        });
        
        if (temProduto) {
          return true;
        }
      }

      // 4. Buscar no valor (ex: buscar "50" encontra pedidos de R$ 50,00)
      const valorPedido = (pedido.total || 0).toString();
      if (valorPedido.includes(termo)) {
        return true;
      }

      return false;
    });
  }, [pedidos, termoBusca, filtro]);

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

  const STATUS_LABELS = {
    aberto: 'Aberto',
    'em-preparo': 'Em preparo',
    parcial: 'Parcial',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    balcao: 'Balcão'
  };

  /**
   * Retorna a classe CSS baseada no status
   */
  const getClasseStatus = (status) => {
    return `pedido-status ${String(status || 'aberto').toLowerCase().replace(/\s+/g, '-')}`;
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[String(status || 'aberto').toLowerCase()] || String(status || 'Aberto');
  };

  /**
   * Destaca o termo buscado no texto
   */
  const destacarTexto = (texto, termo) => {

    const textoString = String(texto || '');

    if (!termo || !textoString) return textoString;

    const inicio = textoString.toLowerCase().indexOf(termo.toLowerCase());
    if (inicio < 0) return textoString;
    return <>{textoString.slice(0, inicio)}<mark>{textoString.slice(inicio, inicio + termo.length)}</mark>{textoString.slice(inicio + termo.length)}</>;

  };
  
  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  return (
    <div className="lista-pedidos-container">
      
      <div className="pdv-orders-intro"><span>ATENDIMENTO</span><h2>Suas comandas, em um só lugar.</h2><p>Abra uma venda ou selecione uma comanda para continuar.</p></div>
      {/* CABEÇALHO COM BUSCA E BOTÃO */}
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
            aria-label="Buscar comandas por cliente, pedido ou produto"
            placeholder="Buscar por cliente, pedido ou produto..."
            className="busca-input"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
          
          {/* Botão para limpar busca */}
          {termoBusca && (
            <button 
              className="btn-limpar-busca"
              onClick={() => setTermoBusca('')}
              title="Limpar busca"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#999',
                padding: '5px'
              }}
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
      </div>

      <div className="pdv-order-filters" aria-label="Filtrar comandas">
        {[['todos', 'Todas'], ['parcial', 'Pagamento parcial'], ['digital', 'Cardápio digital']].map(([id, label]) => <button key={id} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{label}</button>)}
      </div>
      {/* CONTADOR DE RESULTADOS */}
      {termoBusca && (
        <div style={{
          padding: '10px 20px',
          background: '#f0f0f0',
          borderRadius: '8px',
          margin: '10px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <i className="fas fa-filter"></i> 
            {' '}Buscando por: <strong>"{termoBusca}"</strong>
          </span>
          <span style={{ color: '#666' }}>
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      )}

      {/* LISTA DE PEDIDOS */}
      <div className="lista-pedidos-finalizados">
        <div className="lista-pedidos-topbar">
          <h3>Comandas em atendimento</h3>
          <span className="comandas-count">
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'comanda' : 'comandas'}
          </span>
        </div>

        {termoBusca && pedidosFiltrados.length !== pedidos.length && (
          <div className="busca-status">
            Mostrando {pedidosFiltrados.length} de {pedidos.length} comandas
          </div>
        )}

        {pedidosFiltrados.length === 0 ? (
          // Mensagem quando não há resultados
          <div className="sem-pedidos">
            {termoBusca ? (
              // Nenhum resultado na busca
              <>
                <i className="fas fa-search"></i>
                <p>Nenhum pedido encontrado</p>
                <small>
                  Tente buscar por outro termo ou{' '}
                  <button 
                    onClick={() => setTermoBusca('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#007bff',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit'
                    }}
                  >
                    limpe a busca
                  </button>
                </small>
              </>
            ) : (
              // Não há pedidos
              <>
                <i className="fas fa-inbox"></i>
                <p>{filtro === "todos" ? "Tudo pronto para a próxima venda" : "Nenhuma comanda neste filtro"}</p>
                <small>Clique em "Nova Comanda" para começar</small>
              </>
            )}
          </div>
        ) : (
          // Grid com os pedidos
          <div className="pedidos-grid">
              {pedidosFiltrados.map((pedido) => (
                <div
                  key={pedido.id}
                  className="pedido-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir comanda ${pedido.id}, ${pedido.cliente_nome || pedido.cliente || "Balcão"}`}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onEditar(pedido); } }}
                  onClick={() => onEditar(pedido)}
                  style={{ cursor: 'pointer' }}
                >
                
                  {/* Cabeçalho do Card */}
                  <div className="pedido-card-header">
                    <span className="pedido-numero">
                      #{destacarTexto(
                        pedido.id || pedido.id?.toString() || '',
                        termoBusca
                      )}
                    </span>
                    <div className="pedido-status-label">
                      {getStatusLabel(pedido.status)}
                    </div>
                  </div>
                
                  {/* Informações do Pedido */}
                  <div className="pedido-card-body">
                    <div className="pedido-cliente">
                      <i className="fas fa-user"></i>
                      {destacarTexto(
                        pedido.cliente_nome || pedido.cliente || 'Cliente não informado',
                        termoBusca
                      )}
                    </div>

                    <div className="pedido-data">
                      <i className="fas fa-clock"></i>
                      {formatarData(pedido.data || pedido.created_at)}
                    </div>
                    <div className="pedido-origem">
                      <i className="fas fa-home"></i>
                      {pedido.origem || 'PDV'}
                    </div>
                    
                    <div className="pedido-card-footer">
                      <div className="pedido-total">R$ {pedido.total ? Number(pedido.total).toFixed(2) : '0,00'}</div>
                      <div>
                        {pedido.taxa_entrega > 0 &&(
                          <div className="pedido-saldo-devedor">
                              Entrega: R$ {Number(pedido?.taxa_entrega || 0).toFixed(2)}
                          </div>
                        )}
                      {pedido.status === 'parcial' && (
                      <div>
                        <div className="pedido-saldo-devedor">
                          Pago: R$ {( Number(pedido?.valor_pago || 0)).toFixed(2)}
                        </div>
                        <div className="pedido-saldo-devedor">
                          Saldo: R$ {(Number(pedido?.total) + Number(pedido?.taxa_entrega || 0) - Number(pedido?.valor_pago || 0)).toFixed(2)}
                        </div>
                      </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaPedidos;