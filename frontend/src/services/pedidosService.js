// frontend/src/services/pedidosService.js

// frontend/src/services/pedidosService.js

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

const pedidosService = {
    // 🔧 ADICIONANDO: Buscar todos os pedidos
    buscarTodos: async (status = null) => {
        try {
            let url = '/pedidos';
            if (status) {
                url += `?status=${status}`;
            }

            const response = await fetchWithAuth(url);

            // Verificar se a resposta tem a estrutura esperada
            if (response && response.success && Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response)) {
                return response;
            } else {
                console.error('Resposta inesperada da API:', response);
                return [];
            }
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            throw new Error('Erro ao buscar pedidos');
        }
    },

    // 🔧 CORRIGIDO: Buscar pedido por ID
    buscarPorId: async (id) => {
        try {
            // 🔧 CORREÇÃO: Garantir que ID é uma string/número válido
            if (!id || id === '[object Object]') {
                console.error('ID inválido fornecido:', id);
                return { success: false, message: 'ID inválido', data: null };
            }

            const response = await fetchWithAuth(`/pedidos?id=${id}`);

            if (response && response.success) {
                return response.data || response;
            } else if (response && !response.success) {
                console.error('Erro da API:', response.message);
                return response;
            } else {
                console.error('Resposta inesperada da API:', response);
                return { success: false, message: 'Resposta inválida da API', data: null };
            }
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            throw new Error('Erro ao buscar pedido');
        }
    },

    // 🔧 ADICIONANDO: Buscar pedidos por cliente
    buscarPorCliente: async (clienteId) => {
        try {
            const response = await api.get(`/pedidos?cliente_id=${clienteId}`);

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            } else if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Erro ao buscar pedidos do cliente:', error);
            throw new Error('Erro ao buscar pedidos do cliente');
        }
    },

    // 🔧 ADICIONANDO: Buscar pedidos por status
    buscarPorStatus: async (status) => {
        try {
            const response = await api.get(`/pedidos?status=${status}`);

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            } else if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Erro ao buscar pedidos por status:', error);
            throw new Error('Erro ao buscar pedidos por status');
        }
    },

    // 🔧 CORRIGIDO: Criar novo pedido
    criar: async (pedido) => {
        try {
            console.log('🆕 CRIANDO PEDIDO...');
            console.log('📦 Dados enviados:', pedido);

            const response = await fetchWithAuth('/pedidos', {
                method: 'POST',
                body: JSON.stringify(pedido)
            });

            console.log('📡 Resposta completa recebida:', response);

            // 🔧 CORREÇÃO: Verificar diferentes estruturas de resposta
            if (response) {
                // Se a resposta tem success definido, usar isso
                if (typeof response.success !== 'undefined') {
                    if (response.success) {
                        console.log('✅ Pedido criado com sucesso:', response);
                        return response; // Retornar resposta completa
                    } else {
                        console.error('❌ Erro retornado pela API:', response.message);
                        return response; // Retornar erro da API
                    }
                }
                // Se não tem success mas tem data, assumir sucesso
                else if (response.data) {
                    console.log('✅ Pedido criado (sem campo success):', response);
                    return {
                        success: true,
                        data: response.data,
                        message: response.message || 'Pedido criado com sucesso'
                    };
                }
                // Se é um array ou objeto direto
                else if (Array.isArray(response) || (typeof response === 'object' && response !== null)) {
                    console.log('✅ Resposta direta (assumindo sucesso):', response);
                    return {
                        success: true,
                        data: response,
                        message: 'Pedido criado com sucesso'
                    };
                }
                // Resposta inesperada mas não nula
                else {
                    console.error('⚠️ Resposta em formato inesperado:', response);
                    return {
                        success: false,
                        message: 'Resposta em formato inesperado: ' + JSON.stringify(response)
                    };
                }
            }
            // Resposta nula/undefined
            else {
                console.error('❌ Resposta vazia/nula da API');
                return {
                    success: false,
                    message: 'Nenhuma resposta recebida da API'
                };
            }

        } catch (error) {
            console.error('❌ Exceção ao criar pedido:', error);
            return {
                success: false,
                message: 'Erro na comunicação: ' + error.message
            };
        }
    },

    // 🔧 CORRIGIDO: Atualizar pedido usando fetchWithAuth
    atualizar: async (pedido) => {
        try {
            console.log('🔄 Atualizando pedido:', pedido);

            const response = await fetchWithAuth('/pedidos', {
                method: 'PUT',
                body: JSON.stringify(pedido)
            });

            console.log('📡 Resposta da atualização:', response);

            if (response && typeof response.success !== 'undefined') {
                console.log("Valor no service: ", response.data.total)
                return response;
            } else if (response && !response.error) {
                return { success: true, data: response };
            } else {
                return { success: false, message: response?.error || 'Erro ao atualizar pedido' };
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar pedido:', error);
            return { success: false, message: error.message };
        }
    },

    // 🔧 CORRIGIDO: Deletar pedido usando fetchWithAuth
    deletar: async (id) => {
        try {
            const response = await fetchWithAuth('/pedidos', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });

            if (response && response.success) {
                return response;
            } else {
                throw new Error(response?.message || 'Erro ao deletar pedido');
            }
        } catch (error) {
            console.error('Erro ao deletar pedido:', error);
            throw new Error('Erro ao deletar pedido');
        }
    },

    // 🔧 ADICIONANDO: Atualizar status do pedido
    atualizarStatus: async (id, novoStatus) => {
        try {
            const response = await api.put('/pedidos', {
                id: id,
                status: novoStatus
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao atualizar status do pedido:', error);
            throw new Error('Erro ao atualizar status do pedido');
        }
    },

    // 🔧 ADICIONANDO: Adicionar item ao pedido
    adicionarItem: async (pedidoId, item) => {
        try {
            const response = await api.post('/pedidos/itens', {
                pedido_id: pedidoId,
                ...item
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao adicionar item ao pedido:', error);
            throw new Error('Erro ao adicionar item ao pedido');
        }
    },

    // 🔧 ADICIONANDO: Remover item do pedido
    removerItem: async (pedidoId, itemId) => {
        try {
            const response = await api.delete('/pedidos/itens', {
                data: {
                    pedido_id: pedidoId,
                    item_id: itemId
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao remover item do pedido:', error);
            throw new Error('Erro ao remover item do pedido');
        }
    },

    /**
   * 🔄 TRANSFERIR itens entre comandas
   */
    transferir: async (dados) => {
        try {
        console.log('🔄 Service - Transferindo itens:', dados);

        const response = await fetchWithAuth('/pedidos/transferir', {
                method: 'POST',
                body: JSON.stringify(dados)
            });

        console.log('✅ Service - Transferência concluída:', response);
        return response;

        } catch (error) {
        console.error('❌ Service - Erro na transferência:', error);
        throw error;
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
    },

    // 🔧 ADICIONANDO: Calcular total do pedido
    calcularTotal(itens) {
        if (!Array.isArray(itens)) return 0;

        return itens.reduce((total, item) => {
            const preco = parseFloat(item.preco || 0);
            const quantidade = parseInt(item.quantidade || 0);
            return total + (preco * quantidade);
        }, 0);
    },

    // 🔧 ADICIONANDO: Validar pedido antes de salvar
    validarPedido(pedido) {
        const erros = [];

        if (!pedido.cliente_id) {
            erros.push('Cliente é obrigatório');
        }

        if (!pedido.itens || pedido.itens.length === 0) {
            erros.push('Pedido deve ter pelo menos um item');
        }

        if (pedido.itens) {
            pedido.itens.forEach((item, index) => {
                if (!item.produto_id) {
                    erros.push(`Item ${index + 1}: Produto é obrigatório`);
                }
                if (!item.quantidade || item.quantidade <= 0) {
                    erros.push(`Item ${index + 1}: Quantidade deve ser maior que zero`);
                }
                if (!item.preco || item.preco <= 0) {
                    erros.push(`Item ${index + 1}: Preço deve ser maior que zero`);
                }
            });
        }

        return {
            valido: erros.length === 0,
            erros: erros
        };

        
    }
};

// Exportações
export { pedidosService };
export default pedidosService;