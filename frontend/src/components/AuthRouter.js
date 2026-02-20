// src/components/AuthRouter.js
import React, { useState, useEffect } from 'react';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

function AuthRouter({ onLoginSuccess }) {
    const [currentView, setCurrentView] = useState('login');
    const [isResetPassword, setIsResetPassword] = useState(false);

    useEffect(() => {
        // Verifica se há token de reset na URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token && window.location.pathname === '/reset-password') {
            setCurrentView('reset-password');
            setIsResetPassword(true);
        } else if (window.location.pathname === '/forgot-password') {
            setCurrentView('forgot-password');
        } else {
            setCurrentView('login');
            setIsResetPassword(false);
        }
    }, []);

    const handleShowForgotPassword = () => {
        setCurrentView('forgot-password');
        // Atualiza URL sem recarregar a página
        window.history.pushState({}, '', '/forgot-password');
    };

    const handleBackToLogin = () => {
        setCurrentView('login');
        setIsResetPassword(false);
        // Volta para URL de login
        window.history.pushState({}, '', '/login');
    };

    const handleResetSuccess = () => {
        setCurrentView('login');
        setIsResetPassword(false);
        // Remove parâmetros da URL
        window.history.pushState({}, '', '/login');
    };

    // Se é página de reset com token válido na URL
    if (isResetPassword || currentView === 'reset-password') {
        return (
            <ResetPassword
                onSuccess={handleResetSuccess}
                onBackToLogin={handleBackToLogin}
            />
        );
    }

    // Renderiza a view atual
    switch (currentView) {
        case 'forgot-password':
            return (
                <ForgotPassword
                    onBackToLogin={handleBackToLogin}
                />
            );

        case 'login':
        default:
            return (
                <Login
                    onLoginSuccess={onLoginSuccess}
                    onForgotPassword={handleShowForgotPassword}
                />
            );
    }
}

export default AuthRouter;