<?php

// controllers/AuthController.php
// 🔐 CONTROLLER DE AUTENTICAÇÃO COM SEGURANÇA

require_once __DIR__.'/../config/Security.php';
require_once __DIR__.'/../models/Usuario.php';

class AuthController
{
    private $database;
    private $security;

    public function __construct($database)
    {
        $this->database = $database;
        $this->security = new Security($database->conectar());
    }

    /**
     * 🔐 LOGIN com bcrypt e tokens seguros
     */
    public function login($dados)
    {
        try {
            // Validações básicas
            if (empty($dados['email']) || empty($dados['senha'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email e senha são obrigatórios'
                ]);
                return;
            }

            $email = $this->security->sanitize($dados['email']);
            $senha = $dados['senha']; // Não sanitizar senha
            $ipAddress = $this->security->getClientIp();

            // Validar email
            if (!$this->security->isValidEmail($email)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email inválido'
                ]);
                return;
            }

            // 1️⃣ VERIFICAR RATE LIMIT
            if (!$this->security->checkRateLimit($email, $ipAddress)) {
                http_response_code(429);
                echo json_encode([
                    'success' => false,
                    'message' => 'Muitas tentativas de login. Tente novamente em alguns minutos.'
                ]);
                return;
            }

            // 2️⃣ BUSCAR USUÁRIO
            $usuario = new Usuario($this->database->conectar());
            $dadosUsuario = $usuario->buscarPorEmail($email);

