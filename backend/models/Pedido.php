<?php

// models/Pedido.php

class Pedido
{
    private $conn;
    private $table_pedidos = 'pedidos';
    private $table_itens = 'pedido_itens';

    // Propriedades do pedido
    public $id;
    public $cliente_id;
    public $cliente_nome;
    public $numero_pedido;
    public $total;
    public $status;
    public $forma_pagamento;
    public $tipo_pedido;
    public $origem; // Novo campo para origem do pedido (PDV, App, etc.)    
    public $endereco_entrega;
    public $taxa_entrega;
    public $zona_entrega_id;
    public $created_at;
    public $updated_at;
    public $itens; // Array de itens do pedido

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Gerar número único do pedido
    private function gerarNumeroPedido()
    {
        return 'PED' . date('ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Buscar todos os pedidos com informações resumidas
    // 🔧 ATUALIZAR: Método para buscar pedidos com informações de cliente
    public function buscarTodos($status = null)
    {
        $whereClause = '';
        // Uma comanda com pagamento parcial ainda está "aberta" na prática —
        // continua aguardando o restante do pagamento — então uma busca por
        // 'aberto' também deve trazer as 'parcial', senão ela some da lista
        // assim que recebe a primeira parcela.
        $statusFiltro = $status === 'aberto' ? ['aberto', 'parcial'] : ($status ? [$status] : []);

        if (!empty($statusFiltro)) {
            $placeholders = implode(',', array_fill(0, count($statusFiltro), '?'));
            $whereClause = "WHERE p.status IN ($placeholders)";
        }

        $query = 'SELECT
                p.id, p.numero_pedido, p.origem, p.total, p.valor_pago, p.status,
                p.forma_pagamento, p.taxa_entrega, p.created_at, p.updated_at,
                p.cliente_id, p.cliente_nome, p.tipo_cliente,
                COUNT(pi.id) as total_itens
              FROM ' . $this->table_pedidos . ' p
              LEFT JOIN ' . $this->table_itens . " pi ON p.id = pi.pedido_id
              $whereClause
              GROUP BY p.id, p.numero_pedido, p.origem, p.total, p.valor_pago, p.status,
                       p.forma_pagamento, p.taxa_entrega, p.created_at, p.updated_at,
                       p.cliente_id, p.cliente_nome, p.tipo_cliente
              ORDER BY p.created_at DESC";

        $stmt = $this->conn->prepare($query);
        foreach ($statusFiltro as $i => $s) {
            $stmt->bindValue($i + 1, $s);
        }
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Buscar pedido por ID com todos os itens
    // 🔧 ATUALIZAR: Método buscarPorId também com dados do cliente
    public function buscarPorId($id)
    {
        // Buscar dados do pedido
        $query = 'SELECT id, numero_pedido, total, valor_pago, status, forma_pagamento,
                     created_at, updated_at, cliente_id, cliente_nome, tipo_cliente,
                     tipo_pedido, endereco_entrega, taxa_entrega, zona_entrega_id
              FROM ' . $this->table_pedidos . '
              WHERE id = :id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $pedido = $stmt->fetch();

        if ($pedido) {
            // Buscar itens do pedido
            $pedido['itens'] = $this->buscarItensPedido($id);
        }

        return $pedido;
    }

    // Buscar itens de um pedido específico
    public function buscarItensPedido($pedido_id)
    {
        // ✅ CORRIGIDO: Agora busca adicionais e observacoes também
        $query = 'SELECT 
                pi.id, 
                pi.quantidade, 
                pi.preco_unitario, 
                pi.subtotal,
                pi.adicionais,      -- ✅ ADICIONADO
                pi.observacoes,     -- ✅ ADICIONADO
                p.id as produto_id,
                p.nome as produto_nome,
                p.preco as preco_produto,
                c.nome as categoria_nome
              FROM ' . $this->table_itens . ' pi
              INNER JOIN produtos p ON pi.produto_id = p.id
              LEFT JOIN categorias c ON p.categoria_id = c.id
              WHERE pi.pedido_id = :pedido_id
              ORDER BY pi.id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pedido_id', $pedido_id, PDO::PARAM_INT);
        $stmt->execute();

        $itens = $stmt->fetchAll();

        // ✅ IMPORTANTE: Converter JSON de adicionais de volta para array
        foreach ($itens as &$item) {
            // Se adicionais vier como JSON (texto), converter para array
            if (isset($item['adicionais']) && is_string($item['adicionais'])) {
                $item['adicionais'] = json_decode($item['adicionais'], true) ?? [];
            } else {
                $item['adicionais'] = [];
            }

            // Garantir que observacoes sempre existe
            if (!isset($item['observacoes'])) {
                $item['observacoes'] = '';
            }
        }

        return $itens;
    }

    // Criar novo pedido
    public function criar()
    {
        try {
            // Iniciar transação
            $this->conn->beginTransaction();

            // Gerar número do pedido
            $this->numero_pedido = $this->gerarNumeroPedido();

            // 🔧 NOVA LÓGICA: Determinar tipo de cliente e dados
            $cliente_id = null;
            $cliente_nome = '';
            $tipo_cliente = 'avulso';

            // Se tem cliente_id definido, é cliente cadastrado
            if (isset($this->cliente_id) && !empty($this->cliente_id)) {
                $cliente_id = $this->cliente_id;
                $tipo_cliente = 'cadastrado';

                // Buscar nome do cliente no banco para garantir consistência
                $stmt = $this->conn->prepare('SELECT nome FROM clientes WHERE id = ? AND ativo = 1');
                $stmt->bindParam(1, $cliente_id);
                $stmt->execute();
                $cliente = $stmt->fetch();

                if ($cliente) {
                    $cliente_nome = $cliente['nome'];
                } else {
                    throw new Exception('Cliente cadastrado não encontrado ou inativo');
                }
            }
            // Se não tem cliente_id mas tem nome, é cliente avulso
            elseif (isset($this->cliente_nome) && !empty($this->cliente_nome)) {
                $cliente_nome = $this->cliente_nome;
                $tipo_cliente = 'avulso';
            }
            // Se não tem nem ID nem nome, erro
            else {
                Logger::warn('Nome do cliente é obrigatório');
                // throw new Exception('Nome do cliente é obrigatório');
            }

            // Inserir pedido com dados do cliente
            $query = 'INSERT INTO ' . $this->table_pedidos . '
                  (numero_pedido, origem, cliente_id, cliente_nome, tipo_cliente, total, status, forma_pagamento,
                   tipo_pedido, endereco_entrega, taxa_entrega, zona_entrega_id)
                  VALUES (:numero_pedido, :origem, :cliente_id, :cliente_nome, :tipo_cliente, :total, :status, :forma_pagamento,
                          :tipo_pedido, :endereco_entrega, :taxa_entrega, :zona_entrega_id)';

            $tipoPedido = $this->tipo_pedido ?: 'balcao';
            $taxaEntrega = $this->taxa_entrega ?: 0;
            $origem = $this->origem ?: 'PDV';

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':numero_pedido', $this->numero_pedido, PDO::PARAM_INT);
            $stmt->bindParam(':origem', $origem);
            $stmt->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
            $stmt->bindParam(':cliente_nome', $cliente_nome);
            $stmt->bindParam(':tipo_cliente', $tipo_cliente);
            $stmt->bindParam(':total', $this->total);
            $stmt->bindParam(':status', $this->status);
            $stmt->bindParam(':forma_pagamento', $this->forma_pagamento);
            $stmt->bindParam(':tipo_pedido', $tipoPedido);
            $stmt->bindParam(':endereco_entrega', $this->endereco_entrega);
            $stmt->bindParam(':taxa_entrega', $taxaEntrega);
            $stmt->bindParam(':zona_entrega_id', $this->zona_entrega_id);

            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();

                // Inserir itens do pedido
                if (!empty($this->itens)) {
                    foreach ($this->itens as $item) {
                        if (!$this->adicionarItem($item)) {
                            Logger::warn('Erro ao adicionar item do pedido');
                            // throw new Exception('Erro ao adicionar item do pedido');
                        }
                    }
                }

                // Confirmar transação
                $this->conn->commit();
                Logger::info('Conta a Receber', [
                    'Pedido criado ID ' => $this->id,
                    'Cliente: ' => $cliente_nome,
                    'tipo cliente ' => $tipo_cliente,
                ]);

                return true;
            }
            Logger::error('Erro ao criar pedido', [
                'erro ' => throw new Exception('Erro ao criar pedido'),
            ]);
        } catch (Exception $e) {
            // Reverter transação em caso de erro
            $this->conn->rollback();
            Logger::error('Erro ao criar pedido', [
                'erro ' => $e->getMessage(),
            ]);

            return false;
        }
    }

    // Adicionar item ao pedido
    private function adicionarItem($item)
    {
        // ✅ CORRIGIDO: Agora inclui adicionais e observacoes
        $query = 'INSERT INTO ' . $this->table_itens . ' 
                (pedido_id, produto_id, quantidade, preco_unitario, subtotal, adicionais, observacoes) 
                VALUES (:pedido_id, :produto_id, :quantidade, :preco_unitario, :subtotal, :adicionais, :observacoes)';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':produto_id', $item['produto_id']);
        $stmt->bindParam(':quantidade', $item['quantidade']);
        $stmt->bindParam(':preco_unitario', $item['preco_unitario']);
        $stmt->bindParam(':subtotal', $item['subtotal']);

        // ✅ NOVOS CAMPOS:
        // Converter array de adicionais para JSON antes de salvar
        $adicionaisJson = json_encode($item['adicionais'] ?? []);
        $stmt->bindParam(':adicionais', $adicionaisJson);

        // Observações como texto simples
        $observacoes = $item['observacoes'] ?? '';
        $stmt->bindParam(':observacoes', $observacoes);

        return $stmt->execute();
    }

    // No seu models/Pedido.php - Adicionar logs no método atualizarStatus

    public function atualizarStatus($status, $forma_pagamento = null)
    {
        try {
            Logger::info('Atualizar Status do pedido', [
                'ID ' => $this->id,
                'Status' => $status,
                'Forma pagamento:' => $forma_pagamento ?: 'NULL',
            ]);

            $query = 'UPDATE ' . $this->table_pedidos . ' 
                  SET status = :status';

            if ($forma_pagamento) {
                $query .= ', forma_pagamento = :forma_pagamento';
            }

            $query .= ', updated_at = NOW() WHERE id = :id';

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

            if ($forma_pagamento) {
                $stmt->bindParam(':forma_pagamento', $forma_pagamento);
            }

            $resultado = $stmt->execute();
            $linhasAfetadas = $stmt->rowCount();

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                Logger::warn('Erro ao executar SQL', [
                    'erro' => implode(' - ', $errorInfo),
                ]);
            }

            return $resultado && $linhasAfetadas > 0;
        } catch (Exception $e) {
            Logger::error('Erro ao atualizar status do pedido', [
                'erro' => $e->getMessage(),
            ]);

            return false;
        }
    }

