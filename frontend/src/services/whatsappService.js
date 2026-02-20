// src/services/whatsappService.js
import { apiService } from './apiService';

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
            console.error('Erro no whatsappService:', error);
            return {
                success: false,
                message: 'Erro ao enviar recibo por WhatsApp'
            };
        }
    }
};