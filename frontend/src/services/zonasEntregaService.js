// src/services/zonasEntregaService.js
// 🚚 SERVICE: Gestão de zonas de entrega

import apiService from './apiService';

const zonasEntregaService = {
  /**
   * Buscar todas as zonas
   */
  buscarTodas: async (apenasAtivas = false) => {
    try {
      const url = apenasAtivas ? '/zonas-entrega?ativas=true' : '/zonas-entrega';
      const response = await apiService.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar zonas:', error);
      throw error;
    }
  },

  /**
   * Buscar zona por ID
   */
  buscarPorId: async (id) => {
    try {
      const response = await apiService.get(`/zonas-entrega?id=${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar zona:', error);
      throw error;
    }
  },

  /**
   * Criar nova zona
   */
  criar: async (dados) => {
    try {
      const response = await apiService.post('/zonas-entrega', dados);
      return response;
    } catch (error) {
      console.error('Erro ao criar zona:', error);
      throw error;
    }
  },

  /**
   * Atualizar zona
   */
  atualizar: async (dados) => {
    try {
      const response = await apiService.put('/zonas-entrega', dados);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar zona:', error);
      throw error;
    }
  },

  /**
   * Deletar zona
   */
  deletar: async (id) => {
    try {
      const response = await apiService.delete('/zonas-entrega', { id });
      return response;
    } catch (error) {
      console.error('Erro ao deletar zona:', error);
      throw error;
    }
  },
};

export default zonasEntregaService;
