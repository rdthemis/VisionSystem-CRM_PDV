<?php
/**
 * API Endpoint - Impressão de Comanda.
 *
 * POST /api/print_comanda.php
 *
 * Recebe os dados do pedido via JSON e envia para a impressora térmica.
 * Também suporta GET para preview em texto da comanda.
 * GET /api/print_comanda.php?action=info  → Retorna info do ambiente de impressão
 *
 * @author Gelatto Mannia PDV
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__.'/../ComandaBuilder.php';

// ── Configurações ─────────────────────────────────────────────────
// Detecta automaticamente o SO para definir o device correto
$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

$CONFIG = [
    // ╔══════════════════════════════════════════════════════════════╗
    // ║  CONFIGURAÇÃO DA IMPRESSORA                                  ║
    // ║                                                              ║
    // ║  Windows: Use o nome de compartilhamento da impressora       ║
    // ║           Ex: 'BematechMP2500' ou 'MP-2500 TH'              ║
    // ║           Ou caminho completo: '\\\\localhost\\BematechMP2500'║
    // ║           Ou porta direta: 'LPT1'                            ║
    // ║                                                              ║
    // ║  Linux:   Use o caminho do dispositivo USB                   ║
    // ║           Ex: '/dev/usb/lp0'                                 ║
    // ╚══════════════════════════════════════════════════════════════╝
    'device' => $isWindows
        ? 'MP-2500 TH'       // ← ALTERE para o nome compartilhado da sua impressora
        : '/dev/usb/lp0',

    'nome_empresa' => 'SORVETES GELATTO MANNIA',
    'endereco' => 'Rua Guarani, 191 - Corumbataí do Sul - PR',
    'telefone' => '(44) 9.9826-4006',
    // 'cnpj' => '23.544.846/0001-98',
];

try {
    $comanda = new ComandaBuilder($CONFIG['device'], [
        'nome_empresa' => $CONFIG['nome_empresa'],
        'endereco' => $CONFIG['endereco'],
        'telefone' => $CONFIG['telefone'],
        // 'cnpj' => $CONFIG['cnpj'],
        'colunas' => 41,  // ← 32 colunas para 58mm
    ]);

    // ── GET: Info do ambiente ou Preview ──────────────────────────
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Endpoint de diagnóstico: GET ?action=info
        if (isset($_GET['action']) && $_GET['action'] === 'info') {
            $printer = new BematechPrinter($CONFIG['device']);
            echo json_encode([
                'success' => true,
                'info' => $printer->getInfo(),
                'config' => [
                    'device' => $CONFIG['device'],
                    'nome_empresa' => $CONFIG['nome_empresa'],
                ],
            ]);
            exit;
        }

        // Preview da comanda (dados de exemplo)
        $exemploPedido = [
            'numero' => 999,
            'tipo' => 'delivery',
            'cliente' => 'Cliente Exemplo',
            'telefone' => '(44) 99999-0000',
            'endereco' => 'Rua Exemplo, 123 - Centro',
            'itens' => [
                [
                    'qtd' => 2,
                    'descricao' => 'Sorvete 500ml Chocolate',
                    'valor_unit' => 18.00,
                    'adicionais' => [
                        ['descricao' => 'Calda extra', 'valor' => 3.00],
                    ],
                    'observacao' => 'Sem cobertura',
                ],
                [
                    'qtd' => 1,
                    'descricao' => 'Acai 700ml',
                    'valor_unit' => 25.00,
                    'adicionais' => [
                        ['descricao' => 'Granola', 'valor' => 2.00],
                        ['descricao' => 'Leite condensado', 'valor' => 3.00],
                    ],
                    'observacao' => '',
                ],
            ],
            'valor_entrega' => 5.00,
            'desconto' => 0,
            'pagamento' => 'PIX',
            'observacao' => 'Entregar no portao azul',
        ];

        $preview = $comanda->preview($exemploPedido);

        echo json_encode([
            'success' => true,
            'preview' => $preview,
            'pedido' => $exemploPedido,
        ]);
        exit;
    }

    // ── POST: Imprimir comanda ────────────────────────────────────
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'JSON inválido: '.json_last_error_msg(),
            ]);
            exit;
        }

        // Validação básica
        if (empty($input['itens']) || !is_array($input['itens'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'O pedido deve conter pelo menos um item.',
            ]);
            exit;
        }

        // Quantidade de cópias
        $copias = intval($input['copias'] ?? 1);
        $copias = max(1, min($copias, 3));

        $resultado = ['success' => true, 'message' => ''];

        for ($i = 0; $i < $copias; ++$i) {
            $resultado = $comanda->imprimir($input);
            if (!$resultado['success']) {
                break;
            }
        }

        http_response_code($resultado['success'] ? 200 : 500);
        echo json_encode($resultado);
        exit;
    }

    // Método não suportado
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método não suportado. Use POST para imprimir ou GET para preview.',
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno: '.$e->getMessage(),
    ]);
}
