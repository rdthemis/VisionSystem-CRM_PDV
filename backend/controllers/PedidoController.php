<?php

// src/Pedidos.php - CONTROLLER que usa o Model Pedido.php

require_once __DIR__.'/../models/Pedido.php';

class PedidoController
{
    private $database;

    public function __construct($database)
    {
        $this->database = $database;
    }

    // Buscar todos os pedidos
    public function buscarTodos()
    {
        try {
            $pedido = new Pedido($this->database->getConnection());
            $resultado = $pedido->buscarTodos();

            return [
                'success' => true,
                'data' => $resultado,
                'message' => 'Pedidos encontrados com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar pedidos: '.$e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Erro ao buscar pedidos: '.$e->getMessage(),
            ];
        }
    }

    // Buscar pedidos por status
    public function buscarPorStatus($status)
    {
        try {
            $pedido = new Pedido($this->database->getConnection());
            $resultado = $pedido->buscarTodos($status); // Seu model já aceita status

            return [
                'success' => true,
                'data' => $resultado,
                'message' => "Pedidos com status '$status' encontrados com sucesso",
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar pedidos por status: '.$e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Erro ao buscar pedidos: '.$e->getMessage(),
            ];
        }
    }

    // Buscar pedido por ID
    public function buscarPorId($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                return [
                    'success' => false,
                    'data' => null,
                    'message' => 'ID inválido fornecido',
                ];
            }

            $pedido = new Pedido($this->database->getConnection());
            $resultado = $pedido->buscarPorId($id);

            if ($resultado) {
                return [
                    'success' => true,
                    'data' => $resultado,
                    'message' => 'Pedido encontrado com sucesso',
                ];
            } else {
                return [
                    'success' => false,
                    'data' => null,
                    'message' => 'Pedido não encontrado',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar pedido por ID: '.$e->getMessage());

            return [
                'success' => false,
                'data' => null,
                'message' => 'Erro ao buscar pedido: '.$e->getMessage(),
            ];
        }
    }

