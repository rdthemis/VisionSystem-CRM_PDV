// src/services/adicionaisService.js
import axios from 'axios';
import Logger from '../utils/Logger';

// Configuração da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Criar instância do axios com configurações padrão
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        Logger.error('Erro na API:', { erro: error });
        return Promise.reject(error);
    }
);

// Função para fazer requisições autenticadas
const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);

        // Se token expirou, redirecionar para login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        Logger.error('Erro na requisição:', { erro: error });
        throw error;
    }
};

const adicionaisService = {
    // Buscar todos os adicionais
    async buscarTodos() {
        try {
            const data = await fetchWithAuth('/adicionais');

            if (data && data.success) {
                return data.data;
            } else {
                throw new Error(data?.message || 'Erro ao buscar adicionais');
            }
        } catch (error) {
            Logger.error('Erro ao buscar adicionais:', { erro: error });
            throw new Error('Erro ao carregar adicionais. Verifique sua conexão.');
        }
    },

    // Buscar adicionais por categoria
    async buscarPorCategoria(categoriaId) {
        try {
            const data = await fetchWithAuth(`/adicionais?categoria_id=${categoriaId}`);

            if (data && data.success) {
                return data.data;
            } else {
                throw new Error(data?.message || 'Erro ao buscar adicionais da categoria');
            }
        } catch (error) {
            Logger.error('Erro ao buscar adicionais por categoria:', { erro: error });
            throw new Error('Erro ao filtrar adicionais por categoria.');
        }
    },

    // Criar novo adicional
    async criar(adicionalData) {
        try {
            const data = await fetchWithAuth('/adicionais', {
                method: 'POST',
                body: JSON.stringify(adicionalData)
            });

            if (data && data.success) {
                return data;
            } else {
                throw new Error(data?.message || 'Erro ao criar adicional');
            }
        } catch (error) {
            Logger.error('Erro ao criar adicional:', { erro: error });
            throw new Error('Erro ao salvar adicional. Verifique os dados e tente novamente.');
        }
    },

    // Atualizar adicional
    async atualizar(adicionalData) {
        try {
            const data = await fetchWithAuth('/adicionais', {
                method: 'PUT',
                body: JSON.stringify(adicionalData)
            });

            if (data && data.success) {
                return data;
            } else {
                throw new Error(data?.message || 'Erro ao atualizar adicional');
            }
        } catch (error) {
            Logger.error('Erro ao atualizar adicional:', { erro: error });
            throw new Error('Erro ao atualizar adicional. Tente novamente.');
        }
    },

    // Deletar adicional
    async deletar(id) {
        try {
            const data = await fetchWithAuth('/adicionais', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });

            if (data && data.success) {
                return data;
            } else {
                throw new Error(data?.message || 'Erro ao excluir adicional');
            }
        } catch (error) {
            Logger.error('Erro ao deletar adicional:', { erro: error });
            throw new Error('Erro ao excluir adicional. Verifique se não está sendo usado em pedidos.');
        }
    },

    // Buscar adicional por ID
    async buscarPorId(id) {
        try {
            const data = await fetchWithAuth(`/adicionais?id=${id}`);

            if (data && data.success) {
                return data.data;
            } else {
                throw new Error(data?.message || 'Adicional não encontrado');
            }
        } catch (error) {
            Logger.error('Erro ao buscar adicional:', { erro: error });
            throw new Error('Erro ao carregar adicional.');
        }
    }
};

export default adicionaisService;