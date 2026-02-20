// src/components/Produtos/Produtos.jsx

import React, { useState, useEffect } from 'react';
import produtoService from '../services/produtosService';
import categoriaService from '../services/categoriasService';
import './Produtos.css';

const Produtos = () => {
    // Estados do componente
    const [produtos, setProdutos] = useState([]);
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

    // Função para carregar produtos e categorias
    const carregarDados = async () => {
        try {
            setLoading(true);

            // Carregar produtos e categorias em paralelo
            const [produtosData, categoriasData] = await Promise.all([
                produtoService.buscarTodos(),
                categoriaService.buscarTodas()
            ]);

            setProdutos(produtosData);
            setCategorias(categoriasData);
            setError('');
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Função para filtrar produtos por categoria
    const carregarProdutosPorCategoria = async (categoriaId) => {
        try {
            setLoading(true);
            let produtosData;

            if (categoriaId === '') {
                produtosData = await produtoService.buscarTodos();
            } else {
                produtosData = await produtoService.buscarPorCategoria(categoriaId);
            }

            setProdutos(produtosData);
            setError('');
        } catch (err) {
            setError('Erro ao filtrar produtos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Função para lidar com mudanças no filtro
    const handleFiltroChange = (e) => {
        const categoriaId = e.target.value;
        setFiltroCategoria(categoriaId);
        carregarProdutosPorCategoria(categoriaId);
    };

    // Função para lidar com mudanças no formulário
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Função para salvar produto
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
                // Atualizar produto existente
                await produtoService.atualizar({ ...dadosParaEnvio, id: editando });
                alert('Produto atualizado com sucesso!');
            } else {
                // Criar novo produto
                await produtoService.criar(dadosParaEnvio);
                alert('Produto criado com sucesso!');
            }

            // Limpar formulário e recarregar lista
            setFormData({ nome: '', descricao: '', preco: '', categoria_id: '', ativo: true });
            setShowForm(false);
            setEditando(null);
            carregarDados();

        } catch (err) {
            alert('Erro ao salvar produto: ' + err.message);
            console.error('Erro detalhado:', err);
        }
    };

    // Função para editar produto
    const handleEdit = (produto) => {
        setFormData({
            nome: produto.nome,
            descricao: produto.descricao || '',
            preco: produto.preco.toString(),
            categoria_id: produto.categoria_id.toString(),
            ativo: produto.ativo
        });
        setEditando(produto.id);
        setShowForm(true);
    };

    // Função para deletar produto
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await produtoService.deletar(id);
                alert('Produto excluído com sucesso!');
                carregarDados();
            } catch (err) {
                alert('Erro ao excluir produto: ' + err.message);
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
        <div className="produtos-container">
            <div className="produtos-header">
                <h2>Gerenciar Produtos</h2>
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
                        Novo Produto
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Formulário */}
            {showForm && (
                <div className="form-container">
                    <h3>{editando ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nome">Nome do Produto:</label>
                                <input
                                    type="text"
                                    id="nome"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Ex: X-Burguer, Coca-Cola..."
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
                                    placeholder="15.90"
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
                                placeholder="Descrição do produto (opcional)"
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
                                Produto ativo
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

            {/* Lista de produtos */}
            <div className="produtos-list">
                {loading ? (
                    <div className="loading">Carregando produtos...</div>
                ) : (
                    <div className="produtos-grid">
                        {produtos.length === 0 ? (
                            <div className="no-data">
                                {filtroCategoria ? 'Nenhum produto encontrado nesta categoria' : 'Nenhum produto cadastrado'}
                            </div>
                        ) : (
                            produtos.map(produto => (
                                <div key={produto.id} className="produto-card">
                                    <div className="produto-info">
                                        <h4>{produto.nome}</h4>
                                        <div className="produto-preco">{formatarPreco(produto.preco)}</div>
                                        <div className="produto-categoria">
                                            <span className="categoria-tag">{produto.categoria_nome}</span>
                                        </div>
                                        {produto.descricao && (
                                            <p className="produto-descricao">{produto.descricao}</p>
                                        )}
                                        <span className={`status ${produto.ativo ? 'ativo' : 'inativo'}`}>
                                            {produto.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="produto-actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(produto)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(produto.id)}
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
            {!loading && produtos.length > 0 && (
                <div className="produtos-resumo">
                    <div className="resumo-card">
                        <h4>Resumo</h4>
                        <p><strong>Total de produtos:</strong> {produtos.length}</p>
                        <p><strong>Produtos ativos:</strong> {produtos.filter(p => p.ativo).length}</p>
                        <p><strong>Categorias com produtos:</strong> {[...new Set(produtos.map(p => p.categoria_nome))].length}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produtos;