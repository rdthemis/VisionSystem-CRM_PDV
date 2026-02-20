<?php

// gerar-comanda-pdf.php

// Log de debug (remova em produção)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS - Permite requisições do React
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Se for requisição OPTIONS (preflight), retorna OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Só aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['erro' => 'Método não permitido', 'metodo_recebido' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

try {
    // Debug: Log da requisição
    file_put_contents('debug.log', '=== '.date('Y-m-d H:i:s')." ===\n", FILE_APPEND);
    file_put_contents('debug.log', 'Método: '.$_SERVER['REQUEST_METHOD']."\n", FILE_APPEND);

    // Lê os dados enviados pelo React
    $input = file_get_contents('php://input');
    file_put_contents('debug.log', 'Input recebido: '.$input."\n", FILE_APPEND);

    $dadosComanda = json_decode($input, true);
    file_put_contents('debug.log', 'Dados decodificados: '.print_r($dadosComanda, true)."\n", FILE_APPEND);

    // Validação básica
    if (!$dadosComanda) {
        throw new Exception('Dados inválidos - JSON mal formado');
    }

    if (!isset($dadosComanda['numero'])) {
        throw new Exception('Número da comanda é obrigatório');
    }

    // Gera o HTML da comanda
    $html = gerarHTMLComanda($dadosComanda);
    file_put_contents('debug.log', "HTML gerado com sucesso\n", FILE_APPEND);

    // Por enquanto, vamos usar a versão simples para testar
    // gerarPDFSimples($html, $dadosComanda);
    gerarPDFComTCPDF($html, $dadosComanda);
} catch (Exception $e) {
    file_put_contents('debug.log', 'ERRO: '.$e->getMessage()."\n", FILE_APPEND);
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'erro' => $e->getMessage(),
        'linha' => $e->getLine(),
        'arquivo' => $e->getFile(),
    ]);
}

function gerarHTMLComanda($dados)
{
    // Data/hora atual
    $dataHora = date('d/m/Y H:i:s');

    // Monta HTML otimizado para impressora térmica
    $html = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            * { margin: 0; padding: 0; }
            body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                width: 80mm; 
                margin: 0;
                padding: 2mm;
            }
            .centro { text-align: center; }
            .negrito { font-weight: bold; margin: 1px 0; }
            .linha { border-bottom: 2px dashed; margin: 1px 0; }
            .item { display: flex; justify-content: space-between; }
            .total { font-size: 14px; font-weight: bold; }
            .espacamento { margin: 1px 0; }
        </style>
    </head>
    <body>
        <div class='negrito'>
            ".(isset($dados['nome_estabelecimento']) ? $dados['nome_estabelecimento'] : 'RESTAURANTE')."
        </div>
        <div class='negrito'>
            ".(isset($dados['endereco']) ? $dados['endereco'] : '')."
        </div>
        <div class='negrito'>
            ".(isset($dados['telefone']) ? $dados['telefone'] : '')."
        </div>
        
        <div class='espacamento'>
            <div><strong>COMANDA: #_{$dados['numero']}</strong></div>
            <div>Mesa: {$dados['mesa']}</div>
            <div>Data: {$dataHora}</div>
            ".(isset($dados['cliente']) ? "<div>Cliente: {$dados['cliente']}</div>" : '')."
        </div>
                
        <div class='espacamento'>
            <div class='negrito'>ITENS:</div>";

    // Adiciona itens
    $total = 0;
    if (isset($dados['itens']) && is_array($dados['itens'])) {
        foreach ($dados['itens'] as $item) {
            $subtotal = $item['quantidade'] * $item['preco_unitario'];
            $total += $subtotal;

            $html .= "
            <div class='item'>
                <span>{$item['quantidade']}x {$item['produto_nome']} - {$item['preco_unitario']}</span>
                <span>R$ ".number_format($subtotal, 2, ',', '.').'</span>
            </div>';

            // Se tem observação
            if (isset($item['observacao']) && !empty($item['observacao'])) {
                $html .= "<div style='font-size: 10px; margin-left: 3px;'>Obs: {$item['observacao']}</div>";
            }
        }
    }

    $html .= "
        </div>
        
        <div class='espacamento centro total'>
            TOTAL: R$ ".number_format($total, 2, ',', '.').'
        </div>
        
        '.(isset($dados['observacoes_gerais']) ? "
        <div class='espacamento'>
            <div class='negrito'>Observações:</div>
            <div>{$dados['observacoes']}</div>
        </div>
        " : '')."
        
        <div class='centro' style='margin-top: 5px; font-size: 8px;'>
            <h2>Obrigado pela preferência!</h2>
        </div>
    </body>
    </html>";

    return $html;
}

/* function gerarPDFComDompdf($html, $dados)
{
    require_once 'vendor/autoload.php'; // Se usar Composer

    $dompdf = new Dompdf\Dompdf();
    $dompdf->loadHtml($html);

    // Configura para impressora térmica (80mm)
    $dompdf->setPaper([0, 0, 226.77, 841.89], 'portrait'); // 80mm width
    $dompdf->render();

    // Define nome do arquivo
    $nomeArquivo = "comanda_{$dados['numero']}_".date('Ymd_His').'.pdf';

    // Força download
    $dompdf->stream($nomeArquivo, [
        'Attachment' => true,
        'compress' => false,
    ]);
} */

