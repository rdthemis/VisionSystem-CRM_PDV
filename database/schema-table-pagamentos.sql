-- =========================================
-- TABELAS PARA SISTEMA DE RECIBOS
-- Execute este script no MySQL
-- =========================================
USE meu_projeto;

-- =========================================
-- TABELA DE RECIBOS
-- =========================================
CREATE TABLE IF NOT EXISTS recibos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Numeração
    numero_recibo VARCHAR(20) NOT NULL UNIQUE,
    serie VARCHAR(10) DEFAULT 'A',
    -- Relacionamentos
    cliente_id INT NOT NULL,
    conta_receber_id INT NULL,
    pagamento_id INT NULL,
    usuario_emissao INT NOT NULL,
    -- Dados do recibo
    valor_recebido DECIMAL(15, 2) NOT NULL,
    valor_desconto DECIMAL(15, 2) DEFAULT 0.00,
    valor_juros DECIMAL(15, 2) DEFAULT 0.00,
    valor_multa DECIMAL(15, 2) DEFAULT 0.00,
    valor_liquido DECIMAL(15, 2) NOT NULL,
    -- Descrição e referência
    descricao TEXT NOT NULL,
    referencia VARCHAR(255) NULL, -- Número da nota, pedido, etc.
    -- Datas
    data_emissao DATE NOT NULL,
    data_vencimento_original DATE NULL,
    data_pagamento DATE NOT NULL,
    -- Forma de pagamento
    forma_pagamento VARCHAR(100) NOT NULL,
    -- Dados bancários (se aplicável)
    banco VARCHAR(100) NULL,
    agencia VARCHAR(20) NULL,
    conta VARCHAR(30) NULL,
    cheque VARCHAR(50) NULL,
    -- Observações
    observacoes TEXT NULL,
    -- Status
    status ENUM ('ativo', 'cancelado') DEFAULT 'ativo',
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_numero_recibo (numero_recibo),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_conta_receber_id (conta_receber_id),
    INDEX idx_pagamento_id (pagamento_id),
    INDEX idx_data_emissao (data_emissao),
    INDEX idx_data_pagamento (data_pagamento),
    INDEX idx_status (status),
    -- Chaves estrangeiras
    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
    FOREIGN KEY (conta_receber_id) REFERENCES contas_receber (id),
    FOREIGN KEY (pagamento_id) REFERENCES pagamentos (id),
    FOREIGN KEY (usuario_emissao) REFERENCES usuarios (id)
);

-- =========================================
-- TABELA DE CONTROLE DE NUMERAÇÃO
-- =========================================
CREATE TABLE IF NOT EXISTS numeracao_recibos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serie VARCHAR(10) NOT NULL DEFAULT 'A',
    ultimo_numero INT NOT NULL DEFAULT 0,
    prefixo VARCHAR(10) DEFAULT 'REC',
    ano_referencia YEAR NOT NULL,
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índice único por série e ano
    UNIQUE KEY unique_serie_ano (serie, ano_referencia)
);

-- =========================================
-- TABELA DE RELATÓRIOS SALVOS
-- =========================================
CREATE TABLE IF NOT EXISTS relatorios_salvos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Identificação
    nome VARCHAR(255) NOT NULL,
    tipo ENUM (
        'clientes',
        'contas_receber',
        'recibos',
        'financeiro',
        'personalizado'
    ) NOT NULL,
    -- Configurações do relatório (JSON)
    filtros JSON NULL,
    campos JSON NULL,
    configuracoes JSON NULL,
    -- Dados
    usuario_criacao INT NOT NULL,
    publico BOOLEAN DEFAULT FALSE,
    -- Datas
    periodo_inicio DATE NULL,
    periodo_fim DATE NULL,
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_tipo (tipo),
    INDEX idx_usuario_criacao (usuario_criacao),
    INDEX idx_publico (publico),
    -- Chave estrangeira
    FOREIGN KEY (usuario_criacao) REFERENCES usuarios (id)
);

-- =========================================
-- TRIGGERS PARA NUMERAÇÃO AUTOMÁTICA
-- =========================================
DELIMITER / /
-- Trigger para gerar número do recibo automaticamente
CREATE TRIGGER tr_recibos_gerar_numero BEFORE INSERT ON recibos FOR EACH ROW BEGIN DECLARE proximo_numero INT;

DECLARE ano_atual YEAR;

DECLARE numero_formatado VARCHAR(20);

