<?php

// controllers/ZonaEntregaController.php

require_once __DIR__.'/../models/ZonaEntrega.php';

class ZonaEntregaController
{
    private $database;

    public function __construct($database)
    {
        $this->database = $database;
    }

    /**
     * Buscar todas as zonas
     */
    public function buscarTodas($apenasAtivas = false)
    {
        try {
            $zona = new ZonaEntrega($this->database->conectar());
            $resultado = $zona->buscarTodas($apenasAtivas);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $resultado
            ]);
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao buscar zonas: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar zonas: ' . $e->getMessage()
            ]);
            return;
        }
    }

    /**
     * Buscar zona por ID
     */
    public function buscarPorId($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID inválido'
                ]);
                return;
            }

            $zona = new ZonaEntrega($this->database->conectar());
            $resultado = $zona->buscarPorId($id);

            if ($resultado) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $resultado
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Zona não encontrada'
                ]);
            }
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao buscar zona: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar zona: ' . $e->getMessage()
            ]);
            return;
        }
    }

    /**
     * Criar nova zona
     */
    public function criar($dados)
    {
        try {
            // Validações
            if (empty($dados['nome'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Nome da zona é obrigatório'
                ]);
                return;
            }

            if (!isset($dados['valor']) || !is_numeric($dados['valor'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valor da taxa é obrigatório e deve ser numérico'
                ]);
                return;
            }

            $zona = new ZonaEntrega($this->database->conectar());
            $zona->nome = $dados['nome'];
            $zona->valor = $dados['valor'];
            $zona->descricao = $dados['descricao'] ?? '';
            $zona->ativo = $dados['ativo'] ?? 1;

            if ($zona->criar()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Zona criada com sucesso',
                    'data' => ['id' => $zona->id]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao criar zona'
                ]);
            }
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao criar zona: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao criar zona: ' . $e->getMessage()
            ]);
            return;
        }
    }

    /**
     * Atualizar zona
     */
    public function atualizar($dados)
    {
        try {
            // Validações
            if (empty($dados['id']) || !is_numeric($dados['id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID é obrigatório'
                ]);
                return;
            }

            if (empty($dados['nome'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Nome da zona é obrigatório'
                ]);
                return;
            }

            if (!isset($dados['valor']) || !is_numeric($dados['valor'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valor da taxa é obrigatório e deve ser numérico'
                ]);
                return;
            }

            $zona = new ZonaEntrega($this->database->conectar());
            $zona->id = $dados['id'];
            $zona->nome = $dados['nome'];
            $zona->valor = $dados['valor'];
            $zona->descricao = $dados['descricao'] ?? '';
            $zona->ativo = $dados['ativo'] ?? 1;

            if ($zona->atualizar()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Zona atualizada com sucesso'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao atualizar zona'
                ]);
            }
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar zona: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao atualizar zona: ' . $e->getMessage()
            ]);
            return;
        }
    }

    /**
     * Deletar zona
     */
    public function deletar($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID inválido'
                ]);
                return;
            }

            $zona = new ZonaEntrega($this->database->conectar());
            $zona->id = $id;

            if ($zona->deletar()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Zona excluída com sucesso'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao excluir zona'
                ]);
            }
            return;

        } catch (Exception $e) {
            error_log('❌ Erro ao excluir zona: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao excluir zona: ' . $e->getMessage()
            ]);
            return;
        }
    }
}
