<?php

// models/ZonaEntrega.php

class ZonaEntrega
{
    private $conn;
    private $table_name = 'zonas_entrega';

    // Propriedades
    public $id;
    public $nome;
    public $valor;
    public $descricao;
    public $ativo;
    public $created_at;
    public $updated_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Buscar todas as zonas
     */
    public function buscarTodas($apenasAtivas = false)
    {
        $query = "SELECT * FROM {$this->table_name}";
        
        if ($apenasAtivas) {
            $query .= " WHERE ativo = 1";
        }
        
        $query .= " ORDER BY valor ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Buscar zona por ID
     */
    public function buscarPorId($id)
    {
        $query = "SELECT * FROM {$this->table_name} WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Criar nova zona
     */
    public function criar()
    {
        $query = "INSERT INTO {$this->table_name} 
                  (nome, valor, descricao, ativo) 
                  VALUES (:nome, :valor, :descricao, :ativo)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->valor = floatval($this->valor);
        $this->ativo = $this->ativo ? 1 : 0;

        // Bind
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':valor', $this->valor);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':ativo', $this->ativo);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Atualizar zona
     */
    public function atualizar()
    {
        $query = "UPDATE {$this->table_name} 
                  SET nome = :nome, 
                      valor = :valor, 
                      descricao = :descricao, 
                      ativo = :ativo 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->valor = floatval($this->valor);
        $this->ativo = $this->ativo ? 1 : 0;
        $this->id = intval($this->id);

        // Bind
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':valor', $this->valor);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':ativo', $this->ativo);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Deletar zona (soft delete)
     */
    public function deletar()
    {
        $query = "UPDATE {$this->table_name} SET ativo = 0 WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $this->id = intval($this->id);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Reativar zona
     */
    public function reativar()
    {
        $query = "UPDATE {$this->table_name} SET ativo = 1 WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $this->id = intval($this->id);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }
}
