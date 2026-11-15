import React, { useState, useMemo } from 'react';

const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABELS = {
  aberto: 'Aberto',
  'em-preparo': 'Em preparo',
  parcial: 'Pagamento parcial',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  balcao: 'Balcão'
};

const FILTROS = [
  ['todos', 'Todas', 'fa-layer-group'],
  ['parcial', 'Pagamento parcial', 'fa-hourglass-half'],
  ['digital', 'Cardápio digital', 'fa-mobile-screen']
];

const slugStatus = (status) => String(status || 'aberto').toLowerCase().replace(/\s+/g, '-');

const tempoDecorrido = (data) => {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(data).getTime()) / 60000));
  if (!Number.isFinite(minutos)) return '';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return horas < 24 ? `${horas}h ${minutos % 60}min` : `${Math.floor(horas / 24)}d`;
};

const destacarTexto = (texto, termo) => {
  const textoString = String(texto || '');
  if (!termo || !textoString) return textoString;
  const inicio = normalizar(textoString).indexOf(normalizar(termo));
  if (inicio < 0) return textoString;
  return <>{textoString.slice(0, inicio)}<mark>{textoString.slice(inicio, inicio + termo.length)}</mark>{textoString.slice(inicio + termo.length)}</>;
};

const CardComanda = ({ pedido, termoBusca, onEditar }) => {
  const status = slugStatus(pedido.status);
  const taxa = Number(pedido.taxa_entrega || 0);
  const saldo = Number(pedido.total) + taxa - Number(pedido.valor_pago || 0);
  const data = pedido.data || pedido.created_at;
  const digital = pedido.origem === 'cardapio_digital';
  const abrir = () => onEditar(pedido);

  return (
    <div
      className={`gm-order-card status-${status}`}
      role="button"
      tabIndex={0}
      data-testid={`comanda-card-${pedido.id}`}
      aria-label={`Abrir comanda ${pedido.id}, ${pedido.cliente_nome || pedido.cliente || 'Balcão'}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } }}
      onClick={abrir}
    >
      <div className="gm-order-card-top">
        <span className="gm-order-number">#{destacarTexto(String(pedido.id || ''), termoBusca)}</span>
        <span className={`gm-status-pill status-${status}`}>{STATUS_LABELS[status] || pedido.status || 'Aberto'}</span>
      </div>
      <div className="gm-order-client">
        <span className="gm-avatar" aria-hidden="true">{String(pedido.cliente_nome || pedido.cliente || 'B').trim().charAt(0).toUpperCase()}</span>
        <div>
          <strong>{destacarTexto(pedido.cliente_nome || pedido.cliente || 'Cliente não informado', termoBusca)}</strong>
          <small>
            <i className={`fas ${digital ? 'fa-mobile-screen' : 'fa-store'}`} aria-hidden="true" /> {digital ? 'Cardápio digital' : (pedido.origem || 'PDV')}
            {taxa > 0 && <> · <i className="fas fa-motorcycle" aria-hidden="true" /> Entrega</>}
          </small>
        </div>
      </div>
      <div className="gm-order-meta">
        <span><i className="far fa-clock" aria-hidden="true" /> {new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="gm-order-elapsed">aberta há {tempoDecorrido(data)}</span>
      </div>
      <div className="gm-order-bottom">
        <div>
          <small>Total</small>
          <strong className="gm-money" data-testid={`comanda-total-${pedido.id}`}>{moeda(pedido.total)}</strong>
        </div>
        {pedido.status === 'parcial' ? (
          <div className="gm-order-balance">
            <small>Pago {moeda(pedido.valor_pago)}</small>
            <strong>Saldo {moeda(saldo)}</strong>
          </div>
        ) : taxa > 0 ? (
          <div className="gm-order-balance neutral"><small>Taxa entrega</small><strong>{moeda(taxa)}</strong></div>
        ) : (
          <span className="gm-order-open">Abrir <i className="fas fa-arrow-right" aria-hidden="true" /></span>
        )}
      </div>
    </div>
  );
};

const ListaPedidos = ({ pedidos, onEditar, onNovoPedido }) => {
  const [termoBusca, setTermoBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const contagem = useMemo(() => ({
    todos: pedidos.length,
    parcial: pedidos.filter(p => p.status === 'parcial').length,
    digital: pedidos.filter(p => p.origem === 'cardapio_digital').length
  }), [pedidos]);

  const totalAberto = useMemo(() => pedidos.reduce((s, p) => s + Number(p.total || 0) + Number(p.taxa_entrega || 0) - Number(p.valor_pago || 0), 0), [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const termo = normalizar(termoBusca);
    return pedidos.filter(pedido => {
      if (filtro === 'parcial' && pedido.status !== 'parcial') return false;
      if (filtro === 'digital' && pedido.origem !== 'cardapio_digital') return false;
      if (!termo) return true;
      if (normalizar(pedido.cliente_nome || pedido.cliente).includes(termo)) return true;
      if ((pedido.numero_pedido || pedido.id || '').toString().toLowerCase().includes(termo)) return true;
      if (Array.isArray(pedido.itens) && pedido.itens.some(item => normalizar(item.produto_nome || item.nome).includes(termo))) return true;
      return (pedido.total || 0).toString().includes(termo);
    });
  }, [pedidos, termoBusca, filtro]);

  return (
    <div className="gm-orders" data-testid="comandas-board">
      <header className="gm-orders-hero">
        <div>
          <span className="gm-eyebrow">Atendimento</span>
          <h2>Comandas em aberto</h2>
          <p>Abra uma nova venda ou toque em uma comanda para continuar o atendimento.</p>
        </div>
        <div className="gm-orders-stats">
          <div className="gm-stat"><small>Comandas</small><strong data-testid="comandas-count">{pedidos.length}</strong></div>
          <div className="gm-stat"><small>A receber</small><strong className="gm-money">{moeda(totalAberto)}</strong></div>
          <button className="gm-btn gm-btn-primary gm-btn-lg" onClick={onNovoPedido} data-testid="nova-comanda-button">
            <i className="fas fa-plus" aria-hidden="true" /> Nova comanda
          </button>
        </div>
      </header>

      <div className="gm-orders-toolbar">
        <label className="gm-search" htmlFor="gm-busca-comandas">
          <i className="fas fa-search" aria-hidden="true" />
          <input
            id="gm-busca-comandas"
            type="text"
            aria-label="Buscar comandas por cliente, pedido ou produto"
            placeholder="Buscar por cliente, nº da comanda, produto ou valor"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            data-testid="comandas-search-input"
          />
          {termoBusca && (
            <button type="button" className="gm-search-clear" onClick={() => setTermoBusca('')} aria-label="Limpar busca" data-testid="comandas-search-clear">
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="gm-segment" aria-label="Filtrar comandas">
          {FILTROS.map(([id, label, icone]) => (
            <button key={id} aria-label={label} aria-pressed={filtro === id} onClick={() => setFiltro(id)} data-testid={`comandas-filter-${id}`}>
              <i className={`fas ${icone}`} aria-hidden="true" /> {label} <span className="gm-count">{contagem[id]}</span>
            </button>
          ))}
        </div>
      </div>

      {termoBusca && (
        <p className="gm-results-note" data-testid="comandas-results-note">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'resultado' : 'resultados'} para <strong>“{termoBusca}”</strong>
        </p>
      )}

      {pedidosFiltrados.length === 0 ? (
        <div className="gm-empty" data-testid="comandas-empty">
          <span className="gm-empty-icon"><i className={`fas ${termoBusca ? 'fa-search' : 'fa-ice-cream'}`} aria-hidden="true" /></span>
          <h3>{termoBusca ? 'Nenhum pedido encontrado' : filtro === 'todos' ? 'Tudo pronto para a próxima venda' : 'Nenhuma comanda neste filtro'}</h3>
          <p>{termoBusca ? 'Tente outro termo ou limpe a busca.' : 'Clique em “Nova comanda” para iniciar um atendimento.'}</p>
          {termoBusca
            ? <button className="gm-btn gm-btn-ghost" onClick={() => setTermoBusca('')}>Limpar busca</button>
            : <button className="gm-btn gm-btn-primary" onClick={onNovoPedido}><i className="fas fa-plus" aria-hidden="true" /> Nova comanda</button>}
        </div>
      ) : (
        <div className="gm-orders-grid">
          {pedidosFiltrados.map((pedido, i) => (
            <div key={pedido.id} className="gm-stagger" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
              <CardComanda pedido={pedido} termoBusca={termoBusca} onEditar={onEditar} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaPedidos;