    // Cancelar pedido
    public function cancelar()
    {
        return $this->atualizarStatus('cancelado');
    }

    // Fechar pedido (finalizar)
    public function fechar($forma_pagamento)
    {
        return $this->atualizarStatus('fechado', $forma_pagamento);
    }

    // Adicionar item a um pedido existente
    public function adicionarItemExistente($produto_id, $quantidade, $preco_unitario)
    {
        try {
            // Verificar se o item já existe no pedido
            $query = 'SELECT id, quantidade FROM ' . $this->table_itens . ' 
                      WHERE pedido_id = :pedido_id AND produto_id = :produto_id';

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
            $stmt->bindParam(':produto_id', $produto_id, PDO::PARAM_INT);
            $stmt->execute();

            $item_existente = $stmt->fetch();

            if ($item_existente) {
                // Atualizar quantidade do item existente
                $nova_quantidade = $item_existente['quantidade'] + $quantidade;
                $novo_subtotal = $nova_quantidade * $preco_unitario;

                $update_query = 'UPDATE ' . $this->table_itens . ' 
                                 SET quantidade = :quantidade, subtotal = :subtotal 
                                 WHERE id = :id';

                $update_stmt = $this->conn->prepare($update_query);
                $update_stmt->bindParam(':quantidade', $nova_quantidade);
                $update_stmt->bindParam(':subtotal', $novo_subtotal);
                $update_stmt->bindParam(':id', $item_existente['id'], PDO::PARAM_INT);

                $resultado = $update_stmt->execute();
            } else {
                // Adicionar novo item
                $subtotal = $quantidade * $preco_unitario;

                $insert_query = 'INSERT INTO ' . $this->table_itens . ' 
                                 (pedido_id, produto_id, quantidade, preco_unitario, subtotal) 
                                 VALUES (:pedido_id, :produto_id, :quantidade, :preco_unitario, :subtotal)';

                $insert_stmt = $this->conn->prepare($insert_query);
                $insert_stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
                $insert_stmt->bindParam(':produto_id', $produto_id, PDO::PARAM_INT);
                $insert_stmt->bindParam(':quantidade', $quantidade);
                $insert_stmt->bindParam(':preco_unitario', $preco_unitario);
                $insert_stmt->bindParam(':subtotal', $subtotal);

                $resultado = $insert_stmt->execute();
            }

            // Recalcular total do pedido
            if ($resultado) {
                $this->recalcularTotal();
            }

            return $resultado;
        } catch (Exception $e) {
            Logger::error('Erro ao adicionar item', [
                'erro' => $e->getMessage(),
            ]);

            return false;
        }
    }

