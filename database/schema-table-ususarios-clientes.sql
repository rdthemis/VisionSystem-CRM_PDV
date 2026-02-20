-- =========================================
-- SCRIPT COMPLETO PARA SETUP DO BANCO
-- Execute este script no MySQL
-- =========================================
-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS projeto_crm CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE projeto_crm;

-- =========================================
-- TABELA DE USUÁRIOS
-- =========================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Dados básicos
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    -- Perfil
    tipo ENUM ('admin', 'usuario') NOT NULL DEFAULT 'usuario',
    ativo BOOLEAN DEFAULT TRUE,
    -- Dados extras
    telefone VARCHAR(20) NULL,
    foto VARCHAR(500) NULL,
    ultimo_login TIMESTAMP NULL,
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_email (email),
    INDEX idx_ativo (ativo),
    INDEX idx_tipo (tipo)
);

-- =========================================
-- TABELA DE CLIENTES
-- =========================================
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Dados básicos
    nome VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255) NULL,
    nome_fantasia VARCHAR(255) NULL,
    -- Documentos
    tipo_pessoa ENUM ('fisica', 'juridica') NOT NULL DEFAULT 'fisica',
    cpf_cnpj VARCHAR(20) NULL,
    rg_ie VARCHAR(20) NULL,
    -- Contato
    email VARCHAR(255) NULL,
    telefone VARCHAR(20) NULL,
    celular VARCHAR(20) NULL,
    whatsapp VARCHAR(20) NULL,
    -- Endereço
    cep VARCHAR(10) NULL,
    endereco VARCHAR(255) NULL,
    numero VARCHAR(10) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NULL,
    uf VARCHAR(2) NULL,
    -- Dados comerciais
    limite_credito DECIMAL(15, 2) DEFAULT 0.00,
    prazo_pagamento_padrao INT DEFAULT 30,
    desconto_padrao DECIMAL(5, 2) DEFAULT 0.00,
    -- Observações
    observacoes TEXT NULL,
    -- Controle
    ativo BOOLEAN DEFAULT TRUE,
    usuario_criacao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_cpf_cnpj (cpf_cnpj),
    INDEX idx_email (email),
    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo),
    INDEX idx_tipo_pessoa (tipo_pessoa),
    INDEX idx_cidade (cidade),
    INDEX idx_uf (uf),
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_criacao) REFERENCES usuarios (id)
);

-- =========================================
-- TRIGGERS PARA VALIDAR CPF/CNPJ ÚNICO
-- =========================================
DELIMITER / / CREATE TRIGGER tr_clientes_validate_documento BEFORE INSERT ON clientes FOR EACH ROW BEGIN
-- Valida se CPF/CNPJ já existe para clientes ativos
IF NEW.cpf_cnpj IS NOT NULL
AND NEW.cpf_cnpj != '' THEN IF EXISTS (
    SELECT
        1
    FROM
        clientes
    WHERE
        cpf_cnpj = NEW.cpf_cnpj
        AND ativo = TRUE
        AND id != IFNULL (NEW.id, 0)
) THEN SIGNAL SQLSTATE '45000'
SET
    MESSAGE_TEXT = 'CPF/CNPJ já cadastrado para outro cliente ativo';

END IF;

END IF;

END / / CREATE TRIGGER tr_clientes_validate_documento_update BEFORE
UPDATE ON clientes FOR EACH ROW BEGIN
-- Valida se CPF/CNPJ já existe para clientes ativos
IF NEW.cpf_cnpj IS NOT NULL
AND NEW.cpf_cnpj != '' THEN IF EXISTS (
    SELECT
        1
    FROM
        clientes
    WHERE
        cpf_cnpj = NEW.cpf_cnpj
        AND ativo = TRUE
        AND id != NEW.id
) THEN SIGNAL SQLSTATE '45000'
SET
    MESSAGE_TEXT = 'CPF/CNPJ já cadastrado para outro cliente ativo';

END IF;

END IF;

END / / DELIMITER;

-- =========================================
-- USUÁRIOS INICIAIS
-- =========================================
INSERT INTO
    usuarios (nome, email, senha, tipo)
VALUES
    (
        'Administrador',
        'admin@teste.com',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'admin'
    ),
    (
        'Usuário Teste',
        'usuario@teste.com',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'usuario'
    );

-- Senha para ambos: 123456
-- =========================================
-- CLIENTES INICIAIS
-- =========================================
INSERT INTO
    clientes (
        nome,
        tipo_pessoa,
        cpf_cnpj,
        email,
        telefone,
        celular,
        endereco,
        numero,
        bairro,
        cidade,
        uf,
        cep,
        limite_credito,
        usuario_criacao
    )
