-- ============================================
-- MIGRATION: Taxa de entrega por distância real (geocodificação)
-- ============================================
-- Antes, o cliente do cardápio digital escolhia a zona de entrega
-- manualmente numa lista. Agora o backend calcula a distância real
-- (endereço digitado -> coordenadas da loja, via Google Geocoding API)
-- e escolhe a faixa/zona automaticamente — ver backend/src/
-- EntregaCalculoService.php.
--
-- Mantém as mesmas 4 faixas que já existiam (mesmos nomes e valores),
-- só adiciona o intervalo de distância (em km) de cada uma.
-- distancia_max_km = NULL significa "sem limite superior" (última faixa).

ALTER TABLE zonas_entrega
ADD COLUMN distancia_min_km DECIMAL(6, 2) NULL COMMENT 'Distância mínima (km) da loja, inclusive',
ADD COLUMN distancia_max_km DECIMAL(6, 2) NULL COMMENT 'Distância máxima (km) da loja, exclusive; NULL = sem limite';

UPDATE zonas_entrega SET distancia_min_km = 0,  distancia_max_km = 2   WHERE nome = 'Centro';
UPDATE zonas_entrega SET distancia_min_km = 2,  distancia_max_km = 5   WHERE nome = 'Bairro Próximo';
UPDATE zonas_entrega SET distancia_min_km = 5,  distancia_max_km = 10  WHERE nome = 'Bairro Distante';
UPDATE zonas_entrega SET distancia_min_km = 10, distancia_max_km = NULL WHERE nome = 'Zona Rural';

-- Confira o resultado (as 4 linhas devem aparecer com distancia_min_km/max_km preenchidos):
-- SELECT nome, valor, distancia_min_km, distancia_max_km FROM zonas_entrega ORDER BY distancia_min_km;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
