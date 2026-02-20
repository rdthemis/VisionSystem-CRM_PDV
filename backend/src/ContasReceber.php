<?php

// src/ContasReceber.php - Classe para gerenciar contas a receber

class ContasReceber
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database;
    }

    // Listar contas com paginação e filtros
    public function listar($filtros = [])
    {
        try {
            $where = ['ativo = 1'];
            $params = [];

            // Filtro por cliente
            if (!empty($filtros['cliente_id'])) {
                $where[] = 'cr.cliente_id = ?';
                $params[] = $filtros['cliente_id'];
            }

            // Filtro por status
            if (!empty($filtros['status'])) {
                $where[] = 'status = ?';
                $params[] = $filtros['status'];
            }

            // Filtro por período de vencimento
            if (!empty($filtros['data_vencimento_inicio'])) {
                $where[] = 'cr.data_vencimento >= ?';
                $params[] = $filtros['data_vencimento_inicio'];
            }

            if (!empty($filtros['data_vencimento_fim'])) {
                $where[] = 'cr.data_vencimento <= ?';
                $params[] = $filtros['data_vencimento_fim'];
            }

            // Filtro por valor
            if (!empty($filtros['valor_minimo'])) {
                $where[] = 'cr.valor_original >= ?';
                $params[] = $filtros['valor_minimo'];
            }

            if (!empty($filtros['valor_maximo'])) {
                $where[] = 'cr.valor_original <= ?';
                $params[] = $filtros['valor_maximo'];
            }

            // Filtro por descrição
            if (!empty($filtros['descricao'])) {
                $where[] = '(cr.descricao LIKE ? OR cr.numero_documento LIKE ?)';
                $searchTerm = '%'.$filtros['descricao'].'%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            // Paginação
            $limite = intval($filtros['limite'] ?? 10);
            $pagina = intval($filtros['pagina'] ?? 1);
            $offset = ($pagina - 1) * $limite;

            // Ordenação
            $ordenacao = $filtros['ordenacao'] ?? 'data_vencimento';
            $direcao = ($filtros['direcao'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

            $validOrders = ['data_vencimento', 'valor_original', 'cliente_nome', 'status', 'created_at'];
            if (!in_array($ordenacao, $validOrders)) {
                $ordenacao = 'data_vencimento';
            }

            // Query principal usando a view
            $sql = '
                SELECT *
                FROM vw_contas_receber_completo
                WHERE '.implode(' AND ', $where)."
                ORDER BY {$ordenacao} {$direcao}
                LIMIT {$limite} OFFSET {$offset}
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $contas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Contar total para paginação
            $sqlCount = '
                SELECT COUNT(*) as total
                FROM vw_contas_receber_completo
                WHERE '.implode(' AND ', $where);

            $stmtCount = $this->db->prepare($sqlCount);
            $stmtCount->execute($params);
            $total = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];

            return [
                'success' => true,
                'data' => $contas,
                'pagination' => [
                    'total' => intval($total),
                    'por_pagina' => $limite,
                    'pagina_atual' => $pagina,
                    'total_paginas' => ceil($total / $limite),
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar contas: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao buscar contas a receber',
            ];
        }
    }

    // Buscar conta por ID
    public function buscarPorId($id)
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM vw_contas_receber_completo
                WHERE id = ? AND ativo = 1
            ');
            $stmt->execute([$id]);
            $conta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$conta) {
                return [
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ];
            }

            // Buscar histórico de pagamentos
            $stmt = $this->db->prepare('
                SELECT p.*, u.nome as usuario_nome
                FROM pagamentos p
                LEFT JOIN usuarios u ON p.usuario_recebimento = u.id
                WHERE p.conta_receber_id = ?
                ORDER BY p.data_pagamento DESC
            ');
            $stmt->execute([$id]);
            $pagamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $conta['pagamentos'] = $pagamentos;

            return [
                'success' => true,
                'data' => $conta,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar conta: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao buscar conta',
            ];
        }
    }

    // Criar nova conta
    public function criar($dados, $usuarioId)
    {
        try {
            // Validações básicas
            if (empty($dados['cliente_id']) || empty($dados['descricao']) || empty($dados['valor_original']) || empty($dados['data_vencimento'])) {
                return [
                    'success' => false,
                    'message' => 'Cliente, descrição, valor e data de vencimento são obrigatórios',
                ];
            }

            // Validar se cliente existe
            $stmt = $this->db->prepare('SELECT id FROM clientes WHERE id = ? AND ativo = 1');
            $stmt->execute([$dados['cliente_id']]);
            if (!$stmt->fetch()) {
                return [
                    'success' => false,
                    'message' => 'Cliente não encontrado',
                ];
            }

            // Validar valor
            if (!is_numeric($dados['valor_original']) || $dados['valor_original'] <= 0) {
                return [
                    'success' => false,
                    'message' => 'Valor deve ser maior que zero',
                ];
            }

            // Validar data
            $dataVencimento = DateTime::createFromFormat('Y-m-d', $dados['data_vencimento']);
            if (!$dataVencimento) {
                return [
                    'success' => false,
                    'message' => 'Data de vencimento inválida',
                ];
            }

            // Preparar dados
            $campos = [
                'cliente_id',
                'descricao',
                'numero_documento',
                'valor_original',
                'data_vencimento',
                'data_emissao',
                'observacoes',
                'forma_pagamento',
                'banco',
                'agencia',
                'conta',
            ];

            $values = [];
            $placeholders = [];

            foreach ($campos as $campo) {
                $values[] = $dados[$campo] ?? null;
                $placeholders[] = '?';
            }

            $values[] = $usuarioId; // usuario_criacao
            $placeholders[] = '?';

            // Data de emissão padrão é hoje se não fornecida
            if (empty($dados['data_emissao'])) {
                $values[array_search('data_emissao', $campos)] = date('Y-m-d');
            }

            $sql = '
                INSERT INTO contas_receber ('.implode(', ', $campos).', usuario_criacao) 
                VALUES ('.implode(', ', $placeholders).')
            ';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);

            $contaId = $this->db->lastInsertId();

            error_log("✅ Conta criada: {$dados['descricao']} (ID: {$contaId})");

            return [
                'success' => true,
                'message' => 'Conta criada com sucesso',
                'data' => ['id' => $contaId],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao criar conta: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao criar conta',
            ];
        }
    }

    // Atualizar conta
    public function atualizar($id, $dados, $usuarioId)
    {
        try {
            // Verificar se conta existe
            $contaExistente = $this->buscarPorId($id);
            if (!$contaExistente['success']) {
                return $contaExistente;
            }

            // Não permitir editar contas pagas
            if ($contaExistente['data']['status'] === 'pago') {
                return [
                    'success' => false,
                    'message' => 'Não é possível editar contas já pagas',
                ];
            }

            // Validações
            if (isset($dados['valor_original']) && (!is_numeric($dados['valor_original']) || $dados['valor_original'] <= 0)) {
                return [
                    'success' => false,
                    'message' => 'Valor deve ser maior que zero',
                ];
            }

            // Preparar campos para update
            $campos = [
                'descricao',
                'numero_documento',
                'valor_original',
                'data_vencimento',
                'data_emissao',
                'observacoes',
                'forma_pagamento',
                'banco',
                'agencia',
                'conta',
            ];

            $updates = [];
            $values = [];

            foreach ($campos as $campo) {
                if (isset($dados[$campo])) {
                    $updates[] = "{$campo} = ?";
                    $values[] = $dados[$campo];
                }
            }

            if (empty($updates)) {
                return [
                    'success' => false,
                    'message' => 'Nenhum campo para atualizar',
                ];
            }

            $values[] = $id;

            $sql = 'UPDATE contas_receber SET '.implode(', ', $updates).' WHERE id = ? AND ativo = 1';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);

            error_log("✅ Conta atualizada: ID {$id}");

            return [
                'success' => true,
                'message' => 'Conta atualizada com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar conta: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao atualizar conta',
            ];
        }
    }

    // Cancelar conta
    public function cancelar($id)
    {
        try {
            // Verificar se conta existe e não está paga
            $stmt = $this->db->prepare('SELECT status FROM contas_receber WHERE id = ? AND ativo = 1');
            $stmt->execute([$id]);
            $conta = $stmt->fetch();

            if (!$conta) {
                return [
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ];
            }

            if ($conta['status'] === 'pago') {
                return [
                    'success' => false,
                    'message' => 'Não é possível cancelar contas já pagas',
                ];
            }

            $stmt = $this->db->prepare('UPDATE contas_receber SET status = "cancelado" WHERE id = ?');
            $stmt->execute([$id]);

            error_log("✅ Conta cancelada: ID {$id}");

            return [
                'success' => true,
                'message' => 'Conta cancelada com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao cancelar conta: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao cancelar conta',
            ];
        }
    }

    /**
     * Adicionar pagamento.
     */
    public function adicionarPagamento($contaId, $dadosPagamento, $usuarioId)
    {
        try {
            $pdo = $this->db;

            // Iniciar transação
            $pdo->beginTransaction();

            // Buscar conta
            $stmt = $pdo->prepare('SELECT * FROM contas_receber WHERE id = ? AND ativo = 1');
            $stmt->execute([$contaId]);
            $conta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$conta) {
                $pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ];
            }

            // Validações
            $valorPago = floatval($dadosPagamento['valor_pago']);
            $valorPendente = $conta['valor_original'] - $conta['valor_recebido'];

            if ($valorPago <= 0) {
                $pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'Valor do pagamento deve ser maior que zero',
                ];
            }

            if ($valorPago > $valorPendente) {
                $pdo->rollBack();

                return [
                    'success' => false,
                    'message' => 'Valor do pagamento não pode ser maior que o valor pendente',
                ];
            }

            // Inserir pagamento
            $stmt = $pdo->prepare('
            INSERT INTO pagamentos (
                conta_receber_id, valor_pago, data_pagamento, 
                forma_pagamento, observacoes, usuario_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');

            $stmt->execute([
                $contaId,
                $valorPago,
                $dadosPagamento['data_pagamento'] ?? date('Y-m-d'),
                $dadosPagamento['forma_pagamento'] ?? 'dinheiro',
                $dadosPagamento['observacoes'] ?? '',
                $usuarioId,
            ]);

            $pagamentoId = $pdo->lastInsertId();

            // Atualizar valor recebido na conta
            $novoValorRecebido = $conta['valor_recebido'] + $valorPago;
            $novoStatus = ($novoValorRecebido >= $conta['valor_original']) ? 'pago' : 'pendente';

            $stmt = $pdo->prepare('
            UPDATE contas_receber 
            SET valor_recebido = ?, status = ?, updated_at = NOW() 
            WHERE id = ?
        ');
            $stmt->execute([$novoValorRecebido, $novoStatus, $contaId]);

            // *** NOVO: Gerar recibo automaticamente ***
            $recibos = new Recibos($this->db);
            $resultadoRecibo = $recibos->gerarParaPagamento($contaId, $dadosPagamento, $usuarioId);

            if (!$resultadoRecibo['success']) {
                error_log('⚠️ Falha ao gerar recibo, mas pagamento foi registrado: '.$resultadoRecibo['message']);
            }

            // Confirmar transação
            $pdo->commit();

            return [
                'success' => true,
                'message' => 'Pagamento registrado com sucesso',
                'data' => [
                    'pagamento_id' => $pagamentoId,
                    'valor_pago' => $valorPago,
                    'novo_status' => $novoStatus,
                    'valor_pendente' => $conta['valor_original'] - $novoValorRecebido,
                    // *** NOVO: Dados do recibo gerado ***
                    'recibo' => $resultadoRecibo['success'] ? $resultadoRecibo['data'] : null,
                    'recibo_erro' => $resultadoRecibo['success'] ? null : $resultadoRecibo['message'],
                ],
            ];
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('❌ Erro ao adicionar pagamento: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao registrar pagamento',
            ];
        }
    }

    /* public function adicionarPagamento($contaId, $dados, $usuarioId)
    {
        try {
            // Validações
            if (empty($dados['valor_pago']) || empty($dados['data_pagamento']) || empty($dados['forma_pagamento'])) {
                return [
                    'success' => false,
                    'message' => 'Valor, data e forma de pagamento são obrigatórios',
                ];
            }

            if (!is_numeric($dados['valor_pago']) || $dados['valor_pago'] <= 0) {
                return [
                    'success' => false,
                    'message' => 'Valor deve ser maior que zero',
                ];
            }

            // Verificar se conta existe
            $stmt = $this->db->prepare('SELECT valor_original, valor_recebido, status FROM contas_receber WHERE id = ? AND ativo = 1');
            $stmt->execute([$contaId]);
            $conta = $stmt->fetch();

            if (!$conta) {
                return [
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ];
            }

            if ($conta['status'] === 'cancelado') {
                return [
                    'success' => false,
                    'message' => 'Não é possível adicionar pagamento a conta cancelada',
                ];
            }

            // Verificar se valor não excede o pendente
            $valorPendente = $conta['valor_original'] - $conta['valor_recebido'];
            if ($dados['valor_pago'] > $valorPendente) {
                return [
                    'success' => false,
                    'message' => 'Valor do pagamento não pode ser maior que o valor pendente',
                ];
            }

            // Inserir pagamento
            $stmt = $this->db->prepare('
                INSERT INTO pagamentos (
                    conta_receber_id, usuario_recebimento, valor_pago, valor_desconto,
                    valor_juros, valor_multa, data_pagamento, forma_pagamento,
                    observacoes, banco, agencia, conta, cheque
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $contaId,
                $usuarioId,
                $dados['valor_pago'],
                $dados['valor_desconto'] ?? 0,
                $dados['valor_juros'] ?? 0,
                $dados['valor_multa'] ?? 0,
                $dados['data_pagamento'],
                $dados['forma_pagamento'],
                $dados['observacoes'] ?? null,
                $dados['banco'] ?? null,
                $dados['agencia'] ?? null,
                $dados['conta'] ?? null,
                $dados['cheque'] ?? null,
            ]);

            $pagamentoId = $this->db->lastInsertId();

            // Gerar recibo automaticamente
            require_once __DIR__.'/Recibos.php';
            $recibos = new Recibos($this->db);
            // $resultadoRecibo = $recibos->criar($pagamentoId);
            $this->db->beginTransaction();
            // Commit da transação
            $this->db->commit();
            error_log("✅ Pagamento adicionado: R$ {$dados['valor_pago']} para conta {$contaId}");

            if ($resultadoRecibo['success']) {
                error_log("✅ Recibo gerado automaticamente: {$resultadoRecibo['data']['numero_recibo']}");
            }

            return [
                'success' => true,
                'message' => 'Pagamento registrado com sucesso',
                'data' => [
                    'pagamento_id' => $pagamentoId,
                    'recibo' => $resultadoRecibo['success'] ? $resultadoRecibo['data'] : null,
                ],
            ];
            error_log("✅ Pagamento adicionado: R$ {$dados['valor_pago']} para conta {$contaId}");

            return [
                'success' => true,
                'message' => 'Pagamento registrado com sucesso',
                'data' => ['id' => $pagamentoId],
            ];
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
            error_log('❌ Erro ao adicionar pagamento: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao registrar pagamento',
            ];
        }
    } */

    // Obter resumo financeiro
    public function obterResumo()
    {
        try {
            $stmt = $this->db->query('SELECT * FROM vw_resumo_financeiro');
            $resumo = $stmt->fetch(PDO::FETCH_ASSOC);

            // Contas vencendo em 30 dias
            $stmt = $this->db->prepare('
                SELECT COUNT(*) as total, SUM(valor_original - valor_recebido) as valor
                FROM contas_receber 
                WHERE ativo = 1 AND status = "pendente" 
                AND data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            ');
            $stmt->execute();
            $vencendo = $stmt->fetch(PDO::FETCH_ASSOC);

            $resumo['contas_vencendo_30_dias'] = $vencendo['total'];
            $resumo['valor_vencendo_30_dias'] = $vencendo['valor'] ?? 0;

            return [
                'success' => true,
                'data' => $resumo,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao obter resumo: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao obter resumo financeiro',
            ];
        }
    }

    // Buscar contas por cliente (para autocomplete)
    public function buscarPorCliente($clienteId, $limite = 10)
    {
        try {
            $stmt = $this->db->prepare('
                SELECT id, descricao, valor_original, valor_recebido, status, data_vencimento
                FROM contas_receber 
                WHERE cliente_id = ? AND ativo = 1
                ORDER BY data_vencimento DESC
                LIMIT ?
            ');
            $stmt->execute([$clienteId, $limite]);

            return [
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar contas por cliente: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro na busca',
            ];
        }
    }

    // Atualizar status das contas vencidas
    public function atualizarStatusVencidas()
    {
        try {
            $stmt = $this->db->prepare('
                UPDATE contas_receber 
                SET status = "vencido" 
                WHERE ativo = 1 
                AND status = "pendente" 
                AND data_vencimento < CURDATE()
                AND valor_recebido < valor_original
            ');
            $stmt->execute();

            $contasAtualizadas = $stmt->rowCount();

            return [
                'success' => true,
                'message' => "Status atualizado para {$contasAtualizadas} contas",
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar status: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao atualizar status',
            ];
        }
    }

    // Relatório de contas por período
    public function relatorio($dataInicio, $dataFim, $tipo = 'vencimento')
    {
        try {
            $campo = $tipo === 'emissao' ? 'data_emissao' : 'data_vencimento';

            $stmt = $this->db->prepare("
                SELECT 
                    cr.*,
                    c.nome as cliente_nome,
                    c.cpf_cnpj as cliente_documento,
                    u.nome as usuario_criacao_nome,
                    (cr.valor_original - cr.valor_recebido) as valor_pendente
                FROM contas_receber cr
                LEFT JOIN clientes c ON cr.cliente_id = c.id
                LEFT JOIN usuarios u ON cr.usuario_criacao = u.id
                WHERE cr.ativo = 1 
                AND cr.{$campo} BETWEEN ? AND ?
                ORDER BY cr.{$campo}
            ");

            $stmt->execute([$dataInicio, $dataFim]);
            $contas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Totalizadores
            $totais = [
                'total_contas' => count($contas),
                'valor_total' => 0,
                'valor_recebido' => 0,
                'valor_pendente' => 0,
                'por_status' => [],
            ];

            foreach ($contas as $conta) {
                $totais['valor_total'] += $conta['valor_original'];
                $totais['valor_recebido'] += $conta['valor_recebido'];
                $totais['valor_pendente'] += $conta['valor_pendente'];

                if (!isset($totais['por_status'][$conta['status']])) {
                    $totais['por_status'][$conta['status']] = [
                        'quantidade' => 0,
                        'valor' => 0,
                    ];
                }
                ++$totais['por_status'][$conta['status']]['quantidade'];
                $totais['por_status'][$conta['status']]['valor'] += $conta['valor_original'];
            }

            return [
                'success' => true,
                'data' => [
                    'contas' => $contas,
                    'totais' => $totais,
                    'periodo' => [
                        'inicio' => $dataInicio,
                        'fim' => $dataFim,
                        'tipo' => $tipo,
                    ],
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar relatório: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar relatório',
            ];
        }
    }
}