    // Buscar pedidos por cliente (se precisar)
    public function buscarPorCliente($cliente_id)
    {
        try {
            // Como seu model não tem este método, vamos criar uma consulta direta
            $sql = 'SELECT p.*, COUNT(pi.id) as total_itens
                    FROM pedidos p
                    LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
                    WHERE p.cliente_id = ?
                    GROUP BY p.id
                    ORDER BY p.created_at DESC';

            $stmt = $this->database->getConnection()->prepare($sql);
            $stmt->execute([$cliente_id]);
            $resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'data' => $resultado,
                'message' => 'Pedidos do cliente encontrados com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar pedidos do cliente: '.$e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Erro ao buscar pedidos do cliente: '.$e->getMessage(),
            ];
        }
    }

    // Criar novo pedido
    // Atualizar o método criar() no seu PedidoController.php

    public function criar($dados)
    {
        try {
            // 🔧 DEBUG: Log dos dados recebidos
            error_log('📝 Controller - Dados recebidos para criar pedido: '.json_encode($dados));

            // Calcular total dos itens
            $totalPedido = 0;

            // Verificar se há itens
            /*if (!isset($dados['itens']) || !is_array($dados['itens']) || empty($dados['itens'])) {
                return [
                    'success' => false,
                    'message' => 'Pedido deve ter pelo menos um item',
                ];
            }*/

            // Calcular total baseado nos itens
            foreach ($dados['itens'] as $item) {
                if (isset($item['quantidade']) && isset($item['preco_unitario'])) {
                    $quantidade = floatval($item['quantidade']);
                    $preco = floatval($item['preco_unitario']);
                    $totalPedido += $quantidade * $preco;
                }
            }

            // Se o frontend enviou um total, usar ele (sobrescrever)
            if (isset($dados['total']) && is_numeric($dados['total'])) {
                $totalPedido = floatval($dados['total']);
            } elseif (isset($dados['total']) && is_array($dados['total'])) {
                if (isset($dados['total']['totalPagar'])) {
                    $totalPedido = floatval($dados['total']['totalPagar']);
                } elseif (isset($dados['total']['totalItens'])) {
                    $totalPedido = floatval($dados['total']['totalItens']);
                }
            }

            // Validar se conseguimos um total válido
            /*if ($totalPedido <= 0) {
                return [
                    'success' => false,
                    'message' => 'Total do pedido deve ser maior que zero',
                ];
            }*/

            // 🔧 NOVA LÓGICA: Validar dados do cliente
            $cliente_id = null;
            $cliente_nome = '';

            // Verificar se é cliente cadastrado (tem cliente_id)
            if (isset($dados['cliente_id']) && !empty($dados['cliente_id'])) {
                $cliente_id = intval($dados['cliente_id']);

                // Validar se cliente existe
                $stmt = $this->database->getConnection()->prepare('SELECT nome FROM clientes WHERE id = ? AND ativo = 1');
                $stmt->execute([$cliente_id]);
                $cliente = $stmt->fetch();

                if (!$cliente) {
                    return [
                        'success' => false,
                        'message' => 'Cliente selecionado não encontrado ou inativo',
                    ];
                }

                $cliente_nome = $cliente['nome'];
                error_log("👤 Cliente cadastrado selecionado: {$cliente_nome} (ID: {$cliente_id})");
            }
            // Se não tem cliente_id, deve ter nome do cliente (avulso)
            elseif (isset($dados['cliente_nome']) && !empty(trim($dados['cliente_nome']))) {
                $cliente_nome = trim($dados['cliente_nome']);
                error_log("👤 Cliente avulso: {$cliente_nome}");
            } else {
                return [
                    'success' => false,
                    'message' => 'Nome do cliente é obrigatório',
                ];
            }

            // Preparar itens no formato correto para o Model
            $itensFormatados = [];
            foreach ($dados['itens'] as $item) {
                $itensFormatados[] = [
                    'produto_id' => $item['produto_id'],
                    'quantidade' => floatval($item['quantidade']),
                    'preco_unitario' => floatval($item['preco_unitario']),
                    'subtotal' => floatval($item['quantidade']) * floatval($item['preco_unitario']),
                    // ✅ ADICIONAR ESTES CAMPOS:
                    'adicionais' => $item['adicionais'] ?? [],
                    'observacoes' => $item['observacoes'] ?? '',
                ];
            }

            // Criar instância do model
            $pedido = new Pedido($this->database->getConnection());

            // 🔧 DEFINIR PROPRIEDADES COM DADOS DO CLIENTE
            $pedido->cliente_id = $cliente_id; // NULL para avulso, ID para cadastrado
            $pedido->cliente_nome = $cliente_nome; // Nome sempre presente
            $pedido->total = $totalPedido;
            $pedido->status = $dados['status'] ?? 'aberto';
            $pedido->forma_pagamento = $dados['forma_pagamento'] ?? null;
            $pedido->itens = $itensFormatados;

            // 🔧 DEBUG: Log antes de criar
            error_log('💾 Controller - Tentando criar pedido com:');
            error_log('   - Cliente ID: '.($cliente_id ?: 'NULL (avulso)'));
            error_log('   - Cliente Nome: '.$cliente_nome);
            error_log('   - Total: '.$pedido->total);
            error_log('   - Status: '.$pedido->status);
            error_log('   - Itens: '.count($pedido->itens));
            error_log('   - Forma_pagamento: '.$pedido->forma_pagamento);

            // Tentar criar o pedido
            $resultado = $pedido->criar();

            if ($resultado) {
                error_log('✅ Controller - Pedido criado com sucesso, ID: '.$pedido->id);

                return [
                    'success' => true,
                    'data' => [
                        'id' => $pedido->id,
                        'numero_pedido' => $pedido->numero_pedido,
                        'total' => $pedido->total,
                        'cliente_id' => $cliente_id,
                        'cliente_nome' => $cliente_nome,
                        'tipo_cliente' => $cliente_id ? 'cadastrado' : 'avulso',
                    ],
                    'message' => $cliente_id
                        ? 'Pedido criado com sucesso! Conta a receber gerada automaticamente.'
                        : 'Pedido criado com sucesso!',
                ];
            } else {
                error_log('❌ Controller - Falha ao criar pedido');

                return [
                    'success' => false,
                    'message' => 'Erro ao criar pedido no banco de dados',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Controller - Exceção ao criar pedido: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao criar pedido: '.$e->getMessage(),
            ];
        }
    }
    /* public function criar($dados)
    {
        try {
            // 🔧 DEBUG: Log dos dados recebidos
            error_log('📝 Controller - Dados recebidos para criar pedido: '.json_encode($dados));

            // 🔧 CORREÇÃO 1: Calcular total dos itens
            $totalPedido = 0;

            // Verificar se há itens
            if (!isset($dados['itens']) || !is_array($dados['itens']) || empty($dados['itens'])) {
                return [
                    'success' => false,
                    'message' => 'Pedido deve ter pelo menos um item',
                ];
            }

            // 🔧 CORREÇÃO 2: Calcular total baseado nos itens
            foreach ($dados['itens'] as $item) {
                if (isset($item['quantidade']) && isset($item['preco_unitario'])) {
                    $quantidade = floatval($item['quantidade']);
                    $preco = floatval($item['preco_unitario']);
                    $totalPedido += $quantidade * $preco;
                }
            }

            // 🔧 CORREÇÃO 3: Se o frontend enviou um total, usar ele (sobrescrever)
            if (isset($dados['total']) && is_numeric($dados['total'])) {
                // Se total vem como número simples
                $totalPedido = floatval($dados['total']);
            } elseif (isset($dados['total']) && is_array($dados['total'])) {
                // Se total vem como objeto {totalItens, totalPagar}
                if (isset($dados['total']['totalPagar'])) {
                    $totalPedido = floatval($dados['total']['totalPagar']);
                } elseif (isset($dados['total']['totalItens'])) {
                    $totalPedido = floatval($dados['total']['totalItens']);
                }
            }

            // 🔧 DEBUG: Log do total calculado
            error_log('💰 Total calculado: '.$totalPedido);

            // Validar se conseguimos um total válido
            if ($totalPedido <= 0) {
                return [
                    'success' => false,
                    'message' => 'Total do pedido deve ser maior que zero',
                ];
            }

            // 🔧 CORREÇÃO 4: Preparar itens no formato correto para o Model
            $itensFormatados = [];
            foreach ($dados['itens'] as $item) {
                $itensFormatados[] = [
                    'produto_id' => $item['produto_id'],
                    'quantidade' => floatval($item['quantidade']),
                    'preco_unitario' => floatval($item['preco_unitario']),
                    'subtotal' => floatval($item['quantidade']) * floatval($item['preco_unitario']),
                ];
            }

            // Criar instância do model
            $pedido = new Pedido($this->database->getConnection());

            // Definir propriedades do pedido
            $pedido->total = $totalPedido;
            $pedido->status = $dados['status'] ?? 'aberto';
            $pedido->forma_pagamento = $dados['forma_pagamento'] ?? null;
            $pedido->itens = $itensFormatados;

            // 🔧 DEBUG: Log antes de criar
            error_log('💾 Controller - Tentando criar pedido com:');
            error_log('   - Total: '.$pedido->total);
            error_log('   - Status: '.$pedido->status);
            error_log('   - Itens: '.count($pedido->itens));

            // Tentar criar o pedido
            $resultado = $pedido->criar();

            if ($resultado) {
                error_log('✅ Controller - Pedido criado com sucesso, ID: '.$pedido->id);

                return [
                    'success' => true,
                    'data' => [
                        'id' => $pedido->id,
                        'numero_pedido' => $pedido->numero_pedido,
                        'total' => $pedido->total,
                    ],
                    'message' => 'Pedido criado com sucesso',
                ];
            } else {
                error_log('❌ Controller - Falha ao criar pedido');

                return [
                    'success' => false,
                    'message' => 'Erro ao criar pedido no banco de dados',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Controller - Exceção ao criar pedido: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao criar pedido: '.$e->getMessage(),
            ];
        }
    } */

    /*  // Criar novo pedido
     public function criar($dados)
     {
         try {
             // 🔧 DEBUG: Log dos dados recebidos
             error_log('📝 Controller - Dados recebidos para criar pedido: '.json_encode($dados));
             error_log('valor: '.$dados['total.totalPagar']);
             // Validar dados obrigatórios
             if (!isset($dados['total.totalpagar'])) {
                 return [
                     'success' => false,
                     'message' => 'Total do pedido é obrigatório',
                 ];
             }

             if (!isset($dados['itens']) || !is_array($dados['itens']) || empty($dados['itens'])) {
                 return [
                     'success' => false,
                     'message' => 'Pedido deve ter pelo menos um item',
                 ];
             }

             // Criar instância do model
             $pedido = new Pedido($this->database->getConnection());

             // Definir propriedades do pedido
             $pedido->total = floatval($dados['total']);
             $pedido->status = $dados['status'] ?? 'aberto';
             $pedido->forma_pagamento = $dados['forma_pagamento'] ?? null;
             $pedido->itens = $dados['itens'];

             // 🔧 DEBUG: Log antes de criar
             error_log('💾 Controller - Tentando criar pedido com total: '.$pedido->total);

             // Tentar criar o pedido
             $resultado = $pedido->criar();

             if ($resultado) {
                 error_log('✅ Controller - Pedido criado com sucesso, ID: '.$pedido->id);

                 return [
                     'success' => true,
                     'data' => [
                         'id' => $pedido->id,
                         'numero_pedido' => $pedido->numero_pedido,
                     ],
                     'message' => 'Pedido criado com sucesso',
                 ];
             } else {
                 error_log('❌ Controller - Falha ao criar pedido');

                 return [
                     'success' => false,
                     'message' => 'Erro ao criar pedido no banco de dados',
                 ];
             }
         } catch (Exception $e) {
             error_log('❌ Controller - Exceção ao criar pedido: '.$e->getMessage());

             return [
                 'success' => false,
                 'message' => 'Erro ao criar pedido: '.$e->getMessage(),
             ];
         }
     } */

    // Método atualizar() corrigido no PedidoController

    // PedidoController.php - VERSÃO COMPLETA COM AMBOS OS MÉTODOS

    // ✅ MÉTODO PRINCIPAL - atualizar()
    public function atualizar($dados)
    {
        try {
            // 🔧 DEBUG: Log completo dos dados recebidos
            error_log('📝 Atualizar pedido - Dados recebidos: '.json_encode($dados));

            // Validação do ID
            if (!isset($dados['id']) || !is_numeric($dados['id'])) {
                error_log('❌ ID inválido ou não fornecido');

                return [
                    'success' => false,
                    'message' => 'ID do pedido é obrigatório e deve ser numérico',
                ];
            }

            $pedido_id = intval($dados['id']);
            error_log("🔍 Atualizando pedido ID: {$pedido_id}");

            // Criar instância do model
            $pedido = new Pedido($this->database->getConnection());
            $pedido->id = $pedido_id;

            // 🔧 MELHORIA: Verificar se pedido existe antes de atualizar
            $pedidoExistente = $pedido->buscarPorId($pedido_id);
            if (!$pedidoExistente) {
                error_log("❌ Pedido ID {$pedido_id} não encontrado");

                return [
                    'success' => false,
                    'message' => 'Pedido não encontrado',
                ];
            }

            error_log("✅ Pedido encontrado: {$pedidoExistente['numero_pedido']}");

            // 🔧 DIFERENTES TIPOS DE ATUALIZAÇÃO:

            // 1️⃣ ATUALIZAÇÃO APENAS DO STATUS (mais comum)
            if (isset($dados['status']) && !isset($dados['itens']) && !isset($dados['total'])) {
                error_log('📊 Atualizando apenas status do pedido');

                $forma_pagamento = $dados['forma_pagamento'] ?? null;
                $resultado = $pedido->atualizarStatus($dados['status'], $forma_pagamento);

                error_log('🔄 Resultado atualizarStatus(): '.($resultado ? 'true' : 'false'));

                if ($resultado) {
                    error_log('✅ Status atualizado com sucesso');

                    return [
                        'success' => true,
                        'data' => [
                            'id' => $pedido_id,
                            'status' => $dados['status'],
                            'forma_pagamento' => $forma_pagamento,
                        ],
                        'message' => 'Status do pedido atualizado com sucesso',
                    ];
                } else {
                    error_log('❌ Falha ao atualizar status');

                    return [
                        'success' => false,
                        'message' => 'Erro ao atualizar status do pedido no banco de dados',
                    ];
                }
            }

            // 2️⃣ ATUALIZAÇÃO COMPLETA DO PEDIDO (com itens, total, etc.)
            elseif (isset($dados['itens']) || isset($dados['total']) || isset($dados['cliente_nome'])) {
                error_log('📦 Atualizando pedido completo (itens, total, cliente)');

                // Calcular novo total se há itens
                $novoTotal = 0;
                if (isset($dados['itens']) && is_array($dados['itens'])) {
                    error_log('🧮 Calculando total baseado em '.count($dados['itens']).' itens');
                    foreach ($dados['itens'] as $item) {
                        if (isset($item['quantidade']) && isset($item['preco_unitario'])) {
                            $subtotal = floatval($item['quantidade']) * floatval($item['preco_unitario']);
                            $novoTotal += $subtotal;
                            error_log("   - Item: {$item['quantidade']}x {$item['preco_unitario']} = {$subtotal}");
                        }
                    }
                    error_log("💰 Total calculado dos itens: {$novoTotal}");
                } elseif (isset($dados['total']) && is_numeric($dados['total'])) {
                    $novoTotal = floatval($dados['total']);
                    error_log("💰 Total fornecido diretamente: {$novoTotal}");
                }

                // Dados do cliente (se fornecidos)
                $cliente_id = isset($dados['cliente_id']) ? intval($dados['cliente_id']) : null;
                $cliente_nome = $dados['cliente_nome'] ?? null;

                // 🔧 CHAMAR: Método para atualização completa
                $resultado = $this->atualizarPedidoCompleto($pedido, $dados, $novoTotal, $cliente_id, $cliente_nome);

                if ($resultado['success']) {
                    error_log('✅ Pedido completo atualizado com sucesso');

                    return $resultado;
                } else {
                    error_log('❌ Falha ao atualizar pedido completo: '.$resultado['message']);

                    return $resultado;
                }
            }

            // 3️⃣ NENHUM CAMPO RECONHECIDO PARA ATUALIZAÇÃO
            else {
                error_log('⚠️ Nenhum campo válido encontrado para atualização');
                error_log('📋 Campos disponíveis: '.implode(', ', array_keys($dados)));

                return [
                    'success' => false,
                    'message' => 'Nenhum campo válido fornecido para atualização. Campos aceitos: status, forma_pagamento, itens, total, cliente_nome, cliente_id',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Exceção ao atualizar pedido: '.$e->getMessage());
            error_log('📍 Arquivo: '.$e->getFile().' Linha: '.$e->getLine());

            return [
                'success' => false,
                'message' => 'Erro interno ao atualizar pedido: '.$e->getMessage(),
            ];
        }
    }

    // ✅ MÉTODO AUXILIAR - atualizarPedidoCompleto() COM ATUALIZAÇÃO DE ITENS
    private function atualizarPedidoCompleto($pedido, $dados, $novoTotal, $cliente_id, $cliente_nome)
    {
        try {
            error_log("🔄 Iniciando atualização completa do pedido {$pedido->id}");

            // 🔧 INICIAR TRANSAÇÃO para garantir consistência
            $this->database->getConnection()->beginTransaction();

            // Preparar dados para atualização da tabela principal
            $camposAtualizar = [];
            $valores = [];

            // Total
            if ($novoTotal > 0) {
                $camposAtualizar[] = 'total = ?';
                $valores[] = $novoTotal;
                error_log("💰 Novo total: {$novoTotal}");
            }

            // Cliente
            if ($cliente_nome) {
                $camposAtualizar[] = 'cliente_nome = ?';
                $valores[] = $cliente_nome;
                error_log("👤 Novo cliente nome: {$cliente_nome}");
            }

            if ($cliente_id === null) {
                $camposAtualizar[] = 'cliente_id = ?';
                $camposAtualizar[] = 'tipo_cliente = ?';
                $valores[] = $cliente_id;
                $valores[] = $cliente_id ? 'cadastrado' : 'avulso';
                error_log('👤 Novo cliente ID: '.($cliente_id ?: 'NULL'));
            } else {
                $camposAtualizar[] = 'cliente_id = ?';
                $camposAtualizar[] = 'tipo_cliente = ?';
                $valores[] = $cliente_id;
                $valores[] = $cliente_id ? 'cadastrado' : 'avulso';
                error_log('👤 Novo cliente ID: '.($cliente_id ?: 'NULL'));
            }

            // Status se fornecido
            if (isset($dados['status'])) {
                $camposAtualizar[] = 'status = ?';
                $valores[] = $dados['status'];
                error_log("📊 Novo status: {$dados['status']}");
            }

            // Forma de pagamento se fornecida
            if (isset($dados['forma_pagamento'])) {
                $camposAtualizar[] = 'forma_pagamento = ?';
                $valores[] = $dados['forma_pagamento'];
                error_log("💳 Nova forma pagamento: {$dados['forma_pagamento']}");
            }

            // 1️⃣ ATUALIZAR DADOS PRINCIPAIS DO PEDIDO
            if (!empty($camposAtualizar)) {
                $valores[] = $pedido->id; // WHERE id = ?

                $sql = 'UPDATE pedidos SET '.implode(', ', $camposAtualizar).', updated_at = NOW() WHERE id = ?';
                error_log("🔍 SQL pedido: {$sql}");
                error_log('📋 Valores pedido: '.json_encode($valores));

                $stmt = $this->database->getConnection()->prepare($sql);
                $resultado = $stmt->execute($valores);

                if (!$resultado) {
                    throw new Exception('Erro ao atualizar dados do pedido');
                }

                error_log('✅ Dados principais do pedido atualizados');
            }

            // 2️⃣ ATUALIZAR ITENS DO PEDIDO
            if (isset($dados['itens']) && is_array($dados['itens'])) {
                error_log('📦 Atualizando '.count($dados['itens']).' itens do pedido');

                // 🗑️ REMOVER TODOS OS ITENS ANTIGOS
                $sqlDelete = 'DELETE FROM pedido_itens WHERE pedido_id = ?';
                $stmtDelete = $this->database->getConnection()->prepare($sqlDelete);
                $resultadoDelete = $stmtDelete->execute([$pedido->id]);

                if (!$resultadoDelete) {
                    throw new Exception('Erro ao remover itens antigos');
                }

                $itensRemovidosCount = $stmtDelete->rowCount();
                error_log("🗑️ {$itensRemovidosCount} itens antigos removidos");

                // 📦 INSERIR NOVOS ITENS
                // ✅ CORRIGIDO: INSERIR NOVOS ITENS COM ADICIONAIS E OBSERVAÇÕES
                $sqlInsert = 'INSERT INTO pedido_itens 
              (pedido_id, produto_id, quantidade, preco_unitario, subtotal, adicionais, observacoes) 
              VALUES (?, ?, ?, ?, ?, ?, ?)';
                $stmtInsert = $this->database->getConnection()->prepare($sqlInsert);

                $totalCalculado = 0;
                $itensInseridos = 0;

                foreach ($dados['itens'] as $index => $item) {
                    // Validar item
                    if (!isset($item['produto_id']) || !isset($item['quantidade']) || !isset($item['preco_unitario'])) {
                        error_log("⚠️ Item {$index} inválido: ".json_encode($item));
                        continue;
                    }

                    $produto_id = intval($item['produto_id']);
                    $quantidade = floatval($item['quantidade']);
                    $preco_unitario = floatval($item['preco_unitario']);
                    $subtotal = $quantidade * $preco_unitario;

                    // ✅ PROCESSAR ADICIONAIS E OBSERVAÇÕES
                    $adicionaisJson = json_encode($item['adicionais'] ?? []);
                    $observacoes = $item['observacoes'] ?? '';

                    // Inserir item COM os novos campos
                    $resultadoInsert = $stmtInsert->execute([
                        $pedido->id,
                        $produto_id,
                        $quantidade,
                        $preco_unitario,
                        $subtotal,
                        $adicionaisJson,    // ✅ NOVO
                        $observacoes,        // ✅ NOVO
                    ]);

                    if (!$resultadoInsert) {
                        $errorInfo = $stmtInsert->errorInfo();
                        throw new Exception("Erro ao inserir item {$index}: ".implode(' - ', $errorInfo));
                    }

                    $totalCalculado += $subtotal;
                    ++$itensInseridos;

                    error_log("📦 Item {$itensInseridos}: Produto {$produto_id}, Qty {$quantidade}, Preço {$preco_unitario}, Subtotal {$subtotal}");
                }

                error_log("✅ {$itensInseridos} novos itens inseridos, total calculado: {$totalCalculado}");

                // 3️⃣ ATUALIZAR TOTAL FINAL (baseado nos itens reais)
                if ($itensInseridos > 0) {
                    $sqlUpdateTotal = 'UPDATE pedidos SET total = ?, updated_at = NOW() WHERE id = ?';
                    $stmtUpdateTotal = $this->database->getConnection()->prepare($sqlUpdateTotal);
                    $resultadoUpdateTotal = $stmtUpdateTotal->execute([$totalCalculado, $pedido->id]);

                    if (!$resultadoUpdateTotal) {
                        throw new Exception('Erro ao atualizar total final');
                    }

                    error_log("💰 Total final atualizado para: {$totalCalculado}");
                }
            }

            // 🔧 CONFIRMAR TRANSAÇÃO
            $this->database->getConnection()->commit();
            error_log('✅ Transação confirmada - Pedido atualizado completamente');

            return [
                'success' => true,
                'data' => [
                    'id' => $pedido->id,
                    'total' => $totalCalculado ?? $novoTotal,
                    'itens_atualizados' => $itensInseridos ?? 0,
                ],
                'message' => 'Pedido e itens atualizados com sucesso',
            ];
        } catch (Exception $e) {
            // 🔙 REVERTER TRANSAÇÃO EM CASO DE ERRO
            $this->database->getConnection()->rollback();
            error_log('❌ Erro na atualização completa (transação revertida): '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro na atualização completa: '.$e->getMessage(),
            ];
        }
    }

    // Deletar pedido (cancelar)
    public function deletar($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                return [
                    'success' => false,
                    'message' => 'ID inválido fornecido',
                ];
            }

            $pedido = new Pedido($this->database->getConnection());
            $pedido->id = $id;

            // Usar o método cancelar do model
            $resultado = $pedido->cancelar();

            if ($resultado) {
                return [
                    'success' => true,
                    'data' => ['id' => $id],
                    'message' => 'Pedido cancelado com sucesso',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao cancelar pedido',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao deletar pedido: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao cancelar pedido: '.$e->getMessage(),
            ];
        }
    }

    // Adicionar item ao pedido
    public function adicionarItem($dados)
    {
        try {
            if (!isset($dados['pedido_id']) || !isset($dados['produto_id'])
                || !isset($dados['quantidade']) || !isset($dados['preco_unitario'])) {
                return [
                    'success' => false,
                    'message' => 'Dados obrigatórios não fornecidos',
                ];
            }

            $pedido = new Pedido($this->database->getConnection());
            $pedido->id = $dados['pedido_id'];

            $resultado = $pedido->adicionarItemExistente(
                $dados['produto_id'],
                $dados['quantidade'],
                $dados['preco_unitario']
            );

            if ($resultado) {
                return [
                    'success' => true,
                    'message' => 'Item adicionado com sucesso',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao adicionar item',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao adicionar item: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao adicionar item: '.$e->getMessage(),
            ];
        }
    }

    // Remover item do pedido
    public function removerItem($dados)
    {
        try {
            if (!isset($dados['pedido_id']) || !isset($dados['item_id'])) {
                return [
                    'success' => false,
                    'message' => 'ID do pedido e item são obrigatórios',
                ];
            }

            $pedido = new Pedido($this->database->getConnection());
            $pedido->id = $dados['pedido_id'];

            $resultado = $pedido->removerItem($dados['item_id']);

            if ($resultado) {
                return [
                    'success' => true,
                    'message' => 'Item removido com sucesso',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erro ao remover item',
                ];
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao remover item: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao remover item: '.$e->getMessage(),
            ];
        }
    }

    // Buscar produtos disponíveis
    public function buscarProdutosDisponiveis()
    {
        try {
            $pedido = new Pedido($this->database->getConnection());
            $resultado = $pedido->buscarProdutosDisponiveis();

            return [
                'success' => true,
                'data' => $resultado,
                'message' => 'Produtos encontrados com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar produtos: '.$e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Erro ao buscar produtos: '.$e->getMessage(),
            ];
        }
    }

    /**
     * 🔄 TRANSFERIR ITENS ENTRE COMANDAS.
     *
     * Transfere itens (total ou parcial) de um pedido para outro
     * Suporta criação de nova comanda ou transferência para comanda existente
     */
    public function transferir($dados)
    {
        try {
            error_log('🔄 ===== INICIANDO TRANSFERÊNCIA =====');
            error_log('📦 Dados recebidos: '.json_encode($dados));

            // ==========================================
            // 1️⃣ VALIDAÇÕES INICIAIS
            // ==========================================

            $pedidoOrigemId = intval($dados['pedidoOrigemId']);
            $tipoDestino = $dados['tipoDestino']; // 'existente' | 'nova'
            $itensTransferir = $dados['itens'];

            if (empty($itensTransferir)) {
                return [
                    'success' => false,
                    'message' => 'Nenhum item selecionado para transferir',
                ];
            }

            // ==========================================
            // 2️⃣ BUSCAR PEDIDO ORIGEM
            // ==========================================

            $pedidoOrigem = new Pedido($this->database->getConnection());
            $dadosOrigem = $pedidoOrigem->buscarPorId($pedidoOrigemId);

            if (!$dadosOrigem) {
                return [
                    'success' => false,
                    'message' => 'Pedido de origem não encontrado',
                ];
            }

            if ($dadosOrigem['status'] !== 'aberto') {
                return [
                    'success' => false,
                    'message' => 'Só é possível transferir itens de pedidos abertos',
                ];
            }

            error_log("✅ Pedido origem encontrado: #{$pedidoOrigemId}");

            // ==========================================
            // 3️⃣ DETERMINAR/CRIAR PEDIDO DESTINO
            // ==========================================

            $pedidoDestinoId = null;

            if ($tipoDestino === 'existente') {
                // Usar comanda existente
                if (!isset($dados['comandaDestinoId']) || empty($dados['comandaDestinoId'])) {
                    return [
                        'success' => false,
                        'message' => 'ID da comanda de destino não informado',
                    ];
                }

                $pedidoDestinoId = intval($dados['comandaDestinoId']);

                // Validar se comanda destino existe e está aberta
                $pedidoDestino = new Pedido($this->database->getConnection());
                $dadosDestino = $pedidoDestino->buscarPorId($pedidoDestinoId);

                if (!$dadosDestino) {
                    return [
                        'success' => false,
                        'message' => 'Comanda de destino não encontrada',
                    ];
                }

                if ($dadosDestino['status'] !== 'aberto') {
                    return [
                        'success' => false,
                        'message' => 'Comanda de destino deve estar aberta',
                    ];
                }

                error_log("✅ Comanda destino existente: #{$pedidoDestinoId}");
            } elseif ($tipoDestino === 'nova') {
                // Criar nova comanda
                if (!isset($dados['nomeNovaComanda']) || empty(trim($dados['nomeNovaComanda']))) {
                    return [
                        'success' => false,
                        'message' => 'Nome do cliente para nova comanda não informado',
                    ];
                }

                $nomeCliente = trim($dados['nomeNovaComanda']);

                // Criar pedido vazio
                $novoPedido = new Pedido($this->database->getConnection());
                $novoPedido->cliente_id = null; // Cliente avulso
                $novoPedido->cliente_nome = $nomeCliente;
                $novoPedido->total = 0;
                $novoPedido->status = 'aberto';
                $novoPedido->itens = [];

                if (!$novoPedido->criar()) {
                    return [
                        'success' => false,
                        'message' => 'Erro ao criar nova comanda',
                    ];
                }

                $pedidoDestinoId = $novoPedido->id;
                error_log("✅ Nova comanda criada: #{$pedidoDestinoId} - Cliente: {$nomeCliente}");
            } else {
                return [
                    'success' => false,
                    'message' => 'Tipo de destino inválido',
                ];
            }

            // ==========================================
            // 4️⃣ PROCESSAR TRANSFERÊNCIA (COM TRANSAÇÃO)
            // ==========================================

            $this->database->getConnection()->beginTransaction();

            try {
                $itensTransferidos = 0;
                $totalTransferido = 0;

                foreach ($itensTransferir as $itemData) {
                    error_log('📦 Processando item: '.json_encode($itemData));

                    $produtoId = intval($itemData['produto_id']);
                    $quantidadeTransferir = floatval($itemData['quantidadeTransferir']);
                    $precoUnitario = floatval($itemData['preco_unitario']);
                    $adicionais = $itemData['adicionais'] ?? [];
                    $observacoes = $itemData['observacoes'] ?? '';

                    // 🔍 Buscar item no pedido origem
                    $sqlBuscarItem = 'SELECT * FROM pedido_itens 
                                    WHERE pedido_id = ? AND produto_id = ? 
                                    LIMIT 1';
                    $stmtBuscar = $this->database->getConnection()->prepare($sqlBuscarItem);
                    $stmtBuscar->execute([$pedidoOrigemId, $produtoId]);
                    $itemOrigem = $stmtBuscar->fetch(PDO::FETCH_ASSOC);

                    if (!$itemOrigem) {
                        throw new Exception("Item produto #{$produtoId} não encontrado no pedido origem");
                    }

                    $quantidadeOrigem = floatval($itemOrigem['quantidade']);

                    if ($quantidadeTransferir > $quantidadeOrigem) {
                        throw new Exception("Quantidade a transferir ({$quantidadeTransferir}) maior que disponível ({$quantidadeOrigem})");
                    }

                    // ➖ REDUZIR/REMOVER DO PEDIDO ORIGEM
                    if ($quantidadeTransferir >= $quantidadeOrigem) {
                        // Transferir tudo - REMOVER item
                        $sqlRemover = 'DELETE FROM pedido_itens WHERE id = ?';
                        $stmtRemover = $this->database->getConnection()->prepare($sqlRemover);
                        $stmtRemover->execute([$itemOrigem['id']]);
                        error_log('   🗑️ Item removido completamente do origem');
                    } else {
                        // Transferir parcial - REDUZIR quantidade
                        $novaQuantidade = $quantidadeOrigem - $quantidadeTransferir;
                        $novoSubtotal = $novaQuantidade * $precoUnitario;

                        $sqlReduzir = 'UPDATE pedido_itens 
                                    SET quantidade = ?, subtotal = ? 
                                    WHERE id = ?';
                        $stmtReduzir = $this->database->getConnection()->prepare($sqlReduzir);
                        $stmtReduzir->execute([$novaQuantidade, $novoSubtotal, $itemOrigem['id']]);
                        error_log("   ➖ Quantidade reduzida de {$quantidadeOrigem} para {$novaQuantidade}");
                    }

                    // ➕ ADICIONAR AO PEDIDO DESTINO
                    $subtotalTransferir = $quantidadeTransferir * $precoUnitario;
                    $adicionaisJson = json_encode($adicionais);

                    $sqlAdicionar = 'INSERT INTO pedido_itens 
                                    (pedido_id, produto_id, quantidade, preco_unitario, subtotal, adicionais, observacoes)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)';
                    $stmtAdicionar = $this->database->getConnection()->prepare($sqlAdicionar);
                    $stmtAdicionar->execute([
                        $pedidoDestinoId,
                        $produtoId,
                        $quantidadeTransferir,
                        $precoUnitario,
                        $subtotalTransferir,
                        $adicionaisJson,
                        $observacoes,
                    ]);

                    error_log("   ✅ Adicionado {$quantidadeTransferir} unidades ao pedido destino");

                    ++$itensTransferidos;
                    $totalTransferido += $subtotalTransferir;
                }

                // ==========================================
                // 5️⃣ RECALCULAR TOTAIS
                // ==========================================

                // Recalcular total do pedido ORIGEM
                $sqlTotalOrigem = 'SELECT COALESCE(SUM(subtotal), 0) as total 
                                FROM pedido_itens 
                                WHERE pedido_id = ?';
                $stmtTotalOrigem = $this->database->getConnection()->prepare($sqlTotalOrigem);
                $stmtTotalOrigem->execute([$pedidoOrigemId]);
                $novoTotalOrigem = floatval($stmtTotalOrigem->fetchColumn());

                $sqlAtualizarOrigem = 'UPDATE pedidos SET total = ?, updated_at = NOW() WHERE id = ?';
                $stmtAtualizarOrigem = $this->database->getConnection()->prepare($sqlAtualizarOrigem);
                $stmtAtualizarOrigem->execute([$novoTotalOrigem, $pedidoOrigemId]);

                error_log("💰 Total origem atualizado: {$novoTotalOrigem}");

                // Recalcular total do pedido DESTINO
                $sqlTotalDestino = 'SELECT COALESCE(SUM(subtotal), 0) as total 
                                    FROM pedido_itens 
                                    WHERE pedido_id = ?';
                $stmtTotalDestino = $this->database->getConnection()->prepare($sqlTotalDestino);
                $stmtTotalDestino->execute([$pedidoDestinoId]);
                $novoTotalDestino = floatval($stmtTotalDestino->fetchColumn());

                $sqlAtualizarDestino = 'UPDATE pedidos SET total = ?, updated_at = NOW() WHERE id = ?';
                $stmtAtualizarDestino = $this->database->getConnection()->prepare($sqlAtualizarDestino);
                $stmtAtualizarDestino->execute([$novoTotalDestino, $pedidoDestinoId]);

                error_log("💰 Total destino atualizado: {$novoTotalDestino}");

                // ==========================================
                // 6️⃣ CONFIRMAR TRANSAÇÃO
                // ==========================================

                $this->database->getConnection()->commit();

                error_log('✅ ===== TRANSFERÊNCIA CONCLUÍDA =====');
                error_log("   📊 {$itensTransferidos} itens transferidos");
                error_log("   💰 Valor transferido: {$totalTransferido}");

                return [
                    'success' => true,
                    'message' => "Transferência realizada com sucesso! {$itensTransferidos} item(ns) transferido(s).",
                    'data' => [
                        'pedidoOrigemId' => $pedidoOrigemId,
                        'pedidoDestinoId' => $pedidoDestinoId,
                        'itensTransferidos' => $itensTransferidos,
                        'totalTransferido' => $totalTransferido,
                        'novoTotalOrigem' => $novoTotalOrigem,
                        'novoTotalDestino' => $novoTotalDestino,
                    ],
                ];
            } catch (Exception $e) {
                // Reverter em caso de erro
                $this->database->getConnection()->rollback();
                throw $e;
            }
        } catch (Exception $e) {
            error_log('❌ Erro na transferência: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao transferir itens: '.$e->getMessage(),
            ];
        }
    }
}
