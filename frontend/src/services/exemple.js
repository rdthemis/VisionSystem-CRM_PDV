// frontend/src/services/clientesService.js

import axios from 'axios';

// Configuração base da API
// Se o XAMPP estiver na porta 80 (padrão):
//const API_BASE_URL = 'http://localhost:8000';

// Se o XAMPP estiver em outra porta (ex: 8080), descomente a linha abaixo:
// const API_BASE_URL = 'http://localhost:8080/projeto_crm/backend';

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

const ClientesService = {

    // Listar clientes com filtros e paginação
    async listar(filtros = {}) {
        const params = new URLSearchParams();

        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });

        const queryString = params.toString();
        const url = `/clientes${queryString ? `?${queryString}` : ''}`;

        return await fetchWithAuth(url);
    },

    // Buscar cliente por ID
    async buscarPorId(id) {
        return await fetchWithAuth(`/clientes/${id}`);
    },

    // Buscar cliente por nome
    async buscarPorNome(nome) {
        return await fetchWithAuth(`/clientes/${nome}`);
    },

    // Criar novo cliente
    async criar(dadosCliente) {
        return await fetchWithAuth('/clientes', {
            method: 'POST',
            body: JSON.stringify(dadosCliente)
        });
    },

    // Atualizar cliente
    async atualizar(id, dadosCliente) {
        return await fetchWithAuth(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dadosCliente)
        });
    },

    // Desativar cliente (soft delete)
    async desativar(id) {
        return await fetchWithAuth(`/clientes/${id}`, {
            method: 'DELETE'
        });
    },

    // Buscar todos os clientes
    buscarTodos: async () => {
        try {
            const response = await api.get('/clientes');
            return response.data;
        } catch (error) {
            throw new Error('Erro ao buscar clientes');
        }
    },

    // Buscar clientes para select/autocomplete
    async buscarParaSelect(termo = '', limite = 10) {
        const params = new URLSearchParams();
        if (termo) params.append('q', termo);
        if (limite) params.append('limite', limite);

        const queryString = params.toString();
        const url = `/clientes/search${queryString ? `?${queryString}` : ''}`;

        return await fetchWithAuth(url);
    },

    // Buscar CEP via API externa (ViaCEP)
    async buscarCEP(cep) {
        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length !== 8) {
            return {
                success: false,
                message: 'CEP deve ter 8 dígitos'
            };
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();

            if (data.erro) {
                return {
                    success: false,
                    message: 'CEP não encontrado'
                };
            }

            return {
                success: true,
                data: {
                    endereco: data.logradouro,
                    bairro: data.bairro,
                    cidade: data.localidade,
                    uf: data.uf
                }
            };
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return {
                success: false,
                message: 'Erro ao buscar CEP'
            };
        }
    },
    // Formatar data e hora para exibição
    formatarDataHora(data) {
        if (!data) return '-';

        const dataObj = new Date(data);
        return dataObj.toLocaleString('pt-BR');
    }
}
const clientesService = new ClientesService();

export { clientesService };
export default clientesService;