    // Remover item do pedido
    public function removerItem($item_id)
    {
        $query = 'DELETE FROM ' . $this->table_itens . ' 
                  WHERE id = :id AND pedido_id = :pedido_id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $item_id, PDO::PARAM_INT);
        $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $this->recalcularTotal();

            return true;
        }

        return false;
    }

    // Atualizar quantidade de um item
    public function atualizarQuantidadeItem($item_id, $nova_quantidade)
    {
        if ($nova_quantidade <= 0) {
            return $this->removerItem($item_id);
        }

        // Buscar preço unitário do item
        $query = 'SELECT preco_unitario FROM ' . $this->table_itens . ' 
                  WHERE id = :id AND pedido_id = :pedido_id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $item_id, PDO::PARAM_INT);
        $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
        $stmt->execute();

        $item = $stmt->fetch();

        if ($item) {
            $novo_subtotal = $nova_quantidade * $item['preco_unitario'];

            $update_query = 'UPDATE ' . $this->table_itens . ' 
                             SET quantidade = :quantidade, subtotal = :subtotal 
                             WHERE id = :id AND pedido_id = :pedido_id';

            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(':quantidade', $nova_quantidade);
            $update_stmt->bindParam(':subtotal', $novo_subtotal);
            $update_stmt->bindParam(':id', $item_id, PDO::PARAM_INT);
            $update_stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);

            if ($update_stmt->execute()) {
                $this->recalcularTotal();

                return true;
            }
        }

        return false;
    }

    // Recalcular total do pedido
    private function recalcularTotal()
    {
        $query = 'SELECT SUM(subtotal) as total 
                  FROM ' . $this->table_itens . ' 
                  WHERE pedido_id = :pedido_id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
        $stmt->execute();

        $resultado = $stmt->fetch();
        $novo_total = $resultado['total'] ?? 0;

        // Atualizar total na tabela de pedidos
        $update_query = 'UPDATE ' . $this->table_pedidos . ' 
                         SET total = :total 
                         WHERE id = :id';

        $update_stmt = $this->conn->prepare($update_query);
        $update_stmt->bindParam(':total', $novo_total);
        $update_stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $update_stmt->execute();
    }

    // Buscar produtos para adicionar no pedido
    public function buscarProdutosDisponiveis()
    {
        $query = 'SELECT 
                    p.id, p.nome, p.preco, p.descricao,
                    c.nome as categoria_nome
                  FROM produtos p
                  LEFT JOIN categorias c ON p.categoria_id = c.id
                  WHERE p.ativo = 1
                  ORDER BY c.nome, p.nome';

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Buscar histórico de pagamentos de um pedido
    public function buscarPagamentos($pedido_id)
    {
        $query = 'SELECT id, pedido_id, valor, forma_pagamento, valor_recebido,
                     valor_troco, conta_receber_id, observacoes, usuario_id, created_at
              FROM pedido_pagamentos
              WHERE pedido_id = :pedido_id
              ORDER BY created_at';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pedido_id', $pedido_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Registra um pagamento (total ou parcial) de um pedido.
     *
     * Se $formaPagamento for 'prazo', cria (ou reaproveita) uma conta a
     * receber vinculada apenas a esse pedido, pelo valor da parcela — não
     * pelo total do pedido. O status/valor_pago do pedido são recalculados
     * automaticamente pelos triggers de pedido_pagamentos.
     */
    public function registrarPagamento($pedido_id, $valor, $formaPagamento, $usuario_id, array $extra = [])
    {
        try {
            $this->conn->beginTransaction();

            $stmt = $this->conn->prepare(
                'SELECT total, valor_pago, status, cliente_id, cliente_nome, numero_pedido, taxa_entrega FROM ' . $this->table_pedidos . ' WHERE id = :id FOR UPDATE'
            );
            $stmt->bindParam(':id', $pedido_id, PDO::PARAM_INT);
            $stmt->execute();
            $pedido = $stmt->fetch();

            if (!$pedido) {
                throw new Exception('Pedido não encontrado');
            }

            if (in_array($pedido['status'], ['finalizado', 'cancelado'], true)) {
                throw new Exception('Pedido já está ' . $pedido['status'] . ', não é possível registrar pagamento');
            }

            $valor = floatval($valor);
            $saldoPendente = floatval($pedido['total']) - floatval($pedido['valor_pago']) + floatval($pedido['taxa_entrega']);

            if ($valor <= 0) {
                throw new Exception('Valor do pagamento deve ser maior que zero');
            }

            if ($valor > $saldoPendente + 0.01) { // tolerância de arredondamento
                throw new Exception('Valor do pagamento não pode ser maior que o saldo devedor');
            }

            $contaReceberId = null;

            if ($formaPagamento === 'prazo') {
                if (empty($pedido['cliente_id'])) {
                    throw new Exception('Pagamento a prazo requer um cliente cadastrado no pedido');
                }

                // Reaproveita conta a receber pendente já aberta para este pedido
                $stmt = $this->conn->prepare(
                    "SELECT id FROM contas_receber WHERE pedido_id = :pedido_id AND status = 'pendente' LIMIT 1"
                );
                $stmt->bindParam(':pedido_id', $pedido_id, PDO::PARAM_INT);
                $stmt->execute();
                $contaExistente = $stmt->fetch();

                if ($contaExistente) {
                    $contaReceberId = $contaExistente['id'];

                    $stmt = $this->conn->prepare(
                        'UPDATE contas_receber SET valor_original = valor_original + :valor, updated_at = NOW() WHERE id = :id'
                    );
                    $stmt->bindParam(':valor', $valor);
                    $stmt->bindParam(':id', $contaReceberId, PDO::PARAM_INT);
                    $stmt->execute();
                } else {
                    $stmt = $this->conn->prepare(
                        'INSERT INTO contas_receber
                            (cliente_id, pedido_id, usuario_criacao, descricao, valor_original,
                             data_vencimento, data_emissao, status, observacoes, created_at)
                         VALUES
                            (:cliente_id, :pedido_id, :usuario_id, :descricao, :valor,
                             DATE_ADD(CURDATE(), INTERVAL 30 DAY), CURDATE(), \'pendente\', :observacoes, NOW())'
                    );
                    $descricao = "Pedido #{$pedido['numero_pedido']} - {$pedido['cliente_nome']}";
                    $observacoes = $extra['observacoes'] ?? '';
                    $stmt->bindParam(':cliente_id', $pedido['cliente_id'], PDO::PARAM_INT);
                    $stmt->bindParam(':pedido_id', $pedido_id, PDO::PARAM_INT);
                    $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
                    $stmt->bindParam(':descricao', $descricao);
                    $stmt->bindParam(':valor', $valor);
                    $stmt->bindParam(':observacoes', $observacoes);
                    $stmt->execute();

                    $contaReceberId = $this->conn->lastInsertId();
                }
            }

            $stmt = $this->conn->prepare(
                'INSERT INTO pedido_pagamentos
                    (pedido_id, valor, forma_pagamento, valor_recebido, valor_troco,
                     conta_receber_id, observacoes, usuario_id, created_at)
                 VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $pedido_id,
                $valor,
                $formaPagamento,
                $extra['valor_recebido'] ?? null,
                $extra['valor_troco'] ?? null,
                $contaReceberId,
                $extra['observacoes'] ?? '',
                $usuario_id,
            ]);

            $pagamentoId = $this->conn->lastInsertId();

            // O trigger tr_pedido_pagamentos_after_insert já recalculou
            // pedidos.valor_pago/status — só precisamos ler de volta.
            $stmt = $this->conn->prepare(
                'SELECT valor_pago, status FROM ' . $this->table_pedidos . ' WHERE id = :id'
            );
            $stmt->bindParam(':id', $pedido_id, PDO::PARAM_INT);
            $stmt->execute();
            $pedidoAtualizado = $stmt->fetch();

            $this->conn->commit();

            return [
                'pagamento_id' => $pagamentoId,
                'valor_pago' => $valor,
                'saldo_pendente' => floatval($pedido['total']) - floatval($pedidoAtualizado['valor_pago']),
                'novo_status' => $pedidoAtualizado['status'],
                'conta_receber_id' => $contaReceberId,
            ];
        } catch (Exception $e) {
            $this->conn->rollback();
            Logger::error('Erro ao registrar pagamento do pedido', [
                'pedido_id' => $pedido_id,
                'erro' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
