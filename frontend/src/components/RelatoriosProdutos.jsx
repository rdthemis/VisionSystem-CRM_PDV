import React, { useState, useEffect, useMemo } from 'react';
import Logger from '../utils/Logger.js';
import produtoService from '../services/produtosService.js';
import categoriaService from '../services/categoriasService.js';
import adicionaisService from '../services/adicionaisService.js';

/**
 * RelatorioCadastros
 * Relatório de acompanhamento de cadastros: produtos e adicionais agrupados por categoria.
 * Objetivo: dar visibilidade rápida de quantos produtos e adicionais existem em cada
 * categoria, e sinalizar categorias que ainda não têm produtos ou adicionais cadastrados.
 *
 * INTEGRAÇÃO NO SEU BACKEND:
 * Ajuste as 3 chamadas fetch() dentro de carregarDados() para os endpoints reais da sua API.
 * O componente espera este formato de resposta (ajuste o mapeamento se seu retorno for diferente):
 *
 * GET /api/categorias.php
 *   [{ id, nome }]
 *
 * GET /api/produtos.php
 *   [{ id, nome, categoria_id, preco, ativo }]
 *
 * GET /api/adicionais.php
 *   [{ id, nome, categoria_id, preco, ativo }]
 *
 * Se os adicionais forem vinculados por categoria (como você descreveu), o campo
 * categoria_id em adicionais é o que conecta tudo.
 

const API_BASE = 'http://localhost:8000'; // ex: 'http://localhost:8000' -- ajuste conforme seu setup

async function carregarDados() {
  const headers = {
    'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`, // se seu backend usa JWT
  };

  const [categoriasRes, produtosRes, adicionaisRes] = await Promise.all([
    fetch(`${API_BASE}/categorias.php`, { headers }),
    fetch(`${API_BASE}/produtos.php`, { headers }),
    fetch(`${API_BASE}/adicionais.php`, { headers }),
  ]);

  if (!categoriasRes.ok || !produtosRes.ok || !adicionaisRes.ok) {
    throw new Error('Falha ao carregar dados do relatório.');
  }

  const [categorias, produtos, adicionais] = await Promise.all([
    categoriasRes.json(),
    produtosRes.json(),
    adicionaisRes.json(),
  ]);

  return { categorias, produtos, adicionais };
}
*/


