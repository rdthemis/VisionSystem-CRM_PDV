// src/services/emailService.js
import { apiService } from './apiService';

export const emailService = {
    // Carregar configurações de email
    async carregarConfiguracoes() {
        try {
            console.log('📧 EmailService: Carregando configurações...');
            const resultado = await apiService.get('/integracoes/email');
            console.log('📋 EmailService: Configurações:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao carregar configurações:', error);
            throw error;
        }
    },

    // Salvar configurações de email
    async salvarConfiguracoes(config) {
        try {
            console.log('💾 EmailService: Salvando configurações...');
            const resultado = await apiService.post('/integracoes/email/salvar', config);
            console.log('✅ EmailService: Configurações salvas:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao salvar configurações:', error);
            throw error;
        }
    },

    // Testar configuração de email
    async testar(emailTeste = null) {
        try {
            console.log('🧪 EmailService: Testando configuração...');
            const dados = emailTeste ? { email_teste: emailTeste } : {};
            const resultado = await apiService.post('/integracoes/testar/email', dados);
            console.log('✅ EmailService: Teste concluído:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro no teste:', error);
            throw error;
        }
    },

    // Enviar recibo por email
    async enviarRecibo(reciboId, email, nome = '') {
        try {
            console.log('📧 EmailService: Enviando recibo:', { reciboId, email });
            const resultado = await apiService.post(`/recibos/${reciboId}/enviar-email`, {
                email,
                nome
            });
            console.log('✅ EmailService: Recibo enviado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao enviar recibo:', error);
            throw error;
        }
    },

    // Enviar notificação de vencimento
    async enviarNotificacaoVencimento(email, nome, contas) {
        try {
            console.log('⚠️ EmailService: Enviando notificação de vencimento...');
            const resultado = await apiService.post('/email/notificacao-vencimento', {
                email,
                nome,
                contas
            });
            console.log('✅ EmailService: Notificação enviada:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao enviar notificação:', error);
            throw error;
        }
    },

    // Enviar relatório por email
    async enviarRelatorio(emailDestino, tipoRelatorio, dadosRelatorio, periodo = null) {
        try {
            console.log('📊 EmailService: Enviando relatório...');
            const resultado = await apiService.post('/email/relatorio', {
                email: emailDestino,
                tipo: tipoRelatorio,
                dados: dadosRelatorio,
                periodo
            });
            console.log('✅ EmailService: Relatório enviado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao enviar relatório:', error);
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
            console.log('📧 EmailService: Listando templates...');
            const resultado = await apiService.get('/email/templates');
            console.log('📋 EmailService: Templates:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao listar templates:', error);
            throw error;
        }
    },

    // Salvar template personalizado
    async salvarTemplate(nome, assunto, corpo, tipo = 'custom') {
        try {
            console.log('💾 EmailService: Salvando template...');
            const resultado = await apiService.post('/email/templates', {
                nome,
                assunto,
                corpo,
                tipo
            });
            console.log('✅ EmailService: Template salvo:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao salvar template:', error);
            throw error;
        }
    },

    // Enviar email personalizado
    async enviarPersonalizado(destinatarios, assunto, corpo, anexos = []) {
        try {
            console.log('📧 EmailService: Enviando email personalizado...');
            const resultado = await apiService.post('/email/enviar', {
                destinatarios,
                assunto,
                corpo,
                anexos
            });
            console.log('✅ EmailService: Email enviado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao enviar email:', error);
            throw error;
        }
    },

    // Histórico de emails enviados
    async historico(filtros = {}) {
        try {
            console.log('📧 EmailService: Carregando histórico...');
            const params = new URLSearchParams();

            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });

            const url = `/email/historico${params.toString() ? `?${params.toString()}` : ''}`;
            const resultado = await apiService.get(url);
            console.log('📋 EmailService: Histórico:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ EmailService: Erro ao carregar histórico:', error);
            throw error;
        }
    }
};