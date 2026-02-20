// src/services/adicionaisService.js
import axios from 'axios';

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
        console.error('Erro na API:', error);
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
        console.error('Erro na requisição:', error);
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
            console.error('Erro ao buscar adicionais:', error);
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
            console.error('Erro ao buscar adicionais por categoria:', error);
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
            console.error('Erro ao criar adicional:', error);
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
            console.error('Erro ao atualizar adicional:', error);
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
            console.error('Erro ao deletar adicional:', error);
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
            console.error('Erro ao buscar adicional:', error);
            throw new Error('Erro ao carregar adicional.');
        }
    }
};

export default adicionaisService;