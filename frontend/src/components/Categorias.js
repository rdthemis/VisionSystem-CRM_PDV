// src/components/Categorias/Categorias.jsx

import React, { useState, useEffect } from 'react';
import categoriaService from '../services/categoriasService';
import './Categorias.css';
import Logger from '../utils/Logger';

const Categorias = () => {
    // Estados do componente
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState(null);
    
    // Estados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        ativo: true
    });
    
    // Buscar categorias quando o componente carrega
    useEffect(() => {
        carregarCategorias();
    }, []);

    // Função para carregar categorias - VERSÃO CORRIGIDA
    const carregarCategorias = async () => {
        try {
            setLoading(true);
            const response = await categoriaService.buscarTodas();

            // 🔧 CORREÇÃO: Verificar se a resposta tem a estrutura esperada
            Logger.debug('Resposta da API:', {debug: response}); // Para debug

            if (response && response.success && Array.isArray(response.data)) {
                // Se a API retorna { success: true, data: [...] }
                setCategorias(response.data);
            } else if (Array.isArray(response)) {
                // Se a API retorna diretamente o array
                setCategorias(response);
            } else {
                // Se não é nem um nem outro, algo está errado
                Logger.error('Formato de resposta inesperado:', {erro: response});
                setCategorias([]);
                setError('Formato de dados inválido recebido da API');
            }

            setError('');
        } catch (err) {
            setError('Erro ao carregar categorias');
            Logger.error('Erro detalhado:', {erro: err});
            setCategorias([]); // 🔧 IMPORTANTE: Garantir que seja sempre um array
        } finally {
            setLoading(false);
        }
    };
    // Função para lidar com mudanças no formulário
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Função para salvar categoria
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editando) {
                // Atualizar categoria existente
                await categoriaService.atualizar({ ...formData, id: editando });
                alert('Categoria atualizada com sucesso!');
            } else {
                // Criar nova categoria
                await categoriaService.criar(formData);
                alert('Categoria criada com sucesso!');
            }

            // Limpar formulário e recarregar lista
            setFormData({ nome: '', descricao: '', ativo: true });
            setShowForm(false);
            setEditando(null);
            carregarCategorias();

        } catch (err) {
            alert('Erro ao salvar categoria: ' + err.message);
        }
    };

    // Função para editar categoria
    const handleEdit = (categoria) => {
        setFormData({
            nome: categoria.nome,
            descricao: categoria.descricao,
            ativo: categoria.ativo
        });
        setEditando(categoria.id);
        setShowForm(true);
    };

    // Função para deletar categoria
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            try {
                await categoriaService.deletar(id);
                alert('Categoria excluída com sucesso!');
                carregarCategorias();
            } catch (err) {
                alert('Erro ao excluir categoria: ' + err.message);
            }
        }
    };

    // Função para cancelar edição
    const handleCancel = () => {
        setFormData({ nome: '', descricao: '', ativo: true });
        setShowForm(false);
        setEditando(null);
    };

    return (
        <div className="categorias-container">
            <div className="categorias-header">
                <h2>Gerenciar Categorias</h2>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(true)}
                >
                    Nova Categoria
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Formulário */}
            {showForm && (
                <div className="form-container">
                    <h3>{editando ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="nome">Nome da Categoria:</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange}
                                required
                                placeholder="Ex: Lanches, Bebidas..."
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="descricao">Descrição:</label>
                            <textarea
                                id="descricao"
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                placeholder="Descrição da categoria (opcional)"
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
                                Categoria ativa
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

            {/* Lista de categorias */}
            <div className="categorias-list">
                {loading ? (
                    <div className="loading">Carregando categorias...</div>
                ) : (
                    <div className="categorias-grid">
                        {categorias.length === 0 ? (
                            <div className="no-data">Nenhuma categoria encontrada</div>
                        ) : (
                            categorias.map((categoria) => (
                                <div
                                    key={categoria.id}
                                    className="categoria-card">
                                    <div className="categoria-info">
                                        <h4>{categoria.nome}</h4>
                                        {categoria.descricao && (
                                            <p className="categoria-descricao">{categoria.descricao}</p>
                                        )}
                                        <span className={`status ${categoria.ativo ? 'ativo' : 'inativo'}`}>
                                            {categoria.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="categoria-actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(categoria)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(categoria.id)}
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
            {!loading && categorias.length > 0 && (
                <div className="categorias-resumo">
                    <div className="resumo-card">
                        <h4>Resumo</h4>
                        <p><strong>Total de categorias:</strong> {categorias.length}</p>
                        <p><strong>Categorias ativos:</strong> {categorias.filter(a => a.ativo).length}</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Categorias;