-- SQL para criar as tabelas do caixa
CREATE TABLE IF NOT EXISTS caixa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_abertura TIMESTAMP NOT NULL,
    data_fechamento TIMESTAMP NULL,
    saldo_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    saldo_final DECIMAL(10, 2) NULL,
    status ENUM ('aberto', 'fechado') DEFAULT 'aberto',
    usuario_abertura INT NOT NULL,
    usuario_fechamento INT NULL,
    observacoes_abertura TEXT NULL,
    observacoes_fechamento TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_data_abertura (data_abertura),
    FOREIGN KEY (usuario_abertura) REFERENCES usuarios (id),
    FOREIGN KEY (usuario_fechamento) REFERENCES usuarios (id)
);

CREATE TABLE IF NOT EXISTS caixa_movimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caixa_id INT NOT NULL,
    tipo ENUM ('entrada', 'saida') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    usuario_id INT NOT NULL,
    pedido_id INT NULL COMMENT 'ID do pedido que gerou este movimento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_caixa_id (caixa_id),
    INDEX idx_tipo (tipo),
    INDEX idx_categoria (categoria),
    INDEX idx_created_at (created_at),
    INDEX idx_pedido_id (pedido_id),
    FOREIGN KEY (caixa_id) REFERENCES caixa (id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE SET NULL
);