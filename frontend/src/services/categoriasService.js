// frontend/src / services / categoriesService.js

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
        Logger.error('Erro na API:', {erro: error});
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
    }
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        // Se token expirou, redirecionar para login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        Logger.error('Erro na requisição:', {erro: error});
        throw error;
    }
};

// CORREÇÃO: Removemos o 'new' e exportamos o objeto diretamente
const categoriasService = {
    // Buscar todas as categorias - VERSÃO CORRIGIDA
    buscarTodas: async () => {
        try {
            const response = await fetchWithAuth('/categorias');

            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                Logger.error('Resposta inesperada da API:', {erro: response});
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            Logger.error('Erro ao buscar categorias:', {erro: error});
            throw new Error('Erro ao buscar categorias');
        }
    },

    // Buscar categoria por ID - VERSÃO CORRIGIDA
    buscarPorId: async (id) => {
        try {
            const response = await api.get(`/categorias?id=${id}`);

            // 🔧 CORREÇÃO: Extrair os dados corretos
            if (response.data && response.data.success) {
                return response.data.data; // Retorna apenas os dados
            }
            return response.data;
        } catch (error) {
            Logger.error('Erro ao buscar categoria:', {erro: error});
            throw new Error("Erro ao buscar categoria");
        }
    },

    // Criar nova categoria - VERSÃO CORRIGIDA
    criar: async (categoria) => {
        try {
            const response = await fetchWithAuth('/categorias', {
                method: 'POST',
                body: JSON.stringify(categoria)
            });
             
            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                Logger.error('Resposta inesperada da API:', {erro: response});
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            Logger.error('Erro ao criar categorias:', {erro: error});
            throw new Error('Erro ao criar categorias');
        }
    },

    // Atualizar categoria
    atualizar: async (categoria) => {
        try {
            const response = await fetchWithAuth('/categorias', {
                method: 'PUT',
                body: JSON.stringify(categoria)
            });

            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                Logger.error('Resposta inesperada da API:', {erro: response});
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            Logger.error('Erro ao atualizar categorias:', {erro: error});
            throw new Error('Erro ao atualizar categorias');
        }
    },

    // Deletar categoria
    deletar: async (id) => {
        try {
            const response = await api.delete('/categorias', { data: { id } });
            return response.data;
        } catch (error) {
            Logger.error('Erro ao deletar categoria:', {erro: error});
            throw new Error('Erro ao deletar categoria');
        }
    },

    // Formatar moeda brasileira
    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';

        const numero = parseFloat(valor);
        return numero.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    // Limpar formatação e manter apenas números
    limparNumeros(texto) {
        return texto.replace(/\D/g, '');
    },

    // Formatar data para exibição
    formatarData(data) {
        if (!data) return '-';

        const dataObj = new Date(data);
        return dataObj.toLocaleDateString('pt-BR');
    },

    // Formatar data e hora para exibição
    formatarDataHora(data) {
        if (!data) return '-';

        const dataObj = new Date(data);
        return dataObj.toLocaleString('pt-BR');
    }
};

// Exportações
export { categoriasService };
export default categoriasService;