            if (!$dadosUsuario) {
                // Registrar tentativa falha
                $this->security->logLoginAttempt($email, $ipAddress, false);

                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ]);
                return;
            }

            // 3️⃣ VERIFICAR SE ESTÁ BLOQUEADO
            if ($this->security->isUserLocked($dadosUsuario['id'])) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário bloqueado temporariamente devido a múltiplas tentativas falhas. Tente novamente em 15 minutos.'
                ]);
                return;
            }

            // 4️⃣ VERIFICAR SENHA
            $senhaValida = false;

            // Tentar bcrypt primeiro (novo sistema)
            if (!empty($dadosUsuario['password_hash'])) {
                $senhaValida = $this->security->verifyPassword($senha, $dadosUsuario['password_hash']);

                // Se o hash precisa ser atualizado (mudou o cost), atualizar
                if ($senhaValida && $this->security->needsRehash($dadosUsuario['password_hash'])) {
                    $this->atualizarHashSenha($dadosUsuario['id'], $senha);
                }
            }
            // Fallback para MD5 (sistema antigo) - MIGRAR PARA BCRYPT
            elseif (!empty($dadosUsuario['senha'])) {
                if (md5($senha) === $dadosUsuario['senha']) {
                    $senhaValida = true;
                    // MIGRAR PARA BCRYPT AUTOMATICAMENTE
                    $this->migrarSenhaParaBcrypt($dadosUsuario['id'], $senha);
                }
            }

            if (!$senhaValida) {
                // Registrar tentativa falha
                $this->security->logLoginAttempt($email, $ipAddress, false);
                $this->security->incrementLoginAttempts($dadosUsuario['id']);

                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ]);
                return;
            }

            // 5️⃣ GERAR TOKENS
            $accessToken = $this->security->generateAccessToken(
                $dadosUsuario['id'],
                $dadosUsuario['email'],
                $dadosUsuario['nome']
            );

            $refreshToken = $this->security->generateRefreshToken();

            // 6️⃣ SALVAR REFRESH TOKEN
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
            $this->security->saveRefreshToken(
                $dadosUsuario['id'],
                $refreshToken,
                $ipAddress,
                $userAgent
            );

            // 7️⃣ ATUALIZAR INFORMAÇÕES DE LOGIN
            $this->atualizarUltimoLogin($dadosUsuario['id'], $ipAddress);

            // 8️⃣ RESETAR CONTADOR DE TENTATIVAS
            $this->security->resetLoginAttempts($dadosUsuario['id']);

            // 9️⃣ REGISTRAR LOGS
            $this->security->logLoginAttempt($email, $ipAddress, true);
            $this->security->logSecurityEvent(
                $dadosUsuario['id'],
                'login_sucesso',
                $ipAddress,
                ['email' => $email]
            );

            // 🔟 RETORNAR RESPOSTA
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'data' => [
                    'accessToken' => $accessToken,
                    'refreshToken' => $refreshToken,
                    'expiresIn' => Security::ACCESS_TOKEN_EXPIRY,
                    'user' => [
                        'id' => $dadosUsuario['id'],
                        'nome' => $dadosUsuario['nome'],
                        'email' => $dadosUsuario['email'],
                        'tipo' => $dadosUsuario['tipo']
                    ]
                ]
            ]);
            return;

        } catch (Exception $e) {
            error_log('❌ Erro no login: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro interno no servidor'
            ]);
            return;
        }
    }

    /**
     * 🔄 REFRESH TOKEN - Renovar access token
     */
    public function refresh($dados)
    {
        try {
            if (empty($dados['refreshToken'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Refresh token não fornecido'
                ]);
                return;
            }

            $refreshToken = $dados['refreshToken'];

            // Validar refresh token
            $usuario = $this->security->validateRefreshToken($refreshToken);

            if (!$usuario) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Refresh token inválido ou expirado'
                ]);
                return;
            }

            // Gerar novo access token
            $accessToken = $this->security->generateAccessToken(
                $usuario['id'],
                $usuario['email'],
                $usuario['nome']
            );

            // Log
            $this->security->logSecurityEvent(
                $usuario['id'],
                'token_refresh',
                $this->security->getClientIp()
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'accessToken' => $accessToken,
                    'expiresIn' => Security::ACCESS_TOKEN_EXPIRY
                ]
            ]);
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao renovar token: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao renovar token'
            ]);
            return;
        }
    }

    /**
     * 🚪 LOGOUT - Revogar tokens
     */
    public function logout($dados)
    {
        try {
            if (empty($dados['refreshToken'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Refresh token não fornecido'
                ]);
                return;
            }

            $refreshToken = $dados['refreshToken'];

            // Buscar usuário antes de revogar
            $usuario = $this->security->validateRefreshToken($refreshToken);

            // Revogar token
            $this->security->revokeRefreshToken($refreshToken);

            // Log
            if ($usuario) {
                $this->security->logSecurityEvent(
                    $usuario['id'],
                    'logout',
                    $this->security->getClientIp()
                );
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Logout realizado com sucesso'
            ]);
            return;

        } catch (Exception $e) {
            error_log('❌ Erro no logout: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao fazer logout'
            ]);
            return;
        }
    }

    /**
     * 🔐 ALTERAR SENHA
     */
    public function alterarSenha($dados, $userId)
    {
        try {
            if (empty($dados['senhaAtual']) || empty($dados['senhaNova'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Senha atual e nova senha são obrigatórias'
                ]);
                return;
            }

            // Validar senha forte
            if (!$this->security->isStrongPassword($dados['senhaNova'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números'
                ]);
                return;
            }

            // Buscar usuário
            $usuario = new Usuario($this->database->conectar());
            $dadosUsuario = $usuario->buscarPorId($userId);

            if (!$dadosUsuario) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário não encontrado'
                ]);
                return;
            }

            // Verificar senha atual
            $senhaAtualValida = false;

            if (!empty($dadosUsuario['password_hash'])) {
                $senhaAtualValida = $this->security->verifyPassword(
                    $dados['senhaAtual'],
                    $dadosUsuario['password_hash']
                );
            } elseif (!empty($dadosUsuario['senha'])) {
                $senhaAtualValida = (md5($dados['senhaAtual']) === $dadosUsuario['senha']);
            }

            if (!$senhaAtualValida) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Senha atual incorreta'
                ]);
                return;
            }

            // Atualizar senha
            $novoHash = $this->security->hashPassword($dados['senhaNova']);
            $this->atualizarHashSenha($userId, $dados['senhaNova']);

            // Revogar todas as sessões (forçar novo login)
            $this->security->revokeAllUserSessions($userId);

            // Log
            $this->security->logSecurityEvent(
                $userId,
                'senha_alterada',
                $this->security->getClientIp()
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Senha alterada com sucesso. Faça login novamente.'
            ]);
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao alterar senha: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao alterar senha'
            ]);
            return;
        }
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    /**
     * Migrar senha de MD5 para bcrypt
     */
    private function migrarSenhaParaBcrypt($userId, $senhaTexto)
    {
        try {
            $novoHash = $this->security->hashPassword($senhaTexto);

            $sql = "UPDATE usuarios 
                    SET password_hash = ?, 
                        senha = NULL 
                    WHERE id = ?";

            $stmt = $this->database->conectar()->prepare($sql);
            $stmt->execute([$novoHash, $userId]);

            error_log("✅ Senha migrada para bcrypt - Usuário ID: {$userId}");

        } catch (Exception $e) {
            error_log('❌ Erro ao migrar senha: ' . $e->getMessage());
        }
    }

    /**
     * Atualizar hash da senha
     */
    private function atualizarHashSenha($userId, $senhaTexto)
    {
        try {
            $novoHash = $this->security->hashPassword($senhaTexto);

            $sql = "UPDATE usuarios SET password_hash = ? WHERE id = ?";
            $stmt = $this->database->conectar()->prepare($sql);
            $stmt->execute([$novoHash, $userId]);

        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar hash: ' . $e->getMessage());
        }
    }

    /**
     * Atualizar último login
     */
    private function atualizarUltimoLogin($userId, $ipAddress)
    {
        try {
            $sql = "UPDATE usuarios 
                    SET ultimo_login = NOW(), 
                        ip_ultimo_login = ? 
                    WHERE id = ?";

            $stmt = $this->database->conectar()->prepare($sql);
            $stmt->execute([$ipAddress, $userId]);

        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar último login: ' . $e->getMessage());
        }
    }
}
