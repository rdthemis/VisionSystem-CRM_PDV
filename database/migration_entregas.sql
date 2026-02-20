-- ============================================
-- MIGRATION: Sistema de Entregas
-- ============================================

-- 1️⃣ CRIAR TABELA DE ZONAS DE ENTREGA
CREATE TABLE IF NOT EXISTS zonas_entrega (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL COMMENT 'Nome da zona (ex: Centro, Bairro A)',
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Taxa de entrega',
    descricao TEXT COMMENT 'Descrição opcional da zona',
    ativo TINYINT(1) DEFAULT 1 COMMENT '1 = ativa, 0 = inativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ativo (ativo),
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Zonas de entrega com taxas diferenciadas';

-- 2️⃣ ADICIONAR CAMPOS DE ENTREGA NA TABELA PEDIDOS
ALTER TABLE pedidos
ADD COLUMN tipo_pedido ENUM('balcao', 'entrega') DEFAULT 'balcao' COMMENT 'Tipo do pedido' AFTER status,
ADD COLUMN endereco_entrega TEXT COMMENT 'Endereço de entrega' AFTER tipo_pedido,
ADD COLUMN taxa_entrega DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Taxa de entrega aplicada' AFTER endereco_entrega,
ADD COLUMN zona_entrega_id INT COMMENT 'ID da zona de entrega' AFTER taxa_entrega,
ADD INDEX idx_tipo_pedido (tipo_pedido),
ADD INDEX idx_zona_entrega (zona_entrega_id);

-- 3️⃣ INSERIR ZONAS DE EXEMPLO (OPCIONAL - REMOVER SE NÃO QUISER)
INSERT INTO zonas_entrega (nome, valor, descricao) VALUES
('Centro', 5.00, 'Entrega na região central'),
('Bairro Próximo', 8.00, 'Bairros próximos ao centro'),
('Bairro Distante', 12.00, 'Bairros mais afastados'),
('Zona Rural', 15.00, 'Região rural e sítios');

-- ============================================
-- FIM DA MIGRATION
-- ============================================
