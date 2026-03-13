-- ============================================
-- MIGRATION: SISTEMA DE SEGURANÇA
-- ============================================

-- 1️⃣ ADICIONAR CAMPOS DE SEGURANÇA NA TABELA USUARIOS
ALTER TABLE usuarios
ADD COLUMN password_hash VARCHAR(255) COMMENT 'Hash bcrypt da senha (substitui password_md5)' AFTER senha,
ADD COLUMN refresh_token VARCHAR(500) COMMENT 'Token de refresh para renovação' AFTER password_hash,
ADD COLUMN refresh_token_expires DATETIME COMMENT 'Expiração do refresh token' AFTER refresh_token,
ADD COLUMN tentativas_login INT DEFAULT 0 COMMENT 'Contador de tentativas falhas' AFTER refresh_token_expires,
ADD COLUMN bloqueado_ate DATETIME NULL COMMENT 'Data/hora até quando está bloqueado' AFTER tentativas_login,
ADD COLUMN ultimo_login DATETIME COMMENT 'Data/hora do último login' AFTER bloqueado_ate,
ADD COLUMN ip_ultimo_login VARCHAR(45) COMMENT 'IP do último login' AFTER ultimo_login,
ADD INDEX idx_refresh_token (refresh_token),
ADD INDEX idx_bloqueado (bloqueado_ate);

-- 2️⃣ CRIAR TABELA DE LOGS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS logs_seguranca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL COMMENT 'ID do usuário (null se login falhou)',
    tipo_evento ENUM('login_sucesso', 'login_falha', 'logout', 'token_refresh', 'senha_alterada', 'bloqueio', 'desbloqueio') NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    detalhes TEXT COMMENT 'Informações adicionais em JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo (tipo_evento),
    INDEX idx_data (created_at),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de eventos de segurança';

-- 3️⃣ CRIAR TABELA DE SESSÕES ATIVAS
CREATE TABLE IF NOT EXISTS sessoes_ativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (refresh_token),
    INDEX idx_expiracao (expires_at),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sessões ativas de usuários';

-- 4️⃣ CRIAR TABELA DE TENTATIVAS DE LOGIN
CREATE TABLE IF NOT EXISTS tentativas_login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    sucesso TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_ip (email, ip_address),
    INDEX idx_data (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de tentativas de login para rate limiting';

-- 5️⃣ PROCEDURE PARA LIMPAR DADOS ANTIGOS (executar periodicamente)
DELIMITER $$

CREATE PROCEDURE limpar_dados_seguranca()
BEGIN
    -- Limpar logs com mais de 90 dias
    DELETE FROM logs_seguranca WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Limpar sessões expiradas
    DELETE FROM sessoes_ativas WHERE expires_at < NOW();
    
    -- Limpar tentativas de login com mais de 24 horas
    DELETE FROM tentativas_login WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- Desbloquear usuários que já passaram do tempo de bloqueio
    UPDATE usuarios SET bloqueado_ate = NULL, tentativas_login = 0 
    WHERE bloqueado_ate IS NOT NULL AND bloqueado_ate < NOW();
END$$

DELIMITER ;

-- 6️⃣ CRIAR EVENT PARA EXECUTAR LIMPEZA AUTOMÁTICA (1x por dia às 3h da manhã)
-- Verificar se o event scheduler está habilitado: SHOW VARIABLES LIKE 'event_scheduler';
-- Se não estiver, executar: SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS limpar_dados_seguranca_diario
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
DO CALL limpar_dados_seguranca();

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. O campo 'senha' existente será mantido temporariamente
--    para compatibilidade durante a migração
-- 
-- 2. Após migrar todas as senhas para bcrypt, você pode:
--    ALTER TABLE usuarios DROP COLUMN senha;
--
-- 3. Para habilitar o event scheduler (limpeza automática):
--    SET GLOBAL event_scheduler = ON;
--    Adicionar no my.cnf: event_scheduler=ON
--
-- 4. Para executar limpeza manualmente:
--    CALL limpar_dados_seguranca();
-- ============================================
