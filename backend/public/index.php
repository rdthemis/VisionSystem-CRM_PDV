<?php

// index.php - API com banco de dados
// ==========================================
// CONFIGURAÇÕES INICIAIS
// ==========================================

use function Laravel\Prompts\error;

require_once __DIR__.'/../src/Database.php';
require_once __DIR__.'/cors.php';
require_once __DIR__.'/../src/Auth.php';
require_once __DIR__.'/../src/Clientes.php';
require_once __DIR__.'/../src/ContasReceber.php';
require_once __DIR__.'/../src/Recibos.php';
require_once __DIR__.'/../src/Relatorios.php';
require_once __DIR__.'/../src/Backup.php';
require_once __DIR__.'/../src/EmailService.php';
require_once __DIR__.'/../controllers/CategoriaController.php';
require_once __DIR__.'/../controllers/ProdutoController.php';
require_once __DIR__.'/../controllers/PedidoController.php';

$database = new Database();
$database->conectar();
$auth = new Auth($database);

date_default_timezone_set('America/Sao_Paulo');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Sempre retornar JSON
// header('Content-Type: application/json; charset=utf-8');
// Headers obrigatórios
// header('Access-Control-Allow-Origin: http://localhost:3000');
// header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
// header('Access-Control-Allow-Headers: Content-Type, Authorization');
// header('Access-Control-Allow-Credentials: true');

// Responder OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_RECOVERABLE_ERROR])) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro interno do servidor',
            'debug' => [
                'error' => $error['message'],
                'file' => basename($error['file']),
                'line' => $error['line'],
            ],
        ]);
    }
});

