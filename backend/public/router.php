<?php

// router.php - Roteador para servidor PHP embutido com CORS

// 🔧 CORS HEADERS - ENVIAR ANTES DE TUDO
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Responder OPTIONS (preflight) IMEDIATAMENTE
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

// Se for um arquivo real (CSS, JS, imagens), serve diretamente
 if (file_exists(__DIR__ . $_SERVER['REQUEST_URI']) && is_file(__DIR__ . $_SERVER['REQUEST_URI'])) {
    return false; // Serve o arquivo estático
}

// Caso contrário, redireciona TUDO para index.php
$_GET['_url'] = $_SERVER['REQUEST_URI'];
require_once __DIR__.'/index.php';