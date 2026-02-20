-- =========================================
-- TABELAS PARA CONTAS A RECEBER
-- Execute este script no MySQL
-- =========================================
USE meu_projeto;

-- =========================================
-- TABELA DE CONTAS A RECEBER
-- =========================================
CREATE TABLE IF NOT EXISTS contas_receber (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Relacionamentos
    cliente_id INT NOT NULL,
    usuario_criacao INT NOT NULL,
    -- Dados da conta
    descricao VARCHAR(500) NOT NULL,
    numero_documento VARCHAR(100) NULL,
    valor_original DECIMAL(15, 2) NOT NULL,
    valor_recebido DECIMAL(15, 2) DEFAULT 0.00,
    valor_desconto DECIMAL(15, 2) DEFAULT 0.00,
    valor_juros DECIMAL(15, 2) DEFAULT 0.00,
    valor_multa DECIMAL(15, 2) DEFAULT 0.00,
    -- Datas
    data_vencimento DATE NOT NULL,
    data_emissao DATE NOT NULL DEFAULT (CURDATE ()),
    data_recebimento DATE NULL,
    -- Status
    status ENUM ('pendente', 'pago', 'vencido', 'cancelado') NOT NULL DEFAULT 'pendente',
    -- Dados adicionais
    observacoes TEXT NULL,
    forma_pagamento VARCHAR(100) NULL,
    banco VARCHAR(100) NULL,
    agencia VARCHAR(20) NULL,
    conta VARCHAR(30) NULL,
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_status (status),
    INDEX idx_data_vencimento (data_vencimento),
    INDEX idx_data_recebimento (data_recebimento),
    INDEX idx_ativo (ativo),
    INDEX idx_valor_original (valor_original),
    INDEX idx_data_emissao (data_emissao),
    -- Chaves estrangeiras
    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
    FOREIGN KEY (usuario_criacao) REFERENCES usuarios (id)
);

-- =========================================
-- TABELA DE HISTÓRICO DE PAGAMENTOS
-- =========================================
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Relacionamentos
    conta_receber_id INT NOT NULL,
    usuario_recebimento INT NOT NULL,
    -- Dados do pagamento
    valor_pago DECIMAL(15, 2) NOT NULL,
    valor_desconto DECIMAL(15, 2) DEFAULT 0.00,
    valor_juros DECIMAL(15, 2) DEFAULT 0.00,
    valor_multa DECIMAL(15, 2) DEFAULT 0.00,
    -- Detalhes
    data_pagamento DATE NOT NULL,
    forma_pagamento VARCHAR(100) NOT NULL,
    observacoes TEXT NULL,
    -- Dados bancários
    banco VARCHAR(100) NULL,
    agencia VARCHAR(20) NULL,
    conta VARCHAR(30) NULL,
    cheque VARCHAR(50) NULL,
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_conta_receber_id (conta_receber_id),
    INDEX idx_data_pagamento (data_pagamento),
    INDEX idx_forma_pagamento (forma_pagamento),
    -- Chaves estrangeiras
    FOREIGN KEY (conta_receber_id) REFERENCES contas_receber (id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_recebimento) REFERENCES usuarios (id)
);

-- =========================================
-- TRIGGERS PARA ATUALIZAR STATUS
-- =========================================
DELIMITER / /
-- Trigger para atualizar status quando valor recebido mudar
CREATE TRIGGER tr_contas_receber_update_status BEFORE
UPDATE ON contas_receber FOR EACH ROW BEGIN
-- Se valor recebido >= valor original, marcar como pago
IF NEW.valor_recebido >= NEW.valor_original THEN
SET
    NEW.status = 'pago';

IF NEW.data_recebimento IS NULL THEN
SET
    NEW.data_recebimento = CURDATE ();

END IF;

-- Se data vencimento passou e não foi pago, marcar como vencido
ELSEIF NEW.data_vencimento < CURDATE ()
AND NEW.status = 'pendente' THEN
SET
    NEW.status = 'vencido';

END IF;

END / /
-- Trigger para atualizar valor recebido quando adicionar pagamento
CREATE TRIGGER tr_pagamentos_update_conta AFTER INSERT ON pagamentos FOR EACH ROW BEGIN
UPDATE contas_receber
SET
    valor_recebido = (
        SELECT
            COALESCE(SUM(valor_pago), 0)
        FROM
            pagamentos
        WHERE
            conta_receber_id = NEW.conta_receber_id
    )
WHERE
    id = NEW.conta_receber_id;

END / /
-- Trigger para atualizar valor recebido quando remover pagamento
CREATE TRIGGER tr_pagamentos_delete_update_conta AFTER DELETE ON pagamentos FOR EACH ROW BEGIN
UPDATE contas_receber
SET
    valor_recebido = (
        SELECT
            COALESCE(SUM(valor_pago), 0)
        FROM
            pagamentos
        WHERE
            conta_receber_id = OLD.conta_receber_id
    )
WHERE
    id = OLD.conta_receber_id;

END / / DELIMITER;

