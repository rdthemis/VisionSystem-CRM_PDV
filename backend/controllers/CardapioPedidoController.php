<?php

/**
 * CardapioPedidoController — recebe pedidos do Cardápio Digital
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
 * ------------------------------------------------------------
 *
 * Payload esperado (JSON) — exatamente o que o front envia:
 * {
 *   "origem": "cardapio_digital",
 *   "cliente": { "nome": "...", "telefone": "..." },
 *   "tipo": "entrega" | "retirada",
 *   "endereco": "..." | null,
 *   "pagamento": { "forma": "PIX", "troco_para": "50,00" | null },
 *   "itens": [
 *     { "produto_id": 1, "nome": "...", "qtd": 2, "preco_unit": 12.0,
 *       "obs": "..." | null,
 *       "adicionais": [ { "adicional_id": 1, "nome": "...", "preco": 3.0 } ] }
 *   ],
 *   "subtotal": 24.0, "taxa_entrega": 5.0, "total": 29.0
 * }
 *
 * Resposta de sucesso: { "sucesso": true, "pedido_id": 123 }
 *
 * ⚠ ADAPTAR: os nomes de tabelas/colunas marcados com TODO
 *   para bater com o schema real do VisionSystem.
 * ⚠ CORS: adicionar o domínio do cardápio (ex: cardapio.gelattomannia.com.br)
 *   na sua allowlist centralizada de CORS.
 */

class CardapioPedidoController
{
    private $db;
    private $database;

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

