import { useState, useEffect, useMemo } from "react";
/* ============================================================
   CARDÁPIO DIGITAL — GELATTO MANNIA (Fase 1 / MVP)
   ------------------------------------------------------------
   CONFIGURAÇÃO: edite o bloco CONFIG abaixo.
   INTEGRAÇÃO PDV: preencha API_BASE com a URL do seu backend
   PHP (ex: "https://seudominio.com.br/api"). O app tenta buscar
   /categorias, /produtos e /adicionais. Se falhar ou estiver
   vazio, usa os DADOS_EXEMPLO abaixo.
   ============================================================ */

const CONFIG = {
  nomeLoja: "Gelatto Mannia",
  slogan: "Sorvetes artesanais · Corumbataí do Sul, PR",
  whatsapp: "5544998264006", // <-- TROCAR: DDI+DDD+número, só dígitos
  taxaEntrega: 3.0,
  pedidoMinimoEntrega: 15.0,
  formasPagamento: ["PIX", "Dinheiro", "Cartão na entrega"],
  chavePix: "23634179000134", // opcional: aparece na mensagem se preenchida
  horarios: {
    // 0=Dom ... 6=Sáb — [abre, fecha] em horas; null = fechado
    0: [10, 22],
    1: [10, 23],
    2: [10, 22],
    3: [10, 22],
    4: [10, 20],
    5: [10, 23],
    6: [10, 23],
  },
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000"; // produção: definido via REACT_APP_API_URL no Vercel

/* ---------- Dados de exemplo (estrutura igual ao PDV) ---------- */
const DADOS_EXEMPLO = {
  categorias: [
    { id: 1, nome: "Açaí" },
    { id: 2, nome: "Sorvetes" },
    { id: 3, nome: "Picolés" },
    { id: 4, nome: "Lanches" },
    { id: 5, nome: "Bebidas" },
  ],
  adicionais: [
    { id: 1, nome: "Leite Ninho", preco: 3.0 },
    { id: 2, nome: "Granola", preco: 2.0 },
    { id: 3, nome: "Morango", preco: 3.5 },
    { id: 4, nome: "Paçoca", preco: 2.0 },
    { id: 5, nome: "Cobertura de chocolate", preco: 2.5 },
    { id: 6, nome: "Bacon extra", preco: 4.0 },
    { id: 7, nome: "Cheddar", preco: 3.0 },
    { id: 8, nome: "Ovo", preco: 2.5 },
  ],
  produtos: [
    { id: 1, categoriaId: 1, nome: "Açaí 300ml", descricao: "Açaí batido na hora", preco: 12.0, adicionaisIds: [1, 2, 3, 4, 5] },
    { id: 2, categoriaId: 1, nome: "Açaí 500ml", descricao: "Açaí batido na hora", preco: 17.0, adicionaisIds: [1, 2, 3, 4, 5] },
    { id: 3, categoriaId: 2, nome: "Milkshake 400ml", descricao: "Sabores: chocolate, morango, ninho", preco: 15.0, adicionaisIds: [1, 5] },
    { id: 4, categoriaId: 2, nome: "Sundae", descricao: "Sorvete com calda e amendoim", preco: 10.0, adicionaisIds: [3, 5] },
    { id: 5, categoriaId: 3, nome: "Picolé de fruta", descricao: "Sabores da estação", preco: 5.0, adicionaisIds: [] },
    { id: 6, categoriaId: 3, nome: "Picolé ao leite", descricao: "Sabores cremosos", preco: 6.0, adicionaisIds: [] },
    { id: 7, categoriaId: 4, nome: "X-Burger", descricao: "Pão, hambúrguer, queijo e salada", preco: 18.0, adicionaisIds: [6, 7, 8] },
    { id: 8, categoriaId: 4, nome: "X-Bacon", descricao: "Pão, hambúrguer, bacon, queijo e salada", preco: 22.0, adicionaisIds: [6, 7, 8] },
    { id: 9, categoriaId: 5, nome: "Refrigerante lata", descricao: "350ml", preco: 6.0, adicionaisIds: [] },
    { id: 10, categoriaId: 5, nome: "Suco natural 400ml", descricao: "Laranja ou limão", preco: 8.0, adicionaisIds: [] },
  ],
};

/* ---------------------- Utilidades ---------------------- */
const fmt = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function lojaAberta() {
  const agora = new Date();
  const faixa = CONFIG.horarios[agora.getDay()];
  if (!faixa) return false;
  const h = agora.getHours() + agora.getMinutes() / 60;
  return h >= faixa[0] && h < faixa[1];
}

async function carregarDoPDV() {
  if (!API_BASE) return null;
  try {
    const [c, p, a, z] = await Promise.all([
      fetch(`${API_BASE}/cardapio/categorias`).then((r) => r.json()),
      fetch(`${API_BASE}/cardapio/produtos`).then((r) => r.json()),
      fetch(`${API_BASE}/cardapio/adicionais`).then((r) => r.json()),
      fetch(`${API_BASE}/cardapio/zonas`)
        .then((r) => r.json())
        .catch(() => []),
    ]);
    if (Array.isArray(c) && c.length && Array.isArray(p) && p.length) {
      return {
        categorias: c,
        produtos: p,
        adicionais: a || [],
        zonas: Array.isArray(z) ? z : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function enviarPedidoAoPDV(payload) {
  if (!API_BASE) return null;
  try {
    const r = await fetch(`${API_BASE}/cardapio/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.error(
        `POST /cardapio/pedidos falhou: ${r.status}`,
        await r.text()
      );
      return null;
    }
    return await r.json(); // esperado: { sucesso: true, pedido_id: 123 }
  } catch (e) {
    console.error("POST /cardapio/pedidos: erro de rede/CORS", e);
    return null;
  }
}

/* ---------------------- Componente ---------------------- */
export default function CardapioGelattoMannia() {
  const [dados, setDados] = useState(DADOS_EXEMPLO);
  const [fonteApi, setFonteApi] = useState(false);
  const [catAtiva, setCatAtiva] = useState(null);
  const [produtoAberto, setProdutoAberto] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [tela, setTela] = useState("menu"); // menu | carrinho | checkout
  const aberta = lojaAberta();

  // Estado do item sendo montado no modal
  const [selAdicionais, setSelAdicionais] = useState([]);
  const [obs, setObs] = useState("");
  const [qtd, setQtd] = useState(1);

  // Checkout
  const [enviando, setEnviando] = useState(false);
  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    modo: "entrega", // entrega | retirada
    endereco: "",
    zonaId: "",
    pagamento: CONFIG.formasPagamento[0],
    troco: "",
  });

const zonaSel = (dados.zonas || []).find(
    (z) => String(z.id) === String(cliente.zonaId)
  );

  useEffect(() => {
    carregarDoPDV().then((d) => {
      if (d) {
        setDados(d);
        setFonteApi(true);
      }
    });
  }, []);

  useEffect(() => {
    if (dados.categorias.length && catAtiva === null)
      setCatAtiva(dados.categorias[0].id);
  }, [dados, catAtiva]);

  const produtosDaCategoria = useMemo(
    () => dados.produtos.filter((p) => p.categoriaId === catAtiva),
    [dados, catAtiva]
  );

  const adicionaisDoProduto = (produto) =>
    (produto.adicionaisIds || [])
      .map((id) => dados.adicionais.find((a) => a.id === id))
      .filter(Boolean);

  const abrirProduto = (p) => {
    setProdutoAberto(p);
    setSelAdicionais([]);
    setObs("");
    setQtd(1);
  };

  const toggleAdicional = (a) =>
    setSelAdicionais((sel) =>
      sel.some((x) => x.id === a.id)
        ? sel.filter((x) => x.id !== a.id)
        : [...sel, a]
    );

  const precoItemAtual = produtoAberto
    ? (produtoAberto.preco +
        selAdicionais.reduce((s, a) => s + a.preco, 0)) *
      qtd
    : 0;

  const adicionarAoCarrinho = () => {
    setCarrinho((c) => [
      ...c,
      {
        uid: Date.now() + Math.random(),
        produto: produtoAberto,
        adicionais: selAdicionais,
        obs: obs.trim(),
        qtd,
      },
    ]);
    setProdutoAberto(null);
  };

  const removerItem = (uid) =>
    setCarrinho((c) => c.filter((i) => i.uid !== uid));

  const subtotal = carrinho.reduce(
    (s, i) =>
      s +
      (i.produto.preco + i.adicionais.reduce((x, a) => x + a.preco, 0)) *
        i.qtd,
    0
  );
  const temZonas = (dados.zonas || []).length > 0;
  const taxa =
    cliente.modo === "entrega"
      ? zonaSel
        ? Number(zonaSel.taxa)
        : temZonas
        ? 0 // aguardando seleção da zona
        : CONFIG.taxaEntrega
      : 0;
  const total = subtotal + taxa;
  const abaixoDoMinimo =
    cliente.modo === "entrega" && subtotal < CONFIG.pedidoMinimoEntrega;

  /* ----------- Payload para o backend do PDV ----------- */
  const montarPayload = () => ({
    origem: "cardapio_digital",
    cliente: { nome: cliente.nome.trim(), telefone: cliente.telefone.trim() },
    tipo: cliente.modo, // "entrega" | "retirada"
    endereco: cliente.modo === "entrega" ? cliente.endereco.trim() : null,
    zona_entrega_id:
      cliente.modo === "entrega" && zonaSel ? zonaSel.id : null,
    pagamento: {
      forma: cliente.pagamento,
      troco_para:
        cliente.pagamento === "Dinheiro" && cliente.troco
          ? cliente.troco
          : null,
    },
    itens: carrinho.map((i) => ({
      produto_id: i.produto.id,
      nome: i.produto.nome,
      qtd: i.qtd,
      preco_unit: i.produto.preco,
      obs: i.obs || null,
      adicionais: i.adicionais.map((a) => ({
        adicional_id: a.id,
        nome: a.nome,
        preco: a.preco,
      })),
    })),
    subtotal,
    taxa_entrega: taxa,
    total,
  });

 /* ----------- Mensagem do WhatsApp ----------- */
  const montarMensagem = (numeroPedido) => {
    const l = [];
    l.push(`*NOVO PEDIDO — ${CONFIG.nomeLoja.toUpperCase()}*`);
    if (numeroPedido) l.push(`*Pedido nº ${numeroPedido}*`);
    l.push("");
    l.push(`*Cliente:* ${cliente.nome}`);
    if (cliente.telefone) l.push(`*Telefone:* ${cliente.telefone}`);
    l.push(
      cliente.modo === "entrega"
        ? `*Entrega:* ${cliente.endereco}`
        : `*Retirada no balcão*`
    );
    if (cliente.modo === "entrega" && zonaSel)
      l.push(`*Zona:* ${zonaSel.nome}`);
    l.push("");
    l.push("*Itens:*");
    carrinho.forEach((i) => {
      const precoItem =
        (i.produto.preco +
          i.adicionais.reduce((x, a) => x + a.preco, 0)) *
        i.qtd;
      l.push(`▪ ${i.qtd}x ${i.produto.nome} — ${fmt(precoItem)}`);
      i.adicionais.forEach((a) =>
        l.push(`   + ${a.nome} (${fmt(a.preco)})`)
      );
      if (i.obs) l.push(`   Obs: ${i.obs}`);
    });
    l.push("");
    l.push(`Subtotal: ${fmt(subtotal)}`);
    if (taxa > 0) l.push(`Taxa de entrega: ${fmt(taxa)}`);
    l.push(`*Total: ${fmt(total)}*`);
    l.push("");
    l.push(`*Pagamento:* ${cliente.pagamento}`);
    if (cliente.pagamento === "Dinheiro" && cliente.troco)
      l.push(`Troco para: R$ ${cliente.troco}`);
    if (cliente.pagamento === "PIX" && CONFIG.chavePix)
      l.push(`Chave PIX: ${CONFIG.chavePix}`);
    return l.join("\n");
  };

  const [numeroPedidoEnviado, setNumeroPedidoEnviado] = useState(null);
  
    const enviarPedido = async () => {
      setEnviando(true);
      // 1) Tenta gravar no PDV (se API_BASE configurado). Falha não bloqueia.
      const resp = await enviarPedidoAoPDV(montarPayload());
      const numeroPedido = resp?.numero_pedido || resp?.pedido_id || null;
      if (resp?.impressao && !resp.impressao.ok) {
        console.warn("Pedido gravado, mas impressão falhou:", resp.impressao.erro);
      }
      // 2) Abre o WhatsApp com a mensagem (com nº do pedido, se gravou)
      const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(
        montarMensagem(numeroPedido)
      )}`;
      window.open(url, "_blank");
      // 3) Conclui: limpa o carrinho e mostra confirmação
      setNumeroPedidoEnviado(numeroPedido);
      setCarrinho([]);
      setEnviando(false);
      setTela("enviado");
    };
  
    const podeEnviar =
      cliente.nome.trim() &&
      cliente.telefone.trim() &&
      (cliente.modo === "retirada" ||
        (cliente.endereco.trim() && (!temZonas || zonaSel))) &&
      carrinho.length > 0 &&
      !abaixoDoMinimo;

  /* ---------------------- Render ---------------------- */
  return (
    <div className="gm-root">
      <style>{css}</style>

      {/* HEADER com borda derretida */}
      <header className="gm-header">
        <div className="gm-header-inner">
          <h1>{CONFIG.nomeLoja}</h1>
          <p>{CONFIG.slogan}</p>
          <span className={`gm-status ${aberta ? "on" : "off"}`}>
            {aberta ? "● Aberto agora" : "● Fechado no momento"}
          </span>
          {!fonteApi && API_BASE && (
            <span className="gm-aviso">modo demonstração (API indisponível)</span>
          )}
        </div>
        <svg
          className="gm-drip"
          viewBox="0 0 375 28"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,0 H375 V8 C355,8 350,24 335,24 C320,24 318,8 300,8 C282,8 280,18 265,18 C250,18 248,8 228,8 C208,8 206,26 190,26 C174,26 172,8 152,8 C132,8 130,16 115,16 C100,16 98,8 78,8 C58,8 56,22 42,22 C28,22 25,8 0,8 Z"
            fill="var(--berry)"
          />
        </svg>
      </header>

      {aberta ? (
        <div>
      {tela === "menu" && (
        <>
          {/* Categorias */}
          <nav className="gm-cats">
            {dados.categorias.map((c) => (
              <button
                key={c.id}
                className={c.id === catAtiva ? "ativa" : ""}
                onClick={() => setCatAtiva(c.id)}
              >
                {c.nome}
              </button>
            ))}
          </nav>

          {/* Produtos */}
          <main className="gm-lista">
            {produtosDaCategoria.map((p) => (
              <button
                key={p.id}
                className="gm-card"
                onClick={() => abrirProduto(p)}
              >
                <div className="gm-card-txt">
                  <strong>{p.nome}</strong>
                  {p.descricao && <span>{p.descricao}</span>}
                </div>
                <div className="gm-card-preco">{fmt(p.preco)}</div>
              </button>
            ))}
            {produtosDaCategoria.length === 0 && (
              <p className="gm-vazio">Nenhum produto nesta categoria.</p>
            )}
          </main>
        </>
      )}

      {/* CARRINHO */}
      {tela === "carrinho" && (
        <main className="gm-lista">
          <h2 className="gm-titulo">Seu pedido</h2>
          {carrinho.length === 0 && (
            <p className="gm-vazio">Seu carrinho está vazio.</p>
          )}
          {carrinho.map((i) => (
            <div key={i.uid} className="gm-card gm-card-cart">
              <div className="gm-card-txt">
                <strong>
                  {i.qtd}x {i.produto.nome}
                </strong>
                {i.adicionais.map((a) => (
                  <span key={a.id}>+ {a.nome} ({fmt(a.preco)})</span>
                ))}
                {i.obs && <span>Obs: {i.obs}</span>}
              </div>
              <div className="gm-card-lado">
                <div className="gm-card-preco">
                  {fmt(
                    (i.produto.preco +
                      i.adicionais.reduce((x, a) => x + a.preco, 0)) *
                      i.qtd
                  )}
                </div>
                <button
                  className="gm-remover"
                  onClick={() => removerItem(i.uid)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          {carrinho.length > 0 && (
            <button className="gm-btn" onClick={() => setTela("checkout")}>
              Continuar — {fmt(subtotal)}
            </button>
          )}
          <button className="gm-btn ghost" onClick={() => setTela("menu")}>
            Voltar ao cardápio
          </button>
        </main>
      )}

      {/* CHECKOUT */}
      {tela === "checkout" && (
        <main className="gm-lista">
          <h2 className="gm-titulo">Finalizar pedido</h2>

          <label className="gm-label">Seu nome</label>
          <input
            className="gm-input"
            value={cliente.nome}
            onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
            placeholder="Como podemos te chamar?"
          />

          <label className="gm-label">Telefone / WhatsApp</label>
          <input
            className="gm-input"
            value={cliente.telefone}
            onChange={(e) =>
              setCliente({ ...cliente, telefone: e.target.value })
            }
            placeholder="(44) 99999-9999"
            inputMode="tel"
          />

          <label className="gm-label">Receber como</label>
          <div className="gm-toggle">
            {["entrega", "retirada"].map((m) => (
              <button
                key={m}
                className={cliente.modo === m ? "ativa" : ""}
                onClick={() => setCliente({ ...cliente, modo: m })}
              >
                {m === "entrega" ? "Entrega" : "Retirada"}
              </button>
            ))}
          </div>

          {cliente.modo === "entrega" && (
            <>
              <label className="gm-label">Endereço de entrega</label>
              <input
                className="gm-input"
                value={cliente.endereco}
                onChange={(e) =>
                  setCliente({ ...cliente, endereco: e.target.value })
                }
                placeholder="Rua, número, bairro, referência"
              />

              {temZonas && (
                <>
                  <label className="gm-label">Bairro / Zona de entrega</label>
                  <select
                    className="gm-input"
                    value={cliente.zonaId}
                    onChange={(e) =>
                      setCliente({ ...cliente, zonaId: e.target.value })
                    }
                  >
                    <option value="">Selecione o bairro...</option>
                    {dados.zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nome} — {fmt(Number(z.taxa))}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <p className="gm-nota">
                {temZonas
                  ? zonaSel
                    ? `Taxa de entrega para ${zonaSel.nome}: ${fmt(Number(zonaSel.taxa))}`
                    : "Selecione o bairro para calcular a taxa de entrega."
                  : `Taxa de entrega: ${fmt(CONFIG.taxaEntrega)}`}
                {" · "}Pedido mínimo: {fmt(CONFIG.pedidoMinimoEntrega)}
              </p>
            </>
          )}

          <label className="gm-label">Pagamento</label>
          <div className="gm-toggle">
            {CONFIG.formasPagamento.map((f) => (
              <button
                key={f}
                className={cliente.pagamento === f ? "ativa" : ""}
                onClick={() => setCliente({ ...cliente, pagamento: f })}
              >
                {f}
              </button>
            ))}
          </div>

          {cliente.pagamento === "Dinheiro" && (
            <>
              <label className="gm-label">Troco para quanto?</label>
              <input
                className="gm-input"
                value={cliente.troco}
                onChange={(e) =>
                  setCliente({ ...cliente, troco: e.target.value })
                }
                placeholder="Ex: 50,00 (deixe vazio se não precisar)"
              />
            </>
          )}

          <div className="gm-resumo">
            <div>
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {taxa > 0 && (
              <div>
                <span>Taxa de entrega</span>
                <span>{fmt(taxa)}</span>
              </div>
            )}
            <div className="tot">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          {abaixoDoMinimo && (
            <p className="gm-erro">
              Para entrega, o pedido mínimo é{" "}
              {fmt(CONFIG.pedidoMinimoEntrega)}. Adicione mais itens ou
              escolha retirada.
            </p>
          )}

          <button
            className="gm-btn zap"
            disabled={!podeEnviar || enviando}
            onClick={enviarPedido}
          >
            {enviando ? "Enviando…" : "Enviar pedido no WhatsApp"}
          </button>
          <button className="gm-btn ghost" onClick={() => setTela("carrinho")}>
            Voltar
          </button>
        </main>
      )}

      {/* CONFIRMAÇÃO */}
      {tela === "enviado" && (
        <main className="gm-lista gm-confirmacao">
          <div className="gm-check">✓</div>
          <h2 className="gm-titulo">Pedido enviado!</h2>
          {numeroPedidoEnviado ? (
            <p>
              Seu pedido <strong>nº {numeroPedidoEnviado}</strong> foi
              registrado. Finalize a conversa no WhatsApp pra gente
              confirmar.
            </p>
          ) : (
            <p>
              Seu pedido foi enviado pelo WhatsApp. Finalize a conversa por
              lá pra gente confirmar.
            </p>
          )}
          <button
            className="gm-btn"
            onClick={() => {
              setNumeroPedidoEnviado(null);
              setTela("menu");
            }}
          >
            Fazer novo pedido
          </button>
        </main>
      )}

      {/* BARRA FLUTUANTE DO CARRINHO */}
      {tela === "menu" && carrinho.length > 0 && (
        <button className="gm-fab" onClick={() => setTela("carrinho")}>
          <span>
            {carrinho.reduce((s, i) => s + i.qtd, 0)}{" "}
            {carrinho.reduce((s, i) => s + i.qtd, 0) === 1 ? "item" : "itens"}
          </span>
          <span>Ver pedido · {fmt(subtotal)}</span>
        </button>
      )}

      {/* MODAL DE PRODUTO */}
      {produtoAberto && (
        <div className="gm-overlay" onClick={() => setProdutoAberto(null)}>
          <div className="gm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{produtoAberto.nome}</h3>
            {produtoAberto.descricao && <p>{produtoAberto.descricao}</p>}

            {adicionaisDoProduto(produtoAberto).length > 0 && (
              <>
                <label className="gm-label">Adicionais</label>
                {adicionaisDoProduto(produtoAberto).map((a) => {
                  const marcado = selAdicionais.some((x) => x.id === a.id);
                  return (
                    <button
                      key={a.id}
                      className={`gm-adicional ${marcado ? "on" : ""}`}
                      onClick={() => toggleAdicional(a)}
                    >
                      <span>{a.nome}</span>
                      <span>
                        {marcado ? "✓ " : "+ "}
                        {fmt(a.preco)}
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            <label className="gm-label">
              Observações (ex: tirar algum ingrediente)
            </label>
            <input
              className="gm-input"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex: sem granola, sem cebola…"
            />

            <div className="gm-qtd">
              <button onClick={() => setQtd(Math.max(1, qtd - 1))}>−</button>
              <span>{qtd}</span>
              <button onClick={() => setQtd(qtd + 1)}>+</button>
            </div>

            <button className="gm-btn" onClick={adicionarAoCarrinho}>
              Adicionar · {fmt(precoItemAtual)}
            </button>
            <button
              className="gm-btn ghost"
              onClick={() => setProdutoAberto(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      </div>
      ) : (
        <main className="gm-vazio">
  <h2 className="gm-titulo">Fechado no momento</h2>
  <div className="gm-horarios-funcionamento-container">
    Nosso horário de funcionamento é:
    <br />
    {Object.entries(CONFIG.horarios).map(([d, h]) => {
      const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      return (
        <span key={d} className="gm-horario-funcionamento">   
          <i className="fa-regular fa-clock"></i>
          <span className="gm-horario-funcionamento-texto">
            {dias[parseInt(d)]}: {h[0]}h às {h[1]}h
          </span>
        </span>
      );
    })}
  </div>
</main>

      )}
    </div>
  );
}

/* ---------------------- Estilos ---------------------- */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;600;700;800&display=swap');

:root {
  --berry: #B5205E;
  --berry-escuro: #8E1749;
  --pistache: #3E8E6E;
  --creme: #FFF8F0;
  --tinta: #2B1B24;
  --linha: #F0DFE0;
  --zap: #1FAF5A;
}

.gm-root, .gm-root * { box-sizing: border-box; }

.gm-root {
  font-family: 'Nunito', system-ui, sans-serif;
  background: var(--creme);
  min-height: 100vh;
  color: var(--tinta);
  max-width: 90vw;
  margin: 0 auto;
  padding-bottom: 96px;
  overflow-x: hidden;
}

.gm-header { position: relative; background: var(--berry); color: #fff; }
.gm-header-inner { padding: 24px 20px 20px; }
.gm-header h1 {
  font-family: 'Fredoka', sans-serif;
  font-weight: 600; font-size: 30px; margin: 0; letter-spacing: .3px;
}
.gm-header p { margin: 2px 0 10px; opacity: .85; font-size: 13.5px; }
.gm-status {
  font-size: 12.5px; font-weight: 800; padding: 4px 12px;
  border-radius: 999px; background: rgba(255,255,255,.16);
}
.gm-status.on { color: #C8F5DC; }
.gm-status.off { color: #FFD6D6; }
.gm-aviso { display:block; margin-top:8px; font-size:11px; opacity:.7; }
.gm-drip { display: block; width: 100%; height: 28px; margin-top: -1px; }

.gm-cats {
  display: flex; gap: 8px; overflow-x: auto; padding: 18px 16px 6px;
  scrollbar-width: none;
}
.gm-cats::-webkit-scrollbar { display: none; }
.gm-cats button {
  flex: 0 0 auto; border: 2px solid var(--linha); background: #fff;
  color: var(--tinta); font: 700 14px 'Nunito', sans-serif;
  padding: 8px 16px; border-radius: 999px; cursor: pointer;
}
.gm-cats button.ativa {
  background: var(--berry); border-color: var(--berry); color: #fff;
}

.gm-lista { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.gm-titulo { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 22px; margin: 8px 0 4px; }
<!-- .gm-vazio { text-align: center; opacity: .6; padding: 24px 0; } -->

.gm-card {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  background: #fff; border: 1px solid var(--linha); border-radius: 16px;
  padding: 14px 16px; text-align: left; cursor: pointer; width: 100%;
  font-family: inherit;
}
.gm-card:active { transform: scale(.99); }
.gm-card-txt { display: flex; flex-direction: column; gap: 2px; }
.gm-card-txt strong { font-size: 15.5px; font-weight: 800; }
.gm-card-txt span { font-size: 13px; opacity: .65; }
.gm-card-preco { font-weight: 800; color: var(--berry); white-space: nowrap; }
.gm-card-cart { cursor: default; align-items: flex-start; }
.gm-card-lado { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.gm-remover {
  border: none; background: none; color: var(--berry);
  font: 700 12.5px 'Nunito', sans-serif; cursor: pointer; text-decoration: underline;
}

.gm-btn {
  border: none; border-radius: 14px; padding: 15px;
  font: 800 15.5px 'Nunito', sans-serif; cursor: pointer;
  background: var(--berry); color: #fff; width: 100%;
}
.gm-btn:active { background: var(--berry-escuro); }
.gm-btn:disabled { opacity: .45; cursor: not-allowed; }
.gm-btn.ghost { background: none; color: var(--tinta); border: 2px solid var(--linha); }
.gm-btn.zap { background: var(--zap); }

.gm-fab {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: 16px; width: calc(100% - 32px); max-width: 448px;
  display: flex; justify-content: space-between; align-items: center;
  background: var(--tinta); color: #fff; border: none; border-radius: 16px;
  padding: 16px 18px; font: 800 15px 'Nunito', sans-serif; cursor: pointer;
  box-shadow: 0 8px 24px rgba(43,27,36,.35);
}

.gm-overlay {
  position: fixed; inset: 0; background: rgba(43,27,36,.5);
  display: flex; align-items: flex-end; justify-content: center; z-index: 20;
}
.gm-modal {
  background: var(--creme); width: 100%; max-width: 480px;
  border-radius: 24px 24px 0 0; padding: 24px 20px 28px;
  max-height: 85vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
}
.gm-modal h3 { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 22px; margin: 0; }
.gm-modal > p { margin: 0; opacity: .7; font-size: 14px; }

.gm-label { font-size: 12.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .6px; opacity: .6; margin-top: 8px; }
.gm-input {
  border: 2px solid var(--linha); border-radius: 12px; padding: 12px 14px;
  font: 600 15px 'Nunito', sans-serif; background: #fff; color: var(--tinta);
  width: 100%; box-sizing: border-box;
}
.gm-input:focus { outline: none; border-color: var(--berry); }
.gm-nota { font-size: 12.5px; opacity: .65; margin: 2px 0 0; }
.gm-erro { color: var(--berry); font-weight: 700; font-size: 13.5px; }

.gm-adicional {
  display: flex; justify-content: space-between; align-items: center;
  border: 2px solid var(--linha); background: #fff; border-radius: 12px;
  padding: 11px 14px; font: 700 14px 'Nunito', sans-serif; color: var(--tinta);
  cursor: pointer; width: 100%;
}
.gm-adicional.on { border-color: var(--pistache); color: var(--pistache); background: #F2FAF6; }

.gm-toggle { display: flex; gap: 8px; flex-wrap: wrap; }
.gm-toggle button {
  flex: 1 1 auto; border: 2px solid var(--linha); background: #fff;
  border-radius: 12px; padding: 11px; font: 800 14px 'Nunito', sans-serif;
  color: var(--tinta); cursor: pointer;
}
.gm-toggle button.ativa { background: var(--berry); border-color: var(--berry); color: #fff; }

.gm-qtd { display: flex; align-items: center; justify-content: center; gap: 20px; margin: 6px 0; }
.gm-qtd button {
  width: 42px; height: 42px; border-radius: 50%; border: 2px solid var(--linha);
  background: #fff; font: 800 20px 'Nunito', sans-serif; color: var(--berry); cursor: pointer;
}
.gm-qtd span { font-weight: 800; font-size: 18px; min-width: 24px; text-align: center; }

.gm-resumo {
  background: #fff; border: 1px solid var(--linha); border-radius: 16px;
  padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px;
}
.gm-resumo div { display: flex; justify-content: space-between; font-size: 14.5px; }
.gm-resumo .tot { font-weight: 800; font-size: 17px; border-top: 1px dashed var(--linha); padding-top: 8px; }

.gm-confirmacao { align-items: center; text-align: center; padding-top: 48px; gap: 14px; }
.gm-confirmacao p { margin: 0; max-width: 320px; opacity: .8; }
.gm-check {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--pistache); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 800;
}

/* Container Geral */
.gm-vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  padding: 20px;
}

/* Título Principal */
.gm-titulo {
  margin-bottom: 15px;
}

/* Container dos Horários */
.gm-horarios-funcionamento-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

/* Cada linha de horário (Ícone + Texto) */
.gm-horario-funcionamento {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}


@media (prefers-reduced-motion: reduce) {
  .gm-card:active, .gm-btn:active { transform: none; }
}
`;