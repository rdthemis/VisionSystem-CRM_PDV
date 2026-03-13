<?php

// models/Usuario.php
// 👤 MODEL: Gerenciamento de Usuários

class Usuario
{
    private $conn;
    private $table_name = 'usuarios';

    // Propriedades
    public $id;
    public $nome;
    public $email;
    public $senha; // MD5 (legado)
    public $password_hash; // bcrypt (novo)
    public $tipo; // admin, usuario, caixa, etc
    public $ativo;
    public $refresh_token;
    public $refresh_token_expires;
    public $tentativas_login;
    public $bloqueado_ate;
    public $ultimo_login;
    public $ip_ultimo_login;
    public $created_at;
    public $updated_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // ==========================================
    // MÉTODOS DE AUTENTICAÇÃO
    // ==========================================

    /**
     * Buscar usuário por email
     */
    public function buscarPorEmail($email)
    {
        $query = "SELECT * FROM {$this->table_name} WHERE email = :email LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Buscar usuário por ID
     */
    public function buscarPorId($id)
    {
        $query = "SELECT * FROM {$this->table_name} WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Verificar se email já existe
     */
    public function emailExiste($email, $excluirId = null)
    {
        $query = "SELECT id FROM {$this->table_name} WHERE email = :email";
        
        if ($excluirId) {
            $query .= " AND id != :excluir_id";
        }
        
        $query .= " LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        
        if ($excluirId) {
            $stmt->bindParam(':excluir_id', $excluirId, PDO::PARAM_INT);
        }
        
        $stmt->execute();

        return $stmt->fetch() !== false;
    }

    // ==========================================
    // CRUD BÁSICO
    // ==========================================

    /**
     * Buscar todos os usuários
     */
    public function buscarTodos($apenasAtivos = false)
    {
        $query = "SELECT id, nome, email, tipo, ativo, ultimo_login, created_at 
                  FROM {$this->table_name}";
        
        if ($apenasAtivos) {
            $query .= " WHERE ativo = 1";
        }
        
        $query .= " ORDER BY nome ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Criar novo usuário
     */
    public function criar()
    {
        $query = "INSERT INTO {$this->table_name} 
                  (nome, email, password_hash, tipo, ativo) 
                  VALUES (:nome, :email, :password_hash, :tipo, :ativo)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->ativo = $this->ativo ? 1 : 0;

        // Bind
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password_hash', $this->password_hash);
        $stmt->bindParam(':tipo', $this->tipo);
        $stmt->bindParam(':ativo', $this->ativo);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Atualizar usuário
     */
    public function atualizar()
    {
        // Se está atualizando senha, incluir no UPDATE
        if (!empty($this->password_hash)) {
            $query = "UPDATE {$this->table_name} 
                      SET nome = :nome, 
                          email = :email, 
                          password_hash = :password_hash,
                          tipo = :tipo, 
                          ativo = :ativo 
                      WHERE id = :id";
        } else {
            $query = "UPDATE {$this->table_name} 
                      SET nome = :nome, 
                          email = :email, 
                          tipo = :tipo, 
                          ativo = :ativo 
                      WHERE id = :id";
        }

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->ativo = $this->ativo ? 1 : 0;
        $this->id = intval($this->id);

        // Bind
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':tipo', $this->tipo);
        $stmt->bindParam(':ativo', $this->ativo);
        $stmt->bindParam(':id', $this->id);

        if (!empty($this->password_hash)) {
            $stmt->bindParam(':password_hash', $this->password_hash);
        }

        return $stmt->execute();
    }

    /**
     * Deletar usuário (soft delete)
     */
    public function deletar()
    {
        $query = "UPDATE {$this->table_name} SET ativo = 0 WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $this->id = intval($this->id);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Reativar usuário
     */
    public function reativar()
    {
        $query = "UPDATE {$this->table_name} SET ativo = 1 WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $this->id = intval($this->id);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // ==========================================
    // MÉTODOS AUXILIARES DE SEGURANÇA
    // ==========================================

    /**
     * Atualizar último login
     */
    public function atualizarUltimoLogin($ipAddress = null)
    {
        $query = "UPDATE {$this->table_name} 
                  SET ultimo_login = NOW()";
        
        if ($ipAddress) {
            $query .= ", ip_ultimo_login = :ip";
        }
        
        $query .= " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        if ($ipAddress) {
            $stmt->bindParam(':ip', $ipAddress);
        }
        
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Atualizar senha (bcrypt)
     */
    public function atualizarSenha($passwordHash)
    {
        $query = "UPDATE {$this->table_name} 
                  SET password_hash = :password_hash, 
                      senha = NULL 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Atualizar refresh token
     */
    public function atualizarRefreshToken($token, $expiresAt)
    {
        $query = "UPDATE {$this->table_name} 
                  SET refresh_token = :token, 
                      refresh_token_expires = :expires 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expires', $expiresAt);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Limpar refresh token (logout)
     */
    public function limparRefreshToken()
    {
        $query = "UPDATE {$this->table_name} 
                  SET refresh_token = NULL, 
                      refresh_token_expires = NULL 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Incrementar tentativas de login
     */
    public function incrementarTentativas()
    {
        $query = "UPDATE {$this->table_name} 
                  SET tentativas_login = tentativas_login + 1 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Resetar tentativas de login
     */
    public function resetarTentativas()
    {
        $query = "UPDATE {$this->table_name} 
                  SET tentativas_login = 0, 
                      bloqueado_ate = NULL 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Bloquear usuário temporariamente
     */
    public function bloquear($minutos = 15)
    {
        $bloqueadoAte = date('Y-m-d H:i:s', time() + ($minutos * 60));
        
        $query = "UPDATE {$this->table_name} 
                  SET bloqueado_ate = :bloqueado_ate 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':bloqueado_ate', $bloqueadoAte);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Verificar se usuário está bloqueado
     */
    public function estaBloqueado()
    {
        $query = "SELECT bloqueado_ate FROM {$this->table_name} 
                  WHERE id = :id 
                  AND bloqueado_ate > NOW() 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch() !== false;
    }

    // ==========================================
    // BUSCAR POR TIPO
    // ==========================================

    /**
     * Buscar usuários por tipo
     */
    public function buscarPorTipo($tipo)
    {
        $query = "SELECT id, nome, email, tipo, ativo, ultimo_login 
                  FROM {$this->table_name} 
                  WHERE tipo = :tipo 
                  AND ativo = 1 
                  ORDER BY nome ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':tipo', $tipo);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Contar usuários por tipo
     */
    public function contarPorTipo($tipo = null)
    {
        if ($tipo) {
            $query = "SELECT COUNT(*) as total 
                      FROM {$this->table_name} 
                      WHERE tipo = :tipo AND ativo = 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':tipo', $tipo);
        } else {
            $query = "SELECT COUNT(*) as total 
                      FROM {$this->table_name} 
                      WHERE ativo = 1";
            
            $stmt = $this->conn->prepare($query);
        }

        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['total'] ?? 0;
    }

    // ==========================================
    // ESTATÍSTICAS
    // ==========================================

    /**
     * Obter estatísticas de usuários
     */
    public function obterEstatisticas()
    {
        $query = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
                    SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativos,
                    SUM(CASE WHEN tipo = 'admin' THEN 1 ELSE 0 END) as admins,
                    SUM(CASE WHEN bloqueado_ate > NOW() THEN 1 ELSE 0 END) as bloqueados
                  FROM {$this->table_name}";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Buscar últimos logins
     */
    public function buscarUltimosLogins($limite = 10)
    {
        $query = "SELECT id, nome, email, ultimo_login, ip_ultimo_login 
                  FROM {$this->table_name} 
                  WHERE ultimo_login IS NOT NULL 
                  ORDER BY ultimo_login DESC 
                  LIMIT :limite";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