function gerarPDFSimples($html, $dados)
{
    // Tenta usar TCPDF se disponível
    if (class_exists('TCPDF')) {
        gerarPDFComTCPDF($html, $dados);

        return;
    }

    // Se não tem TCPDF, tenta DomPDF
    if (class_exists('Dompdf\Dompdf')) {
        gerarPDFComDompdf($html, $dados);

        return;
    }

    // Se não tem nenhuma biblioteca, gera TXT (funciona perfeitamente para impressoras térmicas)
    $nomeArquivo = "comanda_{$dados['numero']}_".date('Ymd_His').'.txt';

    header('Content-Type: application/octet-stream');
    header("Content-Disposition: attachment; filename=\"{$nomeArquivo}\"");

    $textoSimples = htmlToThermalText($dados);
    echo $textoSimples;
}

// Nova função para TCPDF
function gerarPDFComTCPDF($html, $dados)
{
    require_once './../vendor/tecnickcom/tcpdf/tcpdf.php';

    // Cria novo PDF
    $pdf = new TCPDF('P', 'mm', [80, 220], true, 'UTF-8', false);

    // Configurações do documento
    $pdf->SetCreator('Sistema de Comandas');
    $pdf->SetAuthor('Restaurante');
    $pdf->SetTitle('Comanda #'.$dados['numero']);

    // Remove header e footer padrão
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);

    // Margens (esquerda, topo, direita)
    $pdf->SetMargins(5, 5, 5);
    $pdf->SetAutoPageBreak(true, 5);

    // Adiciona página
    $pdf->AddPage();

    // Define fonte
    $pdf->SetFont('courier', '', 10);

    // Escreve o HTML
    $pdf->writeHTML($html, true, false, true, false, '');

    // Nome do arquivo
    $nomeArquivo = "comanda_{$dados['numero']}_".date('Ymd_His').'.pdf';

    // Força download
    $pdf->Output($nomeArquivo, 'D');
}

// Função melhorada para DomPDF
function gerarPDFComDompdf($html, $dados)
{
    require_once 'vendor/autoload.php';

    $dompdf = new Dompdf\Dompdf();

    // Configurações
    $dompdf->getOptions()->setChroot(__DIR__);
    $dompdf->getOptions()->setIsRemoteEnabled(true);

    $dompdf->loadHtml($html);

    // Configura papel para impressora térmica (80mm de largura)
    $dompdf->setPaper([0, 0, 226.77, 841.89], 'portrait');

    $dompdf->render();

    $nomeArquivo = "comanda_{$dados['numero']}_".date('Ymd_His').'.pdf';

    // Força download
    $dompdf->stream($nomeArquivo, [
        'Attachment' => true,
        'compress' => 1,
    ]);
}

// Função para converter para texto simples (funciona sem bibliotecas)
function htmlToThermalText($dados)
{
    $texto = '';
    $texto .= str_repeat('=', 32)."\n";
    $texto .= "       RESTAURANTE DO JOÃO\n";
    $texto .= str_repeat('=', 32)."\n";
    $texto .= 'COMANDA: #'.$dados['numero']."\n";
    $texto .= 'Mesa: '.(isset($dados['mesa']) ? $dados['mesa'] : 'N/A')."\n";
    $texto .= 'Data: '.date('d/m/Y H:i:s')."\n";

    if (isset($dados['cliente'])) {
        $texto .= 'Cliente: '.$dados['cliente']."\n";
    }

    $texto .= str_repeat('-', 32)."\n";
    $texto .= "ITENS:\n";

    $total = 0;
    if (isset($dados['itens']) && is_array($dados['itens'])) {
        foreach ($dados['itens'] as $item) {
            $quantidade = isset($item['quantidade']) ? $item['quantidade'] : 1;
            $nome = isset($item['nome']) ? $item['nome'] : 'Item sem nome';
            $preco = isset($item['preco']) ? $item['preco'] : 0;

            $subtotal = $quantidade * $preco;
            $total += $subtotal;

            $texto .= sprintf("%dx %-20s R$%6.2f\n", $quantidade, $nome, $subtotal);

            if (isset($item['observacao']) && !empty($item['observacao'])) {
                $texto .= '   Obs: '.$item['observacao']."\n";
            }
        }
    }

    $texto .= str_repeat('-', 32)."\n";
    $texto .= sprintf("TOTAL: %22s R$%6.2f\n", '', $total);
    $texto .= str_repeat('=', 32)."\n";
    $texto .= "      Obrigado pela preferência!\n";
    $texto .= str_repeat('=', 32)."\n";

    return $texto;
}

// Exemplo de dados esperados:
/*
{
    "numero": "001",
    "mesa": "5",
    "cliente": "João Silva",
    "nome_estabelecimento": "Restaurante do João",
    "endereco": "Rua das Flores, 123",
    "itens": [
        {
            "nome": "Hambúrguer",
            "quantidade": 2,
            "preco": 15.50,
            "observacao": "Sem cebola"
        },
        {
            "nome": "Refrigerante",
            "quantidade": 1,
            "preco": 5.00
        }
    ],
    "observacoes_gerais": "Cliente preferencial"
}
*/
