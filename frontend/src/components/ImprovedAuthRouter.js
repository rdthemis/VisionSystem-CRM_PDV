// src/components/ImprovedAuthRouter.js
import React, { useState, useEffect } from 'react';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import SimpleResetPassword from './SimpleResetPassword';

function ImprovedAuthRouter({ onLoginSuccess }) {
    const [currentView, setCurrentView] = useState('login');

    useEffect(() => {
        // Verifica se há token de reset na URL ao carregar
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            setCurrentView('reset-password');
        } else {
            setCurrentView('login');
        }
    }, []);

    const handleShowForgotPassword = () => {
        setCurrentView('forgot-password');
    };

    const handleBackToLogin = () => {
        setCurrentView('login');
        // Limpa a URL se houver parâmetros
        if (window.location.search) {
            const newUrl = window.location.protocol + "//" +
                window.location.host +
                window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    };

    // Renderiza a view atual
    switch (currentView) {
        case 'forgot-password':
            return (
                <ForgotPassword
                    onBackToLogin={handleBackToLogin}
                />
            );

        case 'reset-password':
            return (
                <SimpleResetPassword
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

export default ImprovedAuthRouter;