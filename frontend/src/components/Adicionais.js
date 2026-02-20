// src/components/Adicionais.jsx

import React, { useState, useEffect } from 'react';
import adicionalService from '../services/adicionaisService';
import categoriaService from '../services/categoriasService';
import './Adicionais.css';

const Adicionais = () => {
    // Estados do componente
    const [adicionais, setAdicionais] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [filtroCategoria, setFiltroCategoria] = useState('');

    // Estados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco: '',
        categoria_id: '',
        ativo: true
    });

    // Buscar dados quando o componente carrega
    useEffect(() => {
        carregarDados();
    }, []);

    // Função para carregar adicionais e categorias
    const carregarDados = async () => {
        try {
            setLoading(true);

            // Carregar adicionais e categorias em paralelo
            const [adicionaisData, categoriasData] = await Promise.all([
                adicionalService.buscarTodos(),
                categoriaService.buscarTodas()
            ]);

            setAdicionais(adicionaisData);
            setCategorias(categoriasData);
            setError('');
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Função para filtrar adicionais por categoria
    const carregarAdicionaisPorCategoria = async (categoriaId) => {
        try {
            setLoading(true);
            let adicionaisData;

            if (categoriaId === '') {
                adicionaisData = await adicionalService.buscarTodos();
            } else {
                adicionaisData = await adicionalService.buscarPorCategoria(categoriaId);
            }

            setAdicionais(adicionaisData);
            setError('');
        } catch (err) {
            setError('Erro ao filtrar adicionais');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Função para lidar com mudanças no filtro
    const handleFiltroChange = (e) => {
        const categoriaId = e.target.value;
        setFiltroCategoria(categoriaId);
        carregarAdicionaisPorCategoria(categoriaId);
    };

    // Função para lidar com mudanças no formulário
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Função para salvar adicional
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Validações básicas
            if (!formData.nome.trim()) {
                alert('Nome é obrigatório');
                return;
            }

            if (!formData.preco || isNaN(formData.preco) || parseFloat(formData.preco) <= 0) {
                alert('Preço deve ser um número válido maior que zero');
                return;
            }

            if (!formData.categoria_id) {
                alert('Categoria é obrigatória');
                return;
            }

            const dadosParaEnvio = {
                ...formData,
                preco: parseFloat(formData.preco),
                categoria_id: parseInt(formData.categoria_id)
            };

            if (editando) {
                // Atualizar adicional existente
                await adicionalService.atualizar({ ...dadosParaEnvio, id: editando });
                alert('Adicional atualizado com sucesso!');
            } else {
                // Criar novo adicional
                await adicionalService.criar(dadosParaEnvio);
                alert('Adicional criado com sucesso!');
            }

            // Limpar formulário e recarregar lista
            setFormData({ nome: '', descricao: '', preco: '', categoria_id: '', ativo: true });
            setShowForm(false);
            setEditando(null);
            carregarDados();

        } catch (err) {
            alert('Erro ao salvar adicional: ' + err.message);
            console.error('Erro detalhado:', err);
        }
    };

    // Função para editar adicional
    const handleEdit = (adicional) => {
        setFormData({
            nome: adicional.nome,
            descricao: adicional.descricao || '',
            preco: adicional.preco.toString(),
            categoria_id: adicional.categoria_id.toString(),
            ativo: adicional.ativo
        });
        setEditando(adicional.id);
        setShowForm(true);
    };

    // Função para deletar adicional
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este adicional?')) {
            try {
                await adicionalService.deletar(id);
                alert('Adicional excluído com sucesso!');
                carregarDados();
            } catch (err) {
                alert('Erro ao excluir adicional: ' + err.message);
            }
        }
    };

    // Função para cancelar edição
    const handleCancel = () => {
        setFormData({ nome: '', descricao: '', preco: '', categoria_id: '', ativo: true });
        setShowForm(false);
        setEditando(null);
    };

    // Função para formatar preço
    const formatarPreco = (preco) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(preco);
    };

    return (
        <div className="adicionais-container">
            <div className="adicionais-header">
                <h2>Gerenciar Adicionais</h2>
                <div className="header-actions">
                    <select
                        value={filtroCategoria}
                        onChange={handleFiltroChange}
                        className="filtro-categoria"
                    >
                        <option value="">Todas as categorias</option>
                        {categorias.map(categoria => (
                            <option key={categoria.id} value={categoria.id}>
                                {categoria.nome}
                            </option>
                        ))}
                    </select>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        Novo Adicional
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Formulário */}
            {showForm && (
                <div className="form-container">
                    <h3>{editando ? 'Editar Adicional' : 'Novo Adicional'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nome">Nome do Adicional:</label>
                                <input
                                    type="text"
                                    id="nome"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Ex: Queijo Extra, Bacon, Molho..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="preco">Preço (R$):</label>
                                <input
                                    type="number"
                                    id="preco"
                                    name="preco"
                                    value={formData.preco}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="3.50"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="categoria_id">Categoria:</label>
                            <select
                                id="categoria_id"
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Selecione uma categoria</option>
                                {categorias.map(categoria => (
                                    <option key={categoria.id} value={categoria.id}>
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="descricao">Descrição:</label>
                            <textarea
                                id="descricao"
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                placeholder="Descrição do adicional (opcional)"
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="ativo"
                                    checked={formData.ativo}
                                    onChange={handleInputChange}
                                />
                                Adicional ativo
                            </label>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" className="btn-primary">
                                {editando ? 'Atualizar' : 'Criar'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleCancel}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de adicionais */}
            <div className="adicionais-list">
                {loading ? (
                    <div className="loading">Carregando adicionais...</div>
                ) : (
                    <div className="adicionais-grid">
                        {adicionais.length === 0 ? (
                            <div className="no-data">
                                {filtroCategoria ? 'Nenhum adicional encontrado nesta categoria' : 'Nenhum adicional cadastrado'}
                            </div>
                        ) : (
                            adicionais.map(adicional => (
                                <div key={adicional.id} className="adicional-card">
                                    <div className="adicional-info">
                                        <h4>{adicional.nome}</h4>
                                        <div className="adicional-preco">{formatarPreco(adicional.preco)}</div>
                                        <div className="adicional-categoria">
                                            <span className="categoria-tag">{adicional.categoria_nome}</span>
                                        </div>
                                        {adicional.descricao && (
                                            <p className="adicional-descricao">{adicional.descricao}</p>
                                        )}
                                        <span className={`status ${adicional.ativo ? 'ativo' : 'inativo'}`}>
                                            {adicional.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="adicional-actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(adicional)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(adicional.id)}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Resumo */}
            {!loading && adicionais.length > 0 && (
                <div className="adicionais-resumo">
                    <div className="resumo-card">
                        <h4>Resumo</h4>
                        <p><strong>Total de adicionais:</strong> {adicionais.length}</p>
                        <p><strong>Adicionais ativos:</strong> {adicionais.filter(a => a.ativo).length}</p>
                        <p><strong>Categorias com adicionais:</strong> {[...new Set(adicionais.map(a => a.categoria_nome))].length}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Adicionais;