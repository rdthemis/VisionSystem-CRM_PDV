// src/components/Produtos.js

import React, { useState, useEffect, useRef } from 'react';
import produtoService from '../services/produtosService';
import categoriaService from '../services/categoriasService';
import './Produtos.css';
import Logger from '../utils/Logger';

const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [filtroCategoria, setFiltroCategoria] = useState('');

    // 📸 Estados de imagem
    const [imagemPreview, setImagemPreview] = useState(null);
    const [imagemArquivo, setImagemArquivo] = useState(null);
    const [uploadingImagem, setUploadingImagem] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco: '',
        categoria_id: '',
        ativo: true
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [produtosData, categoriasData] = await Promise.all([
                produtoService.buscarTodos(),
                categoriaService.buscarTodas()
            ]);
            setProdutos(produtosData); 
            setCategorias(categoriasData);
            setError('');
        } catch (err) {
            setError('Erro ao carregar dados');
            Logger.error('Erro ao carregar dados:', { erro: err });
        } finally {
            setLoading(false);
        }
    };

    const carregarProdutosPorCategoria = async (categoriaId) => {
        try {
            setLoading(true);
            const produtosData = categoriaId === ''
                ? await produtoService.buscarTodos()
                : await produtoService.buscarPorCategoria(categoriaId);
            setProdutos(produtosData);
            setError('');
        } catch (err) {
            setError('Erro ao filtrar produtos');
            Logger.error('Erro ao filtrar produtos:', { erro: err });
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (e) => {
        const categoriaId = e.target.value;
        setFiltroCategoria(categoriaId);
        carregarProdutosPorCategoria(categoriaId);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ══════════════════════════════════════════════════════════════
    // 📸 HANDLERS DE IMAGEM
    // ══════════════════════════════════════════════════════════════

    const handleImagemChange = (e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;

        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!tiposPermitidos.includes(arquivo.type)) {
            alert('Use imagens JPG, PNG ou WebP.');
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            alert('Imagem muito grande. Máximo: 5MB.');
            return;
        }

        setImagemArquivo(arquivo);
        const reader = new FileReader();
        reader.onload = (e) => setImagemPreview(e.target.result);
        reader.readAsDataURL(arquivo);
    };

    const handleRemoverImagemPreview = () => {
        setImagemArquivo(null);
        setImagemPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoverImagemProduto = async (produtoId) => {
        if (!window.confirm('Remover a imagem deste produto?')) return;

        try {
            const resultado = await produtoService.remover(produtoId);
            if (resultado.success) {
                alert('Imagem removida!');
                carregarDados();
            } else {
                alert(resultado.message || 'Erro ao remover imagem');
            }
        } catch (err) {
            alert('Erro ao remover imagem');
            Logger.error('Erro ao remover imagem:', { erro: err });
        }
    };

    /**
     * Upload avulso direto na lista (botão câmera no card)
     */
    const handleUploadAvulso = async (produtoId, e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;

        const res = await produtoService.uploadImagem(produtoId, arquivo);
        if (res.success) {
            carregarDados();
        } else {
            alert(res.message);
        }
    };

    // ══════════════════════════════════════════════════════════════
    // SALVAR PRODUTO
    // ══════════════════════════════════════════════════════════════

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!formData.nome.trim()) { alert('Nome é obrigatório'); return; }
            if (!formData.preco || isNaN(formData.preco) || parseFloat(formData.preco) <= 0) {
                alert('Preço deve ser um número válido maior que zero'); return;
            }
            if (!formData.categoria_id) { alert('Categoria é obrigatória'); return; }

            const dadosParaEnvio = {
                ...formData,
                preco: parseFloat(formData.preco),
                categoria_id: parseInt(formData.categoria_id)
            };

            // 📸 Se tem imagem, incluir base64 nos dados
            if (imagemArquivo) {
                setUploadingImagem(true);
                dadosParaEnvio.imagem_base64 = await produtoService._fileToBase64(imagemArquivo);
            }

            if (editando) {
                await produtoService.atualizar({ ...dadosParaEnvio, id: editando });
                alert('Produto atualizado com sucesso!');
            } else {
                await produtoService.criar(dadosParaEnvio);
                alert('Produto criado com sucesso!');
            }

            limparFormulario();
            carregarDados();

        } catch (err) {
            alert('Erro ao salvar produto: ' + err.message);
            Logger.error('Erro ao salvar produto:', { erro: err });
        } finally {
            setUploadingImagem(false);
        }
    };

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

        // 📸 Mostrar imagem atual como preview
        if (produto.imagem) {
            setImagemPreview(produtoService.getThumbUrl(produto.imagem));
        } else {
            setImagemPreview(null);
        }
        setImagemArquivo(null);
    };

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

    const limparFormulario = () => {
        setFormData({ nome: '', descricao: '', preco: '', categoria_id: '', ativo: true });
        setShowForm(false);
        setEditando(null);
        setImagemPreview(null);
        setImagemArquivo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatarPreco = (preco) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(preco);
    };

    // ══════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO
    // ══════════════════════════════════════════════════════════════

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
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        Novo Produto
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* ══════════════════════════════════════════
                FORMULÁRIO
            ══════════════════════════════════════════ */}
            {showForm && (
                <div className="form-container">
                    <h3>{editando ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nome">Nome do Produto:</label>
                                <input
                                    type="text" id="nome" name="nome"
                                    value={formData.nome} onChange={handleInputChange}
                                    required placeholder="Ex: Sorvete 500ml Chocolate..."
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="preco">Preço (R$):</label>
                                <input
                                    type="number" id="preco" name="preco"
                                    value={formData.preco} onChange={handleInputChange}
                                    required placeholder="15.90" step="0.01" min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="categoria_id">Categoria:</label>
                            <select
                                id="categoria_id" name="categoria_id"
                                value={formData.categoria_id} onChange={handleInputChange} required
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
                                id="descricao" name="descricao"
                                value={formData.descricao} onChange={handleInputChange}
                                placeholder="Descrição do produto (opcional)" rows="3"
                            />
                        </div>

                        {/* ══════════════════════════════════════
                            📸 CAMPO DE IMAGEM
                        ══════════════════════════════════════ */}
                        <div className="form-group">
                            <label>Imagem do Produto:</label>
                            <div className="imagem-upload-area">
                                {imagemPreview ? (
                                    <div className="imagem-preview-container">
                                        <img src={imagemPreview} alt="Preview" className="imagem-preview" />
                                        <button
                                            type="button" className="btn-remover-imagem"
                                            onClick={handleRemoverImagemPreview} title="Remover"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="imagem-placeholder" onClick={() => fileInputRef.current?.click()}>
                                        <i className="fas fa-camera"></i>
                                        <span>Clique para adicionar foto</span>
                                        <small>JPG, PNG ou WebP — Máx 5MB</small>
                                    </div>
                                )}

                                <input
                                    type="file" ref={fileInputRef}
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImagemChange}
                                    style={{ display: 'none' }}
                                />

                                {imagemPreview && (
                                    <button
                                        type="button" className="btn-trocar-imagem"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <i className="fas fa-sync-alt"></i> Trocar imagem
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleInputChange} />
                                Produto ativo
                            </label>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" className="btn-primary" disabled={uploadingImagem}>
                                {uploadingImagem
                                    ? <><i className="fas fa-spinner fa-spin"></i> Enviando...</>
                                    : editando ? 'Atualizar' : 'Criar'
                                }
                            </button>
                            <button type="button" className="btn-secondary" onClick={limparFormulario}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ══════════════════════════════════════════
                LISTA COM THUMBNAILS
            ══════════════════════════════════════════ */}
            <div className="produtos-list">
                {loading ? (
                    <div className="loading">Carregando produtos...</div>
                ) : (
                    <div className="produtos-grid">
                        {produtos.length === 0 ? (
                            <div className="no-data">
                                {filtroCategoria ? 'Nenhum produto nesta categoria' : 'Nenhum produto cadastrado'}
                            </div>
                        ) : (
                            produtos.map(produto => (
                                <div key={produto.id} className="produto-card">
                                    {/* 📸 Thumbnail */}
                                    <div className="produto-thumb">
                                        {produto.imagem? (
                                            <img
                                                src={produtoService.getThumbUrl(produto.imagem)}
                                                alt={produto.nome}
                                                className="produto-thumb-img"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="produto-thumb-placeholder"
                                            style={{ display: produto.imagem ? 'none' : 'flex' }}
                                        >
                                            <i className="fas fa-ice-cream"></i>
                                        </div>
                                    </div>

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
                                        {!produto.imagem ? (
                                            <label className="btn-upload-avulso" title="Adicionar foto">
                                                <i className="fas fa-camera"></i>
                                                <input
                                                    type="file" accept="image/jpeg,image/png,image/webp"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleUploadAvulso(produto.id, e)}
                                                />
                                            </label>
                                        ) : (
                                            <button
                                                className="btn-remove-img"
                                                onClick={() => handleRemoverImagemProduto(produto.id)}
                                                title="Remover foto"
                                            >
                                                <i className="fas fa-times-circle"></i>
                                            </button>
                                        )}
                                        <button className="btn-edit" onClick={() => handleEdit(produto)}>Editar</button>
                                        <button className="btn-delete" onClick={() => handleDelete(produto.id)}>Excluir</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {!loading && produtos.length > 0 && (
                <div className="produtos-resumo">
                    <div className="resumo-card">
                        <h4>Resumo</h4>
                        <p><strong>Total de produtos:</strong> {produtos.length}</p>
                        <p><strong>Produtos ativos:</strong> {produtos.filter(p => p.ativo).length}</p>
                        <p><strong>Com imagem:</strong> {produtos.filter(p => p.imagem).length}</p>
                        <p><strong>Categorias:</strong> {[...new Set(produtos.map(p => p.categoria_nome))].length}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produtos;
