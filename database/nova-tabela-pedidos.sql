-- Estrutura necessária para a tabela pedidos
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cliente_id INT NULL;

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255) NOT NULL;

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS tipo_cliente ENUM ('avulso', 'cadastrado') DEFAULT 'avulso';

-- Adicionar índices para performance
ALTER TABLE pedidos ADD INDEX idx_cliente_id (cliente_id);

ALTER TABLE pedidos ADD INDEX idx_tipo_cliente (tipo_cliente);

-- Chave estrangeira opcional (se quiser garantir integridade)
-- ALTER TABLE pedidos ADD FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
-- Exemplo da estrutura completa da tabela pedidos:
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    -- Campos do cliente
    cliente_id INT NULL COMMENT 'ID do cliente cadastrado (NULL para avulso)',
    cliente_nome VARCHAR(255) NOT NULL COMMENT 'Nome do cliente (para histórico)',
    tipo_cliente ENUM ('avulso', 'cadastrado') DEFAULT 'avulso' COMMENT 'Tipo do cliente',
    -- Campos do pedido
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM ('aberto', 'fechado', 'cancelado') DEFAULT 'aberto',
    forma_pagamento VARCHAR(50) NULL,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_tipo_cliente (tipo_cliente),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);