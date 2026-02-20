// frontend/src/hooks/useSessionTimeout.js

import { useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';

export const useSessionTimeout = (timeoutMinutes = 30) => {
    const timeoutRef = useRef(null);
    const warningRef = useRef(null);

    const logout = useCallback(async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }

        // Limpar dados locais
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Recarregar a página para voltar ao login
        window.location.reload();
    }, []);

    const resetTimeout = useCallback(() => {
        // Limpar timeouts anteriores
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);

        // Aviso 2 minutos antes
        warningRef.current = setTimeout(() => {
            const continuar = window.confirm(
                'Sua sessão expirará em 2 minutos. Deseja continuar?'
            );
            if (continuar) {
                resetTimeout();
            }
        }, (timeoutMinutes - 2) * 60 * 1000);

        // Timeout final
        timeoutRef.current = setTimeout(() => {
            alert('Sua sessão expirou por inatividade');
            logout();
        }, timeoutMinutes * 60 * 1000);
    }, [timeoutMinutes, logout]);

    useEffect(() => {
        // Eventos que resetam o timeout
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, resetTimeout);
        });

        resetTimeout(); // Iniciar timeout

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimeout);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
        };
    }, [resetTimeout]);
};