set_exception_handler(function ($exception) {
    error_log('❌ Exceção: '.$exception->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor',
        'debug' => [
            'error' => $exception->getMessage(),
            'file' => basename($exception->getFile()),
            'line' => $exception->getLine(),
        ],
    ]);
});
try {
    // ==========================================
    // CARREGAR DEPENDÊNCIAS
    // ==========================================

    // Carregar .env se existir
    if (file_exists(__DIR__.'/../.env')) {
        $lines = file(__DIR__.'/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue;
            }
            if (strpos($line, '=') === false) {
                continue;
            }
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
        }
    }

    // ==========================================
    // ROTEAMENTO
    // ==========================================

    $method = $_SERVER['REQUEST_METHOD'];
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = '/'.ltrim($uri, '/');

    error_log("📡 {$method} {$uri}");

    // ==========================================
    // ROTAS DE TESTE E DIAGNÓSTICO
    // ==========================================

    if ($uri === '/' || $uri === '/test') {
        echo json_encode([
            'success' => true,
            'message' => 'API funcionando com banco de dados!',
            'data' => [
                'method' => $method,
                'uri' => $uri,
                'timestamp' => date('Y-m-d H:i:s'),
                'database' => $database->isConnected() ? 'Conectado' : 'Desconectado',
            ],
        ]);
        exit;
    }

    if ($uri === '/db-test') {
        $resultado = $database->testarConexao();
        echo json_encode($resultado);
        exit;
    }

    if ($uri === '/db-tables') {
        $resultado = $database->verificarTabelas();
        echo json_encode($resultado);
        exit;
    }

    // ==========================================
    // ROTAS DE AUTENTICAÇÃO
    // ==========================================

    /*  if ($method === 'POST' && $uri === '/auth/login') {
         error_log("Cheguei no index.php");
         // Ler dados da requisição
         $input = file_get_contents('php://input');
         $data = json_decode($input, true);

         // Validar dados
         if (!$data || !isset($data['email']) || !isset($data['senha'])) {
             http_response_code(400);
             echo json_encode([
                 'success' => false,
                 'message' => 'Email e senha são obrigatórios',
             ]);
             exit;
         }

         // Usuários de teste
         $usuarios = [
             'admin@teste.com' => '123456',
             'usuario@teste.com' => '123456',
         ];

         // Verificar credenciais
         if (!isset($usuarios[$data['email']])) {
             http_response_code(401);
             echo json_encode([
                 'success' => false,
                 'message' => 'Email não encontrado',
             ]);
             exit;
         }

         if ($usuarios[$data['email']] !== $data['senha']) {
             http_response_code(401);
             echo json_encode([
                 'success' => false,
                 'message' => 'Senha incorreta',
             ]);
             exit;
         }

         // Gerar token
         $token = base64_encode(json_encode([
             'email' => $data['email'],
             'time' => time(),
         ]));

         // Sucesso
         echo json_encode([
             'success' => true,
             'message' => 'Login realizado com sucesso',
             'data' => [
                 'token' => $token,
                 'usuario' => [
                     'id' => 1,
                     'nome' => 'Usuário Teste',
                     'email' => $data['email'],
                 ],
             ],
         ]);
         exit;
     } */

    if ($method === 'POST' && $uri === '/auth/login') {
        // 🔧 DEBUG: Log tudo que chega
        error_log('🚀 === ROTA LOGIN CHAMADA ===');

        $raw_input = file_get_contents('php://input');
        error_log('📦 Raw input: '.$raw_input);

        $input = json_decode($raw_input, true);
        error_log('🔍 Input decodificado: '.json_encode($input));

        // Verificar cada campo que chegou
        if ($input) {
            foreach ($input as $key => $value) {
                error_log("📋 Campo '$key': ".(is_string($value) ? $value : json_encode($value)));
            }
        }

        // 🔧 VALIDAÇÃO SIMPLES (sem validar 'nome')
        if (!$input || !isset($input['email']) || !isset($input['senha'])) {
            error_log('❌ Campos obrigatórios faltando');
            error_log('❌ Email presente: '.(isset($input['email']) ? 'SIM' : 'NÃO'));
            error_log('❌ Senha presente: '.(isset($input['senha']) ? 'SIM' : 'NÃO'));

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Email e senha são obrigatórios',
                'debug' => [
                    'received_fields' => array_keys($input ?: []),
                    'email_present' => isset($input['email']),
                    'senha_present' => isset($input['senha']),
                ],
            ]);
            exit;
        }

        // 🔧 DEBUG: Tentar o login
        error_log('🔐 Tentando login com Auth class...');
        error_log('🔐 Email: '.$input['email']);

        try {
            // Verificar se a classe Auth existe e está funcionando
            if (!isset($auth)) {
                error_log('❌ Classe Auth não encontrada!');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro interno: Auth não inicializada',
                ]);
                exit;
            }

            error_log('✅ Classe Auth encontrada, chamando método login...');
            $resultado = $auth->login($input['email'], $input['senha']);

            error_log('🔐 Resultado do login: '.json_encode($resultado));

            if ($resultado && isset($resultado['success']) && $resultado['success']) {
                http_response_code(200);
            } else {
                http_response_code(401);
            }

            echo json_encode($resultado);
            exit;
        } catch (Exception $e) {
            error_log('❌ EXCEÇÃO no login: '.$e->getMessage());
            error_log('❌ Arquivo: '.$e->getFile());
            error_log('❌ Linha: '.$e->getLine());
            error_log('❌ Stack trace: '.$e->getTraceAsString());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro interno no servidor',
                'debug' => [
                    'error' => $e->getMessage(),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                ],
            ]);
            exit;
        }
    }

    // ==========================================
    // ROTAS DE USUÁRIOS
    // ==========================================

    if ($method === 'GET' && $uri === '/usuarios') {
        $authResult = verificarAuth($database);

        // Só admin pode listar usuários
        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Acesso negado',
            ]);
            exit;
        }

        $resultado = $auth->listarUsuarios();
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && $uri === '/usuarios') {
        $authResult = verificarAuth($database);

        // Só admin pode criar usuários
        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Acesso negado',
            ]);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $resultado = $auth->criarUsuario($input);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // Adicione estas rotas APÓS as rotas de usuários existentes no seu index.php

    // ==========================================
    // NOTA: Usando a função verificarAuth() já existente em Auth.php
    // ==========================================

    // ==========================================
    // ROTAS DE CATEGORIAS
    // ==========================================

    // GET /categorias - Buscar por id ou todas as categorias
    if ($method === 'GET' && $uri === '/categorias') {
        $authResult = verificarAuth($database);

        $categorias = new CategoriaController($database);

        $resultado = $categorias->listar();

        exit;
    }

    // POST /categorias - Criar nova categoria
    if ($method === 'POST' && $uri === '/categorias') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $categorias = new CategoriaController($database);
        $resultado = $categorias->criar($input);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        exit;
    }

    // PUT /categorias - Atualizar categoria
    if ($method === 'PUT' && $uri === '/categorias') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID da categoria é obrigatório',
            ]);
            exit;
        }

        $categorias = new CategoriaController($database);
        $resultado = $categorias->atualizar($input);

        exit;
    }

    // DELETE /categorias - Deletar categoria
    if ($method === 'DELETE' && $uri === '/categorias') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID da categoria é obrigatório',
            ]);
            exit;
        }

        $categorias = new CategoriaController($database);
        $resultado = $categorias->deletar($input['id']);

        exit;
    }

    // Adicione estas rotas no seu index.php
    // No lugar apropriado junto com as outras rotas

    // ==========================================
    // ROTAS DE ADICIONAIS
    // ==========================================

    // GET /adicionais - Buscar todos os adicionais ou por ID ou por categoria
    if ($method === 'GET' && $uri === '/adicionais') {
        $authResult = verificarAuth($database);

        require_once __DIR__.'/../controllers/AdicionalController.php';
        $adicionaisController = new AdicionalController($database);

        // Buscar por ID específico
        if (isset($_GET['id'])) {
            $resultado = $adicionaisController->listar($_GET['id']);
        } else {
            // Busca todos ou filtra por categoria (o controller cuida disso)
            $resultado = $adicionaisController->listar();
        }

        echo json_encode($resultado);
        exit;
    }

    // POST /adicionais - Criar novo adicional
    if ($method === 'POST' && $uri === '/adicionais') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        require_once __DIR__.'/../controllers/AdicionalController.php';
        $adicionaisController = new AdicionalController($database);
        $resultado = $adicionaisController->criar($input);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // PUT /adicionais - Atualizar adicional
    if ($method === 'PUT' && $uri === '/adicionais') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID do adicional é obrigatório',
            ]);
            exit;
        }

        require_once __DIR__.'/../controllers/AdicionalController.php';
        $adicionaisController = new AdicionalController($database);
        $resultado = $adicionaisController->atualizar($input);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // DELETE /adicionais - Deletar adicional
    if ($method === 'DELETE' && $uri === '/adicionais') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID do adicional é obrigatório',
            ]);
            exit;
        }

        require_once __DIR__.'/../controllers/AdicionalController.php';
        $adicionaisController = new AdicionalController($database);
        $resultado = $adicionaisController->deletar($input['id']);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // ==========================================
    // ROTAS DE PRODUTOS
    // ==========================================

    // GET /produtos - Buscar produtos
    if ($method === 'GET' && $uri === '/produtos') {
        $authResult = verificarAuth($database);

        $produtos = new ProdutoController($database);

        $resultado = $produtos->listar();

        exit;
    }

    // POST /produtos - Criar novo produto
    if ($method === 'POST' && $uri === '/produtos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $produtos = new ProdutoController($database);
        $resultado = $produtos->criar($input);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        exit;
    }

    // PUT /produtos - Atualizar produto
    if ($method === 'PUT' && $uri === '/produtos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID do produto é obrigatório',
            ]);
            exit;
        }

        $produtos = new ProdutoController($database);
        $resultado = $produtos->atualizar($input);

        exit;
    }

    // DELETE /produtos - Deletar produto
    if ($method === 'DELETE' && $uri === '/produtos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID do produto é obrigatório',
            ]);
            exit;
        }

        $produtos = new ProdutoController($database);
        $resultado = $produtos->deletar($input['id']);

        exit;
    }
    // ==========================================
    // ROTAS DE PEDIDOS - VERSÃO CORRIGIDA
    // ==========================================

    // GET /pedidos - Buscar pedidos
    if ($method === 'GET' && $uri === '/pedidos') {
        $authResult = verificarAuth($database);

        // 🔧 CORREÇÃO: Usar o CONTROLLER, não o Model
        $pedidosController = new PedidoController($database);

        // Inicializar $resultado
        $resultado = null;

        // Buscar pedido específico por ID
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            if ($id && $id !== '[object Object]') {
                $resultado = $pedidosController->buscarPorId($id);
            } else {
                $resultado = [
                    'success' => false,
                    'message' => 'ID inválido fornecido',
                    'data' => [],
                ];
            }
        }
        // Buscar pedidos por cliente
        elseif (isset($_GET['cliente_id'])) {
            $resultado = $pedidosController->buscarPorCliente($_GET['cliente_id']);
        }
        // Buscar pedidos por status
        elseif (isset($_GET['status'])) {
            $resultado = $pedidosController->buscarPorStatus($_GET['status']);
        }
        // Buscar todos os pedidos
        else {
            $resultado = $pedidosController->buscarTodos();
        }

        // Garantir que sempre temos um resultado
        if ($resultado === null) {
            $resultado = [
                'success' => false,
                'message' => 'Erro ao processar requisição',
                'data' => [],
            ];
        }

        // DEBUG: Log do resultado
        error_log('📊 Resultado da consulta: '.json_encode($resultado));

        echo json_encode($resultado);
        exit;
    }

    // POST /pedidos - Criar novo pedido
    if ($method === 'POST' && $uri === '/pedidos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        // DEBUG: Log dos dados recebidos
        error_log('📝 Dados recebidos para criar pedido: '.json_encode($input));

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        // 🔧 CORREÇÃO: Usar o CONTROLLER, não o Model
        $pedidosController = new PedidoController($database);
        $resultado = $pedidosController->criar($input);

        // DEBUG: Log do resultado
        error_log('💾 Resultado da criação: '.json_encode($resultado));

        if ($resultado && isset($resultado['success']) && $resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // PUT /pedidos - Atualizar pedido
    if ($method === 'PUT' && $uri === '/pedidos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        foreach ($input as $key => $value) {
            error_log("📝 Valor do campo $key: ".print_r($value, true));
        }

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID do pedido é obrigatório',
            ]);
            exit;
        }
        error_log('Chegando no controler');
        // 🔧 CORREÇÃO: Usar o CONTROLLER, não o Model
        $pedidosController = new PedidoController($database);
        $resultado = $pedidosController->atualizar($input);

        echo json_encode($resultado);
        exit;
    }

    // DELETE /pedidos - Deletar pedido
    if ($method === 'DELETE' && $uri === '/pedidos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID do pedido é obrigatório',
            ]);
            exit;
        }

        // 🔧 CORREÇÃO: Usar o CONTROLLER, não o Model

        $pedidosController = new PedidoController($database);
        $resultado = $pedidosController->deletar($input['id']);

        echo json_encode($resultado);
        exit;
    }

    // 🆕 NOVA ROTA: POST /pedidos/itens - Adicionar item ao pedido
    if ($method === 'POST' && $uri === '/pedidos/itens') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $pedidosController = new PedidoController($database);
        $resultado = $pedidosController->adicionarItem($input);

        echo json_encode($resultado);
        exit;
    }

    // 🆕 NOVA ROTA: DELETE /pedidos/itens - Remover item do pedido
    if ($method === 'DELETE' && $uri === '/pedidos/itens') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $pedidosController = new PedidoController($database);
        $resultado = $pedidosController->removerItem($input);

        echo json_encode($resultado);
        exit;
    }

    // 🔄 TRANSFERIR - POST /pedidos/transferir
    if (($method === 'POST' || $method === 'OPTIONS') && $uri === '/pedidos/transferir') {
        
        // Se for OPTIONS (preflight), retornar 204 sem autenticação
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
        
        // POST - requer autenticação
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        if (!isset($input['pedidoOrigemId']) || !isset($input['tipoDestino']) || !isset($input['itens'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados obrigatórios faltando',
            ]);
            exit;
        }

        $pedidosController = new PedidoController($database);
        $resultado = $pedidosController->transferir($input);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // ==========================================
    // ROTAS DE ZONAS DE ENTREGA
    // ==========================================

    // GET /zonas-entrega - Buscar zonas
    if ($method === 'GET' && $uri === '/zonas-entrega') {
        $authResult = verificarAuth($database);

        require_once __DIR__.'/../controllers/ZonaEntregaController.php';
        $zonasController = new ZonaEntregaController($database);

        // Verificar se quer apenas ativas
        $apenasAtivas = isset($_GET['ativas']) && $_GET['ativas'] === 'true';

        if (isset($_GET['id'])) {
            $zonasController->buscarPorId($_GET['id']);
        } else {
            $zonasController->buscarTodas($apenasAtivas);
        }
        exit;
    }

    // POST /zonas-entrega - Criar zona
    if (($method === 'POST' || $method === 'OPTIONS') && $uri === '/zonas-entrega') {
        
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos'
            ]);
            exit;
        }

        require_once __DIR__.'/../controllers/ZonaEntregaController.php';
        $zonasController = new ZonaEntregaController($database);
        $zonasController->criar($input);
        exit;
    }

    // PUT /zonas-entrega - Atualizar zona
    if (($method === 'PUT' || $method === 'OPTIONS') && $uri === '/zonas-entrega') {
        
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID da zona é obrigatório'
            ]);
            exit;
        }

        require_once __DIR__.'/../controllers/ZonaEntregaController.php';
        $zonasController = new ZonaEntregaController($database);
        $zonasController->atualizar($input);
        exit;
    }

    // DELETE /zonas-entrega - Deletar zona
    if (($method === 'DELETE' || $method === 'OPTIONS') && $uri === '/zonas-entrega') {
        
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID da zona é obrigatório'
            ]);
            exit;
        }

        require_once __DIR__.'/../controllers/ZonaEntregaController.php';
        $zonasController = new ZonaEntregaController($database);
        $zonasController->deletar($input['id']);
        exit;
    }


    // ==========================================
    // ROTAS DE CLIENTES
    // ==========================================

    if ($method === 'GET' && $uri === '/clientes') {
        $authResult = verificarAuth($database);

        $clientes = new Clientes($database);

        $filtros = [
            'nome' => $_GET['nome'] ?? '',
            'tipo_pessoa' => $_GET['tipo_pessoa'] ?? '',
            'cidade' => $_GET['cidade'] ?? '',
            'uf' => $_GET['uf'] ?? '',
            'limite' => intval($_GET['limite'] ?? 10),
            'pagina' => intval($_GET['pagina'] ?? 1),
            'ordenacao' => $_GET['ordenacao'] ?? 'nome',
            'direcao' => $_GET['direcao'] ?? 'ASC',
        ];

        $resultado = $clientes->listar($filtros);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && preg_match('/^\/clientes\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $clientes = new Clientes($database);
        $resultado = $clientes->buscarPorId($id);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && $uri === '/clientes') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $clientes = new Clientes($database);
        $resultado = $clientes->criar($input, $authResult['usuario_id']);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'PUT' && preg_match('/^\/clientes\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $clientes = new Clientes($database);
        $resultado = $clientes->atualizar($id, $input, $authResult['usuario_id']);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'DELETE' && preg_match('/^\/clientes\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $clientes = new Clientes($database);
        $resultado = $clientes->desativar($id);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/clientes/search') {
        $authResult = verificarAuth($database);

        $clientes = new Clientes($database);

        $termo = $_GET['q'] ?? '';
        $limite = intval($_GET['limite'] ?? 10);

        $resultado = $clientes->buscarParaSelect($termo, $limite);
        echo json_encode($resultado);
        exit;
    }

    // ==========================================
    // ROTAS DE CONTAS A RECEBER
    // ==========================================

    if ($method === 'GET' && $uri === '/contas-receber') {
        $authResult = verificarAuth($database);

        $contasReceber = new ContasReceber($database);

        $filtros = [
            'cliente_id' => $_GET['cliente_id'] ?? '',
            'status' => $_GET['status'] ?? '',
            'data_vencimento_inicio' => $_GET['data_vencimento_inicio'] ?? '',
            'data_vencimento_fim' => $_GET['data_vencimento_fim'] ?? '',
            'valor_minimo' => $_GET['valor_minimo'] ?? '',
            'valor_maximo' => $_GET['valor_maximo'] ?? '',
            'descricao' => $_GET['descricao'] ?? '',
            'limite' => intval($_GET['limite'] ?? 10),
            'pagina' => intval($_GET['pagina'] ?? 1),
            'ordenacao' => $_GET['ordenacao'] ?? 'data_vencimento',
            'direcao' => $_GET['direcao'] ?? 'ASC',
        ];

        $resultado = $contasReceber->listar($filtros);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && preg_match('/^\/contas-receber\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->buscarPorId($id);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && $uri === '/contas-receber') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->criar($input, $authResult['usuario_id']);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'PUT' && preg_match('/^\/contas-receber\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->atualizar($id, $input, $authResult['usuario_id']);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'DELETE' && preg_match('/^\/contas-receber\/(\d+)\/cancelar$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->cancelar($id);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && preg_match('/^\/contas-receber\/(\d+)\/pagamentos$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $contaId = $matches[1];

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados do pagamento inválidos',
            ]);
            exit;
        }

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->adicionarPagamento($contaId, $input, $authResult['usuario_id']);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/contas-receber/resumo') {
        $authResult = verificarAuth($database);

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->obterResumo();

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && preg_match('/^\/contas-receber\/cliente\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $clienteId = $matches[1];

        $contasReceber = new ContasReceber($database);
        $limite = intval($_GET['limite'] ?? 10);
        $resultado = $contasReceber->buscarPorCliente($clienteId, $limite);

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/contas-receber/relatorio') {
        $authResult = verificarAuth($database);

        $dataInicio = $_GET['data_inicio'] ?? date('Y-m-01');
        $dataFim = $_GET['data_fim'] ?? date('Y-m-t');
        $tipo = $_GET['tipo'] ?? 'vencimento';

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->relatorio($dataInicio, $dataFim, $tipo);

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && $uri === '/contas-receber/atualizar-status') {
        $authResult = verificarAuth($database);

        $contasReceber = new ContasReceber($database);
        $resultado = $contasReceber->atualizarStatusVencidas();

        echo json_encode($resultado);
        exit;
    }

    // ==========================================
    // ROTAS DO CAIXA
    // Adicionar no index.php após as rotas de contas a receber
    // ==========================================

    // GET /caixa - Buscar dados do caixa
    if ($method === 'GET' && $uri === '/caixa') {
        $authResult = verificarAuth($database);

        require_once __DIR__.'/../models/Caixa.php';
        $caixa = new Caixa($database->conectar());

        try {
            // Verificar se é busca de resumo
            if (isset($_GET['resumo'])) {
                $caixaId = $_GET['caixa_id'] ?? null;
                $resumo = $caixa->obterResumo($caixaId);
                echo json_encode([
                    'success' => true,
                    'data' => $resumo,
                ]);
                exit;
            }

            // Verificar se é busca de movimentos
            if (isset($_GET['movimentos'])) {
                $caixaId = $_GET['caixa_id'] ?? null;
                $filtros = [];

                if (isset($_GET['tipo'])) {
                    $filtros['tipo'] = $_GET['tipo'];
                }
                if (isset($_GET['categoria'])) {
                    $filtros['categoria'] = $_GET['categoria'];
                }
                if (isset($_GET['data_inicio'])) {
                    $filtros['data_inicio'] = $_GET['data_inicio'];
                }
                if (isset($_GET['data_fim'])) {
                    $filtros['data_fim'] = $_GET['data_fim'];
                }

                $movimentos = $caixa->buscarMovimentos($caixaId, $filtros);
                echo json_encode([
                    'success' => true,
                    'data' => $movimentos,
                ]);
                exit;
            }

            // Verificar status do caixa
            if (isset($_GET['status'])) {
                $caixaAberto = $caixa->verificarCaixaAberto();
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'caixa_aberto' => (bool) $caixaAberto,
                        'dados' => $caixaAberto,
                    ],
                ]);
                exit;
            }

            // Busca padrão - resumo do caixa atual
            $resumo = $caixa->obterResumo();
            echo json_encode([
                'success' => true,
                'data' => $resumo,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar dados do caixa: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    // POST /caixa - Ações do caixa (abrir, fechar, adicionar movimento)
    // Adicione esta rota no seu index.php com debug melhorado

    // POST /caixa - Abrir caixa (CORRIGIDO)
    if ($method === 'POST' && $uri === '/caixa') {
        error_log('=== DEBUG ABERTURA CAIXA ===');
        error_log('Method: '.$method);
        error_log('URI: '.$uri);

        try {
            // Verificar autenticação
            $authResult = verificarAuth($database);
            error_log('Auth result: '.json_encode($authResult));

            // 🔧 CORREÇÃO: Verificar a estrutura correta do authResult
            // Baseado nos logs, parece que os dados estão diretamente em $authResult
            if (!$authResult) {
                error_log('❌ Erro de autenticação - authResult é false/null');
                echo json_encode([
                    'success' => false,
                    'message' => 'Não autenticado - token inválido',
                ]);
                http_response_code(401);
                exit;
            }

            // Verificar se tem usuario_id (pode estar direto no authResult ou em ['usuario'])
            $usuarioId = null;
            if (isset($authResult['usuario_id'])) {
                // Dados estão diretamente no authResult
                $usuarioId = $authResult['usuario_id'];
                error_log('✅ Usuario ID encontrado diretamente: '.$usuarioId);
            } elseif (isset($authResult['usuario']) && isset($authResult['usuario']['id'])) {
                // Dados estão em $authResult['usuario']
                $usuarioId = $authResult['usuario']['id'];
                error_log("✅ Usuario ID encontrado em ['usuario']: ".$usuarioId);
            } elseif (isset($authResult['usuario']) && isset($authResult['usuario']['usuario_id'])) {
                // Dados estão em $authResult['usuario']['usuario_id']
                $usuarioId = $authResult['usuario']['usuario_id'];
                error_log("✅ Usuario ID encontrado em ['usuario']['usuario_id']: ".$usuarioId);
            }

            if (!$usuarioId) {
                error_log('❌ Usuario ID não encontrado na estrutura de auth');
                error_log('Estrutura completa do authResult: '.print_r($authResult, true));
                echo json_encode([
                    'success' => false,
                    'message' => 'Dados de usuário inválidos',
                ]);
                http_response_code(401);
                exit;
            }

            error_log('✅ Autenticação OK - Usuario ID: '.$usuarioId);

            // Ler input
            $inputRaw = file_get_contents('php://input');
            error_log('Input raw: '.$inputRaw);

            $input = json_decode($inputRaw, true);
            error_log('Input decoded: '.json_encode($input));

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('❌ Erro JSON decode: '.json_last_error_msg());
                echo json_encode([
                    'success' => false,
                    'message' => 'Dados JSON inválidos: '.json_last_error_msg(),
                ]);
                http_response_code(400);
                exit;
            }

            require_once __DIR__.'/../models/Caixa.php';
            $caixa = new Caixa($database->conectar());

            // Verificar se já existe caixa aberto
            $caixaAberto = $caixa->verificarCaixaAberto();
            error_log('Caixa já aberto: '.json_encode($caixaAberto));

            if ($caixaAberto) {
                error_log('⚠️ Já existe um caixa aberto');
                echo json_encode([
                    'success' => false,
                    'message' => 'Já existe um caixa aberto',
                    'debug' => 'Caixa ID: '.$caixaAberto['id'],
                ]);
                http_response_code(400);
                exit;
            }

            // Validar e processar dados
            $saldoInicial = 0;
            if (isset($input['saldo_inicial'])) {
                $saldoInicial = floatval($input['saldo_inicial']);
                error_log('Saldo inicial: '.$saldoInicial);
            }

            $observacoes = $input['observacoes_abertura'] ?? 'Caixa aberto pelo sistema';
            error_log('Observações: '.$observacoes);
            error_log('Usuario ID para abertura: '.$usuarioId);

            // Tentar abrir o caixa
            $resultado = $caixa->abrirCaixa($saldoInicial, $usuarioId, $observacoes);
            error_log('Resultado abertura: '.json_encode($resultado));

            if ($resultado['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Caixa aberto com sucesso',
                    'data' => $resultado['data'],
                ]);
                http_response_code(201);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => $resultado['message'],
                    'debug' => 'Falha na abertura do caixa',
                ]);
                http_response_code(400);
            }
        } catch (Exception $e) {
            error_log('❌ Exception na abertura do caixa: '.$e->getMessage());
            error_log('Stack trace: '.$e->getTraceAsString());

            echo json_encode([
                'success' => false,
                'message' => 'Erro interno do servidor: '.$e->getMessage(),
                'debug' => 'Exception capturada',
            ]);
            http_response_code(500);
        }

        error_log('=== FIM DEBUG ABERTURA CAIXA ===');
        exit;
    }
    // Adicione esta rota no seu index.php, após as outras rotas do caixa

    // POST /caixa/movimento - Adicionar movimento ao caixa
    if ($method === 'POST' && $uri === '/caixa/movimento') {
        $authResult = verificarAuth($database);
        error_log('Auth result: '.json_encode($authResult));

        require_once __DIR__.'/../models/Caixa.php';
        $caixa = new Caixa($database->conectar());

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Validar dados obrigatórios
            $camposObrigatorios = ['tipo', 'valor', 'descricao', 'categoria'];
            foreach ($camposObrigatorios as $campo) {
                if (!isset($input[$campo]) || empty($input[$campo])) {
                    echo json_encode([
                        'success' => false,
                        'message' => "Campo '{$campo}' é obrigatório",
                    ]);
                    http_response_code(400);
                    exit;
                }
            }

            if (!in_array($input['tipo'], ['entrada', 'saida'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Tipo deve ser "entrada" ou "saida"',
                ]);
                http_response_code(400);
                exit;
            }

            if (!is_numeric($input['valor']) || $input['valor'] <= 0) {
                echo json_encode(['success' => false,
                    'message' => 'Valor deve ser um número positivo',
                ]);
                http_response_code(400);
                exit;
            }

            // 🔧 CORREÇÃO: Verificar a estrutura correta do authResult
            // Baseado nos logs, parece que os dados estão diretamente em $authResult
            if (!$authResult) {
                error_log('❌ Erro de autenticação - authResult é false/null');
                echo json_encode([
                    'success' => false,
                    'message' => 'Não autenticado - token inválido',
                ]);
                http_response_code(401);
                exit;
            }

            // Verificar se tem usuario_id (pode estar direto no authResult ou em ['usuario'])
            $usuarioId = null;
            if (isset($authResult['usuario_id'])) {
                // Dados estão diretamente no authResult
                $usuarioId = $authResult['usuario_id'];
                error_log('✅ Usuario ID encontrado diretamente: '.$usuarioId);
            } elseif (isset($authResult['usuario']) && isset($authResult['usuario']['id'])) {
                // Dados estão em $authResult['usuario']
                $usuarioId = $authResult['usuario']['id'];
                error_log("✅ Usuario ID encontrado em ['usuario']: ".$usuarioId);
            } elseif (isset($authResult['usuario']) && isset($authResult['usuario']['usuario_id'])) {
                // Dados estão em $authResult['usuario']['usuario_id']
                $usuarioId = $authResult['usuario']['usuario_id'];
                error_log("✅ Usuario ID encontrado em ['usuario']['usuario_id']: ".$usuarioId);
            }

            if (!$usuarioId) {
                error_log('❌ Usuario ID não encontrado na estrutura de auth');
                error_log('Estrutura completa do authResult: '.print_r($authResult, true));
                echo json_encode([
                    'success' => false,
                    'message' => 'Dados de usuário inválidos',
                ]);
                http_response_code(401);
                exit;
            }

            error_log('✅ Autenticação OK - Usuario ID: '.$usuarioId);

            $resultado = $caixa->adicionarMovimento(
                $input['tipo'],
                floatval($input['valor']),
                $input['descricao'],
                $input['categoria'],
                $usuarioId,
                $input['pedido_id'] ?? null
            );

            if ($resultado['success']) {
                echo json_encode($resultado);
                http_response_code(201);
            } else {
                echo json_encode($resultado);
                http_response_code(400);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao adicionar movimento: '.$e->getMessage(),
            ]);
            http_response_code(500);
        }
        exit;
    }

    // PUT /caixa/fechar - Fechar caixa (OPCIONAL - para implementar depois)
    if ($method === 'PUT' && $uri === '/caixa/fechar') {
        $authResult = verificarAuth($database);

        // 🔧 VALIDAÇÃO: Verificar se há pedidos em aberto
        $pedidosModel = new Pedido($database->conectar());
        $pedidosAbertos = $pedidosModel->buscarTodos('aberto');

        if (!empty($pedidosAbertos)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Não é possível fechar o caixa com comandas em aberto',
                'comandas_abertas' => count($pedidosAbertos),
            ]);
            exit;
        }

        require_once __DIR__.'/../models/Caixa.php';
        $caixa = new Caixa($database->conectar());

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            $observacoes = $input['observacoes_fechamento'] ?? '';
            $usuarioId = $authResult['usuario_id'];

            $resultado = $caixa->fecharCaixa($usuarioId, $observacoes);

            if ($resultado['success']) {
                echo json_encode($resultado);
            } else {
                echo json_encode($resultado);
                http_response_code(400);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao fechar caixa: '.$e->getMessage(),
            ]);
            http_response_code(500);
        }
        exit;
    }

    // ==========================================
    // ROTAS DE RECIBOS
    // ==========================================

    if ($method === 'GET' && $uri === '/recibos') {
        $authResult = verificarAuth($database);

        $recibos = new Recibos($database);

        $filtros = [
            'cliente_id' => $_GET['cliente_id'] ?? '',
            'data_inicio' => $_GET['data_inicio'] ?? '',
            'data_fim' => $_GET['data_fim'] ?? '',
            'forma_pagamento' => $_GET['forma_pagamento'] ?? '',
            'numero_recibo' => $_GET['numero_recibo'] ?? '',
            'limite' => intval($_GET['limite'] ?? 10),
            'pagina' => intval($_GET['pagina'] ?? 1),
            'ordenacao' => $_GET['ordenacao'] ?? 'data_emissao',
            'direcao' => $_GET['direcao'] ?? 'DESC',
        ];

        $resultado = $recibos->listar($filtros);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && preg_match('/^\/recibos\/(\d+)$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $recibos = new Recibos($database);
        $resultado = $recibos->buscarPorId($id);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(404);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && $uri === '/recibos') {
        $authResult = verificarAuth($database);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Dados inválidos',
            ]);
            exit;
        }

        $recibos = new Recibos($database);

        // Pegar usuario_id do authResult
        $usuarioId = $authResult['usuario_id'];

        $resultado = $recibos->criar($input, $usuarioId);

        if ($resultado['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    if ($method === 'PUT' && preg_match('/^\/recibos\/(\d+)\/cancelar$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $recibos = new Recibos($database);
        $resultado = $recibos->cancelar($id);

        if ($resultado['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($resultado);
        exit;
    }

    // Rota para imprimir recibo
    if ($method === 'GET' && preg_match('/^\/recibos\/(\d+)\/imprimir$/', $uri, $matches)) {
        $id = $matches[1];

        // Verificar token via parâmetro GET
        $token = $_GET['token'] ?? null;

        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Token não fornecido',
            ]);
            exit;
        }

        try {
            $auth = new Auth($database);
            $authResult = $auth->verificarToken($token);

            if (!$authResult) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Token inválido',
                ]);
                exit;
            }

            $recibos = new Recibos($database);
            $resultado = $recibos->gerarParaImpressao($id);

            if ($resultado['success']) {
                header('Content-Type: text/html; charset=utf-8');
                echo $resultado['html'];
            } else {
                http_response_code(404);
                echo json_encode($resultado);
            }
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Erro na autenticação',
            ]);
        }

        exit;
    }

    // Rota para visualizar recibo
    if ($method === 'GET' && preg_match('/^\/recibos\/(\d+)\/visualizar$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $id = $matches[1];

        $recibos = new Recibos($database);
        $resultado = $recibos->gerarParaImpressao($id);

        if ($resultado['success']) {
            echo json_encode([
                'success' => true,
                'html' => $resultado['html'],
                'recibo' => $resultado['recibo'],
            ]);
        } else {
            http_response_code(404);
            echo json_encode($resultado);
        }
        exit;
    }

    if ($method === 'GET' && $uri === '/estatisticas') {
        $authResult = verificarAuth($database);

        try {
            $pdo = $database;

            // Total de clientes
            $stmt = $pdo->query('SELECT COUNT(*) as total FROM clientes WHERE ativo = 1');
            $totalClientes = $stmt->fetch()['total'];

            // Clientes por tipo
            $stmt = $pdo->query('
    SELECT
    tipo_pessoa,
    COUNT(*) as total
    FROM clientes
    WHERE ativo = 1
    GROUP BY tipo_pessoa
    ');
            $clientesPorTipo = $stmt->fetchAll();

            // Clientes por UF
            $stmt = $pdo->query('
    SELECT
    uf,
    COUNT(*) as total
    FROM clientes
    WHERE ativo = 1 AND uf IS NOT NULL
    GROUP BY uf
    ORDER BY total DESC
    LIMIT 10
    ');
            $clientesPorUF = $stmt->fetchAll();

            // Clientes cadastrados hoje
            $stmt = $pdo->query('
    SELECT COUNT(*) as total
    FROM clientes
    WHERE ativo = 1 AND DATE(created_at) = CURDATE()
    ');
            $clientesHoje = $stmt->fetch()['total'];

            // Contas a receber
            $stmt = $pdo->query("
    SELECT
    COUNT(*) as total_contas,
    SUM(valor_original - valor_recebido) as valor_pendente,
    SUM(CASE WHEN status = 'vencido' THEN valor_original - valor_recebido ELSE 0 END) as valor_vencido
    FROM contas_receber
    WHERE ativo = 1 AND status IN ('pendente', 'vencido')
    ");
            $contasReceber = $stmt->fetch();
            $stmt = $pdo->query('
    SELECT COUNT(*) as total
    FROM clientes
    WHERE ativo = 1 AND YEARWEEK(created_at) = YEARWEEK(NOW())
    ');
            $clientesSemana = $stmt->fetch()['total'];

            echo json_encode([
                'success' => true,
                'data' => [
                    'total_clientes' => intval($totalClientes),
                    'clientes_hoje' => intval($clientesHoje),
                    'clientes_semana' => intval($clientesSemana),
                    'clientes_por_tipo' => $clientesPorTipo,
                    'clientes_por_uf' => $clientesPorUF,
                    'contas_receber' => [
                        'total_contas' => intval($contasReceber['total_contas'] ?? 0),
                        'valor_pendente' => floatval($contasReceber['valor_pendente'] ?? 0),
                        'valor_vencido' => floatval($contasReceber['valor_vencido'] ?? 0),
                    ],
                ],
            ]);
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar estatísticas: '.$e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar estatísticas',
            ]);
        }
        exit;
    }

    // ==========================================
    // ROTAS DE RELATÓRIOS
    // ==========================================

    if ($method === 'GET' && $uri === '/relatorios/clientes') {
        $authResult = verificarAuth($database);

        $relatorios = new Relatorios($database);

        $filtros = [
            'data_inicio' => $_GET['data_inicio'] ?? '',
            'data_fim' => $_GET['data_fim'] ?? '',
            'tipo_pessoa' => $_GET['tipo_pessoa'] ?? '',
            'cidade' => $_GET['cidade'] ?? '',
            'uf' => $_GET['uf'] ?? '',
            'dias_atraso' => $_GET['dias_atraso'] ?? 30,
        ];

        $resultado = $relatorios->relatorioClientes($filtros);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/relatorios/financeiro') {
        $authResult = verificarAuth($database);

        $relatorios = new Relatorios($database);

        $dataInicio = $_GET['data_inicio'] ?? date('Y-m-01');
        $dataFim = $_GET['data_fim'] ?? date('Y-m-t');

        $resultado = $relatorios->relatorioFinanceiro($dataInicio, $dataFim);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/relatorios/inadimplencia') {
        $authResult = verificarAuth($database);

        $relatorios = new Relatorios($database);

        $diasAtraso = intval($_GET['dias_atraso'] ?? 30);

        $resultado = $relatorios->relatorioInadimplencia($diasAtraso);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/relatorios/fluxo-caixa') {
        $authResult = verificarAuth($database);

        $relatorios = new Relatorios($database);

        $dataInicio = $_GET['data_inicio'] ?? date('Y-m-01');
        $dataFim = $_GET['data_fim'] ?? date('Y-m-t');

        $resultado = $relatorios->relatorioFluxoCaixa($dataInicio, $dataFim);
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'GET' && $uri === '/relatorios/recibos') {
        $authResult = verificarAuth($database);

        $relatorios = new Relatorios($database);

        $dataInicio = $_GET['data_inicio'] ?? date('Y-m-01');
        $dataFim = $_GET['data_fim'] ?? date('Y-m-t');

        $resultado = $relatorios->relatorioFinanceiro($dataInicio, $dataFim);
        echo json_encode($resultado);
        exit;
    }

    // ==========================================
    // ROTAS DE CONFIGURAÇÕES
    // ==========================================

    // Gestão de usuários
    if ($method === 'GET' && $uri === '/usuarios') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        $auth = new Auth($database);
        $resultado = $auth->listarUsuarios();
        echo json_encode($resultado);
        exit;
    }

    if ($method === 'POST' && $uri === '/usuarios') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $auth = new Auth($database);
        $resultado = $auth->criarUsuario($input);
        echo json_encode($resultado);
        exit;
    }

    // Configurações do sistema
    if ($method === 'GET' && $uri === '/configuracoes') {
        $authResult = verificarAuth($database);

        // Retornar configurações básicas por enquanto
        echo json_encode([
            'success' => true,
            'data' => [
                'nome_empresa' => 'Minha Empresa',
                'cnpj' => '',
                'endereco' => '',
                'telefone' => '',
                'email' => '',
                'site' => '',
            ],
        ]);
        exit;
    }

    if ($method === 'POST' && $uri === '/configuracoes') {
        $authResult = verificarAuth($database);

        // Salvar configurações (implementar conforme necessário)
        echo json_encode([
            'success' => true,
            'message' => 'Configurações salvas com sucesso!',
        ]);
        exit;
    }

    // ==========================================
    // ROTAS DE BACKUP - VERSÃO REAL
    // ==========================================

    // Incluir a classe
    require_once __DIR__.'/../src/BackupSimples.php';

    if ($method === 'POST' && $uri === '/backup/gerar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        try {
            error_log('🔄 Iniciando backup via rota...');
            $backup = new BackupSimples($database);
            $resultado = $backup->gerarBackup();
            error_log('✅ Resultado: '.json_encode($resultado));
            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro na rota: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    if ($method === 'GET' && $uri === '/backup/listar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        try {
            error_log('🔍 Listando backups via rota...');
            $backup = new BackupSimples($database);
            $resultado = $backup->listarBackups();
            error_log('📋 Resultado: '.json_encode($resultado));
            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro na listagem: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    if ($method === 'POST' && $uri === '/backup/restaurar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $arquivo = $input['arquivo'] ?? '';
            $tipoRestore = $input['tipo'] ?? 'normal'; // 'normal' ou 'completo'

            if (empty($arquivo)) {
                throw new Exception('Nome do arquivo não fornecido');
            }

            error_log('🔄 Restaurando backup: '.$arquivo." (tipo: {$tipoRestore})");
            $backup = new BackupSimples($database);

            if ($tipoRestore === 'completo') {
                $resultado = $backup->restaurarBackup($arquivo);
            } else {
                $resultado = $backup->restaurarBackup($arquivo);
            }

            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro na rota de restore: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    // Integrações
    if ($method === 'GET' && $uri === '/integracoes') {
        $authResult = verificarAuth($database);

        echo json_encode([
            'success' => true,
            'data' => [
                'email' => [
                    'ativo' => false,
                    'smtp_host' => '',
                    'smtp_port' => '',
                    'smtp_user' => '',
                    'smtp_pass' => '',
                    'ssl' => true,
                ],
                'whatsapp' => [
                    'ativo' => false,
                    'api_key' => '',
                    'numero' => '',
                    'webhook_url' => '',
                ],
            ],
        ]);
        exit;
    }

    if ($method === 'POST' && $uri === '/integracoes') {
        $authResult = verificarAuth($database);

        echo json_encode([
            'success' => true,
            'message' => 'Integrações salvas com sucesso!',
        ]);
        exit;
    }

    // ==========================================
    // ROTAS DE BACKUP - VERSÃO SIMPLIFICADA
    // ==========================================

    if ($method === 'POST' && $uri === '/backup/gerar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        // TESTE SIMPLES: apenas retornar sucesso por enquanto
        error_log('🔄 Rota backup/gerar chamada');

        echo json_encode([
            'success' => true,
            'message' => 'Backup gerado com sucesso!',
            'data' => [
                'filename' => 'backup_teste_'.date('Y-m-d_H-i-s').'.sql',
                'size' => '1.2 MB',
                'tables' => 8,
            ],
        ]);
        exit;
    }

    if ($method === 'GET' && $uri === '/backup/listar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        // TESTE SIMPLES: retornar dados simulados
        error_log('🔍 Rota backup/listar chamada');

        echo json_encode([
            'success' => true,
            'data' => [
                [
                    'nome' => 'backup_2025-01-10_14-30-15.sql',
                    'arquivo' => 'backup_2025-01-10_14-30-15.sql',
                    'data' => '2025-01-10 14:30:15',
                    'tamanho' => '1.2 MB',
                    'size_bytes' => 1258291,
                ],
                [
                    'nome' => 'backup_2025-01-09_10-15-30.sql',
                    'arquivo' => 'backup_2025-01-09_10-15-30.sql',
                    'data' => '2025-01-09 10:15:30',
                    'tamanho' => '1.1 MB',
                    'size_bytes' => 1155042,
                ],
            ],
            'ultimo_backup' => '2025-01-10 14:30:15',
        ]);
        exit;
    }

    // ROTA PARA DELETAR BACKUP - ADICIONAR JUNTO COM AS OUTRAS
    // ROTA DELETE BACKUP
    // ROTA DELETE VIA POST (ALTERNATIVA)
    if ($method === 'POST' && $uri === '/backup/deletar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $filename = $input['arquivo'] ?? '';

            if (empty($filename)) {
                throw new Exception('Nome do arquivo não fornecido');
            }

            error_log('🗑️ POST delete backup: '.$filename);

            $backup = new BackupSimples($database);
            $resultado = $backup->deletarBackup($filename);

            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    // ==========================================
    // ROTAS DE EMAIL - ADICIONAR NO index.php
    // ==========================================

    // Incluir a classe EmailService
    require_once __DIR__.'/../src/EmailService.php';

    // Obter configurações de email
    if ($method === 'GET' && $uri === '/integracoes/email') {
        $authResult = verificarAuth($database);

        try {
            $emailService = new EmailService($database);
            $resultado = $emailService->obterConfiguracoes();
            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro ao obter config email: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao carregar configurações',
            ]);
        }
        exit;
    }

    // Salvar configurações de email
    if ($method === 'POST' && $uri === '/integracoes/email/salvar') {
        $authResult = verificarAuth($database);

        if ($authResult['tipo'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                throw new Exception('Dados não fornecidos');
            }

            error_log('📧 Salvando configurações de email...');

            $emailService = new EmailService($database);
            $resultado = $emailService->salvarConfiguracoes($input);
            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro ao salvar config email: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao salvar configurações: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    // Testar configuração de email
    if ($method === 'POST' && $uri === '/integracoes/email/testar') {
        $authResult = verificarAuth($database);

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $emailTeste = $input['email_teste'] ?? null;

            error_log('🧪 Testando configuração de email...');

            $emailService = new EmailService($database);
            $resultado = $emailService->testarConfiguracao($emailTeste);
            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro no teste de email: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro no teste: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    // Enviar recibo por email
    if ($method === 'POST' && preg_match('/^\/recibos\/(\d+)\/enviar-email$/', $uri, $matches)) {
        $authResult = verificarAuth($database);
        $reciboId = $matches[1];

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['email'])) {
                throw new Exception('Email do destinatário é obrigatório');
            }

            error_log("📧 Enviando recibo ID {$reciboId} para: ".$input['email']);

            $emailService = new EmailService($database);
            $resultado = $emailService->enviarRecibo(
                $reciboId,
                $input['email'],
                $input['nome'] ?? ''
            );

            echo json_encode($resultado);
        } catch (Exception $e) {
            error_log('❌ Erro ao enviar recibo: '.$e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao enviar recibo: '.$e->getMessage(),
            ]);
        }
        exit;
    }

    // GET /debug-auth - Rota temporária para testar autenticação
    if ($method === 'GET' && $uri === '/debug-auth') {
        error_log('=== DEBUG AUTH STRUCTURE ===');

        try {
            $authResult = verificarAuth($database);

            error_log('Auth result completo: '.print_r($authResult, true));
            error_log('Auth result JSON: '.json_encode($authResult));

            // Testar diferentes estruturas
            $possiveisUsuarioIds = [];

            if (isset($authResult['usuario_id'])) {
                $possiveisUsuarioIds['direto'] = $authResult['usuario_id'];
            }

            if (isset($authResult['usuario']) && isset($authResult['usuario']['id'])) {
                $possiveisUsuarioIds['usuario.id'] = $authResult['usuario']['id'];
            }

            if (isset($authResult['usuario']) && isset($authResult['usuario']['usuario_id'])) {
                $possiveisUsuarioIds['usuario.usuario_id'] = $authResult['usuario']['usuario_id'];
            }

            if (isset($authResult['id'])) {
                $possiveisUsuarioIds['id'] = $authResult['id'];
            }

            error_log('Possíveis usuario IDs: '.json_encode($possiveisUsuarioIds));

            echo json_encode([
                'success' => true,
                'message' => 'Debug de autenticação',
                'data' => [
                    'auth_result' => $authResult,
                    'possiveis_usuario_ids' => $possiveisUsuarioIds,
                    'tipo_auth_result' => gettype($authResult),
                    'keys_auth_result' => is_array($authResult) ? array_keys($authResult) : 'Não é array',
                ],
            ]);
        } catch (Exception $e) {
            error_log('❌ Exception no debug auth: '.$e->getMessage());

            echo json_encode([
                'success' => false,
                'message' => 'Erro no debug: '.$e->getMessage(),
            ]);
            http_response_code(500);
        }

        error_log('=== FIM DEBUG AUTH STRUCTURE ===');
        exit;
    }

    // ==========================================
    // ROTA PADRÃO - Quando nenhuma rota é encontrada
    // ==========================================

    // Se chegou até aqui, a rota não foi encontrada
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Rota não encontrada',
        'debug' => [
            'method' => $method,
            'uri' => $uri,
        ],
    ]);
} catch (Exception $e) {
    error_log('❌ Erro na API: '.$e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor',
        'debug' => [
            'error' => $e->getMessage(),
            'file' => basename($e->getFile()),
            'line' => $e->getLine(),
        ],
    ]);
}

