<?php

require_once __DIR__ . '/../config/Database.php';

/**
 * ImpressaoController — fila de impressão para o agente local da loja.
 * ------------------------------------------------------------------
 * O backend roda no Railway e não tem mais acesso direto à impressora
 * Bematech (fica fisicamente na loja). Em vez de o backend "empurrar"
 * a comanda para um endpoint local (modelo antigo, inviável sem IP
 * público/túnel), o agente Python que roda no PC da loja é quem
 * periodicamente "busca" (poll) os pedidos pendentes aqui e confirma
 * quando termina de imprimir.
 *
 * Rotas (ver public/index.php):
 *   GET  /impressao/pendentes      -> lista pedidos aguardando impressão
 *   POST /impressao/{id}/concluir  -> marca pedido como impresso
 *   POST /impressao/{id}/erro      -> registra falha e devolve para a fila
 *
 * Autenticação: header "X-Agent-Token" comparado contra a env
 * PRINT_AGENT_TOKEN (ver AuthMiddleware::verificarAgenteImpressao()).
 * Não é o mesmo JWT dos usuários — é um segredo único, fixo, só para
 * essa máquina da loja.
 */
class ImpressaoController
{
    public $database;
    public $db;

    /** Depois de quantas falhas consecutivas desistimos de tentar de novo. */
    private const MAX_TENTATIVAS = 5;

    /** Job "processando" por mais que isso é considerado travado (agente caiu). */
    private const TIMEOUT_PROCESSANDO_MINUTOS = 3;

    public function __construct()
    {
        $this->database = new Database();
        $this->db = $this->database->getConnection();
    }

    /**
     * GET /impressao/pendentes
     * Retorna até 20 pedidos pendentes, já marcando-os como "processando"
     * para que uma segunda chamada (ex.: o agente rodando duas vezes por
     * engano) não pegue e imprima o mesmo pedido de novo.
     */
    public function pendentes(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            // Destrava jobs que ficaram "processando" (agente reiniciou,
            // caiu a internet etc.) há mais tempo do que o esperado.
            $this->db->prepare(
                "UPDATE pedidos
                    SET status_impressao = 'pendente'
                  WHERE status_impressao = 'processando'
                    AND impressao_atualizada_em < (NOW() - INTERVAL " . self::TIMEOUT_PROCESSANDO_MINUTOS . " MINUTE)"
            )->execute();

            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                "SELECT id FROM pedidos
                  WHERE status_impressao = 'pendente'
                  ORDER BY id ASC
                  LIMIT 20
                    FOR UPDATE"
            );
            $stmt->execute();
            $ids = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id');

