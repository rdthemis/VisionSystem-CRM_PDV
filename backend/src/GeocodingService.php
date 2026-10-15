<?php

/**
 * GeocodingService — converte um endereço em texto em latitude/longitude,
 * usando a Google Geocoding API.
 *
 * Por que isso existe: antes, o cliente do cardápio digital escolhia a
 * "zona de entrega" manualmente numa lista (Centro, Bairro Próximo...).
 * Isso dependia do cliente saber classificar o próprio endereço certo.
 * Agora o endereço digitado é geocodificado e a distância até a loja é
 * calculada de verdade — a zona (e a taxa) são escolhidas pelo backend,
 * não pelo cliente. Ver EntregaCalculoService.php.
 *
 * Configuração (env):
 *   GOOGLE_GEOCODING_API_KEY  — obrigatória. Restrita à Geocoding API no
 *                                Google Cloud Console (ver print-agent/README
 *                                não, ver instruções passadas em chat).
 *   GEOCODING_CONTEXTO        — sufixo somado ao endereço digitado antes de
 *                                geocodificar, pra ancorar na cidade certa
 *                                (padrão: "Corumbataí do Sul - PR, Brasil").
 */
class GeocodingService
{
    private string $apiKey;
    private string $contexto;
    private ?string $ultimoErro = null;

    public function __construct()
    {
        $this->apiKey = $_ENV['GOOGLE_GEOCODING_API_KEY'] ?? (getenv('GOOGLE_GEOCODING_API_KEY') ?: '');
        $this->contexto = $_ENV['GEOCODING_CONTEXTO'] ?? (getenv('GEOCODING_CONTEXTO') ?: 'Corumbataí do Sul - PR, Brasil');
    }

    public function getUltimoErro(): ?string
    {
        return $this->ultimoErro;
    }

    /**
     * @return array{lat: float, lng: float, endereco_formatado: string}|null
     */
    public function geocodificar(string $endereco): ?array
    {
        $this->ultimoErro = null;

        if (empty($this->apiKey)) {
            $this->ultimoErro = 'Geocodificação não configurada no servidor (GOOGLE_GEOCODING_API_KEY ausente).';
            error_log('❌ ' . $this->ultimoErro);
            return null;
        }

        $enderecoCompleto = trim($endereco) . ', ' . $this->contexto;

        $url = 'https://maps.googleapis.com/maps/api/geocode/json?' . http_build_query([
            'address'    => $enderecoCompleto,
            'components' => 'country:BR',
            'key'        => $this->apiKey,
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT        => 8,
        ]);
        $resposta = curl_exec($ch);
        $erroCurl = curl_error($ch);
        curl_close($ch);

        if ($resposta === false) {
            $this->ultimoErro = "Falha de conexão com o serviço de geocodificação ({$erroCurl})";
            error_log('❌ GeocodingService: ' . $this->ultimoErro);
            return null;
        }

        $dados = json_decode($resposta, true);
        $status = $dados['status'] ?? 'UNKNOWN';

        if ($status === 'ZERO_RESULTS') {
            $this->ultimoErro = 'Não conseguimos localizar esse endereço. Confira o nome da rua e o número.';
            return null;
        }

        if ($status !== 'OK') {
            // OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST, etc. — erro
            // nosso (cota, chave, configuração), não do cliente. Loga com
            // detalhe pra investigar, mas não expõe o status bruto pra fora.
            $this->ultimoErro = 'Não foi possível calcular a taxa de entrega agora. Tente novamente em instantes.';
            error_log("❌ GeocodingService: status={$status} resposta={$resposta}");
            return null;
        }

        $resultado = $dados['results'][0] ?? null;
        if ($resultado === null || !isset($resultado['geometry']['location'])) {
            $this->ultimoErro = 'Resposta inesperada do serviço de geocodificação.';
            error_log('❌ GeocodingService: resultado sem geometry.location — ' . $resposta);
            return null;
        }

        return [
            'lat'                 => (float)$resultado['geometry']['location']['lat'],
            'lng'                 => (float)$resultado['geometry']['location']['lng'],
            'endereco_formatado'  => (string)($resultado['formatted_address'] ?? $enderecoCompleto),
        ];
    }

    /**
     * Distância em linha reta (haversine), em km, entre dois pontos.
     * Suficiente pra decidir faixa de taxa numa cidade pequena — não
     * precisa de distância de rota (que seria outra API paga, Distance
     * Matrix) pra esse propósito.
     */
    public static function distanciaKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $raioTerraKm = 6371.0;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $raioTerraKm * $c;
    }
}
