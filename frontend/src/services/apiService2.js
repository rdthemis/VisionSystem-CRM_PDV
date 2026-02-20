// src/services/apiService.js

import axios from 'axios';

// Configuração base da API
// Se o XAMPP estiver na porta 80 (padrão):
const API_BASE_URL = 'http://localhost:8000';

// Se o XAMPP estiver em outra porta (ex: 8080), descomente a linha abaixo:
// const API_BASE_URL = 'http://localhost:8080/projeto_crm/backend';

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

// Serviços para Clientes
export const clienteService = {
  // Buscar todos os clientes
  buscarTodos: async () => {
    try {
      const response = await api.get('/clientes');
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar clientes');
    }
  },

  // Buscar clientes por nome (para autocomplete)
  buscarPorNome: async (nome) => {
    try {
      const response = await api.get(`/clientes?nome=${encodeURIComponent(nome)}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar clientes por nome');
    }
  },

  // Criar novo cliente
  criar: async (cliente) => {
    try {
      const response = await api.post('/clientes', cliente);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar cliente');
    }
  }
};


// Serviços para Categorias
export const categoriaService = {
  // Buscar todas as categorias
  buscarTodas: async () => {
    try {
      const response = await api.get('/categorias');
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar categorias');
    }
  },

  // Buscar categoria por ID
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/categorias?id=${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar categoria');
    }
  },

  // Criar nova categoria
  criar: async (categoria) => {
    try {
      const response = await api.post('/categorias', categoria);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar categoria');
    }
  },

  // Atualizar categoria
  atualizar: async (categoria) => {
    try {
      const response = await api.put('/categorias', categoria);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar categoria');
    }
  },

  // Deletar categoria
  deletar: async (id) => {
    try {
      const response = await api.delete('/categorias', { data: { id } });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao deletar categoria');
    }
  }
};

// Serviços para Produtos
export const produtoService = {
  // Buscar todos os produtos
  buscarTodos: async () => {
    try {
      const response = await api.get('/produtos');
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar produtos');
    }
  },

  // Buscar produto por ID
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/produtos?id=${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar produto');
    }
  },

  // Buscar produtos por categoria
  buscarPorCategoria: async (categoriaId) => {
    try {
      const response = await api.get(`/produtos?categoria_id=${categoriaId}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar produtos da categoria');
    }
  },

  // Criar novo produto
  criar: async (produto) => {
    try {
      const response = await api.post('/produtos', produto);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar produto');
    }
  },

  // Atualizar produto
  atualizar: async (produto) => {
    try {
      const response = await api.put('/produtos', produto);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar produto');
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
  }
};

// Serviços para Pedidos
export const pedidoService = {
  // Buscar todos os pedidos
  buscarTodos: async (status = null) => {
    try {
      const url = status ? `/pedidos?status=${status}` : '/pedidos';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar pedidos');
    }
  },

  // Buscar pedido por ID
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/pedidos?id=${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar pedido');
    }
  },

  // Criar novo pedido
  criar: async (pedido) => {
    try {
      const response = await api.post('/pedidos', pedido);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar pedido');
    }
  },

  // Adicionar item ao pedido
  adicionarItem: async (dadosItem) => {
    try {
      const response = await api.post('/pedidos?acao=adicionar_item', dadosItem);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao adicionar item ao pedido');
    }
  },

  // Atualizar quantidade do item
  atualizarItem: async (dadosItem) => {
    try {
      const response = await api.put('/pedidos?acao=item', dadosItem);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar item');
    }
  },

  // Remover item do pedido
  removerItem: async (dadosItem) => {
    try {
      const response = await api.delete('/pedidos?acao=item', { data: dadosItem });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao remover item');
    }
  },

  // Fechar pedido
  fechar: async (pedidoId, formaPagamento) => {
    try {
      const response = await api.put('/pedidos?acao=fechar', {
        pedido_id: pedidoId,
        forma_pagamento: formaPagamento
      });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao fechar pedido');
    }
  },

  // Cancelar pedido
  cancelar: async (pedidoId) => {
    try {
      const response = await api.delete('/pedidos?acao=cancelar', {
        data: { pedido_id: pedidoId }
      });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao cancelar pedido');
    }
  },

  // Buscar produtos disponíveis para pedido
  buscarProdutosDisponiveis: async () => {
    try {
      const response = await api.post('/pedidos?acao=produtos');
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar produtos disponíveis');
    }
  }
};

// Serviços para Pedidos
export const pedidoService1 = {
    // Buscar todos os pedidos
    buscarTodos: async (status = null) => {
        try {
            const url = status ? `/pedidos?status=${status}` : '/pedidos';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao buscar pedidos');
        }
    },

    // Buscar pedido por ID
    buscarPorId: async (id) => {
        try {
            const response = await api.get(`/pedidos?id=${id}`);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao buscar pedido');
        }
    },

    // Criar novo pedido
    criar: async (pedido) => {
        try {
            const response = await api.post('/pedidos', pedido);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao criar pedido');
        }
    },

    // Adicionar item ao pedido
    adicionarItem: async (dadosItem) => {
        try {
            const response = await api.post('/pedidos?acao=adicionar_item', dadosItem);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao adicionar item ao pedido');
        }
    },

    // Atualizar quantidade do item
    atualizarItem: async (dadosItem) => {
        try {
            const response = await api.put('/pedidos?acao=item', dadosItem);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao atualizar item');
        }
    },

    // Remover item do pedido
    removerItem: async (dadosItem) => {
        try {
            const response = await api.delete('/pedidos?acao=item', { data: dadosItem });
            return response.data;
        } catch (error) {
            throw new Error('Erro ao remover item');
        }
    },

    // Fechar pedido
    fechar: async (pedidoId, formaPagamento) => {
        try {
            const response = await api.put('/pedidos?acao=fechar', {
                pedido_id: pedidoId,
                forma_pagamento: formaPagamento
            });
            return response.data;
        } catch (error) {
            throw new Error('Erro ao fechar pedido');
        }
    },

    // Cancelar pedido
    cancelar: async (pedidoId) => {
        try {
            const response = await api.delete('/pedidos?acao=cancelar', {
                data: { pedido_id: pedidoId }
            });
            return response.data;
        } catch (error) {
            throw new Error('Erro ao cancelar pedido');
        }
    },

    // Buscar produtos disponíveis para pedido
    buscarProdutosDisponiveis: async () => {
        try {
            const response = await api.post('/pedidos?acao=produtos');
            return response.data;
        } catch (error) {
            throw new Error('Erro ao buscar produtos disponíveis');
        }
    }
};