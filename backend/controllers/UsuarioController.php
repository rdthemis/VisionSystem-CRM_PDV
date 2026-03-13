<?php

// controllers/UsuarioController.php
// 👤 CONTROLLER: Gerenciamento de Usuários

require_once __DIR__.'../../models/Usuario.php';
require_once __DIR__.'../../config/Security.php';

class UsuarioController
{
    private $database;
    private $security;
    private $usuario;

    public function __construct($database)
    {
        $this->database = $database;
        $this->security = new Security($database->conectar());
    }

    /**
     * Buscar todos os usuários.
     */
    public function buscarTodos($apenasAtivos = false)
    {
        try {
            $usuario = new Usuario($this->database->conectar());
            $resultado = $usuario->buscarTodos($apenasAtivos);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $resultado,
            ]);

            return;
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar usuários: '.$e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar usuários: '.$e->getMessage(),
            ]);

            return;
        }
    }

    /**
     * Buscar usuário por ID.
     */
    public function buscarPorId($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID inválido',
                ]);

                return;
            }

            $usuario = new Usuario($this->database->conectar());
            $resultado = $usuario->buscarPorId($id);

            if ($resultado) {
                // Remover informações sensíveis
                unset($resultado['senha']);
                unset($resultado['password_hash']);
                unset($resultado['refresh_token']);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $resultado,
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ]);
            }

            return;
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar usuário: '.$e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar usuário: '.$e->getMessage(),
            ]);

            return;
        }
    }

    /**
     * Criar novo usuário.
     */
    public function criar($dados)
    {
        try {
            // Validações
            if (empty($dados['nome'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Nome é obrigatório',
                ]);

                return;
            }

            if (empty($dados['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email é obrigatório',
                ]);

                return;
            }

            if (empty($dados['senha'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Senha é obrigatória',
                ]);

                return;
            }

            // Validar email
            if (!$this->security->isValidEmail($dados['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email inválido',
                ]);

                return;
            }

            // Validar senha forte
            if (!$this->security->isStrongPassword($dados['senha'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números',
                ]);

                return;
            }

            // Verificar se email já existe
            $usuario = new Usuario($this->database->conectar());
            if ($usuario->emailExiste($dados['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email já cadastrado',
                ]);

                return;
            }

            // Criar usuário
            $usuario->nome = $dados['nome'];
            $usuario->email = $dados['email'];
            $usuario->password_hash = $this->security->hashPassword($dados['senha']);
            $usuario->tipo = $dados['tipo'] ?? 'usuario';
            $usuario->ativo = $dados['ativo'] ?? 1;

            if ($usuario->criar()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuário criado com sucesso',
                    'data' => [
                        'id' => $usuario->id,
                        'nome' => $usuario->nome,
                        'email' => $usuario->email,
                    ],
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao criar usuário',
                ]);
            }

            return;
        } catch (Exception $e) {
            error_log('❌ Erro ao criar usuário: '.$e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao criar usuário: '.$e->getMessage(),
            ]);

            return;
        }
    }

    /**
     * Atualizar usuário.
     */
    public function atualizar($dados)
    {
        try {
            // Validações
            if (empty($dados['id']) || !is_numeric($dados['id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID é obrigatório',
                ]);

                return;
            }

            if (empty($dados['nome'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Nome é obrigatório',
                ]);

                return;
            }

            if (empty($dados['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email é obrigatório',
                ]);

                return;
            }

            // Validar email
            if (!$this->security->isValidEmail($dados['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email inválido',
                ]);

                return;
            }

            // Verificar se email já existe (exceto para o próprio usuário)
            $usuario = new Usuario($this->database->conectar());
            if ($usuario->emailExiste($dados['email'], $dados['id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email já cadastrado para outro usuário',
                ]);

                return;
            }

            // Atualizar
            $usuario->id = $dados['id'];
            $usuario->nome = $dados['nome'];
            $usuario->email = $dados['email'];
            $usuario->tipo = $dados['tipo'] ?? 'usuario';
            $usuario->ativo = $dados['ativo'] ?? 1;

            // Se enviou nova senha, atualizar
            if (!empty($dados['senha'])) {
                if (!$this->security->isStrongPassword($dados['senha'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números',
                    ]);

                    return;
                }

                $usuario->password_hash = $this->security->hashPassword($dados['senha']);
            }

            if ($usuario->atualizar()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuário atualizado com sucesso',
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao atualizar usuário',
                ]);
            }

            return;
        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar usuário: '.$e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao atualizar usuário: '.$e->getMessage(),
            ]);

            return;
        }
    }

    /**
     * Deletar usuário.
     */
    public function deletar($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID inválido',
                ]);

                return;
            }

            // Não permitir deletar próprio usuário
            // (verificar com dados do token se necessário)

            $usuario = new Usuario($this->database->conectar());
            $usuario->id = $id;

            if ($usuario->deletar()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuário excluído com sucesso',
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao excluir usuário',
                ]);
            }

            return;
        } catch (Exception $e) {
            error_log('❌ Erro ao excluir usuário: '.$e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao excluir usuário: '.$e->getMessage(),
            ]);

            return;
        }
    }

    /**
     * Obter estatísticas.
     */
    public function obterEstatisticas()
    {
        try {
            $usuario = new Usuario($this->database->conectar());
            $stats = $usuario->obterEstatisticas();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
            ]);

            return;
        } catch (Exception $e) {
            error_log('❌ Erro ao obter estatísticas: '.$e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao obter estatísticas: '.$e->getMessage(),
            ]);

            return;
        }
    }
}