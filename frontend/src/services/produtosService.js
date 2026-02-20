// frontend/src/services/produtosService.js

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
            window.location.reload();
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
};

// CORREÇÃO: Removemos o 'new' e exportamos o objeto diretamente
const produtosService = {
    // Buscar todos os produtos
    buscarTodos: async () => {
        try {
            const response = await fetchWithAuth('/produtos');

            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                console.error('Resposta inesperada da API:', response);
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            console.error("Erro ao buscar todos os produtos:", error);
            throw new Error("Erro ao buscar todos os produtos");
        }
    },

    // Buscar produto por ID
    buscarPorId: async (id) => {
        try {
            const response = await fetchWithAuth('/produtos', {
                method: 'GET',
                body: JSON.stringify(`/produtos?id=${id}`)
            });

            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                console.error('Resposta inesperada da API:', response);
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            console.error("Erro ao buscar produto por ID:", error);
            throw new Error("Erro ao buscar produto por ID");
        }
    },

    // Buscar produtos por categoria
    buscarPorCategoria: async (categoriaId) => {
        try {
            const data = await fetchWithAuth(`/produtos?categoria_id=${categoriaId}`);
            
            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (data && data.success) {
                return data.data; // Retorna apenas o array
            } else if (Array.isArray(data)) {
                return data; // Se já é um array, retorna direto
            } else {
                console.error('Resposta inesperada da API:', data);
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            console.error("Erro ao buscar produtos por categoria:", error);
            throw new Error("Erro ao buscar produtos por categoria");
        }
    },

    // Criar novo produto
    criar: async (produto) => {
        try {
            const response = await fetchWithAuth('/produtos', {
                method: 'POST',
                body: JSON.stringify(produto)
            });

            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                console.error('Resposta inesperada da API:', response);
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            console.error("Erro ao criar novo produto:", error);
            throw new Error("Erro ao criar novo produto");
        }
    },

    // Atualizar produto
    atualizar: async (produto) => {
        console.log("Atualizando pedido:", produto);
        try {
            const response = await fetchWithAuth('/produtos', {
                method: 'PUT',
                body: JSON.stringify(produto)
            });

            // 🔧 CORREÇÃO: Extrair apenas o array de dados
            if (response && response.success && Array.isArray(response.data)) {
                return response.data; // Retorna apenas o array
            } else if (Array.isArray(response)) {
                return response; // Se já é um array, retorna direto
            } else {
                console.error('Resposta inesperada da API:', response);
                return []; // Retorna array vazio em caso de erro
            }
        } catch (error) {
            console.error('Erro ao atualizar categorias:', error);
            throw new Error('Erro ao atualizar categorias');
        }
    },

    // Deletar produto
    deletar: async (id) => {
        try {
            const response = await api.delete('/produtos', { data: { id } });
            return response.data;
        } catch (error) {
            throw new Error('Erro ao deletar produto');
        }
    },

    // Buscar produtos mais vendidos
    buscarMaisVendidos: async (limite = 10) => {
        try {
            const response = await api.get(`/produtos?mais_vendidos=1&limite=${limite}`);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao buscar produtos mais vendidos');
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
export { produtosService };
export default produtosService;