VALUES
    (
        'João Silva Santos',
        'fisica',
        '12345678900',
        'joao.silva@email.com',
        '(11) 3333-1234',
        '(11) 99999-1234',
        'Rua das Flores',
        '123',
        'Centro',
        'São Paulo',
        'SP',
        '01234-567',
        1000.00,
        1
    ),
    (
        'Maria Oliveira Costa',
        'fisica',
        '98765432100',
        'maria.oliveira@email.com',
        '(11) 3333-5678',
        '(11) 98888-5678',
        'Av. Paulista',
        '456',
        'Bela Vista',
        'São Paulo',
        'SP',
        '01310-100',
        2500.00,
        1
    ),
    (
        'Empresa XYZ Ltda',
        'juridica',
        '12345678000190',
        'contato@empresaxyz.com.br',
        '(11) 3333-9999',
        NULL,
        'Rua Comercial',
        '789',
        'Vila Madalena',
        'São Paulo',
        'SP',
        '05434-000',
        10000.00,
        1
    ),
    (
        'Tech Solutions EIRELI',
        'juridica',
        '98765432000111',
        'contato@techsolutions.com.br',
        '(11) 4444-0000',
        '(11) 99999-0000',
        'Av. Faria Lima',
        '1000',
        'Itaim Bibi',
        'São Paulo',
        'SP',
        '04538-132',
        25000.00,
        1
    ),
    (
        'Ana Paula Ferreira',
        'fisica',
        '11122233344',
        'ana.ferreira@email.com',
        NULL,
        '(11) 97777-8888',
        'Rua dos Jardins',
        '555',
        'Jardim Paulista',
        'São Paulo',
        'SP',
        '01234-000',
        1500.00,
        2
    );

-- =========================================
-- VIEW PARA FACILITAR CONSULTAS
-- =========================================
CREATE VIEW vw_clientes_completo AS
SELECT
    c.*,
    u.nome as nome_usuario_criacao,
    CASE
        WHEN c.tipo_pessoa = 'fisica' THEN 'Pessoa Física'
        WHEN c.tipo_pessoa = 'juridica' THEN 'Pessoa Jurídica'
    END as tipo_pessoa_texto,
    CASE
        WHEN c.cpf_cnpj IS NOT NULL
        AND c.tipo_pessoa = 'fisica' THEN CONCAT (
            SUBSTRING(c.cpf_cnpj, 1, 3),
            '.',
            SUBSTRING(c.cpf_cnpj, 4, 3),
            '.',
            SUBSTRING(c.cpf_cnpj, 7, 3),
            '-',
            SUBSTRING(c.cpf_cnpj, 10, 2)
        )
        WHEN c.cpf_cnpj IS NOT NULL
        AND c.tipo_pessoa = 'juridica' THEN CONCAT (
            SUBSTRING(c.cpf_cnpj, 1, 2),
            '.',
            SUBSTRING(c.cpf_cnpj, 3, 3),
            '.',
            SUBSTRING(c.cpf_cnpj, 6, 3),
            '/',
            SUBSTRING(c.cpf_cnpj, 9, 4),
            '-',
            SUBSTRING(c.cpf_cnpj, 13, 2)
        )
        ELSE c.cpf_cnpj
    END as cpf_cnpj_formatado,
    CONCAT (
        COALESCE(c.endereco, ''),
        CASE
            WHEN c.numero IS NOT NULL THEN CONCAT (', ', c.numero)
            ELSE ''
        END,
        CASE
            WHEN c.complemento IS NOT NULL THEN CONCAT (' - ', c.complemento)
            ELSE ''
        END,
        CASE
            WHEN c.bairro IS NOT NULL THEN CONCAT (', ', c.bairro)
            ELSE ''
        END
    ) as endereco_completo
FROM
    clientes c
    LEFT JOIN usuarios u ON c.usuario_criacao = u.id
WHERE
    c.ativo = TRUE
ORDER BY
    c.nome;

-- =========================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =========================================
-- Índice composto para buscas frequentes
CREATE INDEX idx_clientes_busca ON clientes (ativo, nome, cidade);

CREATE INDEX idx_clientes_data ON clientes (created_at);

CREATE INDEX idx_usuarios_login ON usuarios (email, ativo);

-- =========================================
-- VERIFICAÇÕES FINAIS
-- =========================================
-- Verificar se tudo foi criado
SELECT
    'Tabelas criadas:' as status;

SHOW TABLES;

SELECT
    'Usuários cadastrados:' as status;

SELECT
    id,
    nome,
    email,
    tipo
FROM
    usuarios;

SELECT
    'Clientes cadastrados:' as status;

SELECT
    id,
    nome,
    tipo_pessoa,
    cidade
FROM
    clientes;

SELECT
    '✅ Banco configurado com sucesso!' as resultado;