<?php
// backend/config/SecurityHeaders.php

/**
 * Classe para configuração de headers de segurança HTTP
 * Previne ataques XSS, clickjacking, MIME sniffing, etc.
 */
class SecurityHeaders {
    
    /**
     * Aplicar todos os headers de segurança
     */
    public static function apply($isProduction = false) {
        // CORS - já configurado, mas garantir
        self::setCORS();
        
        // Content Security Policy
        self::setCSP($isProduction);
        
        // Proteção contra clickjacking
        self::setFrameOptions();
        
        // Proteção contra MIME sniffing
        self::setContentTypeOptions();
        
        // Proteção XSS do navegador
        self::setXSSProtection();
        
        // HSTS - apenas em produção com HTTPS
        if ($isProduction) {
            self::setHSTS();
        }
        
        // Referrer Policy
        self::setReferrerPolicy();
        
        // Permissions Policy
        self::setPermissionsPolicy();
        
        // Remove headers que expõem informações
        self::removeServerHeaders();
    }
    
    /**
     * Configurar CORS
     */
   private static function setCORS() {
    $allowedOriginsEnv = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000';
    $allowedOrigins = array_map('trim', explode(',', $allowedOriginsEnv));
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }
    
    $methods = $_ENV['CORS_ALLOWED_METHODS'] ?? 'GET,POST,PUT,DELETE,OPTIONS';
    $headers = $_ENV['CORS_ALLOWED_HEADERS'] ?? 'Content-Type,Authorization,X-Requested-With';
    
    header("Access-Control-Allow-Methods: {$methods}");
    header("Access-Control-Allow-Headers: {$headers}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
    
    /**
     * Content Security Policy (CSP)
     * Define de onde recursos podem ser carregados
     */
    private static function setCSP($isProduction) {
    if ($isProduction) {
        $apiUrl = $_ENV['APP_URL'] ?? 'https://pdv.gelattomannia.com.br';
        
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' {$apiUrl}",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ];
    } else {
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' http://localhost:8000 http://localhost:3000",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ];
    }
    
    header("Content-Security-Policy: " . implode('; ', $csp));
}
    
    /**
     * X-Frame-Options
     * Previne clickjacking
     */
    private static function setFrameOptions() {
        header('X-Frame-Options: DENY');
    }
    
    /**
     * X-Content-Type-Options
     * Previne MIME sniffing
     */
    private static function setContentTypeOptions() {
        header('X-Content-Type-Options: nosniff');
    }
    
    /**
     * X-XSS-Protection
     * Ativa proteção XSS do navegador (legacy, mas ainda útil)
     */
    private static function setXSSProtection() {
        header('X-XSS-Protection: 1; mode=block');
    }
    
    /**
     * Strict-Transport-Security (HSTS)
     * Force HTTPS por 1 ano
     * USAR APENAS EM PRODUÇÃO COM HTTPS!
     */
    private static function setHSTS() {
    header('Strict-Transport-Security: max-age=86400');
}
    
    /**
     * Referrer-Policy
     * Controla informações de referência enviadas
     */
    private static function setReferrerPolicy() {
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
    
    /**
     * Permissions-Policy
     * Controla recursos/APIs do navegador
     */
    private static function setPermissionsPolicy() {
        $policies = [
            'geolocation=()',
            'microphone=()',
            'camera=()',
            'payment=()',
            'usb=(self)',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()'
        ];
        
        header('Permissions-Policy: ' . implode(', ', $policies));
    }
    
    /**
     * Remove headers que expõem informações do servidor
     */
    private static function removeServerHeaders() {
        header_remove('X-Powered-By');
        header_remove('Server');
    }
    
    /**
     * Aplicar headers específicos para API JSON
     */
    public static function applyForAPI() {
        header('Content-Type: application/json; charset=utf-8');
        
        // Previne caching de dados sensíveis
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    /**
     * Aplicar headers para arquivos estáticos (com cache)
     */
    public static function applyForStaticFiles($maxAge = 86400) {
        header("Cache-Control: public, max-age={$maxAge}");
    }
}
