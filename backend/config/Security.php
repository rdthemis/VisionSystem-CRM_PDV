<?php

// config/Security.php
// 🔐 CLASSE DE SEGURANÇA: Gerenciamento de senhas bcrypt e tokens

class Security
{
    private $conn;

    // Configurações de segurança
    public const BCRYPT_COST = 12; // Custo do bcrypt (10-12 é recomendado)
    public const ACCESS_TOKEN_EXPIRY = 900; // 15 minutos
    public const REFRESH_TOKEN_EXPIRY = 604800; // 7 dias
    public const MAX_LOGIN_ATTEMPTS = 5; // Máximo de tentativas de login
    public const LOCKOUT_TIME = 900; // 15 minutos de bloqueio
    public const RATE_LIMIT_WINDOW = 300; // 5 minutos para rate limiting
    public const RATE_LIMIT_MAX = 10; // Máximo de tentativas em 5 minutos

    public function __construct($database = null)
    {
        $this->conn = $database;
    }

    // ==========================================
    // GERENCIAMENTO DE SENHAS
    // ==========================================

    /**
     * Criar hash bcrypt de senha.
     */
    public function hashPassword($password)
    {
        return password_hash($password, PASSWORD_BCRYPT, [
            'cost' => self::BCRYPT_COST,
        ]);
    }

