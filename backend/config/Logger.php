<?php

// config/Logger.php
// 📝 HELPER: Sistema de log inteligente baseado em ambiente

class Logger
{
    // Níveis de log (do menos para o mais grave)
    public const LEVEL_DEBUG = 'DEBUG';
    public const LEVEL_INFO = 'INFO';
    public const LEVEL_WARN = 'WARN';
    public const LEVEL_ERROR = 'ERROR';

    /**
     * Verifica se está em ambiente de desenvolvimento.
     */
    private static function isDev(): bool
    {
        return ($_ENV['APP_ENV'] ?? 'production') === 'development';
    }

    /**
     * Log de debug - SÓ aparece em desenvolvimento
     * Use para informações temporárias enquanto está investigando algo.
     */
    public static function debug(string $message, array $context = []): void
    {
        if (!self::isDev()) {
            return; // Em produção, não faz nada
        }
        self::write(self::LEVEL_DEBUG, $message, $context);
    }

    /**
     * Log informativo - aparece em ambos, mas pode ser desabilitado
     * Use para eventos importantes do sistema (login, venda finalizada, etc).
     */
    public static function info(string $message, array $context = []): void
    {
        self::write(self::LEVEL_INFO, $message, $context);
    }

    /**
     * Log de aviso - sempre aparece
     * Use para situações estranhas mas não críticas.
     */
    public static function warn(string $message, array $context = []): void
    {
        self::write(self::LEVEL_WARN, $message, $context);
    }

    /**
     * Log de erro - sempre aparece
     * Use em catch de exceções e erros reais do sistema.
     */
    public static function error(string $message, array $context = []): void
    {
        self::write(self::LEVEL_ERROR, $message, $context);
    }

    /**
     * Escreve a mensagem no log do PHP.
     */
    private static function write(string $level, string $message, array $context): void
    {
        $contextStr = !empty($context) ? ' | '.json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        error_log("[{$level}] {$message}{$contextStr}");
    }
}