function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RelatorioProdutos() {
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [adicionais, setAdicionais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [apenasIncompletas, setApenasIncompletas] = useState(false);
  const [categoriasAbertas, setCategoriasAbertas] = useState({});

  const buscaDebounced = useDebounced(busca);

  const carregarDados = async () => {
        try {
            const [produtosData, categoriasData, adicionaisData] = await Promise.all([
                produtoService.buscarTodos(),
                categoriaService.buscarTodas(),
                adicionaisService.buscarTodos()
            ]);
            Logger.info('Dados carregados com sucesso:', { produtos: produtosData, categorias: categoriasData, adicionais: adicionaisData });
            return { categorias: categoriasData, produtos: produtosData, adicionais: adicionaisData };
            } catch (err) {
            Logger.error('Erro ao carregar dados:', { erro: err });
            throw err;
        }
  };

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    carregarDados()
      .then((dados) => {
        if (!ativo) return;
        setCategorias(dados.categorias || []);
        setProdutos(dados.produtos || []);
        setAdicionais(dados.adicionais || []);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const grupos = useMemo(() => {
    return categorias
      .map((cat) => {
        const produtosDaCategoria = produtos.filter((p) => p.categoria_id === cat.id);
        const adicionaisDaCategoria = adicionais.filter((a) => a.categoria_id === cat.id);
        return {
          categoria: cat,
          produtos: produtosDaCategoria,
          adicionais: adicionaisDaCategoria,
          semProdutos: produtosDaCategoria.length === 0,
          semAdicionais: adicionaisDaCategoria.length === 0,
        };
      })
      .filter((g) => {
        if (apenasIncompletas && !g.semProdutos && !g.semAdicionais) return false;
        if (!buscaDebounced.trim()) return true;
        const termo = buscaDebounced.toLowerCase();
        const nomeCategoriaCombina = g.categoria.nome.toLowerCase().includes(termo);
        const produtoCombina = g.produtos.some((p) => p.nome.toLowerCase().includes(termo));
        const adicionalCombina = g.adicionais.some((a) => a.nome.toLowerCase().includes(termo));
        return nomeCategoriaCombina || produtoCombina || adicionalCombina;
      })
      .sort((a, b) => a.categoria.nome.localeCompare(b.categoria.nome, 'pt-BR'));
  }, [categorias, produtos, adicionais, buscaDebounced, apenasIncompletas]);

  const resumo = useMemo(() => {
    const totalCategorias = categorias.length;
    const totalProdutos = produtos.length;
    const totalAdicionais = adicionais.length;
    const categoriasSemProdutos = categorias.filter(
      (c) => !produtos.some((p) => p.categoria_id === c.id)
    ).length;
    const categoriasSemAdicionais = categorias.filter(
      (c) => !adicionais.some((a) => a.categoria_id === c.id)
    ).length;
    return { totalCategorias, totalProdutos, totalAdicionais, categoriasSemProdutos, categoriasSemAdicionais };
  }, [categorias, produtos, adicionais]);

  function alternarCategoria(id) {
    setCategoriasAbertas((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (carregando) {
    return (
      <div style={estilos.pagina}>
        <p style={estilos.textoMuted}>Carregando relatório...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={estilos.pagina}>
        <div style={estilos.cartaoErro}>
          <p style={{ margin: 0, fontWeight: 600 }}>Não foi possível carregar o relatório</p>
          <p style={{ margin: '4px 0 0', color: '#7a5350' }}>{erro}</p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#7a5350' }}>
            Verifique se os endpoints em <code>carregarDados()</code> estão corretos e se o backend (localhost:8000) está no ar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.cabecalho}>
        <div>
          <h1 style={estilos.titulo}>Relatório de cadastros</h1>
          <p style={estilos.subtitulo}>Produtos e adicionais agrupados por categoria</p>
        </div>
      </div>

      <div style={estilos.gridResumo}>
        <CartaoResumo rotulo="Categorias" valor={resumo.totalCategorias} />
        <CartaoResumo rotulo="Produtos" valor={resumo.totalProdutos} />
        <CartaoResumo rotulo="Adicionais" valor={resumo.totalAdicionais} />
        <CartaoResumo
          rotulo="Categorias sem produtos"
          valor={resumo.categoriasSemProdutos}
          alerta={resumo.categoriasSemProdutos > 0}
        />
        <CartaoResumo
          rotulo="Categorias sem adicionais"
          valor={resumo.categoriasSemAdicionais}
          alerta={resumo.categoriasSemAdicionais > 0}
        />
      </div>

      <div style={estilos.barraFiltros}>
        <input
          type="text"
          placeholder="Buscar categoria, produto ou adicional..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={estilos.input}
        />
        <label style={estilos.checkboxLabel}>
          <input
            type="checkbox"
            checked={apenasIncompletas}
            onChange={(e) => setApenasIncompletas(e.target.checked)}
          />
          Mostrar só categorias incompletas
        </label>
      </div>

      {grupos.length === 0 && (
        <p style={estilos.textoMuted}>Nenhuma categoria encontrada com esse filtro.</p>
      )}

      <div style={estilos.listaGrupos}>
        {grupos.map((g) => {
          const aberta = categoriasAbertas[g.categoria.id] ?? true;
          return (
            <div key={g.categoria.id} style={estilos.cartaoCategoria}>
              <button
                onClick={() => alternarCategoria(g.categoria.id)}
                style={estilos.cabecalhoCategoria}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{aberta ? '▾' : '▸'}</span>
                  <strong>{g.categoria.nome}</strong>
                </span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <Selo texto={`${g.produtos.length} produto${g.produtos.length === 1 ? '' : 's'}`} alerta={g.semProdutos} />
                  <Selo texto={`${g.adicionais.length} adicional${g.adicionais.length === 1 ? '' : 'is'}`} alerta={g.semAdicionais} />
                </span>
              </button>

              {aberta && (
                <div style={estilos.corpoCategoria}>
                  <div style={estilos.colunaCategoria}>
                    <p style={estilos.tituloColuna}>Produtos</p>
                    {g.produtos.length === 0 ? (
                      <p style={estilos.vazio}>Nenhum produto cadastrado nesta categoria.</p>
                    ) : (
                      <ul style={estilos.lista}>
                        {g.produtos.map((p) => (
                          <li key={p.id} style={estilos.itemLista}>
                            <span>{p.nome}</span>
                            <span style={estilos.preco}>
                              {typeof p.preco === 'number'
                                ? p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={estilos.colunaCategoria}>
                    <p style={estilos.tituloColuna}>Adicionais</p>
                    {g.adicionais.length === 0 ? (
                      <p style={estilos.vazio}>Nenhum adicional cadastrado nesta categoria.</p>
                    ) : (
                      <ul style={estilos.lista}>
                        {g.adicionais.map((a) => (
                          <li key={a.id} style={estilos.itemLista}>
                            <span>{a.nome}</span>
                            <span style={estilos.preco}>
                              {typeof a.preco === 'number'
                                ? a.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CartaoResumo({ rotulo, valor, alerta }) {
  return (
    <div style={{ ...estilos.cartaoMetrica, ...(alerta ? estilos.cartaoMetricaAlerta : {}) }}>
      <p style={estilos.rotuloMetrica}>{rotulo}</p>
      <p style={{ ...estilos.valorMetrica, ...(alerta ? { color: '#a34c1f' } : {}) }}>{valor}</p>
    </div>
  );
}

function Selo({ texto, alerta }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: '3px 8px',
        borderRadius: 999,
        background: alerta ? '#fbe9e1' : '#eef1ed',
        color: alerta ? '#a34c1f' : '#4b5d4f',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {texto}
    </span>
  );
}

const estilos = {
  pagina: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px 16px 48px',
    color: '#2c2c2a',
  },
  cabecalho: { marginBottom: 20 },
  titulo: { fontSize: 22, fontWeight: 600, margin: 0 },
  subtitulo: { fontSize: 14, color: '#6b6b66', margin: '4px 0 0' },
  gridResumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  cartaoMetrica: {
    background: '#f4f6f2',
    borderRadius: 10,
    padding: '14px 16px',
  },
  cartaoMetricaAlerta: {
    background: '#fdf1ea',
  },
  rotuloMetrica: { fontSize: 12, color: '#6b6b66', margin: 0 },
  valorMetrica: { fontSize: 24, fontWeight: 600, margin: '4px 0 0' },
  barraFiltros: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: 220,
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #dcdcd5',
    fontSize: 14,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#4a4a46',
    whiteSpace: 'nowrap',
  },
  textoMuted: { color: '#6b6b66', fontSize: 14 },
  listaGrupos: { display: 'flex', flexDirection: 'column', gap: 10 },
  cartaoCategoria: {
    border: '1px solid #e4e4dd',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#fff',
  },
  cabecalhoCategoria: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#fafaf7',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left',
  },
  corpoCategoria: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    borderTop: '1px solid #e4e4dd',
  },
  colunaCategoria: {
    padding: '12px 16px',
  },
  tituloColuna: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#8a8a83',
    margin: '0 0 8px',
    fontWeight: 600,
  },
  lista: { listStyle: 'none', margin: 0, padding: 0 },
  itemLista: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: 13.5,
    borderBottom: '1px solid #f0f0ec',
  },
  preco: { color: '#6b6b66', fontVariantNumeric: 'tabular-nums' },
  vazio: { fontSize: 13, color: '#a3a39c', fontStyle: 'italic', margin: 0 },
  cartaoErro: {
    background: '#fdeeea',
    border: '1px solid #f0c9bd',
    borderRadius: 10,
    padding: '14px 16px',
    color: '#8a3d29',
  },
};
