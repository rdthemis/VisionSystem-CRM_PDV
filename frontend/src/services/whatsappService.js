// src/services/whatsappService.js
import { apiService } from './apiService';
import Logger from '../utils/Logger';

export const whatsappService = {
    enviarRecibo: async (reciboId, telefone, nome) => {
        try {
            const response = await apiService.post('/recibos/enviar-whatsapp', {
                recibo_id: reciboId,
                telefone: telefone,
                nome: nome
            });
            return response;
        } catch (error) {
            Logger.error('Erro no whatsappService:', { erro: error });
            return {
                success: false,
                message: 'Erro ao enviar recibo por WhatsApp'
            };
        }
    }
};