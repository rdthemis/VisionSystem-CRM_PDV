// src/services/recibosService.js
import { apiService } from './apiService';

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
            console.log('🧾 Buscando recibos:', url);

            const resultado = await apiService.get(url);
            console.log('🧾 Resultado recibos:', resultado);

            return resultado;
        } catch (error) {
            console.error('❌ Erro ao listar recibos:', error);
            throw error;
        }
    },

    // Criar novo recibo
    async criar(dados) {
        try {
            console.log('🧾 Criando recibo:', dados);
            const resultado = await apiService.post('/recibos', dados);
            console.log('🧾 Recibo criado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Erro ao criar recibo:', error);
            throw error;
        }
    },

    // Buscar recibo por ID
    async buscarPorId(id) {
        try {
            const resultado = await apiService.get(`/recibos/${id}`);
            return resultado;
        } catch (error) {
            console.error('❌ Erro ao buscar recibo:', error);
            throw error;
        }
    },

    // Cancelar recibo
    async cancelar(id) {
        try {
            const resultado = await apiService.put(`/recibos/${id}/cancelar`);
            return resultado;
        } catch (error) {
            console.error('❌ Erro ao cancelar recibo:', error);
            throw error;
        }
    },

    // Gerar recibo para pagamento de conta
    async gerarParaPagamento(contaId, dados) {
        try {
            const resultado = await apiService.post(`/recibos/gerar-pagamento/${contaId}`, dados);
            return resultado;
        } catch (error) {
            console.error('❌ Erro ao gerar recibo para pagamento:', error);
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
            console.error('❌ Erro ao buscar recibos por cliente:', error);
            throw error;
        }
    },

    // Obter resumo de recibos
    async obterResumo() {
        try {
            const resultado = await apiService.get('/recibos/resumo');
            return resultado;
        } catch (error) {
            console.error('❌ Erro ao obter resumo de recibos:', error);
            throw error;
        }
    },

    // Visualizar recibo (retorna HTML)
    async visualizar(id) {
        try {
            const resultado = await apiService.get(`/recibos/${id}/visualizar`);
            return resultado;
        } catch (error) {
            console.error('❌ Erro ao visualizar recibo:', error);
            throw error;
        }
    }
};