-- Se número não foi fornecido, gerar automaticamente
IF NEW.numero_recibo IS NULL
OR NEW.numero_recibo = '' THEN
SET
    ano_atual = YEAR (NEW.data_emissao);

-- Buscar ou criar controle de numeração para a série e ano
INSERT INTO
    numeracao_recibos (serie, ultimo_numero, ano_referencia)
VALUES
    (NEW.serie, 0, ano_atual) ON DUPLICATE KEY
UPDATE ultimo_numero = ultimo_numero;

-- Incrementar e obter próximo número
UPDATE numeracao_recibos
SET
    ultimo_numero = ultimo_numero + 1
WHERE
    serie = NEW.serie
    AND ano_referencia = ano_atual;

-- Buscar o número atualizado
SELECT
    ultimo_numero INTO proximo_numero
FROM
    numeracao_recibos
WHERE
    serie = NEW.serie
    AND ano_referencia = ano_atual;

-- Formatar número: REC-A-2024-000001
SET
    numero_formatado = CONCAT (
        COALESCE(
            (
                SELECT
                    prefixo
                FROM
                    numeracao_recibos
                WHERE
                    serie = NEW.serie
                    AND ano_referencia = ano_atual
                LIMIT
                    1
            ),
            'REC'
        ),
        '-',
        NEW.serie,
        '-',
        ano_atual,
        '-',
        LPAD (proximo_numero, 6, '0')
    );

SET
    NEW.numero_recibo = numero_formatado;

END IF;

-- Calcular valor líquido se não fornecido
IF NEW.valor_liquido IS NULL
OR NEW.valor_liquido = 0 THEN
SET
    NEW.valor_liquido = NEW.valor_recebido + COALESCE(NEW.valor_juros, 0) + COALESCE(NEW.valor_multa, 0) - COALESCE(NEW.valor_desconto, 0);

END IF;

END / / DELIMITER;

-- =========================================
-- VIEWS PARA RELATÓRIOS
-- =========================================
-- View completa de recibos
CREATE VIEW vw_recibos_completo AS
SELECT
    r.*,
    c.nome as cliente_nome,
    c.cpf_cnpj as cliente_documento,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    c.endereco as cliente_endereco,
    c.cidade as cliente_cidade,
    c.uf as cliente_uf,
    u.nome as usuario_emissao_nome,
    cr.descricao as conta_descricao,
    cr.numero_documento as conta_numero_documento,
    CASE
        WHEN r.status = 'ativo' THEN 'Ativo'
        WHEN r.status = 'cancelado' THEN 'Cancelado'
    END as status_texto
FROM
    recibos r
    LEFT JOIN clientes c ON r.cliente_id = c.id
    LEFT JOIN usuarios u ON r.usuario_emissao = u.id
    LEFT JOIN contas_receber cr ON r.conta_receber_id = cr.id
ORDER BY
    r.data_emissao DESC,
    r.numero_recibo DESC;

-- View de resumo financeiro por período
CREATE VIEW vw_resumo_recibos AS
SELECT
    DATE_FORMAT (data_emissao, '%Y-%m') as periodo,
    COUNT(*) as total_recibos,
    SUM(valor_recebido) as total_recebido,
    SUM(valor_desconto) as total_desconto,
    SUM(valor_juros) as total_juros,
    SUM(valor_multa) as total_multa,
    SUM(valor_liquido) as total_liquido,
    AVG(valor_liquido) as ticket_medio
FROM
    recibos
WHERE
    status = 'ativo'
GROUP BY
    DATE_FORMAT (data_emissao, '%Y-%m')
ORDER BY
    periodo DESC;

-- =========================================
-- INSERIR NUMERAÇÃO INICIAL
-- =========================================
INSERT INTO
    numeracao_recibos (serie, ultimo_numero, prefixo, ano_referencia)
VALUES
    ('A', 0, 'REC', YEAR (CURDATE ())) ON DUPLICATE KEY
UPDATE ultimo_numero = ultimo_numero;

-- =========================================
-- FUNÇÃO PARA GERAR RECIBO AUTOMÁTICO
-- =========================================
DELIMITER / / CREATE PROCEDURE sp_gerar_recibo_pagamento (
    IN p_pagamento_id INT,
    OUT p_recibo_id INT,
    OUT p_numero_recibo VARCHAR(20)
) BEGIN DECLARE v_cliente_id INT;

DECLARE v_conta_id INT;

DECLARE v_usuario_id INT;

