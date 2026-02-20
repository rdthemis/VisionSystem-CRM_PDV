<?php

// src/Relatorios.php - Classe para gerenciar relatórios

class Relatorios
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database->conectar();
    }

    // Relatório de clientes
    public function relatorioClientes($filtros = [])
    {
        try {
            $where = ['c.ativo = 1'];
            $params = [];

            // Aplicar filtros
            if (!empty($filtros['tipo_pessoa'])) {
                $where[] = 'c.tipo_pessoa = ?';
                $params[] = $filtros['tipo_pessoa'];
            }

            if (!empty($filtros['cidade'])) {
                $where[] = 'c.cidade LIKE ?';
                $params[] = '%'.$filtros['cidade'].'%';
            }

            if (!empty($filtros['uf'])) {
                $where[] = 'c.uf = ?';
                $params[] = $filtros['uf'];
            }

            if (!empty($filtros['data_inicio'])) {
                $where[] = 'DATE(c.created_at) >= ?';
                $params[] = $filtros['data_inicio'];
            }

            if (!empty($filtros['data_fim'])) {
                $where[] = 'DATE(c.created_at) <= ?';
                $params[] = $filtros['data_fim'];
            }

            $sql = "
                SELECT 
                    c.*,
                    u.nome as usuario_criacao_nome,
                    CASE 
                        WHEN c.tipo_pessoa = 'fisica' THEN 'Pessoa Física'
                        WHEN c.tipo_pessoa = 'juridica' THEN 'Pessoa Jurídica'
                    END as tipo_pessoa_texto,
                    -- Totais de contas do cliente
                    COALESCE(cc.total_contas, 0) as total_contas,
                    COALESCE(cc.valor_total, 0) as valor_total_contas,
                    COALESCE(cc.valor_recebido, 0) as valor_recebido,
                    COALESCE(cc.valor_pendente, 0) as valor_pendente
                FROM clientes c
                LEFT JOIN usuarios u ON c.usuario_criacao = u.id
                LEFT JOIN (
                    SELECT 
                        cliente_id,
                        COUNT(*) as total_contas,
                        SUM(valor_original) as valor_total,
                        SUM(valor_recebido) as valor_recebido,
                        SUM(valor_original - valor_recebido) as valor_pendente
                    FROM contas_receber 
                    WHERE ativo = 1
                    GROUP BY cliente_id
                ) cc ON c.id = cc.cliente_id
                WHERE ".implode(' AND ', $where).'
                ORDER BY c.nome
            ';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcular totalizadores
            $totais = $this->calcularTotaisClientes($clientes);

            return [
                'success' => true,
                'data' => [
                    'clientes' => $clientes,
                    'totais' => $totais,
                    'filtros' => $filtros,
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no relatório de clientes: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar relatório de clientes',
            ];
        }
    }

    // Relatório financeiro
    public function relatorioFinanceiro($dataInicio, $dataFim, $tipo = 'completo')
    {
        try {
            $dados = [];

            // Contas a receber
            $dados['contas_receber'] = $this->getContasReceberPeriodo($dataInicio, $dataFim);

            // Recibos emitidos
            $dados['recibos'] = $this->getRecibosPeriodo($dataInicio, $dataFim);

            // Resumo por forma de pagamento
            $dados['por_forma_pagamento'] = $this->getResumoFormasPagamento($dataInicio, $dataFim);

            // Evolução diária
            $dados['evolucao_diaria'] = $this->getEvolucaoDiaria($dataInicio, $dataFim);

            // Clientes que mais pagaram
            $dados['top_clientes'] = $this->getTopClientesPagadores($dataInicio, $dataFim);

            return [
                'success' => true,
                'data' => [
                    'periodo' => [
                        'inicio' => $dataInicio,
                        'fim' => $dataFim,
                        'tipo' => $tipo,
                    ],
                    'resumo' => $dados,
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no relatório financeiro: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar relatório financeiro',
            ];
        }
    }

    // Relatório de inadimplência
    public function relatorioInadimplencia($diasAtraso = 30)
    {
        try {
            $sql = "
                SELECT 
                    c.id as cliente_id,
                    c.nome as cliente_nome,
                    c.cpf_cnpj as cliente_documento,
                    c.telefone as cliente_telefone,
                    c.email as cliente_email,
                    c.cidade as cliente_cidade,
                    c.uf as cliente_uf,
                    cr.id as conta_id,
                    cr.descricao as conta_descricao,
                    cr.numero_documento,
                    cr.valor_original,
                    cr.valor_recebido,
                    (cr.valor_original - cr.valor_recebido) as valor_pendente,
                    cr.data_vencimento,
                    cr.data_emissao,
                    DATEDIFF(CURDATE(), cr.data_vencimento) as dias_atraso,
                    CASE 
                        WHEN DATEDIFF(CURDATE(), cr.data_vencimento) <= 30 THEN 'Até 30 dias'
                        WHEN DATEDIFF(CURDATE(), cr.data_vencimento) <= 60 THEN '31-60 dias'
                        WHEN DATEDIFF(CURDATE(), cr.data_vencimento) <= 90 THEN '61-90 dias'
                        ELSE 'Mais de 90 dias'
                    END as faixa_atraso
                FROM contas_receber cr
                INNER JOIN clientes c ON cr.cliente_id = c.id
                WHERE cr.ativo = 1 
                AND cr.status = 'vencido'
                AND DATEDIFF(CURDATE(), cr.data_vencimento) >= ?
                AND (cr.valor_original - cr.valor_recebido) > 0
                ORDER BY dias_atraso DESC, valor_pendente DESC
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([$diasAtraso]);
            $inadimplentes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Agrupar por faixa de atraso
            $porFaixa = [];
            $totalGeral = 0;
            $valorTotalGeral = 0;

            foreach ($inadimplentes as $conta) {
                $faixa = $conta['faixa_atraso'];

                if (!isset($porFaixa[$faixa])) {
                    $porFaixa[$faixa] = [
                        'quantidade' => 0,
                        'valor_total' => 0,
                        'contas' => [],
                    ];
                }

                ++$porFaixa[$faixa]['quantidade'];
                $porFaixa[$faixa]['valor_total'] += $conta['valor_pendente'];
                $porFaixa[$faixa]['contas'][] = $conta;

                ++$totalGeral;
                $valorTotalGeral += $conta['valor_pendente'];
            }

            return [
                'success' => true,
                'data' => [
                    'inadimplentes' => $inadimplentes,
                    'por_faixa' => $porFaixa,
                    'resumo' => [
                        'total_contas' => $totalGeral,
                        'valor_total' => $valorTotalGeral,
                        'dias_minimo_atraso' => $diasAtraso,
                    ],
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no relatório de inadimplência: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar relatório de inadimplência',
            ];
        }
    }

    // Relatório de fluxo de caixa
    public function relatorioFluxoCaixa($dataInicio, $dataFim)
    {
        try {
            // Recebimentos realizados (recibos)
            $sql = "
                SELECT 
                    data_pagamento as data,
                    'entrada' as tipo,
                    'Recebimento' as categoria,
                    cliente_nome,
                    descricao,
                    forma_pagamento,
                    valor_liquido as valor
                FROM vw_recibos_completo
                WHERE status = 'ativo'
                AND data_pagamento BETWEEN ? AND ?
                ORDER BY data_pagamento, cliente_nome
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([$dataInicio, $dataFim]);
            $movimentacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Agrupar por data
            $porData = [];
            $totalEntradas = 0;

            foreach ($movimentacoes as $mov) {
                $data = $mov['data'];

                if (!isset($porData[$data])) {
                    $porData[$data] = [
                        'data' => $data,
                        'entradas' => 0,
                        'saidas' => 0,
                        'saldo' => 0,
                        'movimentacoes' => [],
                    ];
                }

                if ($mov['tipo'] === 'entrada') {
                    $porData[$data]['entradas'] += $mov['valor'];
                    $totalEntradas += $mov['valor'];
                }

                $porData[$data]['movimentacoes'][] = $mov;
                $porData[$data]['saldo'] = $porData[$data]['entradas'] - $porData[$data]['saidas'];
            }

            // Ordenar por data
            ksort($porData);

            return [
                'success' => true,
                'data' => [
                    'periodo' => [
                        'inicio' => $dataInicio,
                        'fim' => $dataFim,
                    ],
                    'movimentacoes' => $movimentacoes,
                    'por_data' => array_values($porData),
                    'resumo' => [
                        'total_entradas' => $totalEntradas,
                        'total_saidas' => 0, // Para futuras implementações
                        'saldo_periodo' => $totalEntradas,
                    ],
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no relatório de fluxo de caixa: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar relatório de fluxo de caixa',
            ];
        }
    }

    // Métodos auxiliares privados

    private function calcularTotaisClientes($clientes)
    {
        $totais = [
            'total_clientes' => count($clientes),
            'pessoa_fisica' => 0,
            'pessoa_juridica' => 0,
            'valor_total_contas' => 0,
            'valor_recebido' => 0,
            'valor_pendente' => 0,
            'por_uf' => [],
            'por_cidade' => [],
        ];

        foreach ($clientes as $cliente) {
            // Contadores por tipo
            if ($cliente['tipo_pessoa'] === 'fisica') {
                ++$totais['pessoa_fisica'];
            } else {
                ++$totais['pessoa_juridica'];
            }

            // Valores financeiros
            $totais['valor_total_contas'] += $cliente['valor_total_contas'];
            $totais['valor_recebido'] += $cliente['valor_recebido'];
            $totais['valor_pendente'] += $cliente['valor_pendente'];

            // Por UF
            $uf = $cliente['uf'] ?: 'Não informado';
            if (!isset($totais['por_uf'][$uf])) {
                $totais['por_uf'][$uf] = 0;
            }
            ++$totais['por_uf'][$uf];

            // Por cidade
            $cidade = $cliente['cidade'] ?: 'Não informado';
            if (!isset($totais['por_cidade'][$cidade])) {
                $totais['por_cidade'][$cidade] = 0;
            }
            ++$totais['por_cidade'][$cidade];
        }

        return $totais;
    }

    private function getContasReceberPeriodo($dataInicio, $dataFim)
    {
        $sql = "
            SELECT 
                COUNT(*) as total_contas,
                SUM(valor_original) as valor_total,
                SUM(valor_recebido) as valor_recebido,
                SUM(valor_original - valor_recebido) as valor_pendente,
                SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) as contas_pagas,
                SUM(CASE WHEN status = 'vencido' THEN 1 ELSE 0 END) as contas_vencidas
            FROM contas_receber 
            WHERE ativo = 1 
            AND data_vencimento BETWEEN ? AND ?
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getRecibosPeriodo($dataInicio, $dataFim)
    {
        $sql = "
            SELECT 
                COUNT(*) as total_recibos,
                SUM(valor_recebido) as valor_recebido,
                SUM(valor_desconto) as valor_desconto,
                SUM(valor_juros) as valor_juros,
                SUM(valor_multa) as valor_multa,
                SUM(valor_liquido) as valor_liquido
            FROM recibos 
            WHERE status = 'ativo'
            AND data_emissao BETWEEN ? AND ?
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getResumoFormasPagamento($dataInicio, $dataFim)
    {
        $sql = "
            SELECT 
                forma_pagamento,
                COUNT(*) as quantidade,
                SUM(valor_liquido) as valor_total
            FROM recibos 
            WHERE status = 'ativo'
            AND data_emissao BETWEEN ? AND ?
            GROUP BY forma_pagamento
            ORDER BY valor_total DESC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getEvolucaoDiaria($dataInicio, $dataFim)
    {
        $sql = "
            SELECT 
                data_emissao as data,
                COUNT(*) as quantidade,
                SUM(valor_liquido) as valor_total
            FROM recibos 
            WHERE status = 'ativo'
            AND data_emissao BETWEEN ? AND ?
            GROUP BY data_emissao
            ORDER BY data_emissao
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getTopClientesPagadores($dataInicio, $dataFim)
    {
        $sql = "
            SELECT 
                c.id,
                c.nome,
                c.cpf_cnpj,
                COUNT(r.id) as total_recibos,
                SUM(r.valor_liquido) as valor_total_pago
            FROM recibos r
            INNER JOIN clientes c ON r.cliente_id = c.id
            WHERE r.status = 'ativo'
            AND r.data_emissao BETWEEN ? AND ?
            GROUP BY c.id, c.nome, c.cpf_cnpj
            ORDER BY valor_total_pago DESC
            LIMIT 10
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Salvar configuração de relatório
    public function salvarRelatorio($dados, $usuarioId)
    {
        try {
            $stmt = $this->db->prepare('
                INSERT INTO relatorios_salvos (
                    nome, tipo, filtros, campos, configuracoes, 
                    usuario_criacao, publico, periodo_inicio, periodo_fim
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $dados['nome'],
                $dados['tipo'],
                json_encode($dados['filtros'] ?? []),
                json_encode($dados['campos'] ?? []),
                json_encode($dados['configuracoes'] ?? []),
                $usuarioId,
                $dados['publico'] ?? false,
                $dados['periodo_inicio'] ?? null,
                $dados['periodo_fim'] ?? null,
            ]);

            $relatorioId = $this->db->lastInsertId();

            return [
                'success' => true,
                'message' => 'Relatório salvo com sucesso',
                'data' => ['id' => $relatorioId],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao salvar relatório: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao salvar relatório',
            ];
        }
    }

    // Listar relatórios salvos
    public function listarRelatoriosSalvos($usuarioId, $incluirPublicos = true)
    {
        try {
            $where = ['usuario_criacao = ?'];
            $params = [$usuarioId];

            if ($incluirPublicos) {
                $where = ['(usuario_criacao = ? OR publico = 1)'];
            }

            $sql = '
                SELECT 
                    rs.*,
                    u.nome as usuario_nome
                FROM relatorios_salvos rs
                LEFT JOIN usuarios u ON rs.usuario_criacao = u.id
                WHERE '.implode(' AND ', $where).'
                ORDER BY rs.created_at DESC
            ';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $relatorios = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decodificar JSON
            foreach ($relatorios as &$relatorio) {
                $relatorio['filtros'] = json_decode($relatorio['filtros'], true);
                $relatorio['campos'] = json_decode($relatorio['campos'], true);
                $relatorio['configuracoes'] = json_decode($relatorio['configuracoes'], true);
            }

            return [
                'success' => true,
                'data' => $relatorios,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar relatórios salvos: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao listar relatórios',
            ];
        }
    }

    // Executar relatório salvo
    public function executarRelatorioSalvo($id, $usuarioId)
    {
        try {
            $stmt = $this->db->prepare('
                SELECT * FROM relatorios_salvos 
                WHERE id = ? AND (usuario_criacao = ? OR publico = 1)
            ');
            $stmt->execute([$id, $usuarioId]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$config) {
                return [
                    'success' => false,
                    'message' => 'Relatório não encontrado',
                ];
            }

            // Decodificar configurações
            $filtros = json_decode($config['filtros'], true) ?? [];
            $campos = json_decode($config['campos'], true) ?? [];
            $configuracoes = json_decode($config['configuracoes'], true) ?? [];

            // Executar relatório baseado no tipo
            switch ($config['tipo']) {
                case 'clientes':
                    $resultado = $this->relatorioClientes($filtros);
                    break;
                case 'financeiro':
                    $resultado = $this->relatorioFinanceiro(
                        $config['periodo_inicio'] ?? date('Y-m-01'),
                        $config['periodo_fim'] ?? date('Y-m-t')
                    );
                    break;
                case 'inadimplencia':
                    $resultado = $this->relatorioInadimplencia($filtros['dias_atraso'] ?? 30);
                    break;
                case 'fluxo_caixa':
                    $resultado = $this->relatorioFluxoCaixa(
                        $config['periodo_inicio'] ?? date('Y-m-01'),
                        $config['periodo_fim'] ?? date('Y-m-t')
                    );
                    break;
                default:
                    return [
                        'success' => false,
                        'message' => 'Tipo de relatório não suportado',
                    ];
            }

            if ($resultado['success']) {
                $resultado['data']['configuracao'] = $config;
            }

            return $resultado;
        } catch (Exception $e) {
            error_log('❌ Erro ao executar relatório salvo: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao executar relatório',
            ];
        }
    }

    // Gerar dados para dashboard
    public function dashboardResumo($periodo = '30')
    {
        try {
            $dataInicio = date('Y-m-d', strtotime("-{$periodo} days"));
            $dataFim = date('Y-m-d');

            $dados = [];

            // Resumo geral
            $dados['resumo'] = $this->getResumoGeral($dataInicio, $dataFim);

            // Evolução dos últimos dias
            $dados['evolucao'] = $this->getEvolucaoDiaria($dataInicio, $dataFim);

            // Formas de pagamento mais utilizadas
            $dados['formas_pagamento'] = $this->getResumoFormasPagamento($dataInicio, $dataFim);

            // Clientes que mais contribuíram
            $dados['top_clientes'] = $this->getTopClientesPagadores($dataInicio, $dataFim);

            return [
                'success' => true,
                'data' => $dados,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no dashboard: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao carregar dashboard',
            ];
        }
    }

    private function getResumoGeral($dataInicio, $dataFim)
    {
        $sql = "
            SELECT 
                -- Recibos
                (SELECT COUNT(*) FROM recibos WHERE status = 'ativo' AND data_emissao BETWEEN ? AND ?) as total_recibos,
                (SELECT COALESCE(SUM(valor_liquido), 0) FROM recibos WHERE status = 'ativo' AND data_emissao BETWEEN ? AND ?) as valor_recebido,
                
                -- Contas a receber
                (SELECT COUNT(*) FROM contas_receber WHERE ativo = 1 AND data_vencimento BETWEEN ? AND ?) as total_contas,
                (SELECT COALESCE(SUM(valor_original - valor_recebido), 0) FROM contas_receber WHERE ativo = 1 AND status IN ('pendente', 'vencido')) as valor_pendente,
                
                -- Clientes ativos
                (SELECT COUNT(*) FROM clientes WHERE ativo = 1) as total_clientes
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$dataInicio, $dataFim, $dataInicio, $dataFim, $dataInicio, $dataFim]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Exportar para CSV
    public function exportarCSV($dados, $nomeArquivo, $cabecalhos = [])
    {
        try {
            $csv = fopen('php://temp', 'r+');

            // Escrever cabeçalhos se fornecidos
            if (!empty($cabecalhos)) {
                fputcsv($csv, $cabecalhos, ';');
            }

            // Escrever dados
            foreach ($dados as $linha) {
                fputcsv($csv, $linha, ';');
            }

            rewind($csv);
            $csvContent = stream_get_contents($csv);
            fclose($csv);

            // Adicionar BOM para UTF-8
            $csvContent = "\xEF\xBB\xBF".$csvContent;

            return [
                'success' => true,
                'data' => [
                    'content' => $csvContent,
                    'filename' => $nomeArquivo,
                    'mime_type' => 'text/csv; charset=utf-8',
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao exportar CSV: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao exportar dados',
            ];
        }
    }

    // Gerar relatório personalizado
    public function relatorioPersonalizado($config)
    {
        try {
            $tabelas = $config['tabelas'] ?? [];
            $campos = $config['campos'] ?? [];
            $filtros = $config['filtros'] ?? [];
            $ordenacao = $config['ordenacao'] ?? [];

            // Construir SQL dinamicamente (implementação básica)
            // Em produção, seria necessário validação rigorosa para evitar SQL injection

            $sql = 'SELECT '.implode(', ', $campos).' FROM '.implode(' ', $tabelas);

            if (!empty($filtros)) {
                $sql .= ' WHERE '.implode(' AND ', $filtros);
            }

            if (!empty($ordenacao)) {
                $sql .= ' ORDER BY '.implode(', ', $ordenacao);
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'data' => [
                    'resultados' => $dados,
                    'configuracao' => $config,
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro no relatório personalizado: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar relatório personalizado',
            ];
        }
    }
}