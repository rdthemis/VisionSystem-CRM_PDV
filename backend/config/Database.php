<?php

// config/database.php

class Database
{
    private $host = 'localhost';
    private $db_name = 'projeto_crm';
    private $username = 'root';  // Ajuste conforme seu MySQL
    private $password = '@v1s10n';      // Ajuste conforme seu MySQL
    private $port = '3306';      // Porta padrão do MySQL
    public $conn;

    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                'mysql:host='.$this->host.
                ';port='.$this->port.
                ';dbname='.$this->db_name,
                $this->username,
                $this->password
            );

            // Configurar PDO para mostrar erros e usar UTF-8
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->exec('set names utf8');
        } catch (PDOException $exception) {
            echo 'Erro de conexão: '.$exception->getMessage();
        }

        return $this->conn;
    }
}