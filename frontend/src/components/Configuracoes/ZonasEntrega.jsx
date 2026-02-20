// src/components/Configuracoes/ZonasEntrega.jsx
// 🚚 COMPONENTE: Cadastro de Zonas de Entrega

import React, { useState, useEffect } from 'react';
import zonasEntregaService from '../../services/zonasEntregaService';
import './ZonasEntrega.css';

const ZonasEntrega = () => {
  // Estados
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  
  // Form
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  
  // Mensagens
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');

  useEffect(() => {
    carregarZonas();
  }, []);

  const carregarZonas = async () => {
    try {
      setLoading(true);
      const resultado = await zonasEntregaService.buscarTodas(false); // false = todas
      setZonas(resultado);
    } catch (error) {
      mostrarMensagemFeedback('Erro ao carregar zonas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setValor('');
    setDescricao('');
    setAtivo(true);
    setEditando(null);
    setMostrarFormulario(false);
  };

  const handleNovo = () => {
    limparFormulario();
    setMostrarFormulario(true);
  };

  const handleEditar = (zona) => {
    setNome(zona.nome);
    setValor(zona.valor);
    setDescricao(zona.descricao || '');
    setAtivo(zona.ativo === 1);
    setEditando(zona);
    setMostrarFormulario(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();

    // Validações
    if (!nome.trim()) {
      mostrarMensagemFeedback('Nome é obrigatório', 'error');
      return;
    }

    if (!valor || parseFloat(valor) < 0) {
      mostrarMensagemFeedback('Valor deve ser maior ou igual a zero', 'error');
      return;
    }

    try {
      const dados = {
        nome: nome.trim(),
        valor: parseFloat(valor),
        descricao: descricao.trim(),
        ativo: ativo ? 1 : 0
      };

      if (editando) {
        // Atualizar
        dados.id = editando.id;
        await zonasEntregaService.atualizar(dados);
        mostrarMensagemFeedback('Zona atualizada com sucesso!', 'success');
      } else {
        // Criar
        await zonasEntregaService.criar(dados);
        mostrarMensagemFeedback('Zona criada com sucesso!', 'success');
      }

      limparFormulario();
      carregarZonas();

    } catch (error) {
      mostrarMensagemFeedback(
        editando ? 'Erro ao atualizar zona' : 'Erro ao criar zona',
        'error'
      );
    }
  };

  const handleDeletar = async (zona) => {
    if (!window.confirm(`Deseja excluir a zona "${zona.nome}"?`)) return;

    try {
      await zonasEntregaService.deletar(zona.id);
      mostrarMensagemFeedback('Zona excluída com sucesso!', 'success');
      carregarZonas();
    } catch (error) {
      mostrarMensagemFeedback('Erro ao excluir zona', 'error');
    }
  };

  const mostrarMensagemFeedback = (texto, tipo) => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    setTimeout(() => {
      setMensagem('');
      setTipoMensagem('');
    }, 3000);
  };

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (loading) {
    return (
      <div className="zonas-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="zonas-container">

      {/* Mensagem */}
      {mensagem && (
        <div className={`mensagem-feedback ${tipoMensagem}`}>
          <i className={`fas fa-${tipoMensagem === 'success' ? 'check' : 'exclamation'}-circle`}></i>
          {mensagem}
        </div>
      )}

      {/* Header */}
      <div className="zonas-header">
        <div>
          <h2>
            <i className="fas fa-map-marked-alt"></i>
            Zonas de Entrega
          </h2>
          <p>Gerencie as zonas e taxas de entrega</p>
        </div>
        <button className="btn-novo" onClick={handleNovo}>
          <i className="fas fa-plus"></i>
          Nova Zona
        </button>
      </div>

      {/* Formulário */}
      {mostrarFormulario && (
        <div className="zonas-form-card">
          <div className="form-header">
            <h3>{editando ? 'Editar Zona' : 'Nova Zona'}</h3>
            <button className="btn-fechar-form" onClick={limparFormulario}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSalvar}>
            <div className="form-row">
              <div className="form-campo">
                <label>Nome da Zona *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Centro, Bairro Norte"
                  required
                />
              </div>

              <div className="form-campo form-campo-pequeno">
                <label>Taxa de Entrega (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="form-campo">
              <label>Descrição (opcional)</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Região central da cidade"
              />
            </div>

            <div className="form-campo">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                Zona ativa
              </label>
            </div>

            <div className="form-acoes">
              <button type="button" className="btn-cancelar" onClick={limparFormulario}>
                Cancelar
              </button>
              <button type="submit" className="btn-salvar">
                <i className="fas fa-save"></i>
                {editando ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="zonas-lista">
        {zonas.length === 0 ? (
          <div className="zonas-vazio">
            <i className="fas fa-map-marked-alt"></i>
            <p>Nenhuma zona cadastrada</p>
            <button className="btn-criar-primeira" onClick={handleNovo}>
              Criar primeira zona
            </button>
          </div>
        ) : (
          <table className="zonas-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Taxa</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {zonas.map((zona) => (
                <tr key={zona.id} className={zona.ativo ? '' : 'inativa'}>
                  <td className="zona-nome">{zona.nome}</td>
                  <td className="zona-valor">{formatarPreco(zona.valor)}</td>
                  <td className="zona-descricao">{zona.descricao || '-'}</td>
                  <td>
                    <span className={`status-badge ${zona.ativo ? 'ativa' : 'inativa'}`}>
                      {zona.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="zona-acoes">
                    <button
                      className="btn-acao-editar"
                      onClick={() => handleEditar(zona)}
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-acao-deletar"
                      onClick={() => handleDeletar(zona)}
                      title="Excluir"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default ZonasEntrega;
