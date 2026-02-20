<?php

class Recibos
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database;
    }

    /**
     * Listar recibos com filtros e paginação.
     */
    public function listar($filtros = [])
    {
        try {
            $pdo = $this->db->conectar();

            // Debug: Log dos filtros recebidos
            error_log('🧾 Recibos - Filtros recebidos: '.json_encode($filtros));

            // Construir WHERE clause
            $where = ['r.status = :status'];
            $params = ['status' => 'ativo'];

            // Filtro por cliente
            if (!empty($filtros['cliente_id'])) {
                $where[] = 'r.cliente_id = :cliente_id';
                $params['cliente_id'] = $filtros['cliente_id'];
            }

            // Filtro por forma de pagamento
            if (!empty($filtros['forma_pagamento'])) {
                $where[] = 'r.forma_pagamento = :forma_pagamento';
                $params['forma_pagamento'] = $filtros['forma_pagamento'];
            }

            // Filtro por data de emissão
            if (!empty($filtros['data_inicio'])) {
                $where[] = 'r.data_emissao >= :data_inicio';
                $params['data_inicio'] = $filtros['data_inicio'];
            }

            if (!empty($filtros['data_fim'])) {
                $where[] = 'r.data_emissao <= :data_fim';
                $params['data_fim'] = $filtros['data_fim'];
            }

            // Filtro por número do recibo
            if (!empty($filtros['numero_recibo'])) {
                $where[] = 'r.numero_recibo LIKE :numero_recibo';
                $params['numero_recibo'] = '%'.$filtros['numero_recibo'].'%';
            }

            // Paginação
            $limite = intval($filtros['limite'] ?? 10);
            $pagina = intval($filtros['pagina'] ?? 1);
            $offset = ($pagina - 1) * $limite;

            // Ordenação
            $ordenacao = $filtros['ordenacao'] ?? 'data_emissao';
            $direcao = strtoupper($filtros['direcao'] ?? 'DESC');

            // Validar ordenação
            $ordenacoesValidas = ['data_emissao', 'numero_recibo', 'valor_liquido', 'cliente_nome'];
            if (!in_array($ordenacao, $ordenacoesValidas)) {
                $ordenacao = 'data_emissao';
            }

            if (!in_array($direcao, ['ASC', 'DESC'])) {
                $direcao = 'DESC';
            }

            // Query principal
            $whereClause = implode(' AND ', $where);
            $sql = "
                SELECT 
                    r.id,
                    r.numero_recibo,
                    r.cliente_id,
                    r.descricao,
                    r.valor_liquido,
                    r.data_emissao,
                    r.data_pagamento,
                    r.forma_pagamento,
                    r.observacoes,
                    r.created_at,
                    c.nome as cliente_nome,
                    c.cpf_cnpj as cliente_documento,
                    c.tipo_pessoa as cliente_tipo_pessoa,
                    u.nome as usuario_nome
                FROM recibos r
                INNER JOIN clientes c ON r.cliente_id = c.id
                LEFT JOIN usuarios u ON r.usuario_id = u.id
                WHERE {$whereClause}
                ORDER BY r.{$ordenacao} {$direcao}
                LIMIT :limite OFFSET :offset
            ";

            // Debug: Log da query
            error_log('🧾 Recibos - SQL Query: '.$sql);
            error_log('🧾 Recibos - Parâmetros: '.json_encode($params));

            $stmt = $pdo->prepare($sql);

            // Bind dos parâmetros
            foreach ($params as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

            $stmt->execute();
            $recibos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug: Log dos resultados
            error_log('🧾 Recibos - Resultados encontrados: '.count($recibos));
            if (!empty($recibos)) {
                error_log('🧾 Recibos - Primeiro registro: '.json_encode($recibos[0]));
            }

            // Contar total para paginação
            $sqlCount = "
                SELECT COUNT(*) as total
                FROM recibos r
                INNER JOIN clientes c ON r.cliente_id = c.id
                WHERE {$whereClause}
            ";

            $stmtCount = $pdo->prepare($sqlCount);
            foreach ($params as $key => $value) {
                $stmtCount->bindValue(":{$key}", $value);
            }
            $stmtCount->execute();
            $total = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];

            return [
                'success' => true,
                'data' => $recibos,
                'pagination' => [
                    'total' => intval($total),
                    'por_pagina' => $limite,
                    'pagina_atual' => $pagina,
                    'total_paginas' => ceil($total / $limite),
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar recibos: '.$e->getMessage());
            error_log('❌ Stack trace: '.$e->getTraceAsString());

            return [
                'success' => false,
                'message' => 'Erro ao buscar recibos',
                'debug' => [
                    'error' => $e->getMessage(),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                ],
            ];
        }
    }

    /**
     * Buscar recibo por ID.
     */
    public function buscarPorId($id)
    {
        try {
            $pdo = $this->db->conectar();

            $stmt = $pdo->prepare('
                SELECT 
                    r.*,
                    c.nome as cliente_nome,
                    c.cpf_cnpj as cliente_documento,
                    c.tipo_pessoa as cliente_tipo_pessoa,
                    u.nome as usuario_nome
                FROM recibos r
                INNER JOIN clientes c ON r.cliente_id = c.id
                LEFT JOIN usuarios u ON r.usuario_id = u.id
                WHERE r.id = ? AND r.status = "ativo"
            ');

            $stmt->execute([$id]);
            $recibo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$recibo) {
                return [
                    'success' => false,
                    'message' => 'Recibo não encontrado',
                ];
            }

            return [
                'success' => true,
                'data' => $recibo,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar recibo por ID: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao buscar recibo',
            ];
        }
    }

    /**
     * Criar novo recibo.
     */
    public function criar($dados, $usuarioId)
    {
        try {
            $pdo = $this->db->conectar();

            // Debug: Log dos dados recebidos
            error_log('🧾 Dados recebidos para criar recibo: '.json_encode($dados));
            error_log('🧾 Usuario ID: '.$usuarioId);

            // Validações
            if (empty($dados['cliente_id']) || empty($dados['descricao']) || empty($dados['valor_liquido'])) {
                return [
                    'success' => false,
                    'message' => 'Dados obrigatórios não fornecidos (cliente_id, descricao, valor_liquido)',
                ];
            }

            // Validar se cliente existe
            $stmtCliente = $pdo->prepare('SELECT id FROM clientes WHERE id = ? AND ativo = 1');
            $stmtCliente->execute([$dados['cliente_id']]);
            if (!$stmtCliente->fetch()) {
                return [
                    'success' => false,
                    'message' => 'Cliente não encontrado',
                ];
            }

            // Gerar número do recibo
            $numeroRecibo = $this->gerarNumeroRecibo($pdo);

            $stmt = $pdo->prepare('
                INSERT INTO recibos (
                    numero_recibo, cliente_id, descricao, valor_liquido, 
                    data_emissao, data_pagamento, forma_pagamento, 
                    observacoes, usuario_id, status, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, "ativo", NOW()
                )
            ');

            $success = $stmt->execute([
                $numeroRecibo,
                $dados['cliente_id'],
                $dados['descricao'],
                floatval($dados['valor_liquido']), // Garantir que é float
                $dados['data_emissao'] ?? date('Y-m-d'),
                !empty($dados['data_pagamento']) ? $dados['data_pagamento'] : null,
                $dados['forma_pagamento'] ?? 'dinheiro',
                $dados['observacoes'] ?? '',
                $usuarioId,
            ]);

            if ($success) {
                $reciboId = $pdo->lastInsertId();

                error_log('✅ Recibo criado com sucesso - ID: '.$reciboId);

                return [
                    'success' => true,
                    'message' => 'Recibo criado com sucesso',
                    'data' => [
                        'id' => $reciboId,
                        'numero_recibo' => $numeroRecibo,
                    ],
                ];
            } else {
                error_log('❌ Falha ao executar INSERT do recibo');

                return [
                    'success' => false,
                    'message' => 'Erro ao inserir recibo no banco de dados',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao criar recibo: '.$e->getMessage());
            error_log('❌ Stack trace: '.$e->getTraceAsString());

            return [
                'success' => false,
                'message' => 'Erro interno ao criar recibo',
                'debug' => [
                    'error' => $e->getMessage(),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                ],
            ];
        }
    }

    /**
     * Cancelar recibo.
     */
    public function cancelar($id)
    {
        try {
            $pdo = $this->db->conectar();

            $stmt = $pdo->prepare('
                UPDATE recibos 
                SET status = "cancelado", updated_at = NOW() 
                WHERE id = ? AND status = "ativo"
            ');

            $success = $stmt->execute([$id]);

            if ($success && $stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => 'Recibo cancelado com sucesso',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Recibo não encontrado ou já cancelado',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao cancelar recibo: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao cancelar recibo',
            ];
        }
    }

    /**
     * Gerar número sequencial do recibo.
     */
    private function gerarNumeroRecibo($pdo)
    {
        try {
            $stmt = $pdo->query('
                SELECT numero_recibo 
                FROM recibos 
                WHERE numero_recibo LIKE "REC-%" 
                ORDER BY id DESC 
                LIMIT 1
            ');

            $ultimo = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($ultimo) {
                $numero = intval(str_replace('REC-', '', $ultimo['numero_recibo']));
                $proximoNumero = $numero + 1;
            } else {
                $proximoNumero = 1;
            }

            return 'REC-'.str_pad($proximoNumero, 6, '0', STR_PAD_LEFT);
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar número do recibo: '.$e->getMessage());

            return 'REC-'.date('YmdHis');
        }
    }

    /**
     * Gerar recibo automaticamente para um pagamento.
     */
    public function gerarParaPagamento($contaId, $dadosPagamento, $usuarioId)
    {
        try {
            $pdo = $this->db->conectar();

            // Buscar dados da conta
            $stmt = $pdo->prepare('
                SELECT 
                    cr.*,
                    c.nome as cliente_nome,
                    c.cpf_cnpj as cliente_documento,
                    c.tipo_pessoa as cliente_tipo_pessoa
                FROM contas_receber cr
                INNER JOIN clientes c ON cr.cliente_id = c.id
                WHERE cr.id = ? AND cr.ativo = 1
            ');
            $stmt->execute([$contaId]);
            $conta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$conta) {
                return [
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ];
            }

            // Gerar número do recibo
            $numeroRecibo = $this->gerarNumeroRecibo($pdo);

            // Criar descrição automática do recibo
            $descricao = 'Pagamento referente à conta: '.$conta['descricao'];
            if (!empty($dadosPagamento['observacoes'])) {
                $descricao .= "\n\nObservações: ".$dadosPagamento['observacoes'];
            }

            // Inserir recibo
            $stmt = $pdo->prepare('
                INSERT INTO recibos (
                    numero_recibo, cliente_id, descricao, valor_liquido, 
                    data_emissao, data_pagamento, forma_pagamento, 
                    observacoes, usuario_id, status, conta_receber_id, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, "ativo", ?, NOW()
                )
            ');

            $success = $stmt->execute([
                $numeroRecibo,
                $conta['cliente_id'],
                $descricao,
                floatval($dadosPagamento['valor_pago']),
                $dadosPagamento['data_pagamento'] ?? date('Y-m-d'),
                $dadosPagamento['data_pagamento'] ?? date('Y-m-d'),
                $dadosPagamento['forma_pagamento'] ?? 'dinheiro',
                $dadosPagamento['observacoes'] ?? '',
                $usuarioId,
                $contaId,
            ]);

            if ($success) {
                $reciboId = $pdo->lastInsertId();

                // Buscar dados completos do recibo criado
                $recibo = $this->buscarPorId($reciboId);

                error_log('✅ Recibo gerado automaticamente - ID: '.$reciboId.' - Número: '.$numeroRecibo);

                return [
                    'success' => true,
                    'message' => 'Recibo gerado automaticamente',
                    'data' => [
                        'id' => $reciboId,
                        'numero_recibo' => $numeroRecibo,
                        'recibo_completo' => $recibo['data'] ?? null,
                    ],
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao gerar recibo',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar recibo para pagamento: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro interno ao gerar recibo',
            ];
        }
    }

    /**
     * Gerar recibo para impressão.
     */
    public function gerarParaImpressao($id)
    {
        try {
            $pdo = $this->db;

            // Buscar dados completos do recibo
            $stmt = $pdo->prepare('
            SELECT 
                r.*,
                c.nome as cliente_nome,
                c.cpf_cnpj as cliente_documento,
                c.endereco as cliente_endereco,
                c.cidade as cliente_cidade,
                c.uf as cliente_uf,
                c.cep as cliente_cep,
                c.telefone as cliente_telefone,
                c.email as cliente_email,
                c.tipo_pessoa as cliente_tipo_pessoa,
                nome as usuario_nome
            FROM recibos r
            INNER JOIN clientes c ON r.cliente_id = c.id
            WHERE r.id = ? AND r.status = "ativo"
        ');

            $stmt->execute([$id]);
            $recibo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$recibo) {
                return [
                    'success' => false,
                    'message' => 'Recibo não encontrado',
                ];
            }

            // Gerar HTML do recibo
            $html = $this->gerarHTMLRecibo($recibo);

            return [
                'success' => true,
                'html' => $html,
                'recibo' => $recibo,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar recibo para impressão: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar recibo para impressão',
            ];
        }
    }

    /**
     * Gerar HTML formatado do recibo.
     */
    private function gerarHTMLRecibo($recibo)
    {
        // Formatações
        $valorFormatado = 'R$ '.number_format($recibo['valor_liquido'], 2, ',', '.');
        $dataEmissao = date('d/m/Y', strtotime($recibo['data_emissao']));
        $dataPagamento = $recibo['data_pagamento'] ? date('d/m/Y', strtotime($recibo['data_pagamento'])) : 'Não informado';

        // Formatar documento do cliente
        $documento = $recibo['cliente_documento'];
        if ($recibo['cliente_tipo_pessoa'] === 'fisica' && strlen($documento) === 11) {
            // Formatir CPF: 000.000.000-00
            $documento = substr($documento, 0, 3).'.'.
                        substr($documento, 3, 3).'.'.
                        substr($documento, 6, 3).'-'.
                        substr($documento, 9, 2);
        } elseif ($recibo['cliente_tipo_pessoa'] === 'juridica' && strlen($documento) === 14) {
            // Formatir CNPJ: 00.000.000/0000-00
            $documento = substr($documento, 0, 2).'.'.
                        substr($documento, 2, 3).'.'.
                        substr($documento, 5, 3).'/'.
                        substr($documento, 8, 4).'-'.
                        substr($documento, 12, 2);
        }

        // Número por extenso (função auxiliar)
        $valorExtenso = $this->numeroParaExtenso($recibo['valor_liquido']);

        $html = '
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo #'.$recibo['numero_recibo'].'</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
                color: #333;
                background: white;
                padding: 20px;
            }
            
            .recibo-container {
                max-width: 800px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 30px;
                background: white;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            .numero-recibo {
                font-size: 18px;
                font-weight: bold;
                color: #666;
            }
            
            .section {
                margin-bottom: 25px;
            }
            
            .section-title {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 10px;
                color: #333;
                text-transform: uppercase;
                border-bottom: 1px solid #ccc;
                padding-bottom: 5px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .info-item {
                margin-bottom: 8px;
            }
            
            .info-label {
                font-weight: bold;
                color: #555;
            }
            
            .info-value {
                margin-left: 10px;
            }
            
            .valor-section {
                background: #f8f9fa;
                border: 2px solid #333;
                padding: 20px;
                margin: 30px 0;
                text-align: center;
            }
            
            .valor-numerico {
                font-size: 32px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 10px;
            }
            
            .valor-extenso {
                font-size: 16px;
                color: #666;
                font-style: italic;
                text-transform: uppercase;
            }
            
            .descricao-section {
                border: 1px solid #ddd;
                padding: 15px;
                background: #fafafa;
                min-height: 80px;
                font-size: 15px;
                line-height: 1.6;
            }
            
            .assinatura-section {
                margin-top: 60px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 60px;
            }
            
            .assinatura-box {
                text-align: center;
                padding-top: 40px;
                border-top: 2px solid #333;
            }
            
            .assinatura-label {
                font-weight: bold;
                color: #555;
            }
            
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 15px;
            }
            
            /* Estilos para impressão */
            @media print {
                body {
                    padding: 0;
                    background: white;
                }
                
                .recibo-container {
                    border: 2px solid #000;
                    box-shadow: none;
                    max-width: none;
                }
                
                .no-print {
                    display: none;
                }
            }
            
            @page {
                size: A4;
                margin: 1cm;
            }
        </style>
    </head>
    <body>
        <div class="recibo-container">
            <!-- CABEÇALHO -->
            <div class="header">
                <h1>🧾 RECIBO</h1>
                <div class="numero-recibo">Nº '.$recibo['numero_recibo'].'</div>
            </div>
            
            <!-- INFORMAÇÕES DO RECIBO -->
            <div class="section">
                <div class="section-title">📋 Informações do Recibo</div>
                <div class="info-grid">
                    <div>
                        <div class="info-item">
                            <span class="info-label">Data de Emissão:</span>
                            <span class="info-value">'.$dataEmissao.'</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Data do Pagamento:</span>
                            <span class="info-value">'.$dataPagamento.'</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <span class="info-label">Forma de Pagamento:</span>
                            <span class="info-value">'.ucfirst($recibo['forma_pagamento']).'</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Emitido por:</span>
                            <span class="info-value">'.($recibo['usuario_nome'] ?: 'Sistema').'</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- DADOS DO CLIENTE -->
            <div class="section">
                <div class="section-title">👤 Dados do Cliente</div>
                <div class="info-grid">
                    <div>
                        <div class="info-item">
                            <span class="info-label">Nome:</span>
                            <span class="info-value">'.$recibo['cliente_nome'].'</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">'.($recibo['cliente_tipo_pessoa'] === 'fisica' ? 'CPF' : 'CNPJ').':</span>
                            <span class="info-value">'.$documento.'</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Telefone:</span>
                            <span class="info-value">'.($recibo['cliente_telefone'] ?: 'Não informado').'</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">'.($recibo['cliente_email'] ?: 'Não informado').'</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Cidade/UF:</span>
                            <span class="info-value">'.($recibo['cliente_cidade'] ? $recibo['cliente_cidade'].'/'.$recibo['cliente_uf'] : 'Não informado').'</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">CEP:</span>
                            <span class="info-value">'.($recibo['cliente_cep'] ?: 'Não informado').'</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- VALOR -->
            <div class="valor-section">
                <div class="valor-numerico">'.$valorFormatado.'</div>
                <div class="valor-extenso">('.$valorExtenso.')</div>
            </div>
            
            <!-- DESCRIÇÃO -->
            <div class="section">
                <div class="section-title">📝 Descrição dos Serviços/Produtos</div>
                <div class="descricao-section">
                    '.nl2br(htmlspecialchars($recibo['descricao'])).'
                </div>
            </div>
            
            <!-- ASSINATURAS -->
            <div class="assinatura-section">
                <div class="assinatura-box">
                    <div class="assinatura-label">Assinatura do Emitente</div>
                </div>
                <div class="assinatura-box">
                    <div class="assinatura-label">Assinatura do Cliente</div>
                </div>
            </div>
            
            <!-- RODAPÉ -->
            <div class="footer">
                <p>📍 Recibo gerado digitalmente em '.date('d/m/Y H:i:s').'</p>
                <p>⚡ Sistema de Gestão Financeira</p>
            </div>
        </div>
        
        <!-- Botões de ação (não aparece na impressão) -->
        <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="background: #3182ce; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 16px;">
                🖨️ Imprimir
            </button>
            <button onclick="window.close()" style="background: #666; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                ❌ Fechar
            </button>
        </div>
        
        <script>
            // Auto-focus para impressão quando a página carrega
            window.onload = function() {
                // Aguarda um pouco para garantir que a página carregou completamente
                setTimeout(function() {
                    // Foca na janela para que os comandos de teclado funcionem
                    window.focus();
                }, 500);
            };
            
            // Atalho Ctrl+P para imprimir
            document.addEventListener("keydown", function(e) {
                if (e.ctrlKey && e.key === "p") {
                    e.preventDefault();
                    window.print();
                }
            });
        </script>
    </body>
    </html>';

        return $html;
    }

    /**
     * Converter número para extenso (versão simplificada).
     */
    private function numeroParaExtenso($valor)
    {
        $valor = floatval($valor);

        if ($valor == 0) {
            return 'zero reais';
        }

        // Separar reais e centavos
        $reais = intval($valor);
        $centavos = intval(($valor - $reais) * 100);

        $resultado = '';

        // Parte dos reais
        if ($reais == 1) {
            $resultado = 'um real';
        } elseif ($reais > 1) {
            $resultado = $this->numeroParaTexto($reais).' reais';
        }

        // Parte dos centavos
        if ($centavos > 0) {
            if ($reais > 0) {
                $resultado .= ' e ';
            }

            if ($centavos == 1) {
                $resultado .= 'um centavo';
            } else {
                $resultado .= $this->numeroParaTexto($centavos).' centavos';
            }
        }

        return $resultado;
    }

    /**
     * Converter número para texto (auxiliar).
     */
    private function numeroParaTexto($numero)
    {
        $unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        $especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        $dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        $centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        if ($numero == 0) {
            return 'zero';
        }
        if ($numero == 100) {
            return 'cem';
        }

        $resultado = '';

        // Milhares (simplificado até 999.999)
        if ($numero >= 1000) {
            $milhares = intval($numero / 1000);
            if ($milhares == 1) {
                $resultado .= 'mil';
            } else {
                $resultado .= $this->numeroParaTexto($milhares).' mil';
            }
            $numero = $numero % 1000;
            if ($numero > 0) {
                $resultado .= ' e ';
            }
        }

        // Centenas
        if ($numero >= 100) {
            $centena = intval($numero / 100);
            $resultado .= $centenas[$centena];
            $numero = $numero % 100;
            if ($numero > 0) {
                $resultado .= ' e ';
            }
        }

        // Dezenas e unidades
        if ($numero >= 20) {
            $dezena = intval($numero / 10);
            $resultado .= $dezenas[$dezena];
            $numero = $numero % 10;
            if ($numero > 0) {
                $resultado .= ' e ';
            }
        } elseif ($numero >= 10) {
            $resultado .= $especiais[$numero - 10];

            return $resultado;
        }

        // Unidades
        if ($numero > 0) {
            $resultado .= $unidades[$numero];
        }

        return $resultado;
    }

    // Gerar HTML do recibo para impressão
    /* public function gerarHtmlRecibo($id)
    {
        try {
            $resultado = $this->buscarPorId($id);

            if (!$resultado['success']) {
                return $resultado;
            }

            $recibo = $resultado['data'];

            // HTML do recibo
            $html = $this->gerarTemplateRecibo($recibo);

            return [
                'success' => true,
                'data' => [
                    'html' => $html,
                    'recibo' => $recibo,
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar HTML do recibo: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar recibo para impressão',
            ];
        }
    } */

    // Template HTML para impressão do recibo
    private function gerarTemplateRecibo($recibo)
    {
        $dataEmissao = date('d/m/Y', strtotime($recibo['data_emissao']));
        $dataPagamento = date('d/m/Y', strtotime($recibo['data_pagamento']));

        $valorRecebido = number_format($recibo['valor_recebido'], 2, ',', '.');
        $valorDesconto = number_format($recibo['valor_desconto'], 2, ',', '.');
        $valorJuros = number_format($recibo['valor_juros'], 2, ',', '.');
        $valorMulta = number_format($recibo['valor_multa'], 2, ',', '.');
        $valorLiquido = number_format($recibo['valor_liquido'], 2, ',', '.');

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Recibo {$recibo['numero_recibo']}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
                .recibo { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
                .numero { font-size: 18px; font-weight: bold; color: #333; }
                .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .label { font-weight: bold; }
                .valores { border-top: 1px solid #ccc; margin-top: 20px; padding-top: 15px; }
                .total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; text-align: center; font-size: 10px; }
            </style>
        </head>
        <body>
            <div class='recibo'>
                <div class='header'>
                    <h2>RECIBO DE PAGAMENTO</h2>
                    <div class='numero'>Nº {$recibo['numero_recibo']}</div>
                </div>

                <div class='row'>
                    <div><span class='label'>Cliente:</span> {$recibo['cliente_nome']}</div>
                    <div><span class='label'>Data:</span> {$dataEmissao}</div>
                </div>

                <div class='row'>
                    <div><span class='label'>Documento:</span> {$recibo['cliente_documento']}</div>
                    <div><span class='label'>Data Pagamento:</span> {$dataPagamento}</div>
                </div>

                <div class='row'>
                    <div><span class='label'>Cidade:</span> {$recibo['cliente_cidade']}/{$recibo['cliente_uf']}</div>
                    <div><span class='label'>Forma Pagamento:</span> {$recibo['forma_pagamento']}</div>
                </div>

                <div style='margin: 20px 0;'>
                    <div class='label'>Descrição:</div>
                    <div style='margin-top: 5px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd;'>
                        {$recibo['descricao']}
                    </div>
                </div>

                ".(!empty($recibo['referencia']) ? "
                <div class='row'>
                    <div><span class='label'>Referência:</span> {$recibo['referencia']}</div>
                </div>
                " : '')."

                <div class='valores'>
                    <div class='row'>
                        <div class='label'>Valor Recebido:</div>
                        <div>R$ {$valorRecebido}</div>
                    </div>

                    ".($recibo['valor_desconto'] > 0 ? "
                    <div class='row'>
                        <div class='label'>(-) Desconto:</div>
                        <div>R$ {$valorDesconto}</div>
                    </div>
                    " : '').'

                    '.($recibo['valor_juros'] > 0 ? "
                    <div class='row'>
                        <div class='label'>(+) Juros:</div>
                        <div>R$ {$valorJuros}</div>
                    </div>
                    " : '').'

                    '.($recibo['valor_multa'] > 0 ? "
                    <div class='row'>
                        <div class='label'>(+) Multa:</div>
                        <div>R$ {$valorMulta}</div>
                    </div>
                    " : '')."

                    <div class='row total'>
                        <div class='label'>VALOR LÍQUIDO:</div>
                        <div>R$ {$valorLiquido}</div>
                    </div>
                </div>

                ".(!empty($recibo['observacoes']) ? "
                <div style='margin-top: 20px;'>
                    <div class='label'>Observações:</div>
                    <div style='margin-top: 5px; font-size: 11px;'>
                        {$recibo['observacoes']}
                    </div>
                </div>
                " : '')."

                <div class='footer'>
                    <p>Este recibo foi gerado automaticamente pelo sistema em ".date('d/m/Y H:i:s')."</p>
                    <p>Emitido por: {$recibo['usuario_emissao_nome']}</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}