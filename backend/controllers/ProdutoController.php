<?php

// controllers/ProdutoController.php

require_once __DIR__.'/../models/Produto.php';

class ProdutoController
{
    public $database;
    public $db;
    public $produto;

    public function __construct($database)
    {
        $this->database = $database;
        $this->db = $database->conectar();
        $this->produto = new Produto($this->db);
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
                http_response_code(405);
                echo json_encode([
                    'success' => false,
                    'message' => 'Método não permitido',
                ]);
        }
    }

    public function listar()
    {
        try {
            // Se tem ID na URL, busca produto específico
            if (isset($_GET['id'])) {
                $produto = $this->produto->buscarPorId($_GET['id']);

                if ($produto) {
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'data' => $produto,
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Produto não encontrado',
                    ]);
                }

            // ✅ ADICIONADO: Se tem categoria_id, filtra por categoria
            } elseif (isset($_GET['categoria_id']) && $_GET['categoria_id'] !== '') {
                $produtos = $this->produto->buscarPorCategoria($_GET['categoria_id']);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $produtos,
                ]);
            } else {
                // Busca todos os produtos
                $produtos = $this->produto->buscarTodos();

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $produtos,
                ]);
            }

            return;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao buscar produtos: '.$e->getMessage(),
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
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Nome é obrigatório',
                ]);

                return;
            }

            if (empty($dados['preco']) || !is_numeric($dados['preco'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Preço é obrigatório e deve ser numérico',
                ]);

                return;
            }

            if (empty($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Categoria é obrigatória',
                ]);

                return;
            }

            // Verificar se categoria existe
            if (!$this->produto->categoriaExiste($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Categoria não encontrada',
                ]);

                return;
            }

            // Definir propriedades
            $this->produto->nome = $dados['nome'];
            $this->produto->descricao = $dados['descricao'] ?? '';
            $this->produto->preco = $dados['preco'];
            $this->produto->categoria_id = $dados['categoria_id'];
            $this->produto->ativo = $dados['ativo'] ?? true;

            // Criar produto
            if ($this->produto->criar()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Produto criado com sucesso',
                    'data' => [
                        'id' => $this->produto->id,
                    ],
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao criar produto',
                ]);
            }

            return;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao criar produto: '.$e->getMessage(),
            ]);

            return;
        }
    }

    public function atualizar()
    {
        try {
            // Pegar dados do PUT
            $dados = json_decode(file_get_contents('php://input'), true);

            // Validar dados obrigatórios
            if (empty($dados['id'])) {
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

            if (empty($dados['preco']) || !is_numeric($dados['preco'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Preço é obrigatório e deve ser numérico',
                ]);

                return;
            }

            if (empty($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Categoria é obrigatória',
                ]);

                return;
            }

            // Verificar se categoria existe
            if (!$this->produto->categoriaExiste($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Categoria não encontrada',
                ]);

                return;
            }

            // Definir propriedades
            $this->produto->id = $dados['id'];
            $this->produto->nome = $dados['nome'];
            $this->produto->descricao = $dados['descricao'] ?? '';
            $this->produto->preco = $dados['preco'];
            $this->produto->categoria_id = $dados['categoria_id'];
            $this->produto->ativo = $dados['ativo'] ?? true;

            // Atualizar produto
            if ($this->produto->atualizar()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Produto atualizado com sucesso',
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao atualizar produto',
                ]);
            }

            return;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao atualizar produto: '.$e->getMessage(),
            ]);

            return;
        }
    }

    public function deletar()
    {
        try {
            // Pegar dados do DELETE
            $dados = json_decode(file_get_contents('php://input'), true);

            // Validar ID
            if (empty($dados['id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID é obrigatório',
                ]);

                return;
            }

            $this->produto->id = $dados['id'];

            // Deletar produto
            if ($this->produto->deletar()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Produto excluído com sucesso',
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao excluir produto',
                ]);
            }

            return;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao excluir produto: '.$e->getMessage(),
            ]);

            return;
        }
    }
}
// ✅ SEM capturar ou ecoar retorno
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    $controller = new ProdutoController($db);
    $controller->processar(); // ✅ só executa, sem echo
}