DECLARE v_valor_pago DECIMAL(15, 2);

DECLARE v_valor_desconto DECIMAL(15, 2);

DECLARE v_valor_juros DECIMAL(15, 2);

DECLARE v_valor_multa DECIMAL(15, 2);

DECLARE v_data_pagamento DATE;

DECLARE v_forma_pagamento VARCHAR(100);

DECLARE v_observacoes TEXT;

DECLARE v_banco VARCHAR(100);

DECLARE v_agencia VARCHAR(20);

DECLARE v_conta VARCHAR(30);

DECLARE v_cheque VARCHAR(50);

DECLARE v_conta_descricao TEXT;

DECLARE v_conta_numero VARCHAR(100);

-- Buscar dados do pagamento
SELECT
    p.conta_receber_id,
    p.usuario_recebimento,
    p.valor_pago,
    p.valor_desconto,
    p.valor_juros,
    p.valor_multa,
    p.data_pagamento,
    p.forma_pagamento,
    p.observacoes,
    p.banco,
    p.agencia,
    p.conta,
    p.cheque,
    cr.cliente_id,
    cr.descricao,
    cr.numero_documento INTO v_conta_id,
    v_usuario_id,
    v_valor_pago,
    v_valor_desconto,
    v_valor_juros,
    v_valor_multa,
    v_data_pagamento,
    v_forma_pagamento,
    v_observacoes,
    v_banco,
    v_agencia,
    v_conta,
    v_cheque,
    v_cliente_id,
    v_conta_descricao,
    v_conta_numero
FROM
    pagamentos p
    LEFT JOIN contas_receber cr ON p.conta_receber_id = cr.id
WHERE
    p.id = p_pagamento_id;

-- Inserir recibo
INSERT INTO
    recibos (
        cliente_id,
        conta_receber_id,
        pagamento_id,
        usuario_emissao,
        valor_recebido,
        valor_desconto,
        valor_juros,
        valor_multa,
        descricao,
        referencia,
        data_emissao,
        data_pagamento,
        forma_pagamento,
        banco,
        agencia,
        conta,
        cheque,
        observacoes
    )
VALUES
    (
        v_cliente_id,
        v_conta_id,
        p_pagamento_id,
        v_usuario_id,
        v_valor_pago,
        v_valor_desconto,
        v_valor_juros,
        v_valor_multa,
        CONCAT ('Recebimento referente a: ', v_conta_descricao),
        v_conta_numero,
        v_data_pagamento,
        v_data_pagamento,
        v_forma_pagamento,
        v_banco,
        v_agencia,
        v_conta,
        v_cheque,
        v_observacoes
    );

-- Retornar ID e número do recibo criado
SET
    p_recibo_id = LAST_INSERT_ID ();

SELECT
    numero_recibo INTO p_numero_recibo
FROM
    recibos
WHERE
    id = p_recibo_id;

END / / DELIMITER;

-- =========================================
-- DADOS DE EXEMPLO
-- =========================================
-- Inserir alguns recibos de exemplo (será feito automaticamente pelos triggers)
INSERT INTO
    recibos (
        cliente_id,
        usuario_emissao,
        valor_recebido,
        descricao,
        data_emissao,
        data_pagamento,
        forma_pagamento
    )
VALUES
    (
        1,
        1,
        500.00,
        'Pagamento de serviços prestados',
        CURDATE (),
        CURDATE (),
        'PIX'
    ),
    (
        2,
        1,
        1200.00,
        'Recebimento de vendas',
        CURDATE () - INTERVAL 1 DAY,
        CURDATE () - INTERVAL 1 DAY,
        'Cartão de Crédito'
    ),
    (
        3,
        1,
        800.00,
        'Pagamento de licença de software',
        CURDATE () - INTERVAL 2 DAY,
        CURDATE () - INTERVAL 2 DAY,
        'Transferência'
    );

-- =========================================
-- VERIFICAÇÕES FINAIS
-- =========================================
SELECT
    'Tabelas de Recibos criadas:' as status;

SHOW TABLES LIKE '%recibo%';

SELECT
    'Recibos de exemplo:' as status;

SELECT
    numero_recibo,
    cliente_nome,
    valor_liquido,
    data_emissao
FROM
    vw_recibos_completo
LIMIT
    5;

SELECT
    'Numeração configurada:' as status;

SELECT
    *
FROM
    numeracao_recibos;

SELECT
    '✅ Sistema de Recibos configurado com sucesso!' as resultado;