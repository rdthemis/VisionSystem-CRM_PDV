<?php

/**
 * CardapioController — rotas PÚBLICAS de leitura para o Cardápio Digital
 * ---------------------------------------------------------------------
 * Registrar no index.php FORA do middleware JWT:
 *   GET /cardapio/categorias  -> CardapioController::categorias()
 *   GET /cardapio/produtos    -> CardapioController::produtos()
 *   GET /cardapio/adicionais  -> CardapioController::adicionais()
 *   POST /cardapio/pedidos    -> CardapioPedidoController::criar()  (também público)
 *
 * Expõe apenas o necessário pro cliente: nada de custo, estoque,
 * margem ou dados internos.
 *
 * ⚠ TODO: ajustar nomes de tabelas/colunas ao schema real.
 *   Se existir flag de ativo/visível (ex: `ativo` ou `disponivel`),
 *   descomentar os WHERE correspondentes.
 */

require_once '../config/Database.php';

class CardapioController
{
    public $database;
    public $db;

    public function __construct()
    {
        $this->database = new Database();
        $this->db = $this->database->getConnection();
    }

    private function json(array $dados): void
    {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    }

    public function categorias(): void
    {
        // TODO: ajustar tabela/colunas
        $rows = $this->db->query(
            "SELECT id, nome
               FROM categorias
              WHERE ativo = 1
              ORDER BY nome"
        )->fetchAll(PDO::FETCH_ASSOC);

        $this->json(array_map(fn($r) => [
            'id'   => (int)$r['id'],
            'nome' => $r['nome'],
        ], $rows));
    }

    public function produtos(): void
    {
        // TODO: ajustar tabela/colunas (categoria_id, descricao...)
        $rows = $this->db->query(
            "SELECT id, categoria_id, nome, descricao, preco
               FROM produtos
              WHERE ativo = 1
              ORDER BY nome"
        )->fetchAll(PDO::FETCH_ASSOC);

        // Vínculo por CATEGORIA: o produto herda os adicionais
        // cuja categoria_id é a mesma do produto.
        // TODO: confirmar nome da coluna em `adicionais` (categoria_id)
        $vinculos = [];
        $v = $this->db->query(
            "SELECT id, categoria_id FROM adicionais
              WHERE ativo = 1"
        )->fetchAll(PDO::FETCH_ASSOC);
        foreach ($v as $row) {
            $vinculos[(int)$row['categoria_id']][] = (int)$row['id'];
        }

        $this->json(array_map(fn($r) => [
            'id'           => (int)$r['id'],
            'categoriaId'  => (int)$r['categoria_id'],
            'nome'         => $r['nome'],
            'descricao'    => $r['descricao'] ?? '',
            'preco'        => (float)$r['preco'],
            'adicionaisIds' => $vinculos[(int)$r['categoria_id']] ?? [],
        ], $rows));
    }

    public function zonas(): void
    {
        // TODO: confirmar nome da tabela (assumi `zonas_entrega`) e da
        // 5ª coluna (assumi `ativo` — todas as linhas estão com 1)
        $rows = $this->db->query(
            "SELECT id, nome, valor, descricao
               FROM zonas_entrega
              ORDER BY valor, nome"
        )->fetchAll(PDO::FETCH_ASSOC);

        $this->json(array_map(fn($r) => [
            'id'        => (int)$r['id'],
            'nome'      => $r['nome'],
            'taxa'      => (float)$r['valor'],
            'descricao' => $r['descricao'] ?? '',
        ], $rows));
    }

    public function adicionais(): void
    {
        // TODO: ajustar tabela/colunas
        $rows = $this->db->query(
            "SELECT id, nome, preco
               FROM adicionais
              WHERE ativo = 1
              ORDER BY nome"
        )->fetchAll(PDO::FETCH_ASSOC);

        $this->json(array_map(fn($r) => [
            'id'    => (int)$r['id'],
            'nome'  => $r['nome'],
            'preco' => (float)$r['preco'],
        ], $rows));
    }
}
