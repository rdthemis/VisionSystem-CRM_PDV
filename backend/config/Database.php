<?php

// config/Database.php

// ══════════════════════════════════════════════════════════════════
// GUARD - Evita redeclaração da classe Database
// ══════════════════════════════════════════════════════════════════
if (class_exists('Database')) {
    return;
}

class Database
{
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private string $port;
    public ?PDO $conn = null;
    private bool $connected = false;

    public function __construct()
    {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->port = $_ENV['DB_PORT'] ?? '3306';
        $this->db_name = $_ENV['DB_NAME'] ?? 'projeto_crm';
        $this->username = $_ENV['DB_USER'] ?? null;
        $this->password = $_ENV['DB_PASS'] ?? null;

        if (empty($this->username) || empty($this->db_name)) {
            $this->connected = false;
            throw new Exception('Configuração de banco de dados incompleta. Verifique o .env');
        } else {
            $this->connected = true;
        }
    }

    public function getConnection(): ?PDO
    {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $this->host,
                $this->port,
                $this->db_name
            );

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
        } catch (PDOException $e) {
            // Em dev mostra o erro, em prod loga silenciosamente
            if (($_ENV['APP_ENV'] ?? 'development') !== 'production') {
                throw $e;
            }
            error_log('DB Connection Error: '.$e->getMessage());

            return null;
        }

        return $this->conn;
    }

    /**
     * Carrega o arquivo .env e popula $_ENV.
     */
    private function loadEnv(): void
    {
        // Só carrega uma vez
        if (defined('ENV_LOADED')) {
            return;
        }

        // Caminho do .env na raiz do backend
        $envFile = __DIR__.'/../.env';

        if (!file_exists($envFile)) {
            // Tenta um nível acima (raiz do projeto)
            $envFile = __DIR__.'/../../.env';
        }

        if (!file_exists($envFile)) {
            return; // Usa valores padrão do construtor
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Ignora comentários
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            // Separa KEY=VALUE
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }

            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));

            // Remove aspas ao redor do valor
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            $_ENV[$key] = $value;
            putenv("$key=$value");
        }

        define('ENV_LOADED', true);
    }

    // Método para verificar se tabelas existem
    public function verificarTabelas()
    {
        try {
            $pdo = $this->getConnection();

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
            $pdo = $this->getConnection();

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
            'connected' => $this->connected,
            'database' => IS_PRODUCTION ? '***' : $this->db_name,
        ];
    }

    // Método para começar transação
    public function beginTransaction()
    {
        return $this->getConnection()->beginTransaction();
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
        return $this->getConnection()->prepare($sql);
    }


    // Método para verificar se está conectado
    public function isConnected()
    {
        return $this->connected && $this->conn !== null;
    }

    // Método para executar query direta
    public function query($sql)
    {
        return $this->getConnection()->query($sql);
    }

    // Método para obter último ID inserido
    public function lastInsertId()
    {
        return $this->conn->lastInsertId();
    }
}