    /**
     * Verificar senha contra hash bcrypt.
     */
    public function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    /**
     * Verificar se hash precisa ser atualizado (rehash).
     */
    public function needsRehash($hash)
    {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, [
            'cost' => self::BCRYPT_COST,
        ]);
    }

    // ==========================================
    // GERENCIAMENTO DE TOKENS JWT
    // ==========================================

    /**
     * Gerar Access Token (JWT).
     */
    public function generateAccessToken($userId, $email, $nome)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        $payload = json_encode([
            'user_id' => $userId,
            'email' => $email,
            'nome' => $nome,
            'iat' => time(), // Issued at
            'exp' => time() + self::ACCESS_TOKEN_EXPIRY, // Expiration
        ]);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader.'.'.$base64UrlPayload,
            $this->getJwtSecret(),
            true
        );

        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader.'.'.$base64UrlPayload.'.'.$base64UrlSignature;
    }

    /**
     * Gerar Refresh Token (aleatório).
     */
    public function generateRefreshToken()
    {
        return bin2hex(random_bytes(64)); // 128 caracteres hex
    }

    /**
     * Validar Access Token.
     */
    public function validateAccessToken($token)
    {
        try {
            $parts = explode('.', $token);

            if (count($parts) !== 3) {
                return false;
            }

            list($header, $payload, $signature) = $parts;

            // Verificar assinatura
            $validSignature = hash_hmac(
                'sha256',
                $header.'.'.$payload,
                $this->getJwtSecret(),
                true
            );

            $base64UrlSignature = $this->base64UrlEncode($validSignature);

            if ($signature !== $base64UrlSignature) {
                return false;
            }

            // Decodificar payload
            $payloadData = json_decode($this->base64UrlDecode($payload), true);

            // Verificar expiração
            if (!isset($payloadData['exp']) || $payloadData['exp'] < time()) {
                return false;
            }

            return $payloadData;
        } catch (Exception $e) {
            error_log('❌ Erro ao validar token: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Extrair dados do token (sem validar expiração).
     */
    public function decodeToken($token)
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return false;
            }

            $payload = json_decode($this->base64UrlDecode($parts[1]), true);

            return $payload;
        } catch (Exception $e) {
            return false;
        }
    }

    // ==========================================
    // SESSÕES E REFRESH TOKENS
    // ==========================================

    /**
     * Salvar refresh token no banco.
     */
    public function saveRefreshToken($userId, $refreshToken, $ipAddress, $userAgent)
    {
        if (!$this->conn) {
            return false;
        }

        try {
            $expiresAt = date('Y-m-d H:i:s', time() + self::REFRESH_TOKEN_EXPIRY);

            // Salvar na tabela sessoes_ativas
            $sql = 'INSERT INTO sessoes_ativas 
                    (usuario_id, refresh_token, ip_address, user_agent, expires_at) 
                    VALUES (?, ?, ?, ?, ?)';

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId, $refreshToken, $ipAddress, $userAgent, $expiresAt]);

            // Atualizar usuário
            $sqlUser = 'UPDATE usuarios 
                        SET refresh_token = ?, 
                            refresh_token_expires = ? 
                        WHERE id = ?';

            $stmtUser = $this->conn->prepare($sqlUser);
            $stmtUser->execute([$refreshToken, $expiresAt, $userId]);

            return true;
        } catch (Exception $e) {
            error_log('❌ Erro ao salvar refresh token: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Validar refresh token.
     */
    public function validateRefreshToken($refreshToken)
    {
        if (!$this->conn) {
            return false;
        }

        try {
            $sql = 'SELECT u.* FROM usuarios u
                    INNER JOIN sessoes_ativas s ON u.id = s.usuario_id
                    WHERE s.refresh_token = ? 
                    AND s.expires_at > NOW()
                    AND u.ativo = 1
                    LIMIT 1';

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$refreshToken]);

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log('❌ Erro ao validar refresh token: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Revogar refresh token (logout).
     */
    public function revokeRefreshToken($refreshToken)
    {
        if (!$this->conn) {
            return false;
        }

        try {
            // Deletar da tabela de sessões
            $sql = 'DELETE FROM sessoes_ativas WHERE refresh_token = ?';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$refreshToken]);

            // Limpar do usuário (se for o último)
            $sqlUser = 'UPDATE usuarios 
                        SET refresh_token = NULL, 
                            refresh_token_expires = NULL 
                        WHERE refresh_token = ?';
            $stmtUser = $this->conn->prepare($sqlUser);
            $stmtUser->execute([$refreshToken]);

            return true;
        } catch (Exception $e) {
            error_log('❌ Erro ao revogar token: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Revogar todas as sessões do usuário.
     */
    public function revokeAllUserSessions($userId)
    {
        if (!$this->conn) {
            return false;
        }

        try {
            $sql = 'DELETE FROM sessoes_ativas WHERE usuario_id = ?';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId]);

            $sqlUser = 'UPDATE usuarios 
                        SET refresh_token = NULL, 
                            refresh_token_expires = NULL 
                        WHERE id = ?';
            $stmtUser = $this->conn->prepare($sqlUser);
            $stmtUser->execute([$userId]);

            return true;
        } catch (Exception $e) {
            error_log('❌ Erro ao revogar sessões: '.$e->getMessage());

            return false;
        }
    }

    // ==========================================
    // RATE LIMITING E PROTEÇÃO
    // ==========================================

    /**
     * Verificar rate limit de login.
     */
    public function checkRateLimit($email, $ipAddress)
    {
        if (!$this->conn) {
            return true;
        } // Permitir se não tem conexão

        try {
            // Contar tentativas nos últimos X minutos
            $sql = 'SELECT COUNT(*) as tentativas 
                    FROM tentativas_login 
                    WHERE (email = ? OR ip_address = ?)
                    AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)';

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$email, $ipAddress, self::RATE_LIMIT_WINDOW]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $tentativas = $result['tentativas'] ?? 0;

            return $tentativas < self::RATE_LIMIT_MAX;
        } catch (Exception $e) {
            error_log('❌ Erro ao verificar rate limit: '.$e->getMessage());

            return true; // Permitir em caso de erro
        }
    }

    /**
     * Registrar tentativa de login.
     */
    public function logLoginAttempt($email, $ipAddress, $sucesso)
    {
        if (!$this->conn) {
            return;
        }

        try {
            $sql = 'INSERT INTO tentativas_login (email, ip_address, sucesso) 
                    VALUES (?, ?, ?)';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$email, $ipAddress, $sucesso ? 1 : 0]);
        } catch (Exception $e) {
            error_log('❌ Erro ao registrar tentativa: '.$e->getMessage());
        }
    }

    /**
     * Verificar se usuário está bloqueado.
     */
    public function isUserLocked($userId)
    {
        if (!$this->conn) {
            return false;
        }

        try {
            $sql = 'SELECT bloqueado_ate FROM usuarios 
                    WHERE id = ? AND bloqueado_ate > NOW()';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId]);

            return $stmt->fetch() !== false;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Incrementar tentativas de login falhas.
     */
    public function incrementLoginAttempts($userId)
    {
        if (!$this->conn) {
            return;
        }

        try {
            $sql = 'UPDATE usuarios 
                    SET tentativas_login = tentativas_login + 1 
                    WHERE id = ?';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId]);

            // Verificar se deve bloquear
            $sqlCheck = 'SELECT tentativas_login FROM usuarios WHERE id = ?';
            $stmtCheck = $this->conn->prepare($sqlCheck);
            $stmtCheck->execute([$userId]);
            $result = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($result && $result['tentativas_login'] >= self::MAX_LOGIN_ATTEMPTS) {
                $this->lockUser($userId);
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao incrementar tentativas: '.$e->getMessage());
        }
    }

    /**
     * Bloquear usuário.
     */
    public function lockUser($userId)
    {
        if (!$this->conn) {
            return;
        }

        try {
            $bloqueadoAte = date('Y-m-d H:i:s', time() + self::LOCKOUT_TIME);

            $sql = 'UPDATE usuarios 
                    SET bloqueado_ate = ? 
                    WHERE id = ?';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$bloqueadoAte, $userId]);

            // Log de segurança
            $this->logSecurityEvent($userId, 'bloqueio', $this->getClientIp());
        } catch (Exception $e) {
            error_log('❌ Erro ao bloquear usuário: '.$e->getMessage());
        }
    }

    /**
     * Resetar contador de tentativas.
     */
    public function resetLoginAttempts($userId)
    {
        if (!$this->conn) {
            return;
        }

        try {
            $sql = 'UPDATE usuarios 
                    SET tentativas_login = 0, 
                        bloqueado_ate = NULL 
                    WHERE id = ?';
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId]);
        } catch (Exception $e) {
            error_log('❌ Erro ao resetar tentativas: '.$e->getMessage());
        }
    }

    // ==========================================
    // LOGS DE SEGURANÇA
    // ==========================================

    /**
     * Registrar evento de segurança.
     */
    public function logSecurityEvent($usuarioId, $tipoEvento, $ipAddress, $detalhes = null)
    {
        if (!$this->conn) {
            return;
        }

        try {
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
            $detalhesJson = $detalhes ? json_encode($detalhes) : null;

            $sql = 'INSERT INTO logs_seguranca 
                    (usuario_id, tipo_evento, ip_address, user_agent, detalhes) 
                    VALUES (?, ?, ?, ?, ?)';

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $usuarioId,
                $tipoEvento,
                $ipAddress,
                $userAgent,
                $detalhesJson,
            ]);
        } catch (Exception $e) {
            error_log('❌ Erro ao registrar log: '.$e->getMessage());
        }
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    /**
     * Obter IP do cliente.
     */
    public function getClientIp()
    {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        }

        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
    }

    /**
     * Obter secret para JWT (usar variável de ambiente em produção!).
     */
    private function getJwtSecret()
    {
        // 🔴 IMPORTANTE: Mover para variável de ambiente em produção!
        return $_ENV['JWT_SECRET'] ?? '6880b9ca9c7988c4cd2f95ac5727c86dd3b848b8a8d352b90d56d5c219101c41';
    }

    /**
     * Base64 URL Encode.
     */
    private function base64UrlEncode($data)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Base64 URL Decode.
     */
    private function base64UrlDecode($data)
    {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }

    /**
     * Sanitizar input.
     */
    public function sanitize($data)
    {
        if (is_array($data)) {
            return array_map([$this, 'sanitize'], $data);
        }

        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');

        return $data;
    }

    /**
     * Validar email.
     */
    public function isValidEmail($email)
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validar senha forte.
     */
    public function isStrongPassword($password)
    {
        // Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
        return strlen($password) >= 8
            && preg_match('/[A-Z]/', $password)
            && preg_match('/[a-z]/', $password)
            && preg_match('/[0-9]/', $password);
    }
}