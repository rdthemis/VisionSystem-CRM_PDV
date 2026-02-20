<?php
// cors.php - Configuração CORS

// Limpar buffer antes de enviar headers
if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

// Headers CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');  // ✅ Authorization aqui!
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Responder OPTIONS imediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

// Garantir que não há output anterior
if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

// Handler de erro que mantém CORS
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    // Garantir CORS mesmo em erro
    if (!headers_sent()) {
        @header('Access-Control-Allow-Origin: http://localhost:3000');
        @header('Access-Control-Allow-Credentials: true');
        @header('Content-Type: application/json; charset=utf-8');
    }

    error_log("PHP Error: $errstr in $errfile on line $errline");

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor',
        'error' => $errstr,
    ]);
    exit;
});

// Handler de exceções não capturadas
set_exception_handler(function ($exception) {
    // Garantir CORS mesmo em exceção
    if (!headers_sent()) {
        @header('Access-Control-Allow-Origin: http://localhost:3000');
        @header('Access-Control-Allow-Credentials: true');
        @header('Content-Type: application/json; charset=utf-8');
    }

    error_log('PHP Exception: '.$exception->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno: '.$exception->getMessage(),
    ]);
    exit;
});