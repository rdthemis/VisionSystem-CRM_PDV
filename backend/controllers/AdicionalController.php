<?php
// controllers/AdicionalController.php
require_once __DIR__.'/../models/Adicional.php';

class AdicionalController
{
    private $db;
    private $adicional;

    public function __construct($database)
    {
        $this->db = $database->conectar();
        $this->adicional = new Adicional($this->db);
    }

    // Listar adicionais
    public function listar($id = null)
    {
        try {
            // Se tem ID, busca específico
            if ($id) {
                $adicional = $this->adicional->buscarPorId($id);
                if ($adicional) {
                    return [
                        'success' => true,
                        'data' => $adicional
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Adicional não encontrado'
                    ];
                }
            }

            // Se tem categoria_id, filtra por categoria
            if (isset($_GET['categoria_id']) && !empty($_GET['categoria_id'])) {
                $adicionais = $this->adicional->buscarPorCategoria($_GET['categoria_id']);
            } else {
                // Busca todos
                $adicionais = $this->adicional->buscarTodos();
            }

            return [
                'success' => true,
                'data' => $adicionais
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao buscar adicionais: ' . $e->getMessage()
            ];
        }
    }

    // Criar adicional
    public function criar($dados)
    {
        try {
            // Validar dados obrigatórios
            if (empty($dados['nome'])) {
                return [
                    'success' => false,
                    'message' => 'Nome é obrigatório'
                ];
            }

            if (empty($dados['preco']) || !is_numeric($dados['preco'])) {
                return [
                    'success' => false,
                    'message' => 'Preço válido é obrigatório'
                ];
            }

            if (empty($dados['categoria_id'])) {
                return [
                    'success' => false,
                    'message' => 'Categoria é obrigatória'
                ];
            }

            // Definir propriedades
            $this->adicional->nome = $dados['nome'];
            $this->adicional->descricao = $dados['descricao'] ?? '';
            $this->adicional->preco = $dados['preco'];
            $this->adicional->categoria_id = $dados['categoria_id'];
            $this->adicional->ativo = isset($dados['ativo']) ? $dados['ativo'] : true;

            // Criar adicional
            if ($this->adicional->criar()) {
                return [
                    'success' => true,
                    'message' => 'Adicional criado com sucesso',
                    'data' => [
                        'id' => $this->adicional->id
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao criar adicional'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao criar adicional: ' . $e->getMessage()
            ];
        }
    }

    // Atualizar adicional
    public function atualizar($dados)
    {
        try {
            // Validar dados obrigatórios
            if (empty($dados['id'])) {
                return [
                    'success' => false,
                    'message' => 'ID é obrigatório'
                ];
            }

            if (empty($dados['nome'])) {
                return [
                    'success' => false,
                    'message' => 'Nome é obrigatório'
                ];
            }

            if (empty($dados['preco']) || !is_numeric($dados['preco'])) {
                return [
                    'success' => false,
                    'message' => 'Preço válido é obrigatório'
                ];
            }

            if (empty($dados['categoria_id'])) {
                return [
                    'success' => false,
                    'message' => 'Categoria é obrigatória'
                ];
            }

            // Definir propriedades
            $this->adicional->id = $dados['id'];
            $this->adicional->nome = $dados['nome'];
            $this->adicional->descricao = $dados['descricao'] ?? '';
            $this->adicional->preco = $dados['preco'];
            $this->adicional->categoria_id = $dados['categoria_id'];
            $this->adicional->ativo = isset($dados['ativo']) ? $dados['ativo'] : true;

            // Atualizar adicional
            if ($this->adicional->atualizar()) {
                return [
                    'success' => true,
                    'message' => 'Adicional atualizado com sucesso'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao atualizar adicional'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao atualizar adicional: ' . $e->getMessage()
            ];
        }
    }

    // Deletar adicional
    public function deletar($id)
    {
        try {
            if (empty($id)) {
                return [
                    'success' => false,
                    'message' => 'ID é obrigatório'
                ];
            }

            $this->adicional->id = $id;

            // Deletar adicional (soft delete)
            if ($this->adicional->deletar()) {
                return [
                    'success' => true,
                    'message' => 'Adicional excluído com sucesso'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao excluir adicional'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao excluir adicional: ' . $e->getMessage()
            ];
        }
    }
}