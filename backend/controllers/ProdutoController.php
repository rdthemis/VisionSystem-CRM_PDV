<?php

// controllers/ProdutoController.php

require_once __DIR__.'/../config/Security.php';
require_once __DIR__.'/../models/Produto.php';
require_once __DIR__.'/../classes/ImageUploader.php';

class ProdutoController
{
    public $database;
    private $security;
    public $produto;
    private $imageUploader;

    public function __construct($database)
    {
        $this->database = $database;
        $this->security = new Security($database->getConnection());
        $this->produto = new Produto($this->database->getConnection());
        $this->imageUploader = new ImageUploader([
            'base_dir' => __DIR__.'/../public/uploads/produtos',
            'max_file_size' => 5 * 1024 * 1024,
            'img_width' => 600,
            'thumb_width' => 200,
            'jpeg_quality' => 80,
        ]);
    }

    public function processar()
    {
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->listar();
                break;
            case 'POST':
                $uri = $_SERVER['REQUEST_URI'] ?? '';
                if (strpos($uri, '/imagem') !== false) {
                    $this->uploadImagem();
                } else {
                    $this->criar();
                }
                break;
            case 'PUT':
                $this->atualizar();
                break;
            case 'DELETE':
                $uri = $_SERVER['REQUEST_URI'] ?? '';
                if (strpos($uri, '/imagem') !== false) {
                    $this->removerImagem();
                } else {
                    $this->deletar();
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Método não permitido']);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // LISTAR
    // ══════════════════════════════════════════════════════════════

    public function listar()
    {
        try {
            if (isset($_GET['id'])) {
                $produto = $this->produto->buscarPorId($_GET['id']);

                if ($produto) {
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'data' => $this->anexarUrlsImagem($produto),
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Produto não encontrado']);
                }
            } elseif (isset($_GET['categoria_id']) && $_GET['categoria_id'] !== '') {
                $produtos = $this->produto->buscarPorCategoria($_GET['categoria_id']);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => array_map([$this, 'anexarUrlsImagem'], $produtos),
                ]);
            } else {
                $produtos = $this->produto->buscarTodos();

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => array_map([$this, 'anexarUrlsImagem'], $produtos),
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao buscar produtos: '.$e->getMessage()]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // CRIAR
    // ══════════════════════════════════════════════════════════════

    public function criar()
    {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);

            if (empty($dados['nome'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nome é obrigatório']);

                return;
            }

            if (empty($dados['preco']) || !is_numeric($dados['preco'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Preço é obrigatório e deve ser numérico']);

                return;
            }

            if (empty($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Categoria é obrigatória']);

                return;
            }

            if (!$this->produto->categoriaExiste($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Categoria não encontrada']);

                return;
            }

            // Definir propriedades no Model
            $this->produto->nome = $dados['nome'];
            $this->produto->descricao = $dados['descricao'] ?? '';
            $this->produto->preco = $dados['preco'];
            $this->produto->categoria_id = $dados['categoria_id'];
            $this->produto->imagem = null;  // Começa sem imagem
            $this->produto->ativo = $dados['ativo'] ?? true;

            if (!$this->produto->criar()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erro ao criar produto']);

                return;
            }

            $produtoId = $this->produto->id;
            $nomeImagem = null;

            // 📸 Se veio imagem, processar upload e atualizar via Model
            if (!empty($dados['imagem_base64'])) {
                $nomeImagem = $this->processarUploadImagem(
                    $dados['imagem_base64'],
                    $dados['nome'],
                    $produtoId
                );
            }

            $resposta = [
                'success' => true,
                'message' => 'Produto criado com sucesso',
                'data' => ['id' => $produtoId],
            ];

            if ($nomeImagem) {
                $resposta['data']['imagem'] = $nomeImagem;
                $resposta['data']['imagem_url'] = $this->imageUploader->getImagemUrl($nomeImagem);
                $resposta['data']['thumb_url'] = $this->imageUploader->getThumbUrl($nomeImagem);
            }

            http_response_code(201);
            echo json_encode($resposta);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao criar produto: '.$e->getMessage()]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // ATUALIZAR
    // ══════════════════════════════════════════════════════════════

    public function atualizar()
    {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);

            if (empty($dados['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID é obrigatório']);

                return;
            }

            if (empty($dados['nome'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nome é obrigatório']);

                return;
            }

            if (empty($dados['preco']) || !is_numeric($dados['preco'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Preço é obrigatório e deve ser numérico']);

                return;
            }

            if (empty($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Categoria é obrigatória']);

                return;
            }

            if (!$this->produto->categoriaExiste($dados['categoria_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Categoria não encontrada']);

                return;
            }

            // Buscar produto atual pra manter a imagem existente
            $produtoAtual = $this->produto->buscarPorId($dados['id']);

            // Definir propriedades no Model
            $this->produto->id = $dados['id'];
            $this->produto->nome = $dados['nome'];
            $this->produto->descricao = $dados['descricao'] ?? '';
            $this->produto->preco = $dados['preco'];
            $this->produto->categoria_id = $dados['categoria_id'];
            $this->produto->imagem = $produtoAtual['imagem'] ?? null; // Manter imagem atual
            $this->produto->ativo = $dados['ativo'] ?? true;

            // 📸 Se veio imagem nova, processar e atualizar a propriedade
            if (!empty($dados['imagem_base64'])) {
                $nomeImagem = $this->processarUploadImagem(
                    $dados['imagem_base64'],
                    $dados['nome'],
                    intval($dados['id']),
                    $produtoAtual['imagem'] ?? null
                );

                if ($nomeImagem) {
                    $this->produto->imagem = $nomeImagem;
                }
            }

            if ($this->produto->atualizar()) {
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Produto atualizado com sucesso']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erro ao atualizar produto']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao atualizar produto: '.$e->getMessage()]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // DELETAR
    // ══════════════════════════════════════════════════════════════

    public function deletar()
    {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);

            if (empty($dados['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID é obrigatório']);

                return;
            }

            // 📸 Buscar imagem antes de deletar
            $produtoAtual = $this->produto->buscarPorId($dados['id']);

            $this->produto->id = $dados['id'];

            if ($this->produto->deletar()) {
                // Remover arquivos de imagem do disco
                if (!empty($produtoAtual['imagem'])) {
                    $this->imageUploader->remover($produtoAtual['imagem']);
                }

                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Produto excluído com sucesso']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Erro ao excluir produto']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao excluir produto: '.$e->getMessage()]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // UPLOAD AVULSO DE IMAGEM
    // POST /produtos/imagem  { produto_id, imagem_base64 }
    // ══════════════════════════════════════════════════════════════

    public function uploadImagem()
    {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);

            $produtoId = intval($dados['produto_id'] ?? 0);
            $base64Data = $dados['imagem_base64'] ?? null;

            if (!$produtoId || !$base64Data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Envie produto_id e imagem_base64.']);

                return;
            }

            // Buscar produto via Model
            $produto = $this->produto->buscarPorId($produtoId);
            if (!$produto) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Produto não encontrado.']);

                return;
            }

            // Processar upload
            $nomeImagem = $this->processarUploadImagem(
                $base64Data,
                $produto['nome'],
                $produtoId,
                $produto['imagem'] ?? null
            );

            if (!$nomeImagem) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Erro ao processar imagem.']);

                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Imagem enviada com sucesso!',
                'data' => [
                    'filename' => $nomeImagem,
                    'imagem_url' => $this->imageUploader->getImagemUrl($nomeImagem),
                    'thumb_url' => $this->imageUploader->getThumbUrl($nomeImagem),
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro no upload: '.$e->getMessage()]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // REMOVER IMAGEM (sem deletar o produto)
    // DELETE /produtos/imagem  { produto_id }
    // ══════════════════════════════════════════════════════════════

    public function removerImagem()
    {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);
            $produtoId = intval($dados['produto_id'] ?? 0);

            if (!$produtoId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Informe o produto_id.']);

                return;
            }

            $produto = $this->produto->buscarPorId($produtoId);
            if (!$produto) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Produto não encontrado.']);

                return;
            }

            if (empty($produto['imagem'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Produto não possui imagem.']);

                return;
            }

            // 📸 Remover arquivos do disco
            $this->imageUploader->remover($produto['imagem']);

            // 📸 Limpar campo no banco VIA MODEL
            $this->produto->removerImagem($produtoId);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Imagem removida com sucesso!']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao remover imagem: '.$e->getMessage()]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // HELPER: Processa upload e atualiza banco via Model
    // Centraliza a lógica de upload em um único lugar
    // ══════════════════════════════════════════════════════════════

    private function processarUploadImagem(string $base64Data, string $nomeProduto, int $produtoId, ?string $imagemAnterior = null): ?string
    {
        $resultado = $this->imageUploader->uploadBase64(
            $base64Data,
            $nomeProduto,
            $produtoId,
            $imagemAnterior
        );

        if (!$resultado['success']) {
            return null;
        }

        // 📸 Atualizar banco VIA MODEL (não mais query direta)
        $this->produto->atualizarImagem($produtoId, $resultado['filename']);

        return $resultado['filename'];
    }

    // ══════════════════════════════════════════════════════════════
    // HELPER: Anexa URLs de imagem ao array do produto
    // ══════════════════════════════════════════════════════════════

    private function anexarUrlsImagem(array $produto): array
    {
        if (!empty($produto['imagem'])) {
            $produto['imagem_url'] = $this->imageUploader->getImagemUrl($produto['imagem']);
            $produto['thumb_url'] = $this->imageUploader->getThumbUrl($produto['imagem']);
        } else {
            $produto['imagem_url'] = null;
            $produto['thumb_url'] = null;
        }

        return $produto;
    }
}
