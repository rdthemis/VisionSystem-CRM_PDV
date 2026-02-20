// src/services/backupService.js
import { apiService } from './apiService';

export const backupService = {
    // Listar backups disponíveis
    async listar() {
        try {
            console.log('🔍 BackupService: Listando backups...');
            const resultado = await apiService.get('/backup/listar');
            console.log('📋 BackupService: Resultado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro ao listar backups:', error);
            throw error;
        }
    },

    // Gerar novo backup
    async gerar() {
        try {
            console.log('🔄 BackupService: Gerando backup...');
            const resultado = await apiService.post('/backup/gerar', {});
            console.log('✅ BackupService: Backup gerado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro ao gerar backup:', error);
            throw error;
        }
    },

    // Restaurar backup
    async restaurar(arquivo) {
        try {
            console.log('🔄 BackupService: Restaurando backup:', arquivo);
            const resultado = await apiService.post('/backup/restaurar', { arquivo });
            console.log('✅ BackupService: Backup restaurado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro ao restaurar backup:', error);
            throw error;
        }
    },

    // Deletar backup
    async deletar(arquivo) {
        try {
            console.log('🗑️ BackupService: Deletando backup:', arquivo);
            const resultado = await apiService.post('/backup/deletar', { arquivo });
            console.log('✅ BackupService: Backup deletado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro ao deletar backup:', error);
            throw error;
        }
    },

    // Download de backup
    baixar(arquivo) {
        try {
            console.log('📥 BackupService: Iniciando download:', arquivo);

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
            console.error('❌ BackupService: Erro no download:', error);
            return {
                success: false,
                message: 'Erro ao iniciar download: ' + error.message
            };
        }
    },

    // Limpeza de backups antigos
    async limparAntigos(diasParaManter = 30) {
        try {
            console.log('🧹 BackupService: Limpando backups antigos...');
            const resultado = await apiService.post('/backup/limpar', { dias: diasParaManter });
            console.log('✅ BackupService: Limpeza concluída:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro na limpeza:', error);
            throw error;
        }
    },

    // Agendar backup automático
    async agendarAutomatico(config) {
        try {
            console.log('⏰ BackupService: Agendando backup automático...');
            const resultado = await apiService.post('/backup/agendar', config);
            console.log('✅ BackupService: Agendamento configurado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro no agendamento:', error);
            throw error;
        }
    },

    // Verificar status do backup automático
    async statusAutomatico() {
        try {
            console.log('📊 BackupService: Verificando status automático...');
            const resultado = await apiService.get('/backup/status-automatico');
            console.log('📋 BackupService: Status:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ BackupService: Erro ao verificar status:', error);
            throw error;
        }
    }
};