<?php

require_once __DIR__ . '/GeocodingService.php';

/**
 * EntregaCalculoService — a partir de um endereço em texto, descobre a
 * zona de entrega e a taxa corretas pela distância real até a loja.
 *
 * Usado em dois lugares:
 *   - CardapioController::calcularEntrega() — "preview" chamado pelo
 *     front enquanto o cliente ainda está preenchendo o pedido.
 *   - CardapioPedidoController::criar() — cálculo AUTORITATIVO, refeito
 *     no servidor na hora de salvar o pedido (nunca confia no que o
 *     front mandou, mesmo que seja o resultado do preview).
 *
 * Configuração (env): STORE_LAT / STORE_LNG — coordenadas da loja.
 * Gere com uma chamada manual à Geocoding API usando o endereço da loja
 * (ver instruções passadas em chat) e cole os dois valores no Railway.
 */
class EntregaCalculoService
{
    private PDO $db;
    private GeocodingService $geocoder;

    public function __construct(PDO $db, ?GeocodingService $geocoder = null)
    {
        $this->db = $db;
        $this->geocoder = $geocoder ?? new GeocodingService();
    }

    /**
     * @return array{
     *   sucesso: bool,
     *   erro?: string,
     *   zona_entrega_id?: int,
     *   zona_nome?: string,
     *   taxa?: float,
     *   distancia_km?: float,
     *   endereco_formatado?: string
     * }
     */
    public function calcular(string $endereco): array
    {
        if (trim($endereco) === '') {
            return ['sucesso' => false, 'erro' => 'Informe o endereço de entrega.'];
        }

        $storeLat = $_ENV['STORE_LAT'] ?? (getenv('STORE_LAT') ?: null);
        $storeLng = $_ENV['STORE_LNG'] ?? (getenv('STORE_LNG') ?: null);
        if ($storeLat === null || $storeLng === null) {
            error_log('❌ EntregaCalculoService: STORE_LAT/STORE_LNG não configurados.');
            return ['sucesso' => false, 'erro' => 'Cálculo de entrega não configurado no servidor.'];
        }

        $geo = $this->geocoder->geocodificar($endereco);
        if ($geo === null) {
            return ['sucesso' => false, 'erro' => $this->geocoder->getUltimoErro() ?? 'Endereço não encontrado.'];
        }

        $distanciaKm = GeocodingService::distanciaKm(
            $geo['lat'],
            $geo['lng'],
            (float)$storeLat,
            (float)$storeLng
        );

        $zona = $this->buscarZonaPorDistancia($distanciaKm);
        if ($zona === null) {
            return [
                'sucesso' => false,
                'erro' => 'Esse endereço está fora da nossa área de entrega.',
                'distancia_km' => round($distanciaKm, 2),
            ];
        }

        return [
            'sucesso'             => true,
            'zona_entrega_id'     => (int)$zona['id'],
            'zona_nome'           => $zona['nome'],
            'taxa'                => (float)$zona['valor'],
            'distancia_km'        => round($distanciaKm, 2),
            'endereco_formatado'  => $geo['endereco_formatado'],
        ];
    }

    private function buscarZonaPorDistancia(float $distanciaKm): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, nome, valor
               FROM zonas_entrega
              WHERE ativo = 1
                AND distancia_min_km <= :dist
                AND (distancia_max_km IS NULL OR distancia_max_km > :dist2)
              ORDER BY distancia_min_km ASC
              LIMIT 1"
        );
        $stmt->execute([':dist' => $distanciaKm, ':dist2' => $distanciaKm]);
        $zona = $stmt->fetch(PDO::FETCH_ASSOC);

        return $zona !== false ? $zona : null;
    }
}