// ==========================================
// ROTA 404
// ==========================================

/* http_response_code(404);
echo json_encode([
'success' => false,
'message' => 'Rota não encontrada',
'debug' => [
'method' => $method,
'uri' => $uri,
'available_routes' => [
'GET /' => 'Teste da API',
'GET /db-test' => 'Teste do banco',
'GET /db-tables' => 'Verificar tabelas',
'POST /auth/login' => 'Login',
'POST /auth/logout' => 'Logout',
'GET /auth/me' => 'Verificar token',
'GET /usuarios' => 'Listar usuários (admin)',
'POST /usuarios' => 'Criar usuário (admin)',
'GET /clientes' => 'Listar clientes',
'POST /clientes' => 'Criar cliente',
'GET /clientes/{id}' => 'Buscar cliente',
'PUT /clientes/{id}' => 'Atualizar cliente',
'DELETE /clientes/{id}' => 'Desativar cliente',
'GET /clientes/search' => 'Buscar clientes',
'GET /contas-receber' => 'Listar contas a receber',
'POST /contas-receber' => 'Criar conta a receber',
'GET /contas-receber/{id}' => 'Buscar conta a receber',
'PUT /contas-receber/{id}' => 'Atualizar conta a receber',
'DELETE /contas-receber/{id}/cancelar' => 'Cancelar conta a receber',
'POST /contas-receber/{id}/pagamentos' => 'Adicionar pagamento',
'GET /contas-receber/resumo' => 'Resumo financeiro',
'GET /contas-receber/cliente/{id}' => 'Contas por cliente',
'GET /contas-receber/relatorio' => 'Relatório de contas',
'GET /recibos' => 'Listar recibos',
'POST /recibos' => 'Criar recibo',
'GET /recibos/{id}' => 'Buscar recibo',
'POST /recibos/gerar-pagamento/{id}' => 'Gerar recibo automático',
'PUT /recibos/{id}/cancelar' => 'Cancelar recibo',
'GET /recibos/{id}/imprimir' => 'Imprimir recibo',
'GET /recibos/resumo' => 'Resumo de recibos',
'GET /relatorios/clientes' => 'Relatório de clientes',
'GET /relatorios/financeiro' => 'Relatório financeiro',
'GET /relatorios/inadimplencia' => 'Relatório de inadimplência',
'GET /relatorios/fluxo-caixa' => 'Relatório de fluxo de caixa',
'GET /relatorios/dashboard' => 'Dashboard de relatórios',
'POST /relatorios/salvar' => 'Salvar relatório',
'GET /relatorios/salvos' => 'Listar relatórios salvos',
'GET /estatisticas' => 'Estatísticas',
],
],
]);
} catch (Exception $e) {
error_log('❌ Erro na API: '.$e->getMessage());
http_response_code(500);
echo json_encode([
'success' => false,
'message' => 'Erro interno do servidor',
'debug' => [
'error' => $e->getMessage(),
'file' => basename($e->getFile()),
'line' => $e->getLine(),
],
]);
} */
