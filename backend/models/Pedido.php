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
        return 'PED'.date('ymd').str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Buscar todos os pedidos com informações resumidas
    // 🔧 ATUALIZAR: Método para buscar pedidos com informações de cliente
    public function buscarTodos($status = null)
    {
        $whereClause = '';
        if ($status) {
            $whereClause = 'WHERE p.status = :status';
        }

        $query = 'SELECT 
                p.id, p.numero_pedido, p.total, p.status, 
                p.forma_pagamento, p.created_at, p.updated_at,
                p.cliente_id, p.cliente_nome, p.tipo_cliente,
                COUNT(pi.id) as total_itens
              FROM '.$this->table_pedidos.' p
              LEFT JOIN '.$this->table_itens." pi ON p.id = pi.pedido_id
              $whereClause
              GROUP BY p.id, p.numero_pedido, p.total, p.status, 
                       p.forma_pagamento, p.created_at, p.updated_at,
                       p.cliente_id, p.cliente_nome, p.tipo_cliente
              ORDER BY p.created_at DESC";

        $stmt = $this->conn->prepare($query);
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Buscar pedido por ID com todos os itens
    // 🔧 ATUALIZAR: Método buscarPorId também com dados do cliente
    public function buscarPorId($id)
    {
        // Buscar dados do pedido
        $query = 'SELECT id, numero_pedido, total, status, forma_pagamento, 
                     created_at, updated_at, cliente_id, cliente_nome, tipo_cliente
              FROM '.$this->table_pedidos.' 
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
              FROM '.$this->table_itens.' pi
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
            $query = 'INSERT INTO '.$this->table_pedidos.' 
                  (numero_pedido, cliente_id, cliente_nome, tipo_cliente, total, status, forma_pagamento) 
                  VALUES (:numero_pedido, :cliente_id, :cliente_nome, :tipo_cliente, :total, :status, :forma_pagamento)';

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':numero_pedido', $this->numero_pedido, PDO::PARAM_INT);
            $stmt->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
            $stmt->bindParam(':cliente_nome', $cliente_nome);
            $stmt->bindParam(':tipo_cliente', $tipo_cliente);
            $stmt->bindParam(':total', $this->total);
            $stmt->bindParam(':status', $this->status);
            $stmt->bindParam(':forma_pagamento', $this->forma_pagamento);

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

                // 🔧 NOVA FUNCIONALIDADE: Se é cliente cadastrado, gerar conta a receber
                if ($tipo_cliente === 'cadastrado' && $cliente_id) {
                    $this->gerarContaReceber($cliente_id, $cliente_nome);
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
        $query = 'INSERT INTO '.$this->table_itens.' 
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

            $query = 'UPDATE '.$this->table_pedidos.' 
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
            $query = 'SELECT id, quantidade FROM '.$this->table_itens.' 
                      WHERE pedido_id = :pedido_id AND produto_id = :produto_id';

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
            $stmt->bindParam(':produto_id', $produto_id);
            $stmt->execute();

            $item_existente = $stmt->fetch();

            if ($item_existente) {
                // Atualizar quantidade do item existente
                $nova_quantidade = $item_existente['quantidade'] + $quantidade;
                $novo_subtotal = $nova_quantidade * $preco_unitario;

                $update_query = 'UPDATE '.$this->table_itens.' 
                                 SET quantidade = :quantidade, subtotal = :subtotal 
                                 WHERE id = :id';

                $update_stmt = $this->conn->prepare($update_query);
                $update_stmt->bindParam(':quantidade', $nova_quantidade);
                $update_stmt->bindParam(':subtotal', $novo_subtotal);
                $update_stmt->bindParam(':id', $item_existente['id']);

                $resultado = $update_stmt->execute();
            } else {
                // Adicionar novo item
                $subtotal = $quantidade * $preco_unitario;

                $insert_query = 'INSERT INTO '.$this->table_itens.' 
                                 (pedido_id, produto_id, quantidade, preco_unitario, subtotal) 
                                 VALUES (:pedido_id, :produto_id, :quantidade, :preco_unitario, :subtotal)';

                $insert_stmt = $this->conn->prepare($insert_query);
                $insert_stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
                $insert_stmt->bindParam(':produto_id', $produto_id);
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
        $query = 'DELETE FROM '.$this->table_itens.' 
                  WHERE id = :id AND pedido_id = :pedido_id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $item_id);
        $stmt->bindParam(':pedido_id', $this->id);

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
        $query = 'SELECT preco_unitario FROM '.$this->table_itens.' 
                  WHERE id = :id AND pedido_id = :pedido_id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $item_id, PDO::PARAM_INT);
        $stmt->bindParam(':pedido_id', $this->id, PDO::PARAM_INT);
        $stmt->execute();

        $item = $stmt->fetch();

        if ($item) {
            $novo_subtotal = $nova_quantidade * $item['preco_unitario'];

            $update_query = 'UPDATE '.$this->table_itens.' 
                             SET quantidade = :quantidade, subtotal = :subtotal 
                             WHERE id = :id AND pedido_id = :pedido_id';

            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(':quantidade', $nova_quantidade);
            $update_stmt->bindParam(':subtotal', $novo_subtotal);
            $update_stmt->bindParam(':id', $item_id);
            $update_stmt->bindParam(':pedido_id', $this->id);

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
                  FROM '.$this->table_itens.' 
                  WHERE pedido_id = :pedido_id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pedido_id', $this->id);
        $stmt->execute();

        $resultado = $stmt->fetch();
        $novo_total = $resultado['total'] ?? 0;

        // Atualizar total na tabela de pedidos
        $update_query = 'UPDATE '.$this->table_pedidos.' 
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

    // 🆕 NOVO MÉTODO: Gerar conta a receber para cliente cadastrado
    private function gerarContaReceber($cliente_id, $cliente_nome)
    {
        try {
            // Verificar se já existe conta a receber para este pedido
            $stmt = $this->conn->prepare('SELECT id FROM contas_receber WHERE pedido_id = ?');
            $stmt->execute([$this->id]);

            if ($stmt->fetch()) {
                Logger::warn('Conta a receber já existe para pedido', [
                    'pedido_id' => $this->id,
                ]);

                return true; // Já existe, não criar duplicata
            }

            // Inserir conta a receber
            $query = 'INSERT INTO contas_receber 
                  (cliente_id, pedido_id, descricao, valor_total, valor_pendente, 
                   data_vencimento, status, created_at) 
                  VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), \'pendente\', NOW())';

            $stmt = $this->conn->prepare($query);
            $descricao = "Pedido #{$this->numero_pedido} - {$cliente_nome}";

            $resultado = $stmt->execute([
                $cliente_id,
                $this->id,
                $descricao,
                $this->total,
                $this->total, // valor_pendente = valor_total inicialmente
            ]);

            if ($resultado) {
                $conta_id = $this->conn->lastInsertId();
                Logger::info('Conta a Receber', [
                    'Conta ID' => $conta_id,
                    'Pedido' => $this->id,
                ]);

                return true;
            } else {
                Logger::info('Erro ao criar Conta a Receber', [
                    'Pedido' => $this->id,
                ]);

                return false;
            }
        } catch (Exception $e) {
            Logger::error('Erro ao gerar conta a receber', [
                'Erro ' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
