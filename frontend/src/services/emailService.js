// src/services/emailService.js
import { apiService } from './apiService';
import Logger from '../utils/Logger';

export const emailService = {
    // Carregar configurações de email
    async carregarConfiguracoes() {
        try {
            Logger.info('EmailService: Carregando configurações...', {info: 'emailService.carregarConfiguracoes'});
            const resultado = await apiService.get('/integracoes/email');
            Logger.debug('EmailService: Configurações:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao carregar configurações:', { erro: error });
            throw error;
        }
    },

    // Salvar configurações de email
    async salvarConfiguracoes(config) {
        try {
            Logger.info('EmailService: Salvando configurações...', {info: 'emailService.salvarConfiguracoes'});
            const resultado = await apiService.post('/integracoes/email/salvar', config);
            Logger.debug('EmailService: Configurações salvas:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao salvar configurações:', { erro: error });
            throw error;
        }
    },

    // Testar configuração de email
    async testar(emailTeste = null) {
        try {
            Logger.info('EmailService: Testando configuração...', {info: 'emailService.testar'});
            const dados = emailTeste ? { email_teste: emailTeste } : {};
            const resultado = await apiService.post('/integracoes/testar/email', dados);
            Logger.debug('EmailService: Teste concluído:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro no teste:', { erro: error });
            throw error;
        }
    },

    // Enviar recibo por email
    async enviarRecibo(reciboId, email, nome = '') {
        try {
            Logger.info('EmailService: Enviando recibo...', {info: 'emailService.enviarRecibo', reciboId, email, nome});
            const resultado = await apiService.post(`/recibos/${reciboId}/enviar-email`, {
                email,
                nome
            });
            Logger.debug('EmailService: Recibo enviado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao enviar recibo:', { erro: error });
            throw error;
        }
    },

    // Enviar notificação de vencimento
    async enviarNotificacaoVencimento(email, nome, contas) {
        try {
            Logger.info('EmailService: Enviando notificação de vencimento...', {info: 'emailService.enviarNotificacaoVencimento', email, nome, contas});
            const resultado = await apiService.post('/email/notificacao-vencimento', {
                email,
                nome,
                contas
            });
            Logger.debug('EmailService: Notificação enviada:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao enviar notificação:', { erro: error });
            throw error;
        }
    },

    // Enviar relatório por email
    async enviarRelatorio(emailDestino, tipoRelatorio, dadosRelatorio, periodo = null) {
        try {
            Logger.info('EmailService: Enviando relatório...', {info: 'emailService.enviarRelatorio', emailDestino, tipoRelatorio});
            const resultado = await apiService.post('/email/relatorio', {
                email: emailDestino,
                tipo: tipoRelatorio,
                dados: dadosRelatorio,
                periodo
            });
            Logger.debug('EmailService: Relatório enviado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao enviar relatório:', { erro: error });
            throw error;
        }
    },

    // Verificar se email está configurado
    async isConfigurado() {
        try {
            const config = await this.carregarConfiguracoes();
            return config.success && config.data && config.data.ativo;
        } catch (error) {
            return false;
        }
    },

    // Listar templates de email disponíveis
    async listarTemplates() {
        try {
            Logger.info('EmailService: Listando templates...', {info: 'emailService.listarTemplates'});
            const resultado = await apiService.get('/email/templates');
            Logger.debug('EmailService: Templates:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao listar templates:', { erro: error });
            throw error;
        }
    },

    // Salvar template personalizado
    async salvarTemplate(nome, assunto, corpo, tipo = 'custom') {
        try {
            Logger.info('EmailService: Salvando template...', {info: 'emailService.salvarTemplate', nome, assunto, corpo, tipo});
            const resultado = await apiService.post('/email/templates', {
                nome,
                assunto,
                corpo,
                tipo
            });
            Logger.debug('EmailService: Template salvo:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao salvar template:', { erro: error });
            throw error;
        }
    },

    // Enviar email personalizado
    async enviarPersonalizado(destinatarios, assunto, corpo, anexos = []) {
        try {
            Logger.info('EmailService: Enviando email personalizado...', {info: 'emailService.enviarPersonalizado', destinatarios, assunto, corpo, anexos});
            const resultado = await apiService.post('/email/enviar', {
                destinatarios,
                assunto,
                corpo,
                anexos
            });
            Logger.debug('EmailService: Email enviado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao enviar email:', { erro: error });
            throw error;
        }
    },

    // Histórico de emails enviados
    async historico(filtros = {}) {
        try {
            Logger.info('EmailService: Carregando histórico...', {info: 'emailService.historico'});
            const params = new URLSearchParams();

            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });

            const url = `/email/historico${params.toString() ? `?${params.toString()}` : ''}`;
            const resultado = await apiService.get(url);
            Logger.debug('EmailService: Histórico:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('EmailService: Erro ao carregar histórico:', { erro: error });
            throw error;
        }
    }
};