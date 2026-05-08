// src/services/zonasEntregaService.js
// 🚚 SERVICE: Gestão de zonas de entrega

import apiService from './apiService';
import Logger from '../utils/Logger';

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
      Logger.error('Erro ao buscar zonas:', { erro: error });
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
      Logger.error('Erro ao buscar zona:', { erro: error });
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
      Logger.error('Erro ao criar zona:', { erro: error });
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
      Logger.error('Erro ao atualizar zona:', { erro: error });
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
      Logger.error('Erro ao deletar zona:', { erro: error });
      throw error;
    }
  },
};

export default zonasEntregaService;
