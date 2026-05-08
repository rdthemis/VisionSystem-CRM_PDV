// src/services/backupService.js
import { apiService } from './apiService';
import Logger from '../utils/Logger';

export const backupService = {
    // Listar backups disponíveis
    async listar() {
        try {
            Logger.info('BackupService: Listando backups...', {info: 'Iniciando requisição para listar backups'});
            const resultado = await apiService.get('/backup/listar');
            Logger.debug('BackupService: Resultado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro ao listar backups:', {erro: error});
            throw error;
        }
    },

    // Gerar novo backup
    async gerar() {
        try {
            Logger.info('BackupService: Gerando backup...', {info: 'Iniciando requisição para gerar backup'});
            const resultado = await apiService.post('/backup/gerar', {});
            Logger.debug('BackupService: Backup gerado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro ao gerar backup:', {erro: error});
            throw error;
        }
    },

    // Restaurar backup
    async restaurar(arquivo) {
        try {
            Logger.info('BackupService: Restaurando backup:', {info: arquivo});
            const resultado = await apiService.post('/backup/restaurar', { arquivo });
            Logger.debug('BackupService: Backup restaurado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro ao restaurar backup:', {erro: error});
            throw error;
        }
    },

    // Deletar backup
    async deletar(arquivo) {
        try {
            Logger.info('BackupService: Deletando backup:', {info: arquivo});
            const resultado = await apiService.post('/backup/deletar', { arquivo });
            Logger.debug('BackupService: Backup deletado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro ao deletar backup:', {erro: error});
            throw error;
        }
    },

    // Download de backup
    baixar(arquivo) {
        try {
            Logger.info('BackupService: Iniciando download:', {info: arquivo});

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }

            // Criar URL com token
            const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/backup/download/${arquivo}?token=${encodeURIComponent(token)}`;

            // Abrir em nova janela para download
            window.open(url, '_blank');

            return {
                success: true,
                message: 'Download iniciado!'
            };
        } catch (error) {
            Logger.error('BackupService: Erro no download:', {erro: error});
            return {
                success: false,
                message: 'Erro ao iniciar download: ' + error.message
            };
        }
    },

    // Limpeza de backups antigos
    async limparAntigos(diasParaManter = 30) {
        try {
            Logger.info('BackupService: Limpando backups antigos...', {info: diasParaManter});
            const resultado = await apiService.post('/backup/limpar', { dias: diasParaManter });
            Logger.debug('BackupService: Limpeza concluída:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro na limpeza:', {erro: error});
            throw error;
        }
    },

    // Agendar backup automático
    async agendarAutomatico(config) {
        try {
            Logger.info('BackupService: Agendando backup automático...', {info: config});
            const resultado = await apiService.post('/backup/agendar', config);
            Logger.debug('BackupService: Agendamento configurado:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro no agendamento:', {erro: error});
            throw error;
        }
    },

    // Verificar status do backup automático
    async statusAutomatico() {
        try {
            Logger.info('BackupService: Verificando status automático...', {info: 'Iniciando requisição para verificar status do backup automático'});
            const resultado = await apiService.get('/backup/status-automatico');
            Logger.debug('BackupService: Status:', {debug: resultado});
            return resultado;
        } catch (error) {
            Logger.error('BackupService: Erro ao verificar status:', {erro: error});
            throw error;
        }
    }
};