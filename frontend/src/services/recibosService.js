// src/services/recibosService.js
import { apiService } from './apiService';
import Logger from '../utils/Logger';

export const recibosService = {
    // Listar recibos com filtros
    async listar(filtros = {}) {
        try {
            const params = new URLSearchParams();

            // Adicionar filtros não vazios
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });

            const url = `/recibos${params.toString() ? `?${params.toString()}` : ''}`;
            Logger.debug('Buscando recibos:', { debug: 'recibosService.listar', url });

            const resultado = await apiService.get(url);
            Logger.info('Resultado recibos:', { info: 'recibosService.listar', resultado });

            return resultado;
        } catch (error) {
            Logger.error('Erro ao listar recibos:', { erro: error });
            throw error;
        }
    },

    // Criar novo recibo
    async criar(dados) {
        try {
            Logger.debug('Criando recibo:', { debug: 'recibosService.criar', dados });
            const resultado = await apiService.post('/recibos', dados);
            Logger.info('Recibo criado:', { info: 'recibosService.criar', resultado });
            return resultado;
        } catch (error) {
            Logger.error('Erro ao criar recibo:', { erro: error });
            throw error;
        }
    },

    // Buscar recibo por ID
    async buscarPorId(id) {
        try {
            const resultado = await apiService.get(`/recibos/${id}`);
            return resultado;
        } catch (error) {
            Logger.error('Erro ao buscar recibo:', { erro: error });
            throw error;
        }
    },

    // Cancelar recibo
    async cancelar(id) {
        try {
            const resultado = await apiService.put(`/recibos/${id}/cancelar`);
            return resultado;
        } catch (error) {
            Logger.error('Erro ao cancelar recibo:', { erro: error });
            throw error;
        }
    },

    // Gerar recibo para pagamento de conta
    async gerarParaPagamento(contaId, dados) {
        try {
            const resultado = await apiService.post(`/recibos/gerar-pagamento/${contaId}`, dados);
            return resultado;
        } catch (error) {
            Logger.error('Erro ao gerar recibo para pagamento:', { erro: error });
            throw error;
        }
    },

    // Buscar recibos por cliente
    async buscarPorCliente(clienteId, limite = 10, pagina = 1) {
        try {
            const params = new URLSearchParams({
                limite: limite.toString(),
                pagina: pagina.toString()
            });

            const resultado = await apiService.get(`/recibos/cliente/${clienteId}?${params.toString()}`);
            return resultado;
        } catch (error) {
            Logger.error('Erro ao buscar recibos por cliente:', { erro: error });
            throw error;
        }
    },

    // Obter resumo de recibos
    async obterResumo() {
        try {
            const resultado = await apiService.get('/recibos/resumo');
            return resultado;
        } catch (error) {
            Logger.error('Erro ao obter resumo de recibos:', { erro: error });
            throw error;
        }
    },

    // Visualizar recibo (retorna HTML)
    async visualizar(id) {
        try {
            const resultado = await apiService.get(`/recibos/${id}/visualizar`);
            return resultado;
        } catch (error) {
            Logger.error('Erro ao visualizar recibo:', { erro: error });
            throw error;
        }
    }
};