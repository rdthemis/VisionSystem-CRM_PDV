<?php

// controllers/CaixaController.php

require_once '../src/Database.php';
require_once '../models/Caixa.php';
require_once '../utils/cors.php';

class CaixaController {
    private $database;
    private $db;
    private $caixa;
    
    public function __construct() {
        $this->database = new Database();
        $this->db = $this->database->conectar();
        $this->caixa = new Caixa($this->db);
        
        setupCORS();
    }
    
    public function processar() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->buscar();
                break;
            case 'POST':
                $this->procesarAcao();
                break;
            case 'PUT':
                $this->atualizar();
                break;
            default:
                sendErrorResponse('Método não permitido', 405);
        }
    }
    
    private function buscar() {
        try {
            // Verificar se é busca de resumo
            if (isset($_GET['resumo'])) {
                $caixaId = $_GET['caixa_id'] ?? null;
                $resumo = $this->caixa->obterResumo($caixaId);
                sendJsonResponse($resumo);
                return;
            }
            
            // Verificar se é busca de movimentos
            if (isset($_GET['movimentos'])) {
                $caixaId = $_GET['caixa_id'] ?? null;
                $filtros = [];
                
                if (isset($_GET['tipo'])) $filtros['tipo'] = $_GET['tipo'];
                if (isset($_GET['categoria'])) $filtros['categoria'] = $_GET['categoria'];
                if (isset($_GET['data_inicio'])) $filtros['data_inicio'] = $_GET['data_inicio'];
                if (isset($_GET['data_fim'])) $filtros['data_fim'] = $_GET['data_fim'];
                
                $movimentos = $this->caixa->buscarMovimentos($caixaId, $filtros);
                sendJsonResponse($movimentos);
                return;
            }
            
            // Verificar status do caixa
            if (isset($_GET['status'])) {
                $caixaAberto = $this->caixa->verificarCaixaAberto();
                sendJsonResponse([
                    'caixa_aberto' => !!$caixaAberto,
                    'dados' => $caixaAberto
                ]);
                return;
            }
            
            // Busca padrão - resumo do caixa atual
            $resumo = $this->caixa->obterResumo();
            sendJsonResponse($resumo);
            
        } catch (Exception $e) {
            sendErrorResponse('Erro ao buscar dados do caixa: ' . $e->getMessage(), 500);
        }
    }
    
    private function procesarAcao() {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);
            
            if (!$dados || !isset($dados['acao'])) {
                sendErrorResponse('Ação não especificada', 400);
                return;
            }
            
            // Obter usuário da sessão (você pode adaptar conforme seu sistema de auth)
            $usuario_id = $this->obterUsuarioLogado();
            if (!$usuario_id) {
                sendErrorResponse('Usuário não autenticado', 401);
                return;
            }
            
            switch ($dados['acao']) {
                case 'abrir':
                    $this->abrirCaixa($dados, $usuario_id);
                    break;
                    
                case 'fechar':
                    $this->fecharCaixa($dados, $usuario_id);
                    break;
                    
                case 'movimento':
                    $this->adicionarMovimento($dados, $usuario_id);
                    break;
                    
                default:
                    sendErrorResponse('Ação inválida', 400);
            }
            
        } catch (Exception $e) {
            sendErrorResponse('Erro ao processar ação: ' . $e->getMessage(), 500);
        }
    }
    
    private function abrirCaixa($dados, $usuario_id) {
        if (!isset($dados['saldo_inicial']) || !is_numeric($dados['saldo_inicial'])) {
            sendErrorResponse('Saldo inicial é obrigatório e deve ser numérico', 400);
            return;
        }
        
        $saldo_inicial = floatval($dados['saldo_inicial']);
        $observacoes = $dados['observacoes'] ?? null;
        
        $resultado = $this->caixa->abrir($saldo_inicial, $usuario_id, $observacoes);
        
        if ($resultado['success']) {
            sendJsonResponse($resultado, 201);
        } else {
            sendErrorResponse($resultado['message'], 400);
        }
    }
    
    private function fecharCaixa($dados, $usuario_id) {
        $observacoes = $dados['observacoes'] ?? null;
        
        $resultado = $this->caixa->fechar($usuario_id, $observacoes);
        
        if ($resultado['success']) {
            sendJsonResponse($resultado);
        } else {
            sendErrorResponse($resultado['message'], 400);
        }
    }
    
    private function adicionarMovimento($dados, $usuario_id) {
        // Validar dados obrigatórios
        $camposObrigatorios = ['tipo', 'valor', 'descricao', 'categoria'];
        foreach ($camposObrigatorios as $campo) {
            if (!isset($dados[$campo]) || empty($dados[$campo])) {
                sendErrorResponse("Campo '{$campo}' é obrigatório", 400);
                return;
            }
        }
        
        if (!in_array($dados['tipo'], ['entrada', 'saida'])) {
            sendErrorResponse('Tipo deve ser "entrada" ou "saida"', 400);
            return;
        }
        
        if (!is_numeric($dados['valor']) || $dados['valor'] <= 0) {
            sendErrorResponse('Valor deve ser um número positivo', 400);
            return;
        }
        
        $resultado = $this->caixa->adicionarMovimento(
            $dados['tipo'],
            floatval($dados['valor']),
            $dados['descricao'],
            $dados['categoria'],
            $usuario_id,
            $dados['pedido_id'] ?? null
        );
        
        if ($resultado['success']) {
            sendJsonResponse($resultado, 201);
        } else {
            sendErrorResponse($resultado['message'], 400);
        }
    }
    
    private function atualizar() {
        try {
            $dados = json_decode(file_get_contents('php://input'), true);
            
            // Implementar atualizações se necessário
            // Por exemplo, editar observações, corrigir valores, etc.
            
            sendJsonResponse(['message' => 'Funcionalidade em desenvolvimento']);
            
        } catch (Exception $e) {
            sendErrorResponse('Erro ao atualizar: ' . $e->getMessage(), 500);
        }
    }
    
    // Método auxiliar para obter usuário logado
    private function obterUsuarioLogado() {
        // Adapte conforme seu sistema de autenticação
        // Exemplo usando o sistema de auth existente:
        
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            
            if (!$authHeader) {
                return null;
            }
            
            require_once '../src/Auth.php';
            $auth = new Auth($this->database);
            $resultado = $auth->verificarToken($authHeader);
            
            return $resultado ? $resultado['usuario_id'] : null;
            
        } catch (Exception $e) {
            error_log('Erro ao obter usuário logado: ' . $e->getMessage());
            return null;
        }
    }
}

// Executar apenas se chamado diretamente
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    $controller = new CaixaController();
    $controller->processar();
}

?>