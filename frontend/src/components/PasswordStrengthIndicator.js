// src/components/PasswordStrengthIndicator.js
import React from 'react';
import './PasswordStrengthIndicator.css';

function PasswordStrengthIndicator({ password, showRequirements = true }) {
    // Calcula força da senha
    const calculateStrength = (pwd) => {
        if (!pwd) return { score: 0, level: 'empty', feedback: [] };

        let score = 0;
        const feedback = [];
        const requirements = [];

        // Comprimento
        if (pwd.length >= 8) {
            score += 20;
            requirements.push({ text: 'Pelo menos 8 caracteres', met: true });
        } else {
            requirements.push({ text: 'Pelo menos 8 caracteres', met: false });
            feedback.push('Use pelo menos 8 caracteres');
        }

        if (pwd.length >= 12) score += 10;
        if (pwd.length >= 16) score += 10;

        // Letras minúsculas
        if (/[a-z]/.test(pwd)) {
            score += 15;
            requirements.push({ text: 'Letras minúsculas (a-z)', met: true });
        } else {
            requirements.push({ text: 'Letras minúsculas (a-z)', met: false });
            feedback.push('Adicione letras minúsculas');
        }

        // Letras maiúsculas
        if (/[A-Z]/.test(pwd)) {
            score += 15;
            requirements.push({ text: 'Letras maiúsculas (A-Z)', met: true });
        } else {
            requirements.push({ text: 'Letras maiúsculas (A-Z)', met: false });
            feedback.push('Adicione letras maiúsculas');
        }

        // Números
        if (/[0-9]/.test(pwd)) {
            score += 15;
            requirements.push({ text: 'Números (0-9)', met: true });
        } else {
            requirements.push({ text: 'Números (0-9)', met: false });
            feedback.push('Adicione números');
        }

        // Símbolos
        if (/[\W_]/.test(pwd)) {
            score += 15;
            requirements.push({ text: 'Símbolos (!@#$%^&*)', met: true });
        } else {
            requirements.push({ text: 'Símbolos (!@#$%^&*)', met: false });
            feedback.push('Adicione símbolos especiais');
        }

        // Variedade de caracteres
        const uniqueChars = new Set(pwd.toLowerCase()).size;
        if (uniqueChars > pwd.length * 0.6) score += 10;

        // Penalidades por padrões comuns
        if (/(.)\1{2,}/.test(pwd)) { // Caracteres repetidos
            score -= 10;
            feedback.push('Evite repetir caracteres');
        }

        if (/123|abc|qwe|asd/i.test(pwd)) { // Sequências
            score -= 15;
            feedback.push('Evite sequências previsíveis');
        }

        // Senhas comuns
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];

        if (commonPasswords.includes(pwd.toLowerCase())) {
            score = Math.min(score, 20);
            feedback.push('Esta senha é muito comum');
        }

        // Determina nível
        let level;
        if (score < 30) level = 'weak';
        else if (score < 60) level = 'fair';
        else if (score < 80) level = 'good';
        else level = 'strong';

        return {
            score: Math.max(0, Math.min(100, score)),
            level,
            feedback,
            requirements
        };
    };

    const strength = calculateStrength(password);

    const getStrengthText = () => {
        switch (strength.level) {
            case 'empty': return '';
            case 'weak': return 'Fraca';
            case 'fair': return 'Regular';
            case 'good': return 'Boa';
            case 'strong': return 'Forte';
            default: return '';
        }
    };

    const getStrengthColor = () => {
        switch (strength.level) {
            case 'weak': return '#dc3545';
            case 'fair': return '#fd7e14';
            case 'good': return '#ffc107';
            case 'strong': return '#28a745';
            default: return '#e9ecef';
        }
    };

    if (!password) return null;

    return (
        <div className="password-strength-indicator">
            {/* Barra de Força */}
            <div className="strength-bar-container">
                <div className="strength-label">
                    <span>Força da senha:</span>
                    <span className={`strength-text ${strength.level}`}>
                        {getStrengthText()} ({strength.score}%)
                    </span>
                </div>
                <div className="strength-bar">
                    <div
                        className={`strength-fill ${strength.level}`}
                        style={{
                            width: `${strength.score}%`,
                            backgroundColor: getStrengthColor()
                        }}
                    />
                </div>
            </div>

            {/* Feedback */}
            {strength.feedback.length > 0 && (
                <div className="strength-feedback">
                    <h4>💡 Dicas para melhorar:</h4>
                    <ul>
                        {strength.feedback.map((tip, index) => (
                            <li key={index}>{tip}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Requisitos */}
            {showRequirements && (
                <div className="strength-requirements">
                    <h4>📋 Requisitos de segurança:</h4>
                    <ul>
                        {strength.requirements.map((req, index) => (
                            <li key={index} className={req.met ? 'requirement-met' : 'requirement-unmet'}>
                                <span className="requirement-icon">
                                    {req.met ? '✅' : '❌'}
                                </span>
                                {req.text}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Dicas Gerais */}
            <div className="security-tips">
                <h4>🛡️ Dicas de segurança:</h4>
                <ul>
                    <li>Use uma senha única para cada conta</li>
                    <li>Considere usar um gerenciador de senhas</li>
                    <li>Ative a autenticação de dois fatores quando disponível</li>
                    <li>Nunca compartilhe sua senha com outras pessoas</li>
                </ul>
            </div>
        </div>
    );
}

export default PasswordStrengthIndicator;