    public function criar(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $payload = json_decode(file_get_contents('php://input'), true);
        $erro = $this->validar($payload);
        if ($erro !== null) {
            http_response_code(422);
            echo json_encode(['sucesso' => false, 'erro' => $erro]);
            return;
        }

        // Segurança: recalcular valores no servidor — nunca confiar no front
        $subtotal = 0.0;
        foreach ($payload['itens'] as $item) {
            $precoItem = $this->precoProduto((int)$item['produto_id']);
            foreach ($item['adicionais'] ?? [] as $ad) {
                $precoItem += $this->precoAdicional((int)$ad['adicional_id']);
            }
            $subtotal += $precoItem * (int)$item['qtd'];
        }
        $taxa  = $payload['tipo'] === 'entrega' ? $this->taxaEntrega() : 0.0;
        $total = $subtotal + $taxa;

        try {
            $this->db->beginTransaction();

            // ---- Pedido (schema real do VisionSystem) -------------------
            $numeroPedido = $this->gerarNumeroPedido();
            $stmt = $this->db->prepare(
                "INSERT INTO pedidos
                   (numero_pedido, origem, tipo_pedido, status,
                    cliente_nome, cliente_telefone, tipo_cliente,
                    endereco_entrega, forma_pagamento, troco_para,
                    taxa_entrega, total, valor_pago)
                 VALUES
                   (:numero, 'cardapio_digital', :tipo, 'aberto',
                    :nome, :telefone, 'avulso',
                    :endereco, :forma, :troco,
                    :taxa, :total, 0.00)"
            );
            $stmt->execute([
                ':numero'   => $numeroPedido,
                ':tipo'     => $payload['tipo'] === 'entrega' ? 'entrega' : 'balcao',
                ':nome'     => trim($payload['cliente']['nome']),
                ':telefone' => trim($payload['cliente']['telefone']),
                ':endereco' => $payload['endereco'] ?? null,
                ':forma'    => $this->mapearPagamento($payload['pagamento']['forma']),
                ':troco'    => $payload['pagamento']['troco_para'] ?? null,
                ':taxa'     => $taxa,
                ':total'    => $total,
            ]);
            $pedidoId = (int)$this->db->lastInsertId();

            // ---- Itens + adicionais (schema real) ----------------------
            $stmtItem = $this->db->prepare(
                "INSERT INTO pedido_itens
                   (pedido_id, produto_id, quantidade, preco_unitario,
                    subtotal, observacoes, adicionais)
                 VALUES
                   (:pedido, :produto, :qtd, :preco,
                    :subtotal, :obs, :resumo_ads)"
            );
            $stmtAd = $this->db->prepare(
                "INSERT INTO pedidos_itens_adicionais
                   (item_id, adicional_id, quantidade, preco)
                 VALUES (:item, :adicional, 1, :preco)"
            );

            $itensComanda = [];
            foreach ($payload['itens'] as $item) {
                $qtdItem   = (int)$item['qtd'];
                $precoUnit = $this->precoProduto((int)$item['produto_id']);

                // Resolve os adicionais com preço do banco
                $ads = [];
                $somaAds = 0.0;
                foreach ($item['adicionais'] ?? [] as $ad) {
                    $p = $this->precoAdicional((int)$ad['adicional_id']);
                    $ads[] = [
                        'id'    => (int)$ad['adicional_id'],
                        'nome'  => (string)($ad['nome'] ?? ''),
                        'preco' => $p,
                    ];
                    $somaAds += $p;
                }

                // subtotal do item = (unitário + adicionais) x quantidade
                // TODO: confirmar se o PDV calcula assim ou sem adicionais
                $subtotalItem = ($precoUnit + $somaAds) * $qtdItem;

                // Coluna `adicionais` no MESMO formato JSON que o PDV grava
                // (a tela do pedido faz parse desse JSON para renderizar)
                $adicionaisJson = json_encode(
                    array_map(
                        fn($a) => [
                            'id'         => $a['id'],
                            'nome'       => $a['nome'],
                            'preco'      => $a['preco'],
                            'quantidade' => 1,
                        ],
                        $ads
                    ),
                    JSON_UNESCAPED_UNICODE
                );

                $stmtItem->execute([
                    ':pedido'     => $pedidoId,
                    ':produto'    => (int)$item['produto_id'],
                    ':qtd'        => $qtdItem,
                    // Convenção do PDV: preco_unitario JÁ inclui os adicionais
                    // (a tela calcula o total do item por preco_unitario x qtd)
                    ':preco'      => $precoUnit + $somaAds,
                    ':subtotal'   => $subtotalItem,
                    ':obs'        => $item['obs'] ?? null,
                    ':resumo_ads' => $adicionaisJson,
                ]);
                $itemId = (int)$this->db->lastInsertId();

                foreach ($ads as $a) {
                    $stmtAd->execute([
                        ':item'      => $itemId,
                        ':adicional' => $a['id'],
                        ':preco'     => $a['preco'],
                    ]);
                }

                // Item no formato do ComandaBuilder / print_comanda.php
                $itensComanda[] = [
                    'qtd'        => $qtdItem,
                    'descricao'  => (string)($item['nome'] ?? ('Produto ' . $item['produto_id'])),
                    'valor_unit' => $precoUnit,
                    'adicionais' => array_map(
                        fn($a) => ['descricao' => $a['nome'], 'valor' => $a['preco']],
                        $ads
                    ),
                    'observacao' => (string)($item['obs'] ?? ''),
                ];
            }

            $this->db->commit();

            // ---- Impressão automática na Bematech ----------------------
            // Reaproveita seu endpoint :8000/print_comanda.php (mesmo
            // contrato do PDV). Falha de impressão não derruba o pedido,
            // mas o motivo vai na resposta (campo `impressao`).
            $impressao = ['ok' => true, 'erro' => null];
            try {
                $troco = $payload['pagamento']['troco_para'] ?? null;
                $this->imprimirComanda([
                    'numero'        => $numeroPedido,
                    'origem_pedido' => 'Cardapio_Digital',
                    'tipo'          => $payload['tipo'] === 'entrega' ? 'delivery' : 'local',
                    'cliente'       => trim($payload['cliente']['nome']),
                    'telefone'      => trim($payload['cliente']['telefone']),
                    'endereco'      => $payload['endereco'] ?? '',
                    'itens'         => $itensComanda,
                    'valor_entrega' => $taxa,
                    'desconto'      => 0,
                    'pagamento'     => $payload['pagamento']['forma'],
                    'observacao'    => $troco ? "Troco para R$ {$troco}" : '',
                    'copias'        => 1,
                ]);
            } catch (Throwable $e) {
                $impressao = ['ok' => false, 'erro' => $e->getMessage()];
                Logger::warn("Falha ao imprimir pedido {$pedidoId}: " . $e->getMessage());
            }

            echo json_encode([
                'sucesso'       => true,
                'pedido_id'     => $pedidoId,
                'numero_pedido' => $numeroPedido,
                'impressao'     => $impressao,
            ]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            Logger::error('Erro ao gravar pedido do cardápio: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'erro' => 'Erro ao gravar o pedido.']);
        }
    }

    /* -------------------- Auxiliares -------------------- */

    private function validar(?array $p): ?string
    {
        if (!is_array($p)) return 'Payload inválido.';
        if (empty($p['cliente']['nome'])) return 'Nome do cliente é obrigatório.';
        if (empty($p['cliente']['telefone'])) return 'Telefone é obrigatório.';
        if (!in_array($p['tipo'] ?? '', ['entrega', 'retirada'], true))
            return 'Tipo deve ser entrega ou retirada.';
        if ($p['tipo'] === 'entrega' && empty($p['endereco']))
            return 'Endereço é obrigatório para entrega.';
        if (empty($p['pagamento']['forma'])) return 'Forma de pagamento é obrigatória.';
        if (empty($p['itens']) || !is_array($p['itens']))
            return 'O pedido precisa ter ao menos um item.';
        foreach ($p['itens'] as $i) {
            if (empty($i['produto_id']) || empty($i['qtd']) || (int)$i['qtd'] < 1)
                return 'Item inválido no pedido.';
        }
        return null;
    }

    /**
     * URL do seu endpoint de impressão existente.
     * TODO: confirmar host/porta — no PDV o hook usa http://localhost/api
     */
    private const PRINT_URL = 'http://localhost:8000/print_comanda.php';

    /**
     * Envia a comanda ao endpoint de impressão (mesmo contrato do PDV).
     * Lança exceção em falha — o chamador decide o que fazer (aqui, só loga).
     */
    private function imprimirComanda(array $dados): void
    {
        $ch = curl_init(self::PRINT_URL);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($dados, JSON_UNESCAPED_UNICODE),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $resposta = curl_exec($ch);
        $erroCurl = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($resposta === false) {
            throw new RuntimeException("Impressão: falha de conexão ({$erroCurl})");
        }
        $json = json_decode($resposta, true);
        if ($httpCode !== 200 || empty($json['success'])) {
            throw new RuntimeException(
                'Impressão: ' . ($json['message'] ?? "HTTP {$httpCode}")
            );
        };
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


    /**
     * Gera numero_pedido único (varchar 20).
     * Formato: CD + aammddHHMMSS + 2 dígitos aleatórios. Ex: CD26072419320457
     * TODO: se o PDV já tem uma regra de numeração, replicar aqui
     *       para manter a sequência consistente.
     */
    private function gerarNumeroPedido(): string
    {
        return 'CD' . date('ymdHis')
            . str_pad((string)random_int(0, 99), 2, '0', STR_PAD_LEFT);
    }

    /** Mapeia a forma do front para o enum do banco. */
    private function mapearPagamento(string $forma): string
    {
        return match (mb_strtolower(trim($forma))) {
            'pix'      => 'pix',
            'dinheiro' => 'dinheiro',
            // "Cartão na entrega": não dá pra saber débito/crédito antes
            // da maquininha — ajuste se preferir 'cartao_debito'.
            default    => 'cartao_credito',
        };
    }

    private function precoProduto(int $id): float
    {
        // TODO: ajustar tabela/coluna
        $s = $this->db->prepare("SELECT preco FROM produtos WHERE id = :id");
        $s->execute([':id' => $id]);
        $preco = $s->fetchColumn();
        if ($preco === false) {
            throw new RuntimeException("Produto {$id} não encontrado.");
        }
        return (float)$preco;
    }

    private function precoAdicional(int $id): float
    {
        // TODO: ajustar tabela/coluna
        $s = $this->db->prepare("SELECT preco FROM adicionais WHERE id = :id");
        $s->execute([':id' => $id]);
        $preco = $s->fetchColumn();
        if ($preco === false) {
            throw new RuntimeException("Adicional {$id} não encontrado.");
        }
        return (float)$preco;
    }

    private function taxaEntrega(): float
    {
        // TODO: buscar de configurações do sistema, se existir tabela.
        return 5.00;
    }
}
