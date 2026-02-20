<?php

// src/Clientes.php - Classe Clientes com banco de dados

class Clientes
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database->conectar();
    }

    // Listar clientes com paginação e filtros
    public function listar($filtros = [])
    {
        try {
            $where = ['c.ativo = 1'];
            $params = [];

            // Filtro por nome
            if (!empty($filtros['nome'])) {
                $where[] = '(c.nome LIKE ? OR c.razao_social LIKE ? OR c.nome_fantasia LIKE ?)';
                $searchTerm = '%'.$filtros['nome'].'%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            // Filtro por tipo de pessoa
            if (!empty($filtros['tipo_pessoa'])) {
                $where[] = 'c.tipo_pessoa = ?';
                $params[] = $filtros['tipo_pessoa'];
            }

            // Filtro por cidade
            if (!empty($filtros['cidade'])) {
                $where[] = 'c.cidade LIKE ?';
                $params[] = '%'.$filtros['cidade'].'%';
            }

            // Filtro por UF
            if (!empty($filtros['uf'])) {
                $where[] = 'c.uf = ?';
                $params[] = $filtros['uf'];
            }

            // Paginação
            $limite = intval($filtros['limite'] ?? 10);
            $pagina = intval($filtros['pagina'] ?? 1);
            $offset = ($pagina - 1) * $limite;

            // Ordenação
            $ordenacao = $filtros['ordenacao'] ?? 'nome';
            $direcao = ($filtros['direcao'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

            $validOrders = ['nome', 'email', 'cidade', 'tipo_pessoa', 'created_at'];
            if (!in_array($ordenacao, $validOrders)) {
                $ordenacao = 'nome';
            }

            // Query principal
            $sql = "
                SELECT 
                    c.id,
                    c.nome,
                    c.razao_social,
                    c.nome_fantasia,
                    c.tipo_pessoa,
                    c.cpf_cnpj,
                    c.email,
                    c.telefone,
                    c.celular,
                    c.cidade,
                    c.uf,
                    c.limite_credito,
                    c.created_at,
                    u.nome as usuario_criacao_nome,
                    CASE 
                        WHEN c.tipo_pessoa = 'fisica' THEN 'Pessoa Física'
                        WHEN c.tipo_pessoa = 'juridica' THEN 'Pessoa Jurídica'
                    END as tipo_pessoa_texto,
                    CASE 
                        WHEN c.cpf_cnpj IS NOT NULL AND c.tipo_pessoa = 'fisica' AND LENGTH(c.cpf_cnpj) = 11 THEN 
                            CONCAT(
                                SUBSTRING(c.cpf_cnpj, 1, 3), '.',
                                SUBSTRING(c.cpf_cnpj, 4, 3), '.',
                                SUBSTRING(c.cpf_cnpj, 7, 3), '-',
                                SUBSTRING(c.cpf_cnpj, 10, 2)
                            )
                        WHEN c.cpf_cnpj IS NOT NULL AND c.tipo_pessoa = 'juridica' AND LENGTH(c.cpf_cnpj) = 14 THEN 
                            CONCAT(
                                SUBSTRING(c.cpf_cnpj, 1, 2), '.',
                                SUBSTRING(c.cpf_cnpj, 3, 3), '.',
                                SUBSTRING(c.cpf_cnpj, 6, 3), '/',
                                SUBSTRING(c.cpf_cnpj, 9, 4), '-',
                                SUBSTRING(c.cpf_cnpj, 13, 2)
                            )
                        ELSE c.cpf_cnpj
                    END as cpf_cnpj_formatado
                FROM clientes c
                LEFT JOIN usuarios u ON c.usuario_criacao = u.id
                WHERE ".implode(' AND ', $where)."
                ORDER BY c.{$ordenacao} {$direcao}
                LIMIT {$limite} OFFSET {$offset}
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatar dados para o frontend
            foreach ($clientes as &$cliente) {
                $cliente['cpf_cnpj'] = $cliente['cpf_cnpj_formatado'] ?? $cliente['cpf_cnpj'];
                unset($cliente['cpf_cnpj_formatado']);
            }

            // Contar total para paginação
            $sqlCount = '
                SELECT COUNT(*) as total
                FROM clientes c
                WHERE '.implode(' AND ', $where);

            $stmtCount = $this->db->prepare($sqlCount);
            $stmtCount->execute($params);
            $total = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];

            return [
                'success' => true,
                'data' => $clientes,
                'pagination' => [
                    'total' => intval($total),
                    'por_pagina' => $limite,
                    'pagina_atual' => $pagina,
                    'total_paginas' => ceil($total / $limite),
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar clientes: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao buscar clientes',
            ];
        }
    }

    // Buscar cliente por ID
    public function buscarPorId($id)
    {
        try {
            $stmt = $this->db->prepare('
                SELECT c.*, u.nome as usuario_criacao_nome
                FROM clientes c
                LEFT JOIN usuarios u ON c.usuario_criacao = u.id
                WHERE c.id = ? AND c.ativo = 1
            ');
            $stmt->execute([$id]);
            $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cliente) {
                return [
                    'success' => false,
                    'message' => 'Cliente não encontrado',
                ];
            }

            return [
                'success' => true,
                'data' => $cliente,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar cliente: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao buscar cliente',
            ];
        }
    }

    // Criar novo cliente
    public function criar($dados, $usuarioId)
    {
        try {
            // Validações básicas
            if (empty($dados['nome'])) {
                return [
                    'success' => false,
                    'message' => 'Nome é obrigatório',
                ];
            }

            // Validar e limpar CPF/CNPJ se fornecido
            if (!empty($dados['cpf_cnpj'])) {
                $cpfCnpj = $this->limparDocumento($dados['cpf_cnpj']);

                if ($dados['tipo_pessoa'] === 'fisica') {
                    if (!$this->validarCPF($cpfCnpj)) {
                        return [
                            'success' => false,
                            'message' => 'CPF inválido',
                        ];
                    }
                } else {
                    if (!$this->validarCNPJ($cpfCnpj)) {
                        return [
                            'success' => false,
                            'message' => 'CNPJ inválido',
                        ];
                    }
                }
                $dados['cpf_cnpj'] = $cpfCnpj;
            }

            // Validar email se fornecido
            if (!empty($dados['email'])) {
                if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
                    return [
                        'success' => false,
                        'message' => 'Email inválido',
                    ];
                }
            }

            // Limpar CEP
            if (!empty($dados['cep'])) {
                $dados['cep'] = preg_replace('/\D/', '', $dados['cep']);
            }

            // Preparar dados para inserção
            $campos = [
                'nome', 'razao_social', 'nome_fantasia', 'tipo_pessoa',
                'cpf_cnpj', 'rg_ie', 'email', 'telefone', 'celular', 'whatsapp',
                'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
                'limite_credito', 'prazo_pagamento_padrao', 'desconto_padrao', 'observacoes',
            ];

            $values = [];
            $placeholders = [];

            foreach ($campos as $campo) {
                $values[] = $dados[$campo] ?? null;
                $placeholders[] = '?';
            }

            $values[] = $usuarioId; // usuario_criacao
            $placeholders[] = '?';

            $sql = '
                INSERT INTO clientes ('.implode(', ', $campos).', usuario_criacao) 
                VALUES ('.implode(', ', $placeholders).')
            ';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);

            $clienteId = $this->db->lastInsertId();

            error_log("✅ Cliente criado: {$dados['nome']} (ID: {$clienteId})");

            return [
                'success' => true,
                'message' => 'Cliente criado com sucesso',
                'data' => ['id' => $clienteId],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao criar cliente: '.$e->getMessage());

            // Verificar se é erro de documento duplicado
            if (strpos($e->getMessage(), 'já cadastrado') !== false) {
                return [
                    'success' => false,
                    'message' => 'CPF/CNPJ já cadastrado para outro cliente',
                ];
            }

            return [
                'success' => false,
                'message' => 'Erro ao criar cliente',
            ];
        }
    }

    // Atualizar cliente
    public function atualizar($id, $dados, $usuarioId)
    {
        try {
            // Verificar se cliente existe
            $clienteExistente = $this->buscarPorId($id);
            if (!$clienteExistente['success']) {
                return $clienteExistente;
            }

            // Validações
            if (isset($dados['nome']) && empty($dados['nome'])) {
                return [
                    'success' => false,
                    'message' => 'Nome é obrigatório',
                ];
            }

            // Validar CPF/CNPJ se fornecido
            if (isset($dados['cpf_cnpj']) && !empty($dados['cpf_cnpj'])) {
                $cpfCnpj = $this->limparDocumento($dados['cpf_cnpj']);
                $tipoPessoa = $dados['tipo_pessoa'] ?? $clienteExistente['data']['tipo_pessoa'];

                if ($tipoPessoa === 'fisica') {
                    if (!$this->validarCPF($cpfCnpj)) {
                        return [
                            'success' => false,
                            'message' => 'CPF inválido',
                        ];
                    }
                } else {
                    if (!$this->validarCNPJ($cpfCnpj)) {
                        return [
                            'success' => false,
                            'message' => 'CNPJ inválido',
                        ];
                    }
                }
                $dados['cpf_cnpj'] = $cpfCnpj;
            }

            // Validar email se fornecido
            if (isset($dados['email']) && !empty($dados['email'])) {
                if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
                    return [
                        'success' => false,
                        'message' => 'Email inválido',
                    ];
                }
            }

            // Limpar CEP
            if (isset($dados['cep']) && !empty($dados['cep'])) {
                $dados['cep'] = preg_replace('/\D/', '', $dados['cep']);
            }

            // Preparar campos para update
            $campos = [
                'nome', 'razao_social', 'nome_fantasia', 'tipo_pessoa',
                'cpf_cnpj', 'rg_ie', 'email', 'telefone', 'celular', 'whatsapp',
                'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
                'limite_credito', 'prazo_pagamento_padrao', 'desconto_padrao', 'observacoes',
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

            $sql = 'UPDATE clientes SET '.implode(', ', $updates).' WHERE id = ? AND ativo = 1';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);

            error_log("✅ Cliente atualizado: ID {$id}");

            return [
                'success' => true,
                'message' => 'Cliente atualizado com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao atualizar cliente: '.$e->getMessage());

            if (strpos($e->getMessage(), 'já cadastrado') !== false) {
                return [
                    'success' => false,
                    'message' => 'CPF/CNPJ já cadastrado para outro cliente',
                ];
            }

            return [
                'success' => false,
                'message' => 'Erro ao atualizar cliente',
            ];
        }
    }

    // Desativar cliente (soft delete)
    public function desativar($id)
    {
        try {
            $stmt = $this->db->prepare('UPDATE clientes SET ativo = 0 WHERE id = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Cliente não encontrado',
                ];
            }

            error_log("✅ Cliente desativado: ID {$id}");

            return [
                'success' => true,
                'message' => 'Cliente desativado com sucesso',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao desativar cliente: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao desativar cliente',
            ];
        }
    }

    // Buscar clientes para select/autocomplete
    public function buscarParaSelect($termo = '', $limite = 10)
    {
        try {
            $sql = '
                SELECT id, nome, cpf_cnpj, cidade
                FROM clientes 
                WHERE ativo = 1 
                AND (nome LIKE ? OR razao_social LIKE ? OR cpf_cnpj LIKE ?)
                ORDER BY nome
                LIMIT ?
            ';

            $searchTerm = '%'.$termo.'%';

            $stmt = $this->db->prepare($sql);
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $limite]);

            return [
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao buscar clientes para select: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro na busca',
            ];
        }
    }

    // Métodos auxiliares

    private function limparDocumento($documento)
    {
        return preg_replace('/\D/', '', $documento);
    }

    private function validarCPF($cpf)
    {
        $cpf = preg_replace('/\D/', '', $cpf);

        if (strlen($cpf) != 11 || preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; ++$t) {
            for ($d = 0, $c = 0; $c < $t; ++$c) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }

        return true;
    }

    private function validarCNPJ($cnpj)
    {
        $cnpj = preg_replace('/\D/', '', $cnpj);

        if (strlen($cnpj) != 14 || preg_match('/(\d)\1{13}/', $cnpj)) {
            return false;
        }

        $tamanho = strlen($cnpj) - 2;
        $numeros = substr($cnpj, 0, $tamanho);
        $digitos = substr($cnpj, $tamanho);
        $soma = 0;
        $pos = $tamanho - 7;

        for ($i = $tamanho; $i >= 1; --$i) {
            $soma += $numeros[$tamanho - $i] * $pos--;
            if ($pos < 2) {
                $pos = 9;
            }
        }

        $resultado = $soma % 11 < 2 ? 0 : 11 - $soma % 11;
        if ($resultado != $digitos[0]) {
            return false;
        }

        $tamanho = $tamanho + 1;
        $numeros = substr($cnpj, 0, $tamanho);
        $soma = 0;
        $pos = $tamanho - 7;

        for ($i = $tamanho; $i >= 1; --$i) {
            $soma += $numeros[$tamanho - $i] * $pos--;
            if ($pos < 2) {
                $pos = 9;
            }
        }

        $resultado = $soma % 11 < 2 ? 0 : 11 - $soma % 11;

        return $resultado == $digitos[1];
    }
}