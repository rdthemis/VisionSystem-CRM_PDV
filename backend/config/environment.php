<?php

// backend/config/environment.php

/*
 * Configurações de Ambiente
 * Detecta se está em desenvolvimento ou produção e configura adequadamente
 */

// ══════════════════════════════════════════════════════════════════
// GUARD - Evita que o arquivo seja carregado mais de uma vez
// (Resolve: "Cannot redeclare getEnv()")
// ══════════════════════════════════════════════════════════════════
//if (defined('ENVIRONMENT_LOADED')) {
//    return;
//}
//define('ENVIRONMENT_LOADED', true);

// environment.php - ADICIONE o carregamento do .env AQUI, no início
// Carregar .env primeiro
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        $pos = strpos($line, '=');
        if ($pos === false) continue;
        
        $key = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1));
        
        if ((str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
            $value = substr($value, 1, -1);
        }
        
        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
}

// Detectar ambiente UMA ÚNICA VEZ
if (!defined('IS_PRODUCTION')) {
    $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
    define('IS_PRODUCTION', $isProduction);
}


/*
 * TIMEZONE
 */
date_default_timezone_set('America/Sao_Paulo');

/*
 * LIMITES DE EXECUÇÃO
 */
if (IS_PRODUCTION) {
    ini_set('max_execution_time', 30);
    ini_set('memory_limit', '128M');
} else {
    ini_set('max_execution_time', 60);
    ini_set('memory_limit', '256M');
}

/*
 * UPLOAD DE ARQUIVOS
 */
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');

/*
 * SESSÃO
 */
if (IS_PRODUCTION) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Strict');
}

/**
 * FUNÇÃO HELPER - Obter configuração.
 */
function env($key, $default = null)
{
    return $_ENV[$key] ?? $default;
}

/**
 * FUNÇÃO HELPER - Verificar se está em produção.
 */
function isProduction()
{
    return IS_PRODUCTION;
}

/**
 * FUNÇÃO HELPER - Logar erro de forma segura.
 */
function logError($message, $context = [])
{
    $logMessage = date('Y-m-d H:i:s').' - '.$message;

    if (!empty($context)) {
        $logMessage .= ' - Context: '.json_encode($context);
    }

    $logMessage .= PHP_EOL;

    $logFile = __DIR__.'/../logs/application.log';

    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    error_log($logMessage, 3, $logFile);
}

/**
 * FUNÇÃO HELPER - Resposta de erro padronizada.
 */
function sendErrorResponse($message, $statusCode = 500, $details = null)
{
    http_response_code($statusCode);

    $response = [
        'success' => false,
        'message' => $message,
    ];

    if (!IS_PRODUCTION && $details !== null) {
        $response['details'] = $details;
    }

    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

/**
 * FUNÇÃO HELPER - Resposta de sucesso padronizada.
 */
function sendSuccessResponse($data = null, $message = null)
{
    http_response_code(200);

    $response = [
        'success' => true,
    ];

    if ($message) {
        $response['message'] = $message;
    }

    if ($data !== null) {
        $response['data'] = $data;
    }

    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}