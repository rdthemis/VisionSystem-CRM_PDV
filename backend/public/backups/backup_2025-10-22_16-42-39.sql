-- =============================================
-- BACKUP AUTOMÁTICO DO SISTEMA CRM
-- Data: 22/10/2025 16:42:39
-- Arquivo: backup_2025-10-22_16-42-39.sql
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Tabela: adicionais
DROP TABLE IF EXISTS `adicionais`;

CREATE TABLE `adicionais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `preco` decimal(10,2) NOT NULL,
  `categoria_id` int NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `idx_ativo` (`ativo`),
  KEY `idx_nome` (`nome`),
  CONSTRAINT `adicionais_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `adicionais` (`id`, `nome`, `descricao`, `preco`, `categoria_id`, `ativo`, `created_at`, `updated_at`) VALUES
('1', 'Bacon Extra', 'Fatias extras de bacon', '3.50', '1', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('2', 'Queijo Extra', 'Queijo cheddar extra', '2.50', '1', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('3', 'Ovo Frito', 'Ovo frito fresquinho', '2.00', '1', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('4', 'Alface Extra', 'Alface fresquinha', '1.00', '1', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('5', 'Gelo Extra', 'Gelo extra para bebida', '0.50', '2', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('6', 'Limão', 'Fatias de limão', '1.00', '2', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('7', 'Molho Especial', 'Molho da casa', '2.00', '4', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('8', 'Queijo Derretido', 'Queijo derretido por cima', '3.00', '4', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('9', 'Calda de Chocolate', 'Calda de chocolate quente', '2.50', '3', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('10', 'Granulado', 'Granulado colorido', '1.50', '3', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02'),
('11', 'Chantilly', 'Chantilly fresquinho', '2.00', '3', '1', '2025-10-07 00:09:02', '2025-10-07 00:09:02');

-- Tabela: caixa
DROP TABLE IF EXISTS `caixa`;

CREATE TABLE `caixa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_abertura` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_fechamento` timestamp NULL DEFAULT NULL,
  `saldo_inicial` decimal(10,2) NOT NULL DEFAULT '0.00',
  `saldo_final` decimal(10,2) DEFAULT NULL,
  `status` enum('aberto','fechado') COLLATE utf8mb4_unicode_ci DEFAULT 'aberto',
  `usuario_abertura` int NOT NULL,
  `usuario_fechamento` int DEFAULT NULL,
  `observacoes_abertura` text COLLATE utf8mb4_unicode_ci,
  `observacoes_fechamento` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_data_abertura` (`data_abertura`),
  KEY `usuario_abertura` (`usuario_abertura`),
  KEY `usuario_fechamento` (`usuario_fechamento`),
  CONSTRAINT `caixa_ibfk_1` FOREIGN KEY (`usuario_abertura`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `caixa_ibfk_2` FOREIGN KEY (`usuario_fechamento`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `caixa` (`id`, `data_abertura`, `data_fechamento`, `saldo_inicial`, `saldo_final`, `status`, `usuario_abertura`, `usuario_fechamento`, `observacoes_abertura`, `observacoes_fechamento`, `created_at`, `updated_at`) VALUES
('3', '2025-08-04 13:58:22', '2025-08-04 16:15:57', '50.00', '81.50', 'fechado', '3', NULL, 'Abertura de cx.', 'Fechamento do caixa', '2025-08-04 13:58:22', '2025-08-04 16:15:57'),
('4', '2025-08-04 17:02:42', '2025-08-04 17:05:50', '100.00', '155.90', 'fechado', '3', NULL, 'Abertura de caixa nova funcionalidade, fechamento e redirecionamento pra dashboard.', 'Caixa fechado', '2025-08-04 17:02:42', '2025-08-04 17:05:50'),
('5', '2025-08-04 18:00:03', '2025-08-04 18:32:01', '0.00', '100.00', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-04 18:00:03', '2025-08-04 18:32:01'),
('6', '2025-08-04 18:32:26', '2025-08-04 18:32:42', '0.00', '0.00', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-04 18:32:26', '2025-08-04 18:32:42'),
('7', '2025-08-05 07:13:28', '2025-08-05 07:19:30', '0.00', '62.00', 'fechado', '3', NULL, 'teste ', 'teste fechamento...', '2025-08-05 07:13:28', '2025-08-05 07:19:30'),
('8', '2025-08-05 08:24:16', '2025-08-05 08:26:43', '0.00', '74.90', 'fechado', '3', NULL, 'teste...', 'teste', '2025-08-05 08:24:16', '2025-08-05 08:26:43'),
('9', '2025-08-05 08:45:21', '2025-08-05 17:34:01', '0.00', '0.00', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'teste...', '2025-08-05 08:45:21', '2025-08-05 17:34:01'),
('10', '2025-08-05 17:34:51', '2025-08-05 17:38:50', '100.00', '176.80', 'fechado', '3', NULL, 'Abertura cx teste...', 'Caixa fechado', '2025-08-05 17:34:51', '2025-08-05 17:38:50'),
('11', '2025-08-05 17:42:07', '2025-08-05 17:45:14', '50.00', '128.90', 'fechado', '3', NULL, 'Teste abert. cx.', 'Caixa fechado', '2025-08-05 17:42:07', '2025-08-05 17:45:14'),
('12', '2025-08-05 17:45:34', '2025-08-05 17:45:47', '10.00', '10.00', 'fechado', '3', NULL, 'Teste', 'teste fech.', '2025-08-05 17:45:34', '2025-08-05 17:45:47'),
('13', '2025-08-05 17:46:18', '2025-08-05 17:47:12', '0.00', '0.00', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-05 17:46:18', '2025-08-05 17:47:12'),
('14', '2025-08-05 17:47:23', '2025-08-10 18:31:44', '0.00', '30.90', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-05 17:47:23', '2025-08-10 18:31:44'),
('15', '2025-08-10 18:31:52', '2025-08-12 07:34:30', '0.00', '196.60', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-10 18:31:52', '2025-08-12 07:34:30'),
('16', '2025-08-12 07:43:24', '2025-08-25 18:35:44', '100.00', '247.40', 'fechado', '3', NULL, 'Abertura de caixa em 12/08/2025 07:43.', 'Caixa fechado', '2025-08-12 07:43:24', '2025-08-25 18:35:44'),
('17', '2025-08-25 20:11:39', '2025-08-25 20:16:53', '0.00', '32.00', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-25 20:11:39', '2025-08-25 20:16:53'),
('18', '2025-08-25 20:21:49', '2025-10-06 23:42:39', '0.00', '36.90', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-08-25 20:21:49', '2025-10-06 23:42:39'),
('19', '2025-10-07 00:14:16', '2025-10-19 13:05:41', '0.00', '54.40', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-10-07 00:14:16', '2025-10-19 13:05:41'),
('20', '2025-10-20 00:37:26', '2025-10-21 01:12:12', '50.00', '50.00', 'fechado', '3', NULL, 'Abertura de caixa teste: 50,00.', 'Caixa fechado', '2025-10-20 00:37:26', '2025-10-21 01:12:12'),
('21', '2025-10-21 15:39:55', '2025-10-22 16:42:28', '100.00', '147.90', 'fechado', '3', NULL, 'Caixa aberto pelo sistema', 'Caixa fechado', '2025-10-21 15:39:55', '2025-10-22 16:42:28');

-- Tabela: caixa_movimentos
DROP TABLE IF EXISTS `caixa_movimentos`;

CREATE TABLE `caixa_movimentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caixa_id` int NOT NULL,
  `tipo` enum('entrada','saida') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int NOT NULL,
  `pedido_id` int DEFAULT NULL COMMENT 'ID do pedido que gerou este movimento',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_caixa_id` (`caixa_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_pedido_id` (`pedido_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `caixa_movimentos_ibfk_1` FOREIGN KEY (`caixa_id`) REFERENCES `caixa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `caixa_movimentos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `caixa_movimentos_ibfk_3` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `caixa_movimentos` (`id`, `caixa_id`, `tipo`, `valor`, `descricao`, `categoria`, `usuario_id`, `pedido_id`, `created_at`) VALUES
('5', '3', 'entrada', '20.50', 'Cliente Fulano, débito antigo sem registro no contas a receber...', 'Recebimento de Clientes', '3', NULL, '2025-08-04 15:55:06'),
('6', '3', 'saida', '10.00', 'Compra mercado, frutas para açaí, ticket n. 14203.- Suplema Supermercados.', 'Compra de Mercadorias', '3', NULL, '2025-08-04 15:56:06'),
('7', '3', 'entrada', '21.00', 'Venda - PED2508042959', 'Vendas', '3', '23', '2025-08-04 15:56:39'),
('8', '4', 'entrada', '55.90', 'Venda - PED2508040830', 'Vendas', '3', '24', '2025-08-04 17:05:21'),
('9', '5', 'entrada', '100.00', '.', 'Recebimento de Clientes', '3', NULL, '2025-08-04 18:31:41'),
('10', '7', 'entrada', '50.00', 'Troco.', 'Dinheiro Inicial do Caixa', '3', NULL, '2025-08-05 07:17:57'),
('11', '7', 'entrada', '12.00', 'Venda - PED2508055274', 'Vendas', '3', '25', '2025-08-05 07:18:26'),
('12', '8', 'entrada', '50.00', 'troco', 'Dinheiro Inicial do Caixa', '3', NULL, '2025-08-05 08:25:02'),
('13', '8', 'entrada', '24.90', 'Venda - PED2508052411', 'Vendas', '3', '26', '2025-08-05 08:25:48'),
('14', '10', 'entrada', '33.00', 'Venda - PED2508054430', 'Vendas', '3', '28', '2025-08-05 17:38:19'),
('15', '10', 'entrada', '43.80', 'Venda - PED2508058123', 'Vendas', '3', '27', '2025-08-05 17:38:25'),
('16', '11', 'entrada', '50.00', 'Conta Antiga...', 'Recebimento de Clientes', '3', NULL, '2025-08-05 17:43:44'),
('17', '11', 'entrada', '28.90', 'Venda - PED2508058753', 'Vendas', '3', '29', '2025-08-05 17:44:43'),
('18', '14', 'entrada', '30.90', 'Venda - PED2508080076', 'Vendas', '3', '30', '2025-08-08 02:07:42'),
('19', '15', 'entrada', '36.00', 'Venda - PED2508101487', 'Vendas', '3', '31', '2025-08-10 18:38:00'),
('20', '15', 'entrada', '52.80', 'Venda - 32', 'Vendas', '3', '32', '2025-08-11 22:57:29'),
('21', '15', 'entrada', '16.00', 'Venda - 33', 'Vendas', '3', '33', '2025-08-11 23:11:05'),
('22', '15', 'entrada', '12.00', 'Venda - PED2508119472', 'Vendas', '3', '34', '2025-08-11 23:14:01'),
('23', '15', 'entrada', '18.00', 'Venda - PED2508110945', 'Vendas', '3', '35', '2025-08-11 23:24:06'),
('24', '15', 'entrada', '6.00', 'Venda - PED2508111657', 'Vendas', '3', '36', '2025-08-11 23:29:16'),
('25', '15', 'entrada', '12.00', 'Venda - PED2508119446', 'Vendas', '3', '37', '2025-08-11 23:37:20'),
('26', '15', 'entrada', '43.80', 'Venda - 38', 'Vendas', '3', '38', '2025-08-12 07:34:03'),
('27', '16', 'entrada', '19.90', 'Venda - 39', 'Vendas', '3', '39', '2025-08-12 09:33:28'),
('28', '16', 'entrada', '12.00', 'Venda - 41', 'Vendas', '3', '41', '2025-08-12 17:09:46'),
('29', '16', 'entrada', '49.80', 'Venda - 40', 'Vendas', '3', '40', '2025-08-13 12:37:13'),
('30', '16', 'entrada', '65.70', 'Venda - 42', 'Vendas', '3', '42', '2025-08-16 15:34:20'),
('31', '17', 'entrada', '20.00', 'Venda - 43', 'Vendas', '3', '43', '2025-08-25 20:14:31'),
('32', '17', 'entrada', '12.00', 'Venda - 44', 'Vendas', '3', '44', '2025-08-25 20:15:39'),
('33', '18', 'entrada', '36.90', 'Venda - 45', 'Vendas', '3', '45', '2025-10-06 23:42:23'),
('34', '19', 'entrada', '30.00', 'Venda - PED2510140675', 'Vendas', '3', '48', '2025-10-14 00:54:33'),
('35', '19', 'entrada', '24.40', 'Venda - PED2510149747', 'Vendas', '3', '50', '2025-10-14 01:09:15'),
('36', '21', 'entrada', '15.00', 'Venda - PED2510225187', 'Vendas', '3', '69', '2025-10-22 08:57:26'),
('37', '21', 'entrada', '8.00', 'Venda - PED2510226493', 'Vendas', '3', '70', '2025-10-22 08:58:45'),
('38', '21', 'entrada', '18.90', 'Venda - PED2510224381', 'Vendas', '3', '71', '2025-10-22 08:59:16'),
('39', '21', 'entrada', '6.00', 'Venda - PED2510222619', 'Vendas', '3', '72', '2025-10-22 08:59:51');

-- Tabela: categorias
DROP TABLE IF EXISTS `categorias`;

CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categorias` (`id`, `nome`, `descricao`, `ativo`, `created_at`, `updated_at`) VALUES
('1', 'Lanches', 'Hambúrgueres, sanduíches e lanches em geral', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('2', 'Bebidas', 'Refrigerantes, sucos e bebidas diversas', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('3', 'Sobremesas', 'Doces, sorvetes e sobremesas', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('4', 'Porções', 'Batata frita, onion rings e porções diversas', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('5', 'Picolés', 'Picolés a base d&#039;agua e ao leite.', '1', '2025-07-28 21:57:09', '2025-07-28 22:45:46'),
('6', 'Pastel', 'Salgados e doces.', '1', '2025-07-28 22:15:32', '2025-07-28 22:15:32');

-- Tabela: clientes
DROP TABLE IF EXISTS `clientes`;

CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `razao_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome_fantasia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_pessoa` enum('fisica','juridica') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fisica',
  `cpf_cnpj` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rg_ie` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bairro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `limite_credito` decimal(15,2) DEFAULT '0.00',
  `prazo_pagamento_padrao` int DEFAULT '30',
  `desconto_padrao` decimal(5,2) DEFAULT '0.00',
  `observacoes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) DEFAULT '1',
  `usuario_criacao` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cpf_cnpj` (`cpf_cnpj`),
  KEY `idx_email` (`email`),
  KEY `idx_nome` (`nome`),
  KEY `idx_ativo` (`ativo`),
  KEY `idx_tipo_pessoa` (`tipo_pessoa`),
  KEY `idx_cidade` (`cidade`),
  KEY `idx_uf` (`uf`),
  KEY `usuario_criacao` (`usuario_criacao`),
  KEY `idx_clientes_busca` (`ativo`,`nome`,`cidade`),
  KEY `idx_clientes_data` (`created_at`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`usuario_criacao`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `clientes` (`id`, `nome`, `razao_social`, `nome_fantasia`, `tipo_pessoa`, `cpf_cnpj`, `rg_ie`, `email`, `telefone`, `celular`, `whatsapp`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `limite_credito`, `prazo_pagamento_padrao`, `desconto_padrao`, `observacoes`, `ativo`, `usuario_criacao`, `created_at`, `updated_at`) VALUES
('1', 'João Silva Santos', NULL, NULL, 'fisica', '12345678900', NULL, 'joao.silva@email.com', '(11) 3333-1234', '(11) 99999-1234', NULL, '01234-567', 'Rua das Flores', '123', NULL, 'Centro', 'São Paulo', 'SP', '1000.00', '30', '0.00', NULL, '1', '1', '2025-06-29 10:54:10', '2025-06-29 10:54:10'),
('2', 'Maria Oliveira Costa', NULL, NULL, 'fisica', '98765432100', NULL, 'maria.oliveira@email.com', '(11) 3333-5678', '(11) 98888-5678', NULL, '01310-100', 'Av. Paulista', '456', NULL, 'Bela Vista', 'São Paulo', 'SP', '2500.00', '30', '0.00', NULL, '1', '1', '2025-06-29 10:54:10', '2025-06-29 10:54:10'),
('3', 'Empresa XYZ Ltda', NULL, NULL, 'juridica', '12345678000190', NULL, 'contato@empresaxyz.com.br', '(11) 3333-9999', NULL, NULL, '05434-000', 'Rua Comercial', '789', NULL, 'Vila Madalena', 'São Paulo', 'SP', '10000.00', '30', '0.00', NULL, '1', '1', '2025-06-29 10:54:10', '2025-06-29 10:54:10'),
('4', 'Tech Solutions EIRELI', NULL, NULL, 'juridica', '98765432000111', NULL, 'contato@techsolutions.com.br', '(11) 4444-0000', '(11) 99999-0000', NULL, '04538-132', 'Av. Faria Lima', '1000', NULL, 'Itaim Bibi', 'São Paulo', 'SP', '25000.00', '30', '0.00', NULL, '1', '1', '2025-06-29 10:54:10', '2025-06-29 10:54:10'),
('5', 'Ana Paula Ferreira', NULL, NULL, 'fisica', '11122233344', NULL, 'ana.ferreira@email.com', NULL, '(11) 97777-8888', NULL, '01234-000', 'Rua dos Jardins', '555', NULL, 'Jardim Paulista', 'São Paulo', 'SP', '1500.00', '30', '0.00', NULL, '1', '2', '2025-06-29 10:54:10', '2025-06-29 10:54:10'),
('6', 'Claudineia de Souza Themistocles', '', '', 'fisica', '03001929910', '77552551', 'neia.themis@gmail.com', '(44) 99826-4006', '(44) 99826-4006', '(44) 99826-4006', '86970000', 'Rua Caraíba', '126', 'Casa', 'centro', 'Corumbataí do Sul', 'PR', '1000.00', '30', '0.00', 'Cliente teste...', '1', '1', '2025-06-30 19:11:31', '2025-06-30 19:12:27'),
('7', 'Reinaldo Themistocles', '', '', 'fisica', '02602102938', '76401691', 'rdthemis@gmail.com', '(44) 99855-2630', '(44) 99855-2630', '(44) 99855-2630', '86970000', 'Rua Caraíba', '126', 'Casa', 'CENTRO', 'Corumbataí do Sul', 'PR', '1000.00', '30', '0.00', 'Cadastro teste final.
Editando valor limite 100 -> 1000', '1', '1', '2025-07-04 13:11:04', '2025-07-04 13:12:06'),
('8', 'Jean Carlos de Souza Themistocles', '', '', 'fisica', '', '', 'tyonflix@gmail.com', '(44) 99704-7046', '', '', '86970000', 'Rua Caraíba', '126', 'Casa', 'centro', 'Corumbataí do Sul', 'PR', '1000.00', '30', '0.00', 'Cadastro cliente.', '1', '1', '2025-07-05 17:50:20', '2025-07-05 17:51:12');

-- Tabela: configuracoes_email
DROP TABLE IF EXISTS `configuracoes_email`;

CREATE TABLE `configuracoes_email` (
  `id` int NOT NULL AUTO_INCREMENT,
  `smtp_host` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `smtp_port` int NOT NULL DEFAULT '587',
  `smtp_user` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `smtp_pass` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `smtp_secure` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'tls',
  `from_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Sistema CRM',
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `configuracoes_email` (`id`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_secure`, `from_email`, `from_name`, `ativo`, `created_at`, `updated_at`) VALUES
('1', 'smtp.gmail.com', '587', 'rdthemis@gmail.com', 'wwbr bpgk gtiv nbvi', 'tls', 'rdthemis@gmail.com', 'Sistema Gestão CRM', '1', '2025-07-10 23:14:01', '2025-07-10 23:14:01');

-- Tabela: contas_receber
DROP TABLE IF EXISTS `contas_receber`;

CREATE TABLE `contas_receber` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `usuario_criacao` int NOT NULL,
  `descricao` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_original` decimal(15,2) NOT NULL,
  `valor_recebido` decimal(15,2) DEFAULT '0.00',
  `valor_desconto` decimal(15,2) DEFAULT '0.00',
  `valor_juros` decimal(15,2) DEFAULT '0.00',
  `valor_multa` decimal(15,2) DEFAULT '0.00',
  `data_vencimento` date NOT NULL,
  `data_emissao` date NOT NULL DEFAULT (curdate()),
  `data_recebimento` date DEFAULT NULL,
  `status` enum('pendente','pago','vencido','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `observacoes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `forma_pagamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banco` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agencia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cliente_id` (`cliente_id`),
  KEY `idx_status` (`status`),
  KEY `idx_data_vencimento` (`data_vencimento`),
  KEY `idx_data_recebimento` (`data_recebimento`),
  KEY `idx_ativo` (`ativo`),
  KEY `idx_valor_original` (`valor_original`),
  KEY `idx_data_emissao` (`data_emissao`),
  KEY `usuario_criacao` (`usuario_criacao`),
  CONSTRAINT `contas_receber_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `contas_receber_ibfk_2` FOREIGN KEY (`usuario_criacao`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `contas_receber` (`id`, `cliente_id`, `usuario_criacao`, `descricao`, `numero_documento`, `valor_original`, `valor_recebido`, `valor_desconto`, `valor_juros`, `valor_multa`, `data_vencimento`, `data_emissao`, `data_recebimento`, `status`, `observacoes`, `forma_pagamento`, `banco`, `agencia`, `conta`, `ativo`, `created_at`, `updated_at`) VALUES
('1', '1', '1', 'Venda de produtos - Pedido #001', 'NF-001', '1500.00', '1500.00', '0.00', '0.00', '0.00', '2024-08-15', '2024-07-15', '2025-07-04', 'pago', 'Primeira venda do cliente', NULL, NULL, NULL, NULL, '1', '2025-06-29 12:39:37', '2025-07-04 13:12:59'),
('2', '2', '1', 'Prestação de serviços', 'NF-002', '2500.00', '2500.00', '0.00', '0.00', '0.00', '2024-07-20', '2024-06-20', '2024-07-22', 'pago', 'Serviço de consultoria', NULL, NULL, NULL, NULL, '1', '2025-06-29 12:39:37', '2025-06-29 12:39:37'),
('3', '1', '1', 'Venda de equipamentos', 'NF-003', '3200.00', '3200.00', '0.00', '0.00', '0.00', '2024-06-10', '2024-05-10', '2025-06-29', 'pago', 'Equipamentos de informática', NULL, NULL, NULL, NULL, '1', '2025-06-29 12:39:37', '2025-06-29 12:42:08'),
('4', '3', '1', 'Licença de software', 'NF-004', '800.00', '800.00', '0.00', '0.00', '0.00', '2024-09-30', '2024-06-15', '2025-06-30', 'pago', 'Licença anual', NULL, NULL, NULL, NULL, '1', '2025-06-29 12:39:37', '2025-06-30 20:13:52'),
('5', '2', '1', 'Manutenção mensal', 'NF-005', '1200.00', '1200.00', '0.00', '0.00', '0.00', '2024-08-01', '2024-07-01', '2025-07-31', 'pago', 'Contrato de manutenção', NULL, NULL, NULL, NULL, '1', '2025-06-29 12:39:37', '2025-08-02 08:08:31'),
('6', '6', '1', 'Compra teste.', 'Pedido 15372', '500.00', '500.00', '0.00', '0.00', '0.00', '2025-07-30', '2025-06-30', '2025-07-02', 'pago', 'Compra teste cliente...', '', '', '', '', '1', '2025-06-30 20:46:59', '2025-07-02 23:40:22'),
('7', '6', '1', 'Venda teste', 'pedido 010', '1000.00', '1000.00', '0.00', '0.00', '0.00', '2025-08-03', '2025-07-04', '2025-07-04', 'pago', 'Teste ', '', '', '', '', '1', '2025-07-03 23:32:12', '2025-07-04 13:16:17'),
('8', '7', '1', 'Venda teste novo cliente.', '214', '400.00', '400.00', '0.00', '0.00', '0.00', '2025-08-04', '2025-07-04', NULL, 'pago', '', '', '', '', '', '1', '2025-07-04 13:14:57', '2025-07-10 23:23:08'),
('9', '8', '1', 'Compra de lanche e refrigerante.', '13849', '150.00', '150.00', '0.00', '0.00', '0.00', '2025-08-04', '2025-07-05', '2025-07-05', 'pago', 'Registro de venda a crédito.', '', '', '', '', '1', '2025-07-05 17:52:37', '2025-07-05 17:56:25'),
('10', '6', '3', 'Pedido PED2507298277 - , , ', 'PED2507298277', '30.95', '30.95', '0.00', '0.00', '0.00', '2025-08-31', '2025-08-01', NULL, 'pago', 'Teste venda a prazo cliente já cadastrado...', 'Outros', '', '', '', '1', '2025-08-01 15:20:04', '2025-10-06 10:46:23'),
('11', '8', '3', 'Pedido PED2507307796 - , , ', 'PED2507307796', '43.80', '43.80', '0.00', '0.00', '0.00', '2025-09-01', '2025-08-02', NULL, 'pago', 'Teste 3, venda a prazo cliente cadastrado...', 'Outros', '', '', '', '1', '2025-08-02 08:07:27', '2025-10-22 09:00:36'),
('12', '8', '3', 'Pedido PED2508021616 - , ', 'PED2508021616', '24.00', '24.00', '0.00', '0.00', '0.00', '2025-09-02', '2025-08-03', NULL, 'pago', 'Teste venda a prazo cliente cadastrado...', 'Outros', '', '', '', '1', '2025-08-03 08:53:42', '2025-10-22 09:13:02'),
('13', '8', '3', 'Pedido PED2508021616, Id no banco: 4, - ,  - [object Object], [object Object]', 'PED2508021616', '24.00', '24.00', '0.00', '0.00', '0.00', '2025-09-02', '2025-08-03', NULL, 'pago', 'Venda a prazo, teste duplicidade... ', 'Outros', '', '', '', '1', '2025-08-03 09:04:01', '2025-10-22 09:19:29'),
('14', '2', '3', 'Pedido PED2508034573, id no banco: 5, - [object Object]', 'PED2508034573', '16.00', '0.00', '0.00', '0.00', '0.00', '2025-09-02', '2025-08-03', NULL, 'pendente', 'Teste...', 'Outros', '', '', '', '1', '2025-08-03 09:58:38', '2025-08-03 09:58:38'),
('15', '8', '3', 'Pedido PED2508034583, id no banco: 7, - {\"produto_id\":5,\"produto_nome\":\"Batata Frita\",\"quantidade\":1,\"preco_unitario\":\"12.000\",\"subtotal\":12,\"adicionais\":[],\"observacoes\":\"\"}}', 'PED2508034583', '12.00', '0.00', '0.00', '0.00', '0.00', '2025-09-02', '2025-08-03', NULL, 'pendente', '.', 'Outros', '', '', '', '1', '2025-08-03 11:31:03', '2025-08-03 11:31:03'),
('16', '5', '3', 'Pedido PED2508037730, id no banco: 13, - {\"produto_id\":3,\"produto_nome\":\"Coca-Cola 350ml\",\"quantidade\":1,\"preco_unitario\":\"4.500\",\"subtotal\":4.5,\"adicionais\":[],\"observacoes\":\"\"}}', 'PED2508037730', '4.50', '0.00', '0.00', '0.00', '0.00', '2025-09-02', '2025-08-03', NULL, 'pendente', 'teste...', 'Outros', '', '', '', '1', '2025-08-03 17:53:52', '2025-08-03 17:53:52');

-- Tabela: numeracao_recibos
DROP TABLE IF EXISTS `numeracao_recibos`;

CREATE TABLE `numeracao_recibos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `serie` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'A',
  `ultimo_numero` int NOT NULL DEFAULT '0',
  `prefixo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'REC',
  `ano_referencia` year NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_serie_ano` (`serie`,`ano_referencia`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `numeracao_recibos` (`id`, `serie`, `ultimo_numero`, `prefixo`, `ano_referencia`, `created_at`, `updated_at`) VALUES
('1', 'A', '8', 'REC', '2025', '2025-06-30 01:13:59', '2025-07-01 15:54:22');

-- Tabela: pagamentos
DROP TABLE IF EXISTS `pagamentos`;

CREATE TABLE `pagamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conta_receber_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `valor_pago` decimal(15,2) NOT NULL,
  `valor_desconto` decimal(15,2) DEFAULT '0.00',
  `valor_juros` decimal(15,2) DEFAULT '0.00',
  `valor_multa` decimal(15,2) DEFAULT '0.00',
  `data_pagamento` date NOT NULL,
  `forma_pagamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `banco` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agencia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conta_receber_id` (`conta_receber_id`),
  KEY `idx_data_pagamento` (`data_pagamento`),
  KEY `idx_forma_pagamento` (`forma_pagamento`),
  KEY `pagamentos_ibfk_2` (`usuario_id`),
  CONSTRAINT `pagamentos_ibfk_1` FOREIGN KEY (`conta_receber_id`) REFERENCES `contas_receber` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pagamentos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pagamentos` (`id`, `conta_receber_id`, `usuario_id`, `valor_pago`, `valor_desconto`, `valor_juros`, `valor_multa`, `data_pagamento`, `forma_pagamento`, `observacoes`, `banco`, `agencia`, `conta`, `cheque`, `created_at`) VALUES
('1', '5', '1', '600.00', '0.00', '0.00', '0.00', '2024-07-28', 'Dinheiro', 'Pagamento parcial', NULL, NULL, NULL, NULL, '2025-06-29 12:39:37'),
('2', '3', '1', '3200.00', '0.00', '0.00', '0.00', '2025-06-29', 'Dinheiro', 'Pagamento teste.', '', '', '', '', '2025-06-29 12:42:08'),
('3', '4', '1', '500.00', '0.00', '0.00', '0.00', '2025-06-30', 'Cartão de Débito', 'Pagamento teste..', '', '', '', '', '2025-06-30 12:29:39'),
('4', '4', '1', '100.00', '0.00', '0.00', '0.00', '2025-06-30', 'Dinheiro', '', '', '', '', '', '2025-06-30 12:34:55'),
('5', '4', '1', '100.00', '0.00', '0.00', '0.00', '2025-06-30', 'Dinheiro', '', '', '', '', '', '2025-06-30 12:40:49'),
('6', '4', '1', '100.00', '0.00', '0.00', '0.00', '2025-06-30', 'PIX', 'teste..', '', '', '', '', '2025-06-30 20:13:52'),
('7', '6', '1', '200.00', '0.00', '0.00', '0.00', '2025-06-30', 'Dinheiro', 'Pagamento teste..', '', '', '', '', '2025-06-30 20:48:37'),
('8', '6', '1', '100.00', '0.00', '0.00', '0.00', '2025-06-30', 'PIX', '', '', '', '', '', '2025-06-30 21:15:45'),
('9', '6', '1', '100.00', '0.00', '0.00', '0.00', '2025-06-30', 'Dinheiro', '', '', '', '', '', '2025-06-30 21:17:54'),
('10', '6', '1', '10.00', '0.00', '0.00', '0.00', '2025-06-30', 'Dinheiro', '', '', '', '', '', '2025-06-30 22:43:59'),
('11', '5', '1', '100.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-06-30 23:40:45'),
('12', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 00:29:35'),
('13', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 09:53:12'),
('14', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 11:06:59'),
('15', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 11:21:35'),
('16', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 11:23:21'),
('17', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'Cheque', '', '', '', '', '', '2025-07-01 11:25:48'),
('18', '5', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-01', 'Boleto', '', '', '', '', '', '2025-07-01 11:27:29'),
('19', '5', '1', '49.99', '0.00', '0.00', '0.00', '2025-07-01', 'Cartão de Débito', '', '', '', '', '', '2025-07-01 11:33:42'),
('20', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 11:40:07'),
('21', '5', '1', '10.01', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 11:45:33'),
('22', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 11:47:38'),
('23', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 12:02:19'),
('24', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 12:05:18'),
('25', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 12:07:00'),
('26', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 12:08:49'),
('27', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 12:09:44'),
('28', '5', '1', '9.99', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 12:11:31'),
('29', '5', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'Cartão de Débito', '', '', '', '', '', '2025-07-01 12:21:13'),
('30', '1', '1', '9.99', '0.00', '0.00', '0.00', '2025-07-01', 'Dinheiro', '', '', '', '', '', '2025-07-01 12:29:39'),
('31', '1', '1', '10.01', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 13:53:35'),
('32', '6', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 15:51:29'),
('33', '6', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-01', 'PIX', '', '', '', '', '', '2025-07-01 15:54:22'),
('34', '6', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-02', 'PIX', 'teste...', '', '', '', '', '2025-07-02 00:24:55'),
('35', '6', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-02', 'Dinheiro', '', '', '', '', '', '2025-07-02 00:31:32'),
('36', '6', '1', '50.00', '0.00', '0.00', '0.00', '2025-07-03', 'Boleto', '', '', '', '', '', '2025-07-02 23:40:22'),
('37', '1', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-03', 'PIX', '', '', '', '', '', '2025-07-02 23:55:52'),
('38', '1', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-03', 'Boleto', '', '', '', '', '', '2025-07-02 23:59:03'),
('39', '1', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-03', 'Boleto', '', '', '', '', '', '2025-07-03 00:23:16'),
('40', '1', '1', '30.00', '0.00', '0.00', '0.00', '2025-07-04', 'Dinheiro', '', '', '', '', '', '2025-07-03 22:45:58'),
('42', '7', '1', '10.00', '0.00', '0.00', '0.00', '2025-07-04', 'Dinheiro', 'teste', NULL, NULL, NULL, NULL, '2025-07-03 23:44:11'),
('43', '7', '1', '90.00', '0.00', '0.00', '0.00', '2025-07-04', 'Dinheiro', 'teste', NULL, NULL, NULL, NULL, '2025-07-04 00:02:38'),
('44', '1', '1', '1420.00', '0.00', '0.00', '0.00', '2025-07-04', 'Boleto', 'Liquidação de conta teste.', NULL, NULL, NULL, NULL, '2025-07-04 13:12:59'),
('45', '7', '1', '900.00', '0.00', '0.00', '0.00', '2025-07-04', 'PIX', '', NULL, NULL, NULL, NULL, '2025-07-04 13:16:17'),
('46', '9', '1', '150.00', '0.00', '0.00', '0.00', '2025-07-05', 'PIX', 'Liquidacao de debito', NULL, NULL, NULL, NULL, '2025-07-05 17:56:25'),
('47', '8', '3', '400.00', '0.00', '0.00', '0.00', '2025-07-11', 'Dinheiro', '', NULL, NULL, NULL, NULL, '2025-07-10 23:23:08'),
('48', '10', '3', '30.95', '0.00', '0.00', '0.00', '2025-10-06', 'Dinheiro', '', NULL, NULL, NULL, NULL, '2025-10-06 10:46:23'),
('49', '11', '3', '43.80', '0.00', '0.00', '0.00', '2025-10-22', 'Dinheiro', '', NULL, NULL, NULL, NULL, '2025-10-22 09:00:36'),
('50', '12', '3', '24.00', '0.00', '0.00', '0.00', '2025-10-22', 'PIX', '', NULL, NULL, NULL, NULL, '2025-10-22 09:13:02'),
('51', '13', '3', '24.00', '0.00', '0.00', '0.00', '2025-10-22', 'PIX', '', NULL, NULL, NULL, NULL, '2025-10-22 09:19:29');

-- Tabela: pedido_itens
DROP TABLE IF EXISTS `pedido_itens`;

CREATE TABLE `pedido_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `quantidade` int NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `adicionais` text COLLATE utf8mb4_unicode_ci,
  `observacoes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `produto_id` (`produto_id`),
  CONSTRAINT `pedido_itens_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedido_itens_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=589 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pedido_itens` (`id`, `pedido_id`, `produto_id`, `quantidade`, `preco_unitario`, `subtotal`, `created_at`, `adicionais`, `observacoes`) VALUES
('33', '1', '5', '1', '12.00', '12.00', '2025-08-01 15:20:03', NULL, NULL),
('34', '1', '7', '5', '1.99', '9.95', '2025-08-01 15:20:03', NULL, NULL),
('35', '1', '3', '2', '4.50', '9.00', '2025-08-01 15:20:03', NULL, NULL),
('36', '2', '2', '2', '18.90', '37.80', '2025-08-01 17:19:33', NULL, NULL),
('37', '2', '4', '2', '6.00', '12.00', '2025-08-01 17:19:33', NULL, NULL),
('38', '2', '3', '2', '4.50', '9.00', '2025-08-01 17:19:33', NULL, NULL),
('51', '3', '1', '1', '15.90', '15.90', '2025-08-02 08:07:27', NULL, NULL),
('52', '3', '2', '1', '18.90', '18.90', '2025-08-02 08:07:27', NULL, NULL),
('53', '3', '3', '2', '4.50', '9.00', '2025-08-02 08:07:27', NULL, NULL),
('114', '4', '4', '2', '6.00', '12.00', '2025-08-03 09:04:00', NULL, NULL),
('115', '4', '5', '1', '12.00', '12.00', '2025-08-03 09:04:00', NULL, NULL),
('124', '6', '7', '10', '1.99', '19.90', '2025-08-03 09:58:25', NULL, NULL),
('125', '5', '6', '2', '8.00', '16.00', '2025-08-03 09:58:38', NULL, NULL),
('126', '7', '5', '1', '12.00', '12.00', '2025-08-03 11:31:03', NULL, NULL),
('127', '8', '3', '2', '4.50', '9.00', '2025-08-03 11:31:57', NULL, NULL),
('128', '9', '7', '10', '1.99', '19.90', '2025-08-03 16:35:41', NULL, NULL),
('129', '10', '1', '1', '15.90', '15.90', '2025-08-03 16:50:21', NULL, NULL),
('130', '11', '4', '1', '6.00', '6.00', '2025-08-03 17:01:00', NULL, NULL),
('131', '12', '5', '1', '12.00', '12.00', '2025-08-03 17:27:53', NULL, NULL),
('132', '13', '3', '1', '4.50', '4.50', '2025-08-03 17:53:52', NULL, NULL),
('133', '14', '6', '1', '8.00', '8.00', '2025-08-03 17:54:23', NULL, NULL),
('134', '15', '3', '2', '4.50', '9.00', '2025-08-03 18:21:12', NULL, NULL),
('135', '15', '5', '1', '12.00', '12.00', '2025-08-03 18:21:12', NULL, NULL),
('136', '16', '5', '1', '12.00', '12.00', '2025-08-04 00:39:15', NULL, NULL),
('137', '17', '4', '2', '6.00', '12.00', '2025-08-04 10:53:35', NULL, NULL),
('138', '18', '6', '1', '8.00', '8.00', '2025-08-04 11:04:29', NULL, NULL),
('139', '19', '5', '1', '12.00', '12.00', '2025-08-04 11:35:29', NULL, NULL),
('140', '20', '5', '1', '12.00', '12.00', '2025-08-04 11:56:29', NULL, NULL),
('141', '20', '4', '1', '6.00', '6.00', '2025-08-04 11:56:29', NULL, NULL),
('142', '21', '6', '1', '8.00', '8.00', '2025-08-04 13:29:07', NULL, NULL),
('143', '22', '3', '1', '4.50', '4.50', '2025-08-04 13:30:13', NULL, NULL),
('144', '23', '3', '2', '4.50', '9.00', '2025-08-04 15:56:39', NULL, NULL),
('145', '23', '4', '2', '6.00', '12.00', '2025-08-04 15:56:39', NULL, NULL),
('149', '24', '5', '2', '12.00', '24.00', '2025-08-04 17:05:20', NULL, NULL),
('150', '24', '7', '10', '1.99', '19.90', '2025-08-04 17:05:20', NULL, NULL),
('151', '24', '4', '2', '6.00', '12.00', '2025-08-04 17:05:20', NULL, NULL),
('152', '25', '5', '1', '12.00', '12.00', '2025-08-05 07:18:26', NULL, NULL),
('153', '26', '2', '1', '18.90', '18.90', '2025-08-05 08:25:48', NULL, NULL),
('154', '26', '4', '1', '6.00', '6.00', '2025-08-05 08:25:48', NULL, NULL),
('163', '28', '5', '2', '12.00', '24.00', '2025-08-05 17:38:18', NULL, NULL),
('164', '28', '3', '2', '4.50', '9.00', '2025-08-05 17:38:18', NULL, NULL),
('165', '27', '1', '2', '15.90', '31.80', '2025-08-05 17:38:24', NULL, NULL),
('166', '27', '4', '2', '6.00', '12.00', '2025-08-05 17:38:24', NULL, NULL),
('171', '29', '3', '2', '4.50', '9.00', '2025-08-05 17:44:43', NULL, NULL),
('172', '29', '7', '10', '1.99', '19.90', '2025-08-05 17:44:43', NULL, NULL),
('176', '30', '5', '1', '12.00', '12.00', '2025-08-08 02:07:42', NULL, NULL),
('177', '30', '2', '1', '18.90', '18.90', '2025-08-08 02:07:42', NULL, NULL),
('186', '31', '5', '2', '12.00', '24.00', '2025-08-10 18:38:00', NULL, NULL),
('187', '31', '4', '2', '6.00', '12.00', '2025-08-10 18:38:00', NULL, NULL),
('244', '32', '3', '2', '4.50', '9.00', '2025-08-11 22:57:29', NULL, NULL),
('245', '32', '2', '2', '18.90', '37.80', '2025-08-11 22:57:29', NULL, NULL),
('246', '32', '4', '1', '6.00', '6.00', '2025-08-11 22:57:29', NULL, NULL),
('247', '33', '6', '2', '8.00', '16.00', '2025-08-11 23:11:05', NULL, NULL),
('248', '34', '5', '1', '12.00', '12.00', '2025-08-11 23:14:00', NULL, NULL),
('249', '35', '5', '1', '12.00', '12.00', '2025-08-11 23:24:06', NULL, NULL),
('250', '35', '4', '1', '6.00', '6.00', '2025-08-11 23:24:06', NULL, NULL),
('251', '36', '4', '1', '6.00', '6.00', '2025-08-11 23:29:15', NULL, NULL),
('252', '37', '5', '1', '12.00', '12.00', '2025-08-11 23:37:20', NULL, NULL),
('255', '38', '1', '2', '15.90', '31.80', '2025-08-12 07:34:02', NULL, NULL),
('256', '38', '4', '2', '6.00', '12.00', '2025-08-12 07:34:02', NULL, NULL),
('259', '39', '7', '10', '1.99', '19.90', '2025-08-12 09:33:27', NULL, NULL),
('270', '41', '5', '1', '12.00', '12.00', '2025-08-12 17:09:46', NULL, NULL),
('271', '40', '2', '2', '18.90', '37.80', '2025-08-13 12:37:12', NULL, NULL),
('272', '40', '4', '2', '6.00', '12.00', '2025-08-13 12:37:12', NULL, NULL),
('318', '42', '2', '3', '18.90', '56.70', '2025-08-16 15:34:19', NULL, NULL),
('319', '42', '3', '2', '4.50', '9.00', '2025-08-16 15:34:19', NULL, NULL),
('346', '43', '6', '1', '8.00', '8.00', '2025-08-25 20:14:30', NULL, NULL),
('347', '43', '5', '1', '12.00', '12.00', '2025-08-25 20:14:30', NULL, NULL),
('348', '44', '5', '1', '12.00', '12.00', '2025-08-25 20:15:39', NULL, NULL),
('363', '45', '2', '1', '18.90', '18.90', '2025-10-06 23:42:23', NULL, NULL),
('364', '45', '4', '1', '6.00', '6.00', '2025-10-06 23:42:23', NULL, NULL),
('365', '45', '5', '1', '12.00', '12.00', '2025-10-06 23:42:23', NULL, NULL),
('368', '48', '5', '2', '15.00', '30.00', '2025-10-14 00:54:33', NULL, NULL),
('370', '50', '1', '1', '17.90', '17.90', '2025-10-14 01:09:15', NULL, NULL),
('371', '50', '4', '1', '6.50', '6.50', '2025-10-14 01:09:15', NULL, NULL),
('387', '46', '2', '2', '21.40', '42.80', '2025-10-14 01:34:53', NULL, NULL),
('388', '46', '4', '1', '6.00', '6.00', '2025-10-14 01:34:53', NULL, NULL),
('389', '47', '5', '2', '15.00', '30.00', '2025-10-14 01:35:19', NULL, NULL),
('390', '49', '5', '2', '15.00', '30.00', '2025-10-14 01:35:30', NULL, NULL),
('391', '51', '2', '1', '18.90', '18.90', '2025-10-14 01:36:13', NULL, NULL),
('392', '52', '7', '5', '1.99', '9.95', '2025-10-14 01:36:23', NULL, NULL),
('401', '53', '3', '1', '4.50', '4.50', '2025-10-14 01:39:49', NULL, NULL),
('402', '54', '6', '1', '8.00', '8.00', '2025-10-14 01:59:16', NULL, NULL),
('403', '55', '2', '1', '18.90', '18.90', '2025-10-14 02:01:21', NULL, NULL),
('404', '55', '4', '1', '6.00', '6.00', '2025-10-14 02:01:21', NULL, NULL),
('464', '56', '1', '2', '24.90', '49.80', '2025-10-18 02:23:02', NULL, NULL),
('465', '56', '3', '2', '6.00', '12.00', '2025-10-18 02:23:02', NULL, NULL),
('466', '56', '6', '13', '14.00', '182.00', '2025-10-18 02:23:02', NULL, NULL),
('467', '56', '2', '2', '23.40', '46.80', '2025-10-18 02:23:02', NULL, NULL),
('492', '57', '6', '1', '10.50', '10.50', '2025-10-19 10:05:32', NULL, NULL),
('495', '58', '5', '1', '15.00', '15.00', '2025-10-19 12:41:08', NULL, NULL),
('498', '59', '5', '1', '14.00', '14.00', '2025-10-19 13:05:30', NULL, NULL),
('536', '60', '4', '1', '6.50', '6.50', '2025-10-21 01:08:08', '[]', ''),
('537', '60', '2', '1', '24.90', '24.90', '2025-10-21 01:08:08', '[]', ''),
('538', '61', '2', '1', '23.40', '23.40', '2025-10-21 01:08:15', '[]', ''),
('539', '62', '5', '1', '17.00', '17.00', '2025-10-21 01:08:20', '[]', ''),
('540', '62', '4', '1', '6.00', '6.00', '2025-10-21 01:08:20', '[]', ''),
('543', '63', '5', '1', '17.00', '17.00', '2025-10-21 01:10:31', '[]', ''),
('544', '63', '4', '1', '6.50', '6.50', '2025-10-21 01:10:31', '[]', ''),
('553', '64', '5', '1', '17.00', '17.00', '2025-10-21 15:54:25', '[]', ''),
('555', '65', '1', '1', '19.40', '19.40', '2025-10-21 16:43:53', '[{\"id\":4,\"nome\":\"Alface Extra\",\"descricao\":\"Alface fresquinha\",\"preco\":\"1.00\",\"categoria_id\":1,\"categoria_nome\":\"Lanches\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"},{\"id\":2,\"nome\":\"Queijo Extra\",\"descricao\":\"Queijo cheddar extra\",\"preco\":\"2.50\",\"categoria_id\":1,\"categoria_nome\":\"Lanches\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"}]', ''),
('580', '66', '6', '1', '9.50', '9.50', '2025-10-22 08:28:44', '[{\"id\":10,\"nome\":\"Granulado\",\"descricao\":\"Granulado colorido\",\"preco\":\"1.50\",\"categoria_id\":3,\"categoria_nome\":\"Sobremesas\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"}]', ''),
('581', '66', '4', '2', '6.50', '13.00', '2025-10-22 08:28:44', '[{\"id\":5,\"nome\":\"Gelo Extra\",\"descricao\":\"Gelo extra para bebida\",\"preco\":\"0.50\",\"categoria_id\":2,\"categoria_nome\":\"Bebidas\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"}]', ''),
('582', '67', '7', '1', '1.99', '1.99', '2025-10-22 08:29:30', '[]', ''),
('583', '67', '6', '1', '9.50', '9.50', '2025-10-22 08:29:30', '[{\"id\":10,\"nome\":\"Granulado\",\"descricao\":\"Granulado colorido\",\"preco\":\"1.50\",\"categoria_id\":3,\"categoria_nome\":\"Sobremesas\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"}]', ''),
('584', '68', '3', '1', '6.00', '6.00', '2025-10-22 08:30:53', '[{\"id\":5,\"nome\":\"Gelo Extra\",\"descricao\":\"Gelo extra para bebida\",\"preco\":\"0.50\",\"categoria_id\":2,\"categoria_nome\":\"Bebidas\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"},{\"id\":6,\"nome\":\"Lim\\u00e3o\",\"descricao\":\"Fatias de lim\\u00e3o\",\"preco\":\"1.00\",\"categoria_id\":2,\"categoria_nome\":\"Bebidas\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"}]', ''),
('585', '69', '5', '1', '15.00', '15.00', '2025-10-22 08:57:25', '[{\"id\":8,\"nome\":\"Queijo Derretido\",\"descricao\":\"Queijo derretido por cima\",\"preco\":\"3.00\",\"categoria_id\":4,\"categoria_nome\":\"Por\\u00e7\\u00f5es\",\"ativo\":1,\"created_at\":\"2025-10-07 00:09:02\",\"updated_at\":\"2025-10-07 00:09:02\"}]', ''),
('586', '70', '6', '1', '8.00', '8.00', '2025-10-22 08:58:44', '[]', ''),
('587', '71', '2', '1', '18.90', '18.90', '2025-10-22 08:59:15', '[]', ''),
('588', '72', '4', '1', '6.00', '6.00', '2025-10-22 08:59:51', '[]', '');

-- Tabela: pedidos
DROP TABLE IF EXISTS `pedidos`;

CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_pedido` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` enum('aberto','finalizado','cancelado') COLLATE utf8mb4_unicode_ci DEFAULT 'aberto',
  `forma_pagamento` enum('dinheiro','cartao_debito','cartao_credito','pix','prazo') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cliente_id` int DEFAULT NULL,
  `cliente_nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_cliente` enum('avulso','cadastrado') COLLATE utf8mb4_unicode_ci DEFAULT 'avulso',
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_pedido` (`numero_pedido`),
  KEY `idx_cliente_id` (`cliente_id`),
  KEY `idx_tipo_cliente` (`tipo_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pedidos` (`id`, `numero_pedido`, `total`, `status`, `forma_pagamento`, `created_at`, `updated_at`, `cliente_id`, `cliente_nome`, `tipo_cliente`) VALUES
('1', 'PED2507298277', '30.95', 'finalizado', 'prazo', '2025-07-29 00:01:00', '2025-08-01 17:20:26', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('2', 'PED2507308980', '58.80', 'finalizado', 'dinheiro', '2025-07-30 11:13:18', '2025-08-01 17:19:33', NULL, 'João Silva', 'avulso'),
('3', 'PED2507307796', '43.80', 'finalizado', 'prazo', '2025-07-30 11:14:45', '2025-08-02 08:08:58', '3', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('4', 'PED2508021616', '24.00', 'finalizado', 'prazo', '2025-08-02 08:14:33', '2025-08-03 09:04:00', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('5', 'PED2508034573', '16.00', 'finalizado', 'prazo', '2025-08-03 09:11:58', '2025-08-03 09:58:38', '2', 'Maria Oliveira Costa', 'cadastrado'),
('6', 'PED2508035677', '19.90', 'finalizado', 'dinheiro', '2025-08-03 09:13:27', '2025-08-03 09:58:25', NULL, 'Cliente Avulso', 'avulso'),
('7', 'PED2508034583', '12.00', 'finalizado', NULL, '2025-08-03 11:31:03', '2025-08-03 11:31:03', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('8', 'PED2508039090', '9.00', 'finalizado', NULL, '2025-08-03 11:31:57', '2025-08-03 11:31:57', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('9', 'PED2508039290', '19.90', 'finalizado', NULL, '2025-08-03 16:35:41', '2025-08-03 16:35:41', NULL, 'Allan', 'avulso'),
('10', 'PED2508036586', '15.90', 'finalizado', NULL, '2025-08-03 16:50:21', '2025-08-03 16:50:21', NULL, 'Reinaldo', 'avulso'),
('11', 'PED2508035484', '6.00', 'finalizado', NULL, '2025-08-03 17:01:00', '2025-08-03 17:01:00', NULL, 'José', 'avulso'),
('12', 'PED2508037557', '12.00', 'finalizado', NULL, '2025-08-03 17:27:53', '2025-08-03 17:27:53', '5', 'Ana Paula Ferreira', 'cadastrado'),
('13', 'PED2508037730', '4.50', 'finalizado', 'prazo', '2025-08-03 17:53:52', '2025-08-03 17:53:52', '5', 'Ana Paula Ferreira', 'cadastrado'),
('14', 'PED2508035309', '8.00', 'finalizado', 'pix', '2025-08-03 17:54:23', '2025-08-03 17:54:23', NULL, 'Reinaldo', 'avulso'),
('15', 'PED2508030759', '21.00', 'finalizado', 'dinheiro', '2025-08-03 18:21:12', '2025-08-03 18:21:12', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('16', 'PED2508046473', '12.00', 'finalizado', 'dinheiro', '2025-08-04 00:39:15', '2025-08-04 00:39:15', NULL, 'Ester', 'avulso'),
('17', 'PED2508046715', '12.00', 'finalizado', 'dinheiro', '2025-08-04 10:53:35', '2025-08-04 10:53:35', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('18', 'PED2508048492', '8.00', 'finalizado', 'dinheiro', '2025-08-04 11:04:29', '2025-08-04 11:04:29', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('19', 'PED2508041949', '12.00', 'finalizado', 'dinheiro', '2025-08-04 11:35:29', '2025-08-04 11:35:29', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('20', 'PED2508049778', '18.00', 'finalizado', 'pix', '2025-08-04 11:56:29', '2025-08-04 11:56:29', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('21', 'PED2508042829', '8.00', 'finalizado', 'dinheiro', '2025-08-04 13:29:07', '2025-08-04 13:29:07', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('22', 'PED2508044598', '4.50', 'finalizado', 'pix', '2025-08-04 13:30:13', '2025-08-04 13:30:13', '1', 'João Silva Santos', 'cadastrado'),
('23', 'PED2508042959', '21.00', 'finalizado', 'cartao_debito', '2025-08-04 15:56:39', '2025-08-04 15:56:39', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('24', 'PED2508040830', '55.90', 'finalizado', 'cartao_credito', '2025-08-04 17:04:16', '2025-08-04 17:05:20', NULL, 'Gustavo', 'avulso'),
('25', 'PED2508055274', '12.00', 'finalizado', 'pix', '2025-08-05 07:18:26', '2025-08-05 07:18:26', '5', 'Ana Paula Ferreira', 'cadastrado'),
('26', 'PED2508052411', '24.90', 'finalizado', 'pix', '2025-08-05 08:25:48', '2025-08-05 08:25:48', NULL, 'Antonio', 'avulso'),
('27', 'PED2508058123', '43.80', 'finalizado', 'pix', '2025-08-05 17:35:35', '2025-08-05 17:38:24', NULL, 'Cliente Avulso', 'avulso'),
('28', 'PED2508054430', '33.00', 'finalizado', 'cartao_debito', '2025-08-05 17:36:46', '2025-08-05 17:38:18', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('29', 'PED2508058753', '28.90', 'finalizado', 'cartao_credito', '2025-08-05 17:44:14', '2025-08-05 17:44:43', NULL, 'Cliente Avulso', 'avulso'),
('30', 'PED2508080076', '30.90', 'finalizado', 'dinheiro', '2025-08-08 02:04:17', '2025-08-08 02:07:42', NULL, 'Fulano', 'avulso'),
('31', 'PED2508101487', '36.00', 'finalizado', 'pix', '2025-08-10 18:32:49', '2025-08-10 18:38:00', NULL, 'Reinaldo', 'avulso'),
('32', 'PED2508108063', '52.80', 'finalizado', 'pix', '2025-08-10 18:37:05', '2025-08-11 22:57:29', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('33', 'PED2508113161', '16.00', 'finalizado', 'cartao_debito', '2025-08-11 22:29:02', '2025-08-11 23:11:05', NULL, 'Reinaldo', 'avulso'),
('34', 'PED2508119472', '12.00', 'finalizado', 'dinheiro', '2025-08-11 23:14:00', '2025-08-11 23:14:00', '1', 'João Silva Santos', 'cadastrado'),
('35', 'PED2508110945', '18.00', 'finalizado', 'pix', '2025-08-11 23:24:06', '2025-08-11 23:24:06', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('36', 'PED2508111657', '6.00', 'finalizado', 'dinheiro', '2025-08-11 23:29:15', '2025-08-11 23:29:15', NULL, 'José', 'avulso'),
('37', 'PED2508119446', '12.00', 'finalizado', 'dinheiro', '2025-08-11 23:37:20', '2025-08-11 23:37:20', NULL, 'João', 'avulso'),
('38', 'PED2508129737', '43.80', 'finalizado', 'pix', '2025-08-12 07:32:32', '2025-08-12 07:34:02', '5', 'Ana Paula Ferreira', 'cadastrado'),
('39', 'PED2508129367', '19.90', 'finalizado', 'cartao_debito', '2025-08-12 07:56:12', '2025-08-12 09:33:27', '2', 'Maria Oliveira Costa', 'cadastrado'),
('40', 'PED2508122883', '49.80', 'finalizado', 'pix', '2025-08-12 09:43:39', '2025-08-13 12:37:12', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('41', 'PED2508122105', '12.00', 'finalizado', 'pix', '2025-08-12 10:03:54', '2025-08-12 17:09:46', '5', 'Ana Paula Ferreira', 'cadastrado'),
('42', 'PED2508139308', '65.70', 'finalizado', 'pix', '2025-08-13 13:00:34', '2025-08-16 15:34:19', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('43', 'PED2508164407', '20.00', 'finalizado', 'pix', '2025-08-16 08:58:23', '2025-08-25 20:14:30', '1', 'João Silva Santos', 'cadastrado'),
('44', 'PED2508198971', '12.00', 'finalizado', 'cartao_debito', '2025-08-19 07:43:16', '2025-08-25 20:15:39', '3', 'Empresa XYZ Ltda', 'cadastrado'),
('45', 'PED2508252684', '36.90', 'finalizado', 'dinheiro', '2025-08-25 20:38:30', '2025-10-06 23:42:23', '7', 'Reinaldo Themistocles', 'cadastrado'),
('46', 'PED2510143172', '48.80', 'finalizado', 'dinheiro', '2025-10-14 00:43:44', '2025-10-14 01:34:53', '5', 'Ana Paula Ferreira', 'cadastrado'),
('47', 'PED2510140255', '30.00', 'finalizado', 'cartao_debito', '2025-10-14 00:50:18', '2025-10-14 01:35:19', '3', 'Empresa XYZ Ltda', 'cadastrado'),
('48', 'PED2510140675', '30.00', 'finalizado', 'dinheiro', '2025-10-14 00:54:33', '2025-10-14 00:54:33', '5', 'Ana Paula Ferreira', 'cadastrado'),
('49', 'PED2510144399', '30.00', 'finalizado', 'cartao_debito', '2025-10-14 01:07:50', '2025-10-14 01:35:30', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('50', 'PED2510149747', '24.40', 'finalizado', 'dinheiro', '2025-10-14 01:09:15', '2025-10-14 01:09:15', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('51', 'PED2510148365', '18.90', 'finalizado', 'pix', '2025-10-14 01:09:34', '2025-10-14 01:36:13', '3', 'Empresa XYZ Ltda', 'cadastrado'),
('52', 'PED2510144045', '9.95', 'finalizado', 'dinheiro', '2025-10-14 01:09:53', '2025-10-14 01:36:23', NULL, 'Reinaldo', 'avulso'),
('53', 'PED2510142875', '4.50', 'finalizado', 'cartao_debito', '2025-10-14 01:10:15', '2025-10-14 01:39:49', NULL, 'Jose', 'avulso'),
('54', 'PED2510142322', '8.00', 'finalizado', 'dinheiro', '2025-10-14 01:10:26', '2025-10-14 01:59:16', NULL, 'Antonio', 'avulso'),
('55', 'PED2510146855', '24.90', 'finalizado', 'dinheiro', '2025-10-14 01:10:49', '2025-10-14 02:01:21', NULL, 'Kaio', 'avulso'),
('56', 'PED2510140222', '290.60', 'finalizado', 'dinheiro', '2025-10-14 01:11:22', '2025-10-18 02:23:02', '2', 'Maria Oliveira Costa', 'cadastrado'),
('57', 'PED2510183173', '10.50', 'finalizado', 'dinheiro', '2025-10-18 02:29:57', '2025-10-19 10:05:32', '5', 'Ana Paula Ferreira', 'cadastrado'),
('58', 'PED2510191693', '15.00', 'finalizado', 'dinheiro', '2025-10-19 10:06:19', '2025-10-19 12:41:08', '1', 'João Silva Santos', 'cadastrado'),
('59', 'PED2510198533', '14.00', 'finalizado', 'dinheiro', '2025-10-19 12:43:01', '2025-10-19 13:05:30', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('60', 'PED2510209365', '31.40', 'finalizado', 'dinheiro', '2025-10-20 00:37:54', '2025-10-21 01:08:08', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('61', 'PED2510201725', '23.40', 'finalizado', 'dinheiro', '2025-10-20 00:43:56', '2025-10-21 01:08:15', '7', 'Reinaldo Themistocles', 'cadastrado'),
('62', 'PED2510206066', '23.00', 'finalizado', 'dinheiro', '2025-10-20 19:31:33', '2025-10-21 01:08:20', '4', 'Tech Solutions EIRELI', 'cadastrado'),
('63', 'PED2510219943', '23.50', 'finalizado', 'pix', '2025-10-21 01:09:35', '2025-10-21 01:10:31', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('64', 'PED2510215982', '17.00', 'finalizado', 'cartao_debito', '2025-10-21 15:49:34', '2025-10-21 15:54:25', '1', 'João Silva Santos', 'cadastrado'),
('65', 'PED2510216933', '19.40', 'finalizado', 'dinheiro', '2025-10-21 16:43:47', '2025-10-21 16:43:53', '8', 'Jean Carlos de Souza Themistocles', 'cadastrado'),
('66', 'PED2510213326', '22.50', 'finalizado', 'dinheiro', '2025-10-21 17:12:57', '2025-10-22 08:28:44', NULL, 'José Fernandes', 'avulso'),
('67', 'PED2510227612', '11.49', 'finalizado', 'pix', '2025-10-22 08:13:43', '2025-10-22 08:29:30', NULL, 'Balcão', 'avulso'),
('68', 'PED2510229907', '6.00', 'finalizado', 'dinheiro', '2025-10-22 08:16:29', '2025-10-22 08:30:53', '7', 'Reinaldo Themistocles', 'cadastrado'),
('69', 'PED2510225187', '15.00', 'finalizado', 'dinheiro', '2025-10-22 08:57:25', '2025-10-22 08:57:25', '5', 'Ana Paula Ferreira', 'cadastrado'),
('70', 'PED2510226493', '8.00', 'finalizado', 'cartao_credito', '2025-10-22 08:58:44', '2025-10-22 08:58:44', '5', 'Ana Paula Ferreira', 'cadastrado'),
('71', 'PED2510224381', '18.90', 'finalizado', 'cartao_debito', '2025-10-22 08:59:15', '2025-10-22 08:59:15', '6', 'Claudineia de Souza Themistocles', 'cadastrado'),
('72', 'PED2510222619', '6.00', 'finalizado', 'pix', '2025-10-22 08:59:51', '2025-10-22 08:59:51', '1', 'João Silva Santos', 'cadastrado');

-- Tabela: produtos
DROP TABLE IF EXISTS `produtos`;

CREATE TABLE `produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `preco` decimal(10,2) NOT NULL,
  `categoria_id` int NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `produtos` (`id`, `nome`, `descricao`, `preco`, `categoria_id`, `ativo`, `created_at`, `updated_at`) VALUES
('1', 'X-Burguer', 'Hambúrguer com queijo, alface e tomate', '15.90', '1', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('2', 'X-Bacon', 'Hambúrguer com bacon, queijo, alface e tomate', '18.90', '1', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('3', 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata', '4.50', '2', '1', '2025-07-20 18:19:32', '2025-07-20 18:19:32'),
('4', 'Suco de Laranja', 'Suco natural de laranja 500ml', '6.00', '2', '1', '2025-07-20 18:19:32', '2025-07-30 08:48:55'),
('5', 'Batata Frita', 'Porção de batata frita 500g', '12.00', '4', '1', '2025-07-20 18:19:32', '2025-07-30 09:22:38'),
('6', 'Sorvete Chocolate', 'Sorvete artesanal sabor chocolate uma explosão de sabor.', '8.00', '3', '1', '2025-07-20 18:19:32', '2025-07-28 23:03:35'),
('7', 'Picolé ao leite', 'Picolé ao leite diversos sabores.', '1.99', '5', '1', '2025-07-28 22:52:40', '2025-07-28 22:52:40');

-- Tabela: recibos
DROP TABLE IF EXISTS `recibos`;

CREATE TABLE `recibos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_recibo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `serie` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'A',
  `cliente_id` int NOT NULL,
  `pagamento_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `valor_recebido` decimal(15,2) DEFAULT NULL,
  `valor_desconto` decimal(15,2) DEFAULT '0.00',
  `valor_juros` decimal(15,2) DEFAULT '0.00',
  `valor_multa` decimal(15,2) DEFAULT '0.00',
  `valor_liquido` decimal(15,2) NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento_original` date DEFAULT NULL,
  `data_pagamento` date NOT NULL,
  `forma_pagamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `banco` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agencia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('ativo','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `conta_receber_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_recibo` (`numero_recibo`),
  KEY `idx_numero_recibo` (`numero_recibo`),
  KEY `idx_cliente_id` (`cliente_id`),
  KEY `idx_pagamento_id` (`pagamento_id`),
  KEY `idx_data_emissao` (`data_emissao`),
  KEY `idx_data_pagamento` (`data_pagamento`),
  KEY `idx_status` (`status`),
  KEY `recibos_ibfk_4` (`usuario_id`),
  KEY `idx_conta_receber_id` (`conta_receber_id`),
  CONSTRAINT `recibos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `recibos_ibfk_3` FOREIGN KEY (`pagamento_id`) REFERENCES `pagamentos` (`id`),
  CONSTRAINT `recibos_ibfk_4` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `recibos` (`id`, `numero_recibo`, `serie`, `cliente_id`, `pagamento_id`, `usuario_id`, `valor_recebido`, `valor_desconto`, `valor_juros`, `valor_multa`, `valor_liquido`, `descricao`, `referencia`, `data_emissao`, `data_vencimento_original`, `data_pagamento`, `forma_pagamento`, `banco`, `agencia`, `conta`, `cheque`, `observacoes`, `status`, `created_at`, `updated_at`, `conta_receber_id`) VALUES
('1', 'REC-A-2025-000001', 'A', '1', NULL, '1', '500.00', '0.00', '0.00', '0.00', '500.00', 'Pagamento de serviços prestados', NULL, '2025-06-30', NULL, '2025-06-30', 'PIX', NULL, NULL, NULL, NULL, NULL, 'ativo', '2025-06-30 01:13:59', '2025-06-30 01:13:59', NULL),
('2', 'REC-A-2025-000002', 'A', '2', NULL, '1', '1200.00', '0.00', '0.00', '0.00', '1200.00', 'Recebimento de vendas', NULL, '2025-06-29', NULL, '2025-06-29', 'Cartão de Crédito', NULL, NULL, NULL, NULL, NULL, 'ativo', '2025-06-30 01:13:59', '2025-06-30 01:13:59', NULL),
('3', 'REC-A-2025-000003', 'A', '3', NULL, '1', '800.00', '0.00', '0.00', '0.00', '800.00', 'Pagamento de licença de software', NULL, '2025-06-28', NULL, '2025-06-28', 'Transferência', NULL, NULL, NULL, NULL, NULL, 'ativo', '2025-06-30 01:13:59', '2025-06-30 01:13:59', NULL),
('4', 'REC-A-2025-000004', 'A', '2', '28', '1', '9.99', '0.00', '0.00', '0.00', '9.99', 'Recebimento referente a: Manutenção mensal', 'NF-005', '2025-07-01', NULL, '2025-07-01', 'Dinheiro', '', '', '', '', '', 'ativo', '2025-07-01 12:11:32', '2025-07-01 12:11:32', NULL),
('5', 'REC-A-2025-000005', 'A', '2', '29', '1', '10.00', '0.00', '0.00', '0.00', '10.00', 'Recebimento referente a: Manutenção mensal', 'NF-005', '2025-07-01', NULL, '2025-07-01', 'Cartão de Débito', '', '', '', '', '', 'ativo', '2025-07-01 12:21:13', '2025-07-01 12:21:13', NULL),
('6', 'REC-A-2025-000006', 'A', '1', '30', '1', '9.99', '0.00', '0.00', '0.00', '9.99', 'Recebimento referente a: Venda de produtos - Pedido #001', 'NF-001', '2025-07-01', NULL, '2025-07-01', 'Dinheiro', '', '', '', '', '', 'ativo', '2025-07-01 12:29:39', '2025-07-01 12:29:39', NULL),
('7', 'REC-A-2025-000007', 'A', '1', '31', '1', '10.01', '0.00', '0.00', '0.00', '10.01', 'Recebimento referente a: Venda de produtos - Pedido #001', 'NF-001', '2025-07-01', NULL, '2025-07-01', 'PIX', '', '', '', '', '', 'ativo', '2025-07-01 13:53:35', '2025-07-01 13:53:35', NULL),
('8', 'REC-A-2025-000008', 'A', '6', '33', '1', '10.00', '0.00', '0.00', '0.00', '10.00', 'Recebimento referente a: Compra teste.', 'Pedido 15372', '2025-07-01', NULL, '2025-07-01', 'PIX', '', '', '', '', '', 'ativo', '2025-07-01 15:54:22', '2025-07-01 15:54:22', NULL),
('9', 'REC-A-2025-000009', 'A', '1', NULL, '1', '150.00', '0.00', '0.00', '0.00', '150.00', 'Serviços de consultoria - Teste', NULL, '2025-07-01', NULL, '2025-07-01', 'dinheiro', NULL, NULL, NULL, NULL, NULL, 'ativo', '2025-07-03 14:55:45', '2025-07-03 22:43:21', NULL),
('10', 'REC-000001', 'A', '6', NULL, '1', NULL, '0.00', '0.00', '0.00', '2.50', 'teste', NULL, '2025-07-04', NULL, '2025-07-01', 'dinheiro', NULL, NULL, NULL, NULL, '', 'ativo', '2025-07-03 22:43:41', '2025-07-03 22:43:41', NULL),
('11', 'REC-000002', 'A', '6', NULL, '1', NULL, '0.00', '0.00', '0.00', '10.00', 'Pagamento referente à conta: Venda teste

Observações: teste', NULL, '2025-07-04', NULL, '2025-07-04', 'Dinheiro', NULL, NULL, NULL, NULL, 'teste', 'ativo', '2025-07-03 23:44:11', '2025-07-03 23:44:11', '7'),
('12', 'REC-000003', 'A', '6', NULL, '1', NULL, '0.00', '0.00', '0.00', '90.00', 'Pagamento referente à conta: Venda teste

Observações: teste', NULL, '2025-07-04', NULL, '2025-07-04', 'Dinheiro', NULL, NULL, NULL, NULL, 'teste', 'ativo', '2025-07-04 00:02:38', '2025-07-04 00:02:38', '7'),
('13', 'REC-000004', 'A', '1', NULL, '1', NULL, '0.00', '0.00', '0.00', '1420.00', 'Pagamento referente à conta: Venda de produtos - Pedido #001

Observações: Liquidação de conta teste.', NULL, '2025-07-04', NULL, '2025-07-04', 'Boleto', NULL, NULL, NULL, NULL, 'Liquidação de conta teste.', 'ativo', '2025-07-04 13:12:59', '2025-07-04 13:12:59', '1'),
('14', 'REC-000005', 'A', '6', NULL, '1', NULL, '0.00', '0.00', '0.00', '900.00', 'Pagamento referente à conta: Venda teste', NULL, '2025-07-04', NULL, '2025-07-04', 'PIX', NULL, NULL, NULL, NULL, '', 'ativo', '2025-07-04 13:16:17', '2025-07-04 13:16:17', '7'),
('15', 'REC-000006', 'A', '8', NULL, '1', NULL, '0.00', '0.00', '0.00', '150.00', 'Pagamento referente à conta: Compra de lanche e refrigerante.

Observações: Liquidacao de debito', NULL, '2025-07-05', NULL, '2025-07-05', 'PIX', NULL, NULL, NULL, NULL, 'Liquidacao de debito', 'ativo', '2025-07-05 17:56:25', '2025-07-05 17:56:25', '9'),
('16', 'REC-000007', 'A', '7', NULL, '3', NULL, '0.00', '0.00', '0.00', '400.00', 'Pagamento referente à conta: Venda teste novo cliente.', NULL, '2025-07-11', NULL, '2025-07-11', 'Dinheiro', NULL, NULL, NULL, NULL, '', 'ativo', '2025-07-10 23:23:08', '2025-07-10 23:23:08', '8'),
('17', 'REC-000008', 'A', '6', NULL, '3', NULL, '0.00', '0.00', '0.00', '30.95', 'Pagamento referente à conta: Pedido PED2507298277 - , , ', NULL, '2025-10-06', NULL, '2025-10-06', 'Dinheiro', NULL, NULL, NULL, NULL, '', 'ativo', '2025-10-06 10:46:23', '2025-10-06 10:46:23', '10'),
('18', 'REC-000009', 'A', '8', NULL, '3', NULL, '0.00', '0.00', '0.00', '43.80', 'Pagamento referente à conta: Pedido PED2507307796 - , , ', NULL, '2025-10-22', NULL, '2025-10-22', 'Dinheiro', NULL, NULL, NULL, NULL, '', 'ativo', '2025-10-22 09:00:37', '2025-10-22 09:00:37', '11'),
('19', 'REC-000010', 'A', '8', NULL, '3', NULL, '0.00', '0.00', '0.00', '24.00', 'Pagamento referente à conta: Pedido PED2508021616 - , ', NULL, '2025-10-22', NULL, '2025-10-22', 'PIX', NULL, NULL, NULL, NULL, '', 'ativo', '2025-10-22 09:13:02', '2025-10-22 09:13:02', '12'),
('20', 'REC-000011', 'A', '8', NULL, '3', NULL, '0.00', '0.00', '0.00', '24.00', 'Pagamento referente à conta: Pedido PED2508021616, Id no banco: 4, - ,  - [object Object], [object Object]', NULL, '2025-10-22', NULL, '2025-10-22', 'PIX', NULL, NULL, NULL, NULL, '', 'ativo', '2025-10-22 09:19:29', '2025-10-22 09:19:29', '13');

-- Tabela: relatorios_salvos
DROP TABLE IF EXISTS `relatorios_salvos`;

CREATE TABLE `relatorios_salvos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('clientes','contas_receber','recibos','financeiro','personalizado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filtros` json DEFAULT NULL,
  `campos` json DEFAULT NULL,
  `configuracoes` json DEFAULT NULL,
  `usuario_criacao` int NOT NULL,
  `publico` tinyint(1) DEFAULT '0',
  `periodo_inicio` date DEFAULT NULL,
  `periodo_fim` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_usuario_criacao` (`usuario_criacao`),
  KEY `idx_publico` (`publico`),
  CONSTRAINT `relatorios_salvos_ibfk_1` FOREIGN KEY (`usuario_criacao`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela relatorios_salvos vazia

-- Tabela: usuarios
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('admin','usuario') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'usuario',
  `ativo` tinyint(1) DEFAULT '1',
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_ativo` (`ativo`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_usuarios_login` (`email`,`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `tipo`, `ativo`, `telefone`, `foto`, `ultimo_login`, `created_at`, `updated_at`) VALUES
('1', 'Administrador', 'admin@teste.com', '$2y$10$VKewYfDGMc.Bwgs8KGHVauVvzci2cg.iLjrlntr9AxMvHqyg26zIG', 'admin', '1', NULL, NULL, '2025-07-07 13:54:54', '2025-06-29 10:54:10', '2025-07-07 13:54:54'),
('2', 'Usuário Teste', 'usuario@teste.com', '$2y$10$VKewYfDGMc.Bwgs8KGHVauVvzci2cg.iLjrlntr9AxMvHqyg26zIG', 'usuario', '1', NULL, NULL, NULL, '2025-06-29 10:54:10', '2025-06-29 12:47:37'),
('3', 'Reinaldo Themistocles', 'rdthemis@gmail.com', '$2y$10$YFbtvVonshMXyTEq7d8hH.BIqUXGn4zDi0iun1NxMtw6Z2JW2nPbG', 'admin', '1', NULL, NULL, '2025-10-22 16:42:10', '2025-07-07 23:28:15', '2025-10-22 16:42:10');


COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
SET AUTOCOMMIT = 1;

-- =============================================
-- Backup finalizado em: 22/10/2025 16:42:39
-- =============================================
