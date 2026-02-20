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

// CORREÇÃO: Removemos o 'new' e exportamos o objeto diretamente
const clientesService = {
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
        return await fetchWithAuth('/clientes');
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

    // Formatação de CPF
    formatarCPF(cpf) {
        const apenasNumeros = cpf.replace(/\D/g, '');

        if (apenasNumeros.length <= 11) {
            return apenasNumeros
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }

        return cpf;
    },

    // Formatação de CNPJ
    formatarCNPJ(cnpj) {
        const apenasNumeros = cnpj.replace(/\D/g, '');

        if (apenasNumeros.length <= 14) {
            return apenasNumeros
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }

        return cnpj;
    },

    // Formatação de telefone
    formatarTelefone(telefone) {
        const apenasNumeros = telefone.replace(/\D/g, '');

        if (apenasNumeros.length <= 10) {
            // Telefone fixo: (11) 3333-4444
            return apenasNumeros
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
        } else if (apenasNumeros.length <= 11) {
            // Celular: (11) 99999-8888
            return apenasNumeros
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
        }

        return telefone;
    },

    // Formatação de CEP
    formatarCEP(cep) {
        const apenasNumeros = cep.replace(/\D/g, '');

        if (apenasNumeros.length <= 8) {
            return apenasNumeros.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
        }

        return cep;
    },

    // Validação de CPF
    validarCPF(cpf) {
        const apenasNumeros = cpf.replace(/\D/g, '');

        if (apenasNumeros.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(apenasNumeros)) return false;

        // Algoritmo de validação do CPF
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(apenasNumeros.charAt(i)) * (10 - i);
        }

        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(apenasNumeros.charAt(9))) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(apenasNumeros.charAt(i)) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(apenasNumeros.charAt(10))) return false;

        return true;
    },

    // Validação de CNPJ
    validarCNPJ(cnpj) {
        const apenasNumeros = cnpj.replace(/\D/g, '');

        if (apenasNumeros.length !== 14) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{13}$/.test(apenasNumeros)) return false;

        // Algoritmo de validação do CNPJ
        let tamanho = apenasNumeros.length - 2;
        let numeros = apenasNumeros.substring(0, tamanho);
        let digitos = apenasNumeros.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0))) return false;

        tamanho = tamanho + 1;
        numeros = apenasNumeros.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(1))) return false;

        return true;
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
export { clientesService };
export default clientesService;