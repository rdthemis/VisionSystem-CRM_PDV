<?php

// middleware/AuthMiddleware.php
// 🛡️ MIDDLEWARE DE AUTENTICAÇÃO

require_once __DIR__.'/../config/Security.php';

function verificarAuth($database)
{
    $security = new Security($database->conectar());

    // Obter token do header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token de autenticação não fornecido'
        ]);
        exit;
    }

    // Extrair token (formato: "Bearer TOKEN")
    $token = str_replace('Bearer ', '', $authHeader);

    // Validar token
    $payload = $security->validateAccessToken($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token inválido ou expirado',
            'code' => 'TOKEN_EXPIRED'
        ]);
        exit;
    }

    // Verificar se usuário ainda está ativo
    try {
        $sql = "SELECT id, nome, email, tipo, ativo 
                FROM usuarios 
                WHERE id = ? AND ativo = 1";
        
        $stmt = $database->conectar()->prepare($sql);
        $stmt->execute([$payload['user_id']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Usuário não encontrado ou inativo'
            ]);
            exit;
        }

        // Retornar dados do usuário autenticado
        return [
            'success' => true,
            'user' => $usuario,
            'user_id' => $usuario['id'],
            'user_tipo' => $usuario['tipo']
        ];

    } catch (Exception $e) {
        error_log('❌ Erro no middleware de auth: ' . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao validar autenticação'
        ]);
        exit;
    }
}

/**
 * Verificar se usuário tem permissão de admin
 */
function verificarAdmin($database)
{
    $authResult = verificarAuth($database);

    if ($authResult['user_tipo'] !== 'admin') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Acesso negado. Apenas administradores.'
        ]);
        exit;
    }

    return $authResult;
}

/**
 * Verificar autenticação OPCIONAL (permite acesso mesmo sem token)
 */
function verificarAuthOpcional($database)
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader)) {
        return null; // Sem autenticação
    }

    $security = new Security($database->conectar());
    $token = str_replace('Bearer ', '', $authHeader);
    $payload = $security->validateAccessToken($token);

    if (!$payload) {
        return null; // Token inválido
    }

    try {
        $sql = "SELECT id, nome, email, tipo 
                FROM usuarios 
                WHERE id = ? AND ativo = 1";
        
        $stmt = $database->conectar()->prepare($sql);
        $stmt->execute([$payload['user_id']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($usuario) {
            return [
                'success' => true,
                'user' => $usuario,
                'user_id' => $usuario['id']
            ];
        }

        return null;

    } catch (Exception $e) {
        error_log('❌ Erro ao verificar auth opcional: ' . $e->getMessage());
        return null;
    }
}
