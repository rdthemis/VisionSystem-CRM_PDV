-- ============================================
-- MIGRATION: Fila de Impressão (agente local)
-- ============================================
-- Com o backend rodando no Railway (nuvem), não existe mais um caminho
-- direto até a impressora Bematech, que fica fisicamente na loja. Esta
-- migration cria a fila que o agente de impressão local (um script Python
-- rodando no PC da loja) consulta periodicamente para saber quais pedidos
-- ainda precisam ser impressos.
--
-- Importante: os novos campos ficam NULL por padrão e só são preenchidos
-- explicitamente pelo código que sabe que aquele pedido deve ser impresso
-- (por enquanto, só CardapioPedidoController::criar()). Isso evita que
-- comandas abertas no PDV local (mesas, balcão) entrem nessa fila sem
-- querer — o PDV continua imprimindo do jeito que já faz hoje.

ALTER TABLE pedidos
ADD COLUMN status_impressao ENUM('pendente', 'processando', 'impressa', 'erro') NULL DEFAULT NULL
    COMMENT 'NULL = não entra na fila do agente. pendente = aguardando impressão.' AFTER status,
ADD COLUMN tentativas_impressao INT NOT NULL DEFAULT 0 COMMENT 'Quantas vezes o agente já tentou imprimir',
ADD COLUMN erro_impressao VARCHAR(255) NULL COMMENT 'Última mensagem de erro reportada pelo agente',
ADD COLUMN impresso_em DATETIME NULL COMMENT 'Quando a impressão foi confirmada pelo agente',
ADD COLUMN impressao_atualizada_em DATETIME NULL COMMENT 'Última vez que o status_impressao mudou (usado para destravar jobs travados)';

ALTER TABLE pedidos
ADD INDEX idx_status_impressao (status_impressao, id);

-- ============================================
-- FIM DA MIGRATION
-- ============================================
