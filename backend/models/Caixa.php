<?php

// models/Caixa.php

class Caixa
{
    private $conn;
    private $table_caixa = 'caixa';
    private $table_movimentos = 'caixa_movimentos';

    // Propriedades
    public $id;
    public $data_abertura;
    public $data_fechamento;
    public $saldo_inicial;
    public $saldo_final;
    public $status;
    public $usuario_abertura;
    public $usuario_fechamento;
    public $observacoes_abertura;
    public $observacoes_fechamento;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Verificar se há caixa aberto
    public function verificarCaixaAberto()
    {
        try {
            error_log('=== DEBUG VERIFICAR CAIXA ABERTO ===');
            error_log('Table name: '.$this->table_caixa);

            $query = "SELECT * FROM {$this->table_caixa} WHERE status = 'aberto' ORDER BY data_abertura DESC LIMIT 1";
            error_log('Query: '.$query);

            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            error_log('Resultado da verificação: '.json_encode($resultado));

            return $resultado ?: false;
        } catch (Exception $e) {
            error_log('❌ Erro ao verificar caixa aberto: '.$e->getMessage());

            return false;
        }
    }

    // Abrir caixa
    public function abrirCaixa($saldoInicial, $usuarioId, $observacoes = '')
    {
        try {
            error_log('=== DEBUG MÉTODO ABRIR CAIXA ===');
            error_log('Saldo inicial: '.$saldoInicial);
            error_log('Usuario ID: '.$usuarioId);
            error_log('Observações: '.$observacoes);
            error_log('Table name: '.$this->table_caixa);

            // Verificar se já existe caixa aberto
            $caixaAberto = $this->verificarCaixaAberto();
            error_log('Verificação caixa aberto: '.json_encode($caixaAberto));

            if ($caixaAberto) {
                error_log('❌ Já existe um caixa aberto: '.json_encode($caixaAberto));

                return ['success' => false, 'message' => 'Já existe um caixa aberto'];
            }

            // Preparar query
            $query = "INSERT INTO {$this->table_caixa} 
                  (saldo_inicial, usuario_abertura, observacoes_abertura, status) 
                  VALUES (?, ?, ?, 'aberto')";

            error_log('Query: '.$query);
            error_log('Parâmetros: ['.$saldoInicial.', '.$usuarioId.", '".$observacoes."']");

            $stmt = $this->conn->prepare($query);

            if (!$stmt) {
                error_log('❌ Erro ao preparar statement: '.json_encode($this->conn->errorInfo()));

                return ['success' => false, 'message' => 'Erro ao preparar consulta SQL'];
            }

            $resultado = $stmt->execute([
                $saldoInicial,
                $usuarioId,
                $observacoes,
            ]);

            error_log('Resultado execute: '.($resultado ? 'true' : 'false'));

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                error_log('❌ Erro SQL: '.json_encode($errorInfo));

                return ['success' => false, 'message' => 'Erro SQL: '.$errorInfo[2]];
            }

            $caixaId = $this->conn->lastInsertId();
            error_log('✅ Caixa criado com ID: '.$caixaId);

            if ($caixaId) {
                error_log("✅ Caixa aberto: ID {$caixaId} - Saldo inicial: R$ {$saldoInicial}");

                return [
                    'success' => true,
                    'message' => 'Caixa aberto com sucesso',
                    'data' => [
                        'id' => $caixaId,
                        'saldo_inicial' => $saldoInicial,
                        'status' => 'aberto',
                    ],
                ];
            } else {
                error_log('❌ lastInsertId retornou 0');

                return ['success' => false, 'message' => 'Erro: não foi possível obter ID do caixa criado'];
            }
        } catch (Exception $e) {
            error_log('❌ Exception ao abrir caixa: '.$e->getMessage());
            error_log('Stack trace: '.$e->getTraceAsString());

            return ['success' => false, 'message' => 'Erro interno: '.$e->getMessage()];
        }
    }

    // Fechar caixa
    public function fechar($usuario_id, $observacoes = null)
    {
        try {
            $caixaAberto = $this->verificarCaixaAberto();
            if (!$caixaAberto) {
                return ['success' => false, 'message' => 'Nenhum caixa aberto encontrado'];
            }

            // Calcular saldo final
            $saldoFinal = $this->calcularSaldoAtual($caixaAberto['id']);

            // Fechar caixa
            $query = "UPDATE {$this->table_caixa} 
                      SET data_fechamento = NOW(), 
                          saldo_final = ?, 
                          status = 'fechado', 
                          usuario_fechamento = ?, 
                          observacoes_fechamento = ?
                      WHERE id = ?";

            $stmt = $this->conn->prepare($query);
            $resultado = $stmt->execute([$saldoFinal, $usuario_id, $observacoes, $caixaAberto['id']]);

            if ($resultado) {
                error_log("✅ Caixa fechado: ID {$caixaAberto['id']}, Saldo final: {$saldoFinal}");

                return [
                    'success' => true,
                    'message' => 'Caixa fechado com sucesso',
                    'data' => [
                        'id' => $caixaAberto['id'],
                        'saldo_final' => $saldoFinal,
                    ],
                ];
            }

            return ['success' => false, 'message' => 'Erro ao fechar caixa'];
        } catch (Exception $e) {
            error_log('Erro ao fechar caixa: '.$e->getMessage());

            return ['success' => false, 'message' => 'Erro ao fechar caixa: '.$e->getMessage()];
        }
    }

    // Adicionar movimento ao caixa
    public function adicionarMovimento($tipo, $valor, $descricao, $categoria, $usuario_id, $pedido_id = null)
    {
        try {
            $caixaAberto = $this->verificarCaixaAberto();
            if (!$caixaAberto) {
                return ['success' => false, 'message' => 'Nenhum caixa aberto'];
            }

            // Validar saldo para saídas
            if ($tipo === 'saida') {
                $saldoAtual = $this->calcularSaldoAtual($caixaAberto['id']);
                if ($valor > $saldoAtual) {
                    return ['success' => false, 'message' => 'Saldo insuficiente no caixa'];
                }
            }

            $query = "INSERT INTO {$this->table_movimentos} 
                      (caixa_id, tipo, valor, descricao, categoria, usuario_id, pedido_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->conn->prepare($query);
            $resultado = $stmt->execute([
                $caixaAberto['id'],
                $tipo,
                $valor,
                $descricao,
                $categoria,
                $usuario_id,
                $pedido_id,
            ]);

            if ($resultado) {
                $movimento_id = $this->conn->lastInsertId();
                error_log("✅ Movimento adicionado: {$tipo} R$ {$valor} - {$descricao}");

                return [
                    'success' => true,
                    'message' => 'Movimento registrado com sucesso',
                    'data' => ['id' => $movimento_id],
                ];
            }

            return ['success' => false, 'message' => 'Erro ao registrar movimento'];
        } catch (Exception $e) {
            error_log('Erro ao adicionar movimento: '.$e->getMessage());

            return ['success' => false, 'message' => 'Erro ao registrar movimento: '.$e->getMessage()];
        }
    }

    // Buscar movimentos do caixa
    public function buscarMovimentos($caixa_id = null, $filtros = [])
    {
        try {
            $where = [];
            $params = [];

            if ($caixa_id) {
                $where[] = 'cm.caixa_id = ?';
                $params[] = $caixa_id;
            } else {
                // Se não especificar, buscar do caixa atual
                $caixaAberto = $this->verificarCaixaAberto();
                if ($caixaAberto) {
                    $where[] = 'cm.caixa_id = ?';
                    $params[] = $caixaAberto['id'];
                }
            }

            if (!empty($filtros['tipo'])) {
                $where[] = 'cm.tipo = ?';
                $params[] = $filtros['tipo'];
            }

            if (!empty($filtros['categoria'])) {
                $where[] = 'cm.categoria = ?';
                $params[] = $filtros['categoria'];
            }

            if (!empty($filtros['data_inicio'])) {
                $where[] = 'DATE(cm.created_at) >= ?';
                $params[] = $filtros['data_inicio'];
            }

            if (!empty($filtros['data_fim'])) {
                $where[] = 'DATE(cm.created_at) <= ?';
                $params[] = $filtros['data_fim'];
            }

            $whereClause = !empty($where) ? 'WHERE '.implode(' AND ', $where) : '';

            $query = "SELECT 
                        cm.*,
                        u.nome as usuario_nome,
                        p.numero_pedido
                      FROM {$this->table_movimentos} cm
                      LEFT JOIN usuarios u ON cm.usuario_id = u.id
                      LEFT JOIN pedidos p ON cm.pedido_id = p.id
                      {$whereClause}
                      ORDER BY cm.created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log('Erro ao buscar movimentos: '.$e->getMessage());

            return [];
        }
    }

    // Adicione este método na sua classe Caixa (models/Caixa.php)

    public function fecharCaixa($usuarioId, $observacoes = '')
    {
        try {
            // Verificar se existe caixa aberto
            $caixaAberto = $this->verificarCaixaAberto();
            if (!$caixaAberto) {
                return ['success' => false, 'message' => 'Nenhum caixa aberto para fechar'];
            }

            // Calcular saldo final
            $saldoFinal = $this->calcularSaldoAtual($caixaAberto['id']);

            $query = "UPDATE {$this->table_caixa} 
                  SET status = 'fechado', 
                      data_fechamento = NOW(), 
                      saldo_final = ?, 
                      usuario_fechamento = ?, 
                      observacoes_fechamento = ? 
                  WHERE id = ?";

            $stmt = $this->conn->prepare($query);
            $resultado = $stmt->execute([
                $saldoFinal,
                $usuarioId,
                $observacoes,
                $caixaAberto['id'],
            ]);

            if ($resultado) {
                error_log("✅ Caixa fechado: ID {$caixaAberto['id']} - Saldo final: R$ {$saldoFinal}");

                return [
                    'success' => true,
                    'message' => 'Caixa fechado com sucesso',
                    'data' => [
                        'id' => $caixaAberto['id'],
                        'saldo_inicial' => $caixaAberto['saldo_inicial'],
                        'saldo_final' => $saldoFinal,
                        'data_fechamento' => date('Y-m-d H:i:s'),
                    ],
                ];
            }

            return ['success' => false, 'message' => 'Erro ao fechar caixa'];
        } catch (Exception $e) {
            error_log('Erro ao fechar caixa: '.$e->getMessage());

            return ['success' => false, 'message' => 'Erro ao fechar caixa: '.$e->getMessage()];
        }
    }

    // Método auxiliar para calcular saldo atual (se ainda não existir)
    private function calcularSaldoAtual($caixaId)
    {
        try {
            $query = "SELECT 
                    c.saldo_inicial,
                    COALESCE(SUM(CASE WHEN cm.tipo = 'entrada' THEN cm.valor ELSE 0 END), 0) as total_entradas,
                    COALESCE(SUM(CASE WHEN cm.tipo = 'saida' THEN cm.valor ELSE 0 END), 0) as total_saidas
                  FROM {$this->table_caixa} c
                  LEFT JOIN {$this->table_movimentos} cm ON c.id = cm.caixa_id
                  WHERE c.id = ?
                  GROUP BY c.id, c.saldo_inicial";

            $stmt = $this->conn->prepare($query);
            $stmt->execute([$caixaId]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado) {
                return $resultado['saldo_inicial'] + $resultado['total_entradas'] - $resultado['total_saidas'];
            }

            return 0;
        } catch (Exception $e) {
            error_log('Erro ao calcular saldo atual: '.$e->getMessage());

            return 0;
        }
    }

    // Calcular saldo atual do caixa
    /* public function calcularSaldoAtual($caixa_id = null)
    {
        try {
            if (!$caixa_id) {
                $caixaAberto = $this->verificarCaixaAberto();
                if (!$caixaAberto) {
                    return 0;
                }
                $caixa_id = $caixaAberto['id'];
            }

            $query = "SELECT
                        c.saldo_inicial,
                        COALESCE(SUM(CASE WHEN cm.tipo = 'entrada' THEN cm.valor ELSE 0 END), 0) as total_entradas,
                        COALESCE(SUM(CASE WHEN cm.tipo = 'saida' THEN cm.valor ELSE 0 END), 0) as total_saidas
                      FROM {$this->table_caixa} c
                      LEFT JOIN {$this->table_movimentos} cm ON c.id = cm.caixa_id
                      WHERE c.id = ?
                      GROUP BY c.id, c.saldo_inicial";

            $stmt = $this->conn->prepare($query);
            $stmt->execute([$caixa_id]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado) {
                return $resultado['saldo_inicial'] + $resultado['total_entradas'] - $resultado['total_saidas'];
            }

            return 0;
        } catch (Exception $e) {
            error_log('Erro ao calcular saldo: '.$e->getMessage());

            return 0;
        }
    } */

    // Obter resumo do caixa
    public function obterResumo($caixa_id = null)
    {
        try {
            if (!$caixa_id) {
                $caixaAberto = $this->verificarCaixaAberto();
                if (!$caixaAberto) {
                    return [
                        'caixa_aberto' => false,
                        'saldo_inicial' => 0,
                        'total_entradas' => 0,
                        'total_saidas' => 0,
                        'saldo_atual' => 0,
                        'total_movimentos' => 0,
                    ];
                }
                $caixa_id = $caixaAberto['id'];
                $caixaDados = $caixaAberto;
            } else {
                $query = "SELECT * FROM {$this->table_caixa} WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                $stmt->execute([$caixa_id]);
                $caixaDados = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            $query = "SELECT 
                        COUNT(*) as total_movimentos,
                        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entradas,
                        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas
                      FROM {$this->table_movimentos}
                      WHERE caixa_id = ?";

            $stmt = $this->conn->prepare($query);
            $stmt->execute([$caixa_id]);
            $resumo = $stmt->fetch(PDO::FETCH_ASSOC);

            $saldo_atual = $caixaDados['saldo_inicial'] + $resumo['total_entradas'] - $resumo['total_saidas'];

            return [
                'caixa_aberto' => $caixaDados['status'] === 'aberto',
                'caixa_id' => $caixa_id,
                'data_abertura' => $caixaDados['data_abertura'],
                'saldo_inicial' => floatval($caixaDados['saldo_inicial']),
                'total_entradas' => floatval($resumo['total_entradas']),
                'total_saidas' => floatval($resumo['total_saidas']),
                'saldo_atual' => $saldo_atual,
                'total_movimentos' => intval($resumo['total_movimentos']),
                'status' => $caixaDados['status'],
            ];
        } catch (Exception $e) {
            error_log('Erro ao obter resumo: '.$e->getMessage());

            return [];
        }
    }
}