            if (empty($ids)) {
                $this->db->commit();
                echo json_encode(['success' => true, 'pedidos' => []]);
                return;
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $this->db->prepare(
                "UPDATE pedidos
                    SET status_impressao = 'processando', impressao_atualizada_em = NOW()
                  WHERE id IN ({$placeholders})"
            )->execute($ids);

            $this->db->commit();

            $pedidos = array_map(fn($id) => $this->montarPedido($id), $ids);

            echo json_encode(['success' => true, 'pedidos' => $pedidos], JSON_UNESCAPED_UNICODE);
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('❌ Erro ao buscar fila de impressão: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao buscar fila de impressão']);
        }
    }

    /**
     * POST /impressao/{id}/concluir
     */
    public function concluir(int $id): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $stmt = $this->db->prepare(
                "UPDATE pedidos
                    SET status_impressao = 'impressa',
                        impresso_em = NOW(),
                        impressao_atualizada_em = NOW(),
                        erro_impressao = NULL
                  WHERE id = :id"
            );
            $stmt->execute([':id' => $id]);

            echo json_encode(['success' => true]);
        } catch (Throwable $e) {
            error_log("❌ Erro ao confirmar impressão do pedido {$id}: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao confirmar impressão']);
        }
    }

    /**
     * POST /impressao/{id}/erro
     * Body opcional: { "mensagem": "texto do erro" }
     * Depois de MAX_TENTATIVAS falhas consecutivas, para de tentar
     * automaticamente (status_impressao = 'erro') — precisa de ação manual.
     */
    public function erro(int $id): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        $mensagem = (string)($payload['mensagem'] ?? 'Erro não informado pelo agente');

        try {
            $stmt = $this->db->prepare(
                'SELECT tentativas_impressao FROM pedidos WHERE id = :id'
            );
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row === false) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Pedido não encontrado']);
                return;
            }

            $tentativas = (int)$row['tentativas_impressao'] + 1;
            $novoStatus = $tentativas >= self::MAX_TENTATIVAS ? 'erro' : 'pendente';

            $stmt = $this->db->prepare(
                "UPDATE pedidos
                    SET status_impressao = :status,
                        tentativas_impressao = :tentativas,
                        erro_impressao = :mensagem,
                        impressao_atualizada_em = NOW()
                  WHERE id = :id"
            );
            $stmt->execute([
                ':status'     => $novoStatus,
                ':tentativas' => $tentativas,
                ':mensagem'   => mb_substr($mensagem, 0, 255),
                ':id'         => $id,
            ]);

            echo json_encode([
                'success'          => true,
                'vai_tentar_de_novo' => $novoStatus === 'pendente',
                'tentativas'       => $tentativas,
            ]);
        } catch (Throwable $e) {
            error_log("❌ Erro ao registrar falha de impressão do pedido {$id}: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao registrar falha de impressão']);
        }
    }

    /**
     * Monta o payload de um pedido no mesmo formato que o ComandaBuilder
     * já usava (ver backend/ComandaBuilder.php e CardapioPedidoController),
     * para o agente local formatar a comanda da mesma forma de sempre.
     */
    private function montarPedido(int $id): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, numero_pedido, origem, tipo_pedido, cliente_nome, cliente_telefone,
                    endereco_entrega, forma_pagamento, troco_para, taxa_entrega, total,
                    created_at
               FROM pedidos
              WHERE id = :id'
        );
        $stmt->execute([':id' => $id]);
        $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmtItens = $this->db->prepare(
            'SELECT produto_id, quantidade, preco_unitario, observacoes, adicionais
               FROM pedido_itens
              WHERE pedido_id = :id
              ORDER BY id ASC'
        );
        $stmtItens->execute([':id' => $id]);
        $linhasItens = $stmtItens->fetchAll(PDO::FETCH_ASSOC);

        $itens = array_map(function ($item) {
            $adicionais = json_decode($item['adicionais'] ?? '[]', true) ?: [];

            return [
                'qtd'        => (int)$item['quantidade'],
                'descricao'  => $this->nomeProduto((int)$item['produto_id']),
                'valor_unit' => (float)$item['preco_unitario'],
                'observacao' => (string)($item['observacoes'] ?? ''),
                'adicionais' => array_map(
                    fn($a) => ['descricao' => (string)($a['nome'] ?? ''), 'valor' => (float)($a['preco'] ?? 0)],
                    $adicionais
                ),
            ];
        }, $linhasItens);

        return [
            'id'             => (int)$pedido['id'],
            'numero'         => $pedido['numero_pedido'],
            'origem_pedido'  => $pedido['origem'],
            'tipo_pedido'    => $pedido['tipo_pedido'],
            'cliente'        => $pedido['cliente_nome'],
            'telefone'       => $pedido['cliente_telefone'],
            'endereco'       => $pedido['endereco_entrega'],
            'pagamento'      => $pedido['forma_pagamento'],
            'troco_para'     => $pedido['troco_para'],
            'valor_entrega'  => (float)$pedido['taxa_entrega'],
            'total'          => (float)$pedido['total'],
            'data'           => $pedido['created_at'],
            'itens'          => $itens,
        ];
    }

    /** Cache simples em memória da requisição — evita 1 SELECT por item repetido. */
    private array $nomesProdutoCache = [];

    private function nomeProduto(int $id): string
    {
        if (isset($this->nomesProdutoCache[$id])) {
            return $this->nomesProdutoCache[$id];
        }

        $stmt = $this->db->prepare('SELECT nome FROM produtos WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $nome = $stmt->fetchColumn();

        return $this->nomesProdutoCache[$id] = $nome !== false ? (string)$nome : "Produto {$id}";
    }
}
