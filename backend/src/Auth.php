<?php

// src/Auth.php - Classe de autenticação com banco de dados

class Auth
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database->conectar();
    }

    // Login com verificação no banco
    public function login($email, $senha)
    {
        try {
            error_log('Cheguei no Auth');
            // Buscar usuário no banco
            $stmt = $this->db->prepare('
                SELECT id, nome, email, senha, tipo, ativo, ultimo_login
                FROM usuarios 
                WHERE email = ? AND ativo = 1
            ');

            $stmt->execute([$email]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                error_log("❌ Tentativa de login com email não encontrado: {$email}");

                return [
                    'success' => false,
                    'message' => 'Email não encontrado',
                ];
            }

            // Verificar senha
            // Para senhas hash use: password_verify($senha, $usuario['senha'])
            // Para desenvolvimento, aceitamos tanto hash quanto texto simples
            $senhaValida = false;

            if (password_verify($senha, $usuario['senha'])) {
                $senhaValida = true;
            } elseif ($usuario['senha'] === $senha) {
                // Compatibilidade com senhas em texto simples (desenvolvimento)
                $senhaValida = true;
            }

            if (!$senhaValida) {
                error_log("❌ Tentativa de login com senha incorreta para: {$email}");

                return [
                    'success' => false,
                    'message' => 'Senha incorreta',
                ];
            }

            // Atualizar último login
            $this->atualizarUltimoLogin($usuario['id']);

            // Gerar token JWT simples
            $payload = [
                'user_id' => $usuario['id'],
                'email' => $usuario['email'],
                'nome' => $usuario['nome'],
                'tipo' => $usuario['tipo'],
                'timestamp' => time(),
                'expires' => time() + (24 * 60 * 60), // 24 horas
            ];

            $token = base64_encode(json_encode($payload));

            error_log("✅ Login bem-sucedido para: {$email} (ID: {$usuario['id']})");

            return [
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'data' => [
                    'token' => $token,
                    'usuario' => [
                        'id' => $usuario['id'],
                        'nome' => $usuario['nome'],
                        'email' => $usuario['email'],
                        'tipo' => $usuario['tipo'],
                    ],
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no login: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro interno no processo de login',
            ];
        }
    }

    // Verificar token
    public function verificarToken($token)
    {
        try {
            if (!$token) {
                return false;
            }

            // Remover "Bearer " se existir
            if (strpos($token, 'Bearer ') === 0) {
                $token = substr($token, 7);
            }

            // Decodificar token
            $decoded = json_decode(base64_decode($token), true);

            if (!$decoded || !isset($decoded['user_id']) || !isset($decoded['email'])) {
                error_log('❌ Token inválido: estrutura incorreta');

                return false;
            }

            // Verificar se token não expirou
            if (isset($decoded['expires']) && time() > $decoded['expires']) {
                error_log("❌ Token expirado para usuário: {$decoded['email']}");

                return false;
            }

            // Verificar se usuário ainda existe e está ativo
            $stmt = $this->db->prepare('
                SELECT id, nome, email, tipo, ativo 
                FROM usuarios 
                WHERE id = ? AND email = ? AND ativo = 1
            ');

            $stmt->execute([$decoded['user_id'], $decoded['email']]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                error_log("❌ Usuário do token não encontrado ou inativo: {$decoded['email']}");

                return false;
            }

            return [
                'usuario_id' => $usuario['id'],
                'email' => $usuario['email'],
                'nome' => $usuario['nome'],
                'tipo' => $usuario['tipo'],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao verificar token: '.$e->getMessage());

            return false;
        }
    }

    // Atualizar último login
    private function atualizarUltimoLogin($usuarioId)
    {
        try {
            $stmt = $this->db->prepare('
                UPDATE usuarios 
                SET ultimo_login = NOW() 
                WHERE id = ?
            ');
            $stmt->execute([$usuarioId]);
        } catch (Exception $e) {
            error_log('⚠️ Erro ao atualizar último login: '.$e->getMessage());
        }
    }

    // Criar novo usuário
    public function criarUsuario($dados)
    {
        try {
            // Validações básicas
            if (empty($dados['nome']) || empty($dados['email']) || empty($dados['senha'])) {
                return [
                    'success' => false,
                    'message' => 'Nome, email e senha são obrigatórios',
                ];
            }

            // Verificar se email já existe
            $stmt = $this->db->prepare('SELECT id FROM usuarios WHERE email = ?');
            $stmt->execute([$dados['email']]);

            if ($stmt->fetch()) {
                return [
                    'success' => false,
                    'message' => 'Email já cadastrado',
                ];
            }

            // Criptografar senha
            $senhaHash = password_hash($dados['senha'], PASSWORD_DEFAULT);

            // Inserir usuário
            $stmt = $this->db->prepare('
                INSERT INTO usuarios (nome, email, senha, tipo, telefone) 
                VALUES (?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $dados['nome'],
                $dados['email'],
                $senhaHash,
                $dados['tipo'] ?? 'usuario',
                $dados['telefone'] ?? null,
            ]);

            $usuarioId = $this->db->lastInsertId();

            error_log("✅ Usuário criado: {$dados['email']} (ID: {$usuarioId})");

            return [
                'success' => true,
                'message' => 'Usuário criado com sucesso',
                'data' => ['id' => $usuarioId],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao criar usuário: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao criar usuário',
            ];
        }
    }

    // Listar usuários
    public function listarUsuarios()
    {
        try {
            $stmt = $this->db->prepare('
                SELECT id, nome, email, tipo, ativo, ultimo_login, created_at
                FROM usuarios 
                ORDER BY nome
            ');
            $stmt->execute();

            return [
                'success' => true,
                'data' => $stmt->fetchAll(),
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar usuários: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao listar usuários',
            ];
        }
    }

    // Alterar senha
    public function alterarSenha($usuarioId, $senhaAtual, $novaSenha)
    {
        try {
            // Buscar senha atual
            $stmt = $this->db->prepare('SELECT senha FROM usuarios WHERE id = ?');
            $stmt->execute([$usuarioId]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                return [
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ];
            }

            // Verificar senha atual
            if (!password_verify($senhaAtual, $usuario['senha'])) {
                return [
                    'success' => false,
                    'message' => 'Senha atual incorreta',
                ];
            }

            // Atualizar senha
            $novaSenhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare('UPDATE usuarios SET senha = ? WHERE id = ?');
            $stmt->execute([$novaSenhaHash, $usuarioId]);

            error_log("✅ Senha alterada para usuário ID: {$usuarioId}");

            return [
                'success' => true,
                'message' => 'Senha alterada com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao alterar senha: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao alterar senha',
            ];
        }
    }

    // Esqueci senha (implementação básica)
    public function forgotPassword($email)
    {
        try {
            // Verificar se email existe
            $stmt = $this->db->prepare('SELECT id, nome FROM usuarios WHERE email = ? AND ativo = 1');
            $stmt->execute([$email]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                // Por segurança, sempre retornar sucesso (não revelar se email existe)
                return [
                    'success' => true,
                    'message' => 'Se o email existir, você receberá instruções para redefinir sua senha',
                ];
            }

            // TODO: Implementar envio de email com token de reset
            // Por enquanto, apenas log
            error_log("🔑 Solicitação de reset de senha para: {$email}");

            return [
                'success' => true,
                'message' => 'Se o email existir, você receberá instruções para redefinir sua senha',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no forgot password: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro interno',
            ];
        }
    }

    // Reset senha (implementação básica)
    public function resetPassword($token, $novaSenha)
    {
        try {
            // TODO: Implementar sistema de tokens de reset
            // Por enquanto, implementação básica

            return [
                'success' => true,
                'message' => 'Senha redefinida com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no reset password: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao redefinir senha',
            ];
        }
    }

    // Obter dados do usuário pelo ID
    public function obterUsuario($usuarioId)
    {
        try {
            $stmt = $this->db->prepare('
                SELECT id, nome, email, tipo, telefone, ativo, ultimo_login, created_at
                FROM usuarios 
                WHERE id = ?
            ');
            $stmt->execute([$usuarioId]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                return [
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ];
            }

            return [
                'success' => true,
                'data' => $usuario,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao obter usuário: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao buscar usuário',
            ];
        }
    }

    // Atualizar perfil do usuário
    public function atualizarPerfil($usuarioId, $dados)
    {
        try {
            $campos = [];
            $valores = [];

            // Campos permitidos para atualização
            $camposPermitidos = ['nome', 'telefone'];

            foreach ($camposPermitidos as $campo) {
                if (isset($dados[$campo])) {
                    $campos[] = "{$campo} = ?";
                    $valores[] = $dados[$campo];
                }
            }

            if (empty($campos)) {
                return [
                    'success' => false,
                    'message' => 'Nenhum campo para atualizar',
                ];
            }

            $valores[] = $usuarioId;

            $stmt = $this->db->prepare('
                UPDATE usuarios 
                SET '.implode(', ', $campos).'
                WHERE id = ?
            ');
            $stmt->execute($valores);

            error_log("✅ Perfil atualizado para usuário ID: {$usuarioId}");

            return [
                'success' => true,
                'message' => 'Perfil atualizado com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar perfil: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao atualizar perfil',
            ];
        }
    }
}

function verificarAuth($database)
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token não fornecido',
        ]);
        exit;
    }

    $auth = new Auth($database);
    $resultado = $auth->verificarToken($authHeader);

    if (!$resultado) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token inválido ou expirado',
        ]);
        exit;
    }
    error_log('🔑 Token recebido: '.$authHeader);
    error_log('🔑 Resultado da verificação: '.json_encode($resultado));

    return $resultado;
}