<?php

// src/Database.php - Classe Database para produção

require_once __DIR__.'/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__.'/..');
$dotenv->load();

class Database
{
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;
    private $connected = false;

    public function __construct()
    {
        // Carrega variáveis do arquivo .env ou usa padrões
        $this->host = $_ENV['DB_HOST'];
        $this->db_name = $_ENV['DB_NAME'];
        $this->username = $_ENV['DB_USER'];
        $this->password = $_ENV['DB_PASS'];
        $this->port = $_ENV['DB_PORT'];

        // Log das configurações (sem senha)
        error_log("🔗 Configuração DB: {$this->username}@{$this->host}:{$this->port}/{$this->db_name}");
    }

    // Método para conectar ao banco
    public function conectar()
    {
        if ($this->connected && $this->conn !== null) {
            return $this->conn;
        }

        try {
            $this->conn = null;

            // DSN (Data Source Name) - string de conexão
            $dsn = 'mysql:host='.$this->host.
                   ';port='.$this->port.
                   ';dbname='.$this->db_name.
                   ';charset=utf8mb4';

            // Criando a conexão PDO
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
            ]);
            // Configurar PDO para mostrar erros e usar UTF-8
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->exec('set names utf8');

            $this->connected = true;
            error_log('✅ Conexão com banco estabelecida com sucesso');
        } catch (PDOException $e) {
            error_log('❌ Erro na conexão com banco: '.$e->getMessage());
            error_log('🔧 Verifique: 1) Banco existe 2) Usuário/senha 3) Servidor MySQL rodando');

            // Em desenvolvimento, mostrar erro detalhado
            if (($_ENV['APP_DEBUG'] ?? false) || ($_ENV['APP_ENV'] ?? '') === 'development') {
                throw new Exception('Erro de banco: '.$e->getMessage());
            }

            throw new Exception('Erro de conexão com o banco de dados');
        }

        return $this->conn;
    }

    // Método para verificar se está conectado
    public function isConnected()
    {
        return $this->connected && $this->conn !== null;
    }

    // Método para testar conexão
    public function testarConexao()
    {
        try {
            $pdo = $this->conectar();

            // Testar se consegue fazer uma query simples
            $stmt = $pdo->query('SELECT 1 as teste, NOW() as agora, DATABASE() as banco');
            $resultado = $stmt->fetch();

            return [
                'success' => true,
                'message' => 'Conexão com banco funcionando perfeitamente',
                'data' => [
                    'database' => $resultado['banco'],
                    'timestamp' => $resultado['agora'],
                    'host' => $this->host,
                    'port' => $this->port,
                ],
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao conectar: '.$e->getMessage(),
                'config' => [
                    'host' => $this->host,
                    'database' => $this->db_name,
                    'port' => $this->port,
                    'user' => $this->username,
                ],
            ];
        }
    }

    // Método para verificar se tabelas existem
    public function verificarTabelas()
    {
        try {
            $pdo = $this->conectar();

            $tabelas = ['usuarios', 'clientes'];
            $resultado = [];

            foreach ($tabelas as $tabela) {
                $stmt = $pdo->prepare('
                    SELECT COUNT(*) as total 
                    FROM information_schema.tables 
                    WHERE table_schema = ? AND table_name = ?
                ');
                $stmt->execute([$this->db_name, $tabela]);
                $existe = $stmt->fetch()['total'] > 0;

                $resultado[$tabela] = [
                    'existe' => $existe,
                    'status' => $existe ? '✅' : '❌',
                ];

                // Se existe, contar registros
                if ($existe) {
                    try {
                        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM `{$tabela}`");
                        $stmt->execute();
                        $resultado[$tabela]['registros'] = $stmt->fetch()['total'];
                    } catch (Exception $e) {
                        $resultado[$tabela]['registros'] = 'Erro: '.$e->getMessage();
                    }
                }
            }

            return [
                'success' => true,
                'tabelas' => $resultado,
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    // Método para executar queries de setup
    public function executarSetup($sqlFile = null)
    {
        try {
            $pdo = $this->conectar();

            if ($sqlFile && file_exists($sqlFile)) {
                $sql = file_get_contents($sqlFile);
                $pdo->exec($sql);

                return [
                    'success' => true,
                    'message' => 'Setup executado com sucesso',
                ];
            }

            return [
                'success' => false,
                'message' => 'Arquivo SQL não encontrado',
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro no setup: '.$e->getMessage(),
            ];
        }
    }

    // Método para fechar conexão
    public function fechar()
    {
        $this->conn = null;
        $this->connected = false;
        error_log('🔌 Conexão com banco fechada');
    }

    // Destructor para garantir que conexão seja fechada
    public function __destruct()
    {
        $this->fechar();
    }

    // Método para obter informações do banco
    public function getInfo()
    {
        return [
            'host' => $this->host,
            'database' => $this->db_name,
            'port' => $this->port,
            'user' => $this->username,
            'connected' => $this->connected,
        ];
    }

    // Método para começar transação
    public function beginTransaction()
    {
        return $this->conectar()->beginTransaction();
    }

    // Método para confirmar transação
    public function commit()
    {
        return $this->conn->commit();
    }

    // Método para desfazer transação
    public function rollback()
    {
        return $this->conn->rollback();
    }

    // Método para preparar statement
    public function prepare($sql)
    {
        return $this->conectar()->prepare($sql);
    }

    // Método para executar query direta
    public function query($sql)
    {
        return $this->conectar()->query($sql);
    }

    // Método para obter último ID inserido
    public function lastInsertId()
    {
        return $this->conn->lastInsertId();
    }
}