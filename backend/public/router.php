<?php

// router.php - Roteador para servidor PHP embutido (php -S)
//
// IMPORTANTE: os headers de CORS NÃO são setados aqui — quem decide a origem
// permitida é SecurityHeaders::setCORS() (config/SecurityHeaders.php), que lê
// CORS_ALLOWED_ORIGINS do .env/variáveis de ambiente.

$publicDir = '/app/public';

$requestedPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// Se for um arquivo real (CSS, JS, imagens, os .php de uploads/print/etc.),
// serve diretamente.
if ($requestedPath !== '/' && file_exists($publicDir . $requestedPath) && is_file($publicDir . $requestedPath)) {
    return false; // Deixa o servidor embutido servir o arquivo estático
}

// Caso contrário (rotas da API, incluindo OPTIONS de preflight), delega tudo
// para index.php — é ele quem aplica os headers de CORS corretos e responde
// ao OPTIONS.
$_GET['_url'] = $_SERVER['REQUEST_URI'];
require_once $publicDir . '/index.php';
