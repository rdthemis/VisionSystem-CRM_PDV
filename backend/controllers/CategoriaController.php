<?php

// controllers/CategoriaController.php
require_once '../src/database.php';
require_once '../models/Categoria.php';

require_once './cors.php';

class CategoriaController
{
    public $database;
    public $db;
    public $categoria;

    public function __construct()
    {
        $this->database = new Database();
        $this->db = $this->database->conectar();
        $this->categoria = new Categoria($this->db);
    }

    public function processar()
    {
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->listar();
                break;
            case 'POST':
                $this->criar();
                break;
            case 'PUT':
                $this->atualizar();
                break;
            case 'DELETE':
                $this->deletar();
                break;
            default:
                sendErrorResponse('Método não permitido', 405);
        }
    }

    public function listar()
{
    try {
        // Se tem ID na URL, busca específica
        if (isset($_GET['id'])) {
            $categoria = $this->categoria->buscarPorId($_GET['id']);
            
            if ($categoria) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $categoria
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Categoria não encontrada'
                ]);
            }
        } else {
            // Busca todas as categorias
            $categorias = $this->categoria->buscarTodas();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $categorias
            ]);
        }
        
        return; // ✅ IMPORTANTE: encerrar função
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao buscar categorias: ' . $e->getMessage()
        ]);
        return;
    }
}

    public function criar()
    {
        try {
            // Pegar dados do POST
            $dados = json_decode(file_get_contents('php://input'), true);

            // Validar dados obrigatórios
            if (empty($dados['nome'])) {
                sendErrorResponse('Nome é obrigatório', 400);
            }

            // Definir propriedades
            $this->categoria->nome = $dados['nome'];
            $this->categoria->descricao = $dados['descricao'] ?? '';
            $this->categoria->ativo = $dados['ativo'] ?? true;

            // Criar categoria
            if ($this->categoria->criar()) {
                sendJsonResponse([
                    'message' => 'Categoria criada com sucesso',
                    'id' => $this->categoria->id,
                ], 201);
            } else {
                sendErrorResponse('Erro ao criar categoria', 500);
            }
        } catch (Exception $e) {
            sendErrorResponse('Erro ao criar categoria: '.$e->getMessage(), 500);
        }
    }

    public function atualizar()
    {
        try {
            // Pegar dados do PUT
            $dados = json_decode(file_get_contents('php://input'), true);

            // Validar dados obrigatórios
            if (empty($dados['id']) || empty($dados['nome'])) {
                sendErrorResponse('ID e nome são obrigatórios', 400);
            }

            // Definir propriedades
            $this->categoria->id = $dados['id'];
            $this->categoria->nome = $dados['nome'];
            $this->categoria->descricao = $dados['descricao'] ?? '';
            $this->categoria->ativo = $dados['ativo'] ?? true;

            // Atualizar categoria
            if ($this->categoria->atualizar()) {
                sendJsonResponse(['message' => 'Categoria atualizada com sucesso']);
            } else {
                sendErrorResponse('Erro ao atualizar categoria', 500);
            }
        } catch (Exception $e) {
            sendErrorResponse('Erro ao atualizar categoria: '.$e->getMessage(), 500);
        }
    }

    public function deletar()
    {
        try {
            // Pegar dados do DELETE
            $dados = json_decode(file_get_contents('php://input'), true);

            // Validar ID
            if (empty($dados['id'])) {
                sendErrorResponse('ID é obrigatório', 400);
            }

            $this->categoria->id = $dados['id'];

            // Deletar categoria
            if ($this->categoria->deletar()) {
                sendJsonResponse(['message' => 'Categoria excluída com sucesso']);
            } else {
                sendErrorResponse('Erro ao excluir categoria', 500);
            }
        } catch (Exception $e) {
            sendErrorResponse('Erro ao excluir categoria: '.$e->getMessage(), 500);
        }
    }
}
// ❌ REMOVER ESTAS LINHAS - execução automática causa conflito!
// $controller = new CategoriaController();
// $controller->processar();

// ✅ ADICIONAR: Só executar se chamado diretamente
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    $controller = new CategoriaController();
    $controller->processar();
}