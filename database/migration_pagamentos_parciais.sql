-- ============================================
-- MIGRATION: Pagamento Parcial de Comandas
-- ============================================
-- Permite registrar múltiplos pagamentos (parciais) por pedido,
-- mantendo a comanda aberta com saldo devedor até ser totalmente
-- quitada. Qualquer parcela pode virar venda a prazo (conta a
-- receber vinculada só àquele valor), sem precisar fechar o
-- pedido inteiro.

-- 1️⃣ NOVO STATUS 'parcial' E CAMPO valor_pago EM PEDIDOS
ALTER TABLE pedidos
MODIFY COLUMN status ENUM('aberto', 'parcial', 'finalizado', 'cancelado') DEFAULT 'aberto',
ADD COLUMN valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Soma dos pagamentos já registrados' AFTER total;

-- 2️⃣ CORRIGIR contas_receber: FALTAVA VÍNCULO COM O PEDIDO
-- (Pedido::gerarContaReceber() já tentava usar esta coluna, mas ela
-- nunca existiu no schema real — por isso sempre falhava em silêncio.)
ALTER TABLE contas_receber
ADD COLUMN pedido_id INT NULL COMMENT 'Pedido de origem, quando a conta vem de uma venda a prazo' AFTER cliente_id,
ADD INDEX idx_pedido_id (pedido_id),
ADD FOREIGN KEY (pedido_id) REFERENCES pedidos (id);

-- 3️⃣ TABELA DE PAGAMENTOS DE PEDIDO (1 pedido : N pagamentos)
-- Paralela a `pagamentos` (que é exclusiva de contas_receber, com
-- conta_receber_id NOT NULL — não dá para reaproveitar sem quebrar
-- essa constraint).
CREATE TABLE IF NOT EXISTS pedido_pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'prazo') NOT NULL,
    valor_recebido DECIMAL(10,2) NULL COMMENT 'Valor entregue pelo cliente (dinheiro), para cálculo de troco',
    valor_troco DECIMAL(10,2) NULL,
    conta_receber_id INT NULL COMMENT 'Preenchido quando forma_pagamento = prazo',
    observacoes TEXT NULL,
    usuario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pedido_id (pedido_id),
    INDEX idx_conta_receber_id (conta_receber_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
    FOREIGN KEY (conta_receber_id) REFERENCES contas_receber (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de pagamentos (parciais ou totais) de cada pedido';

-- 4️⃣ TRIGGERS: manter pedidos.valor_pago e pedidos.status sempre
-- consistentes com o histórico de pedido_pagamentos (mesmo padrão já
-- usado em contas_receber/pagamentos — ver schema-table-contasaReceber.sql)
DELIMITER //

CREATE TRIGGER tr_pedido_pagamentos_after_insert
AFTER INSERT ON pedido_pagamentos
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_pago DECIMAL(10,2);
    DECLARE v_status VARCHAR(20);

    SELECT COALESCE(SUM(valor), 0) INTO v_pago
    FROM pedido_pagamentos
    WHERE pedido_id = NEW.pedido_id;

    SELECT total, status INTO v_total, v_status
    FROM pedidos
    WHERE id = NEW.pedido_id;

    IF v_status <> 'cancelado' THEN
        UPDATE pedidos
        SET
            valor_pago = v_pago,
            status = CASE
                WHEN v_pago >= v_total THEN 'finalizado'
                WHEN v_pago > 0 THEN 'parcial'
                ELSE 'aberto'
            END,
            updated_at = NOW()
        WHERE id = NEW.pedido_id;
    END IF;
END //

CREATE TRIGGER tr_pedido_pagamentos_after_delete
AFTER DELETE ON pedido_pagamentos
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_pago DECIMAL(10,2);
    DECLARE v_status VARCHAR(20);

    SELECT COALESCE(SUM(valor), 0) INTO v_pago
    FROM pedido_pagamentos
    WHERE pedido_id = OLD.pedido_id;

    SELECT total, status INTO v_total, v_status
    FROM pedidos
    WHERE id = OLD.pedido_id;

    IF v_status <> 'cancelado' THEN
        UPDATE pedidos
        SET
            valor_pago = v_pago,
            status = CASE
                WHEN v_pago >= v_total THEN 'finalizado'
                WHEN v_pago > 0 THEN 'parcial'
                ELSE 'aberto'
            END,
            updated_at = NOW()
        WHERE id = OLD.pedido_id;
    END IF;
END //

DELIMITER ;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