-- =========================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =========================================
-- View com dados completos das contas
CREATE VIEW vw_contas_receber_completo AS
SELECT
    cr.*,
    c.nome as cliente_nome,
    c.cpf_cnpj as cliente_documento,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    c.cidade as cliente_cidade,
    c.uf as cliente_uf,
    u.nome as usuario_criacao_nome,
    -- Cálculos
    (cr.valor_original - cr.valor_recebido) as valor_pendente,
    CASE
        WHEN cr.status = 'pago' THEN 'Pago'
        WHEN cr.status = 'pendente' THEN 'Pendente'
        WHEN cr.status = 'vencido' THEN 'Vencido'
        WHEN cr.status = 'cancelado' THEN 'Cancelado'
    END as status_texto,
    -- Dias em atraso
    CASE
        WHEN cr.status = 'vencido' THEN DATEDIFF (CURDATE (), cr.data_vencimento)
        ELSE 0
    END as dias_atraso,
    -- Percentual recebido
    CASE
        WHEN cr.valor_original > 0 THEN (cr.valor_recebido / cr.valor_original) * 100
        ELSE 0
    END as percentual_recebido
FROM
    contas_receber cr
    LEFT JOIN clientes c ON cr.cliente_id = c.id
    LEFT JOIN usuarios u ON cr.usuario_criacao = u.id
WHERE
    cr.ativo = TRUE
ORDER BY
    cr.data_vencimento;

-- View de resumo financeiro
CREATE VIEW vw_resumo_financeiro AS
SELECT
    COUNT(*) as total_contas,
    SUM(valor_original) as valor_total,
    SUM(valor_recebido) as valor_recebido_total,
    SUM(valor_original - valor_recebido) as valor_pendente_total,
    -- Por status
    SUM(
        CASE
            WHEN status = 'pendente' THEN 1
            ELSE 0
        END
    ) as contas_pendentes,
    SUM(
        CASE
            WHEN status = 'pago' THEN 1
            ELSE 0
        END
    ) as contas_pagas,
    SUM(
        CASE
            WHEN status = 'vencido' THEN 1
            ELSE 0
        END
    ) as contas_vencidas,
    -- Valores por status
    SUM(
        CASE
            WHEN status = 'pendente' THEN valor_original - valor_recebido
            ELSE 0
        END
    ) as valor_pendente,
    SUM(
        CASE
            WHEN status = 'pago' THEN valor_original
            ELSE 0
        END
    ) as valor_pago,
    SUM(
        CASE
            WHEN status = 'vencido' THEN valor_original - valor_recebido
            ELSE 0
        END
    ) as valor_vencido
FROM
    contas_receber
WHERE
    ativo = TRUE;

-- =========================================
-- DADOS DE EXEMPLO
-- =========================================
INSERT INTO
    contas_receber (
        cliente_id,
        usuario_criacao,
        descricao,
        numero_documento,
        valor_original,
        data_vencimento,
        data_emissao,
        observacoes
    )
VALUES
    -- Conta pendente
    (
        1,
        1,
        'Venda de produtos - Pedido #001',
        'NF-001',
        1500.00,
        '2024-08-15',
        '2024-07-15',
        'Primeira venda do cliente'
    ),
    -- Conta paga
    (
        2,
        1,
        'Prestação de serviços',
        'NF-002',
        2500.00,
        '2024-07-20',
        '2024-06-20',
        'Serviço de consultoria'
    ),
    -- Conta vencida
    (
        1,
        1,
        'Venda de equipamentos',
        'NF-003',
        3200.00,
        '2024-06-10',
        '2024-05-10',
        'Equipamentos de informática'
    ),
    -- Conta pendente futura
    (
        3,
        1,
        'Licença de software',
        'NF-004',
        800.00,
        '2024-09-30',
        '2024-06-15',
        'Licença anual'
    ),
    -- Conta parcialmente paga
    (
        2,
        1,
        'Manutenção mensal',
        'NF-005',
        1200.00,
        '2024-08-01',
        '2024-07-01',
        'Contrato de manutenção'
    );

-- Marcar uma conta como paga
UPDATE contas_receber
SET
    valor_recebido = valor_original,
    status = 'pago',
    data_recebimento = '2024-07-22'
WHERE
    id = 2;

-- Adicionar pagamento parcial
INSERT INTO
    pagamentos (
        conta_receber_id,
        usuario_recebimento,
        valor_pago,
        data_pagamento,
        forma_pagamento,
        observacoes
    )
VALUES
    (
        5,
        1,
        600.00,
        '2024-07-28',
        'Dinheiro',
        'Pagamento parcial'
    );

-- =========================================
-- VERIFICAÇÕES FINAIS
-- =========================================
SELECT
    'Tabelas de Contas a Receber criadas:' as status;

SHOW TABLES LIKE '%receber%';

SHOW TABLES LIKE '%pagamentos%';

SELECT
    'Contas cadastradas:' as status;

SELECT
    id,
    descricao,
    valor_original,
    valor_recebido,
    status,
    data_vencimento
FROM
    contas_receber;

SELECT
    'Resumo financeiro:' as status;

SELECT
    *
FROM
    vw_resumo_financeiro;

SELECT
    '✅ Módulo Contas a Receber configurado com sucesso!' as resultado;