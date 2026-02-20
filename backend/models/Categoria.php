 <?php
// models/Categoria.php

class Categoria {
    private $conn;
    private $table_name = "categorias";

    // Propriedades da categoria
    public $id;
    public $nome;
    public $descricao;
    public $ativo;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Buscar todas as categorias ativas
    public function buscarTodas() {
        $query = "SELECT id, nome, descricao, ativo, created_at, updated_at 
                  FROM " . $this->table_name . " 
                  WHERE ativo = 1 
                  ORDER BY nome";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Buscar categoria por ID
    public function buscarPorId($id) {
        $query = "SELECT id, nome, descricao, ativo, created_at, updated_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch();
    }

    // Criar nova categoria
    public function criar() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (nome, descricao, ativo) 
                  VALUES (:nome, :descricao, :ativo)";
        
        $stmt = $this->conn->prepare($query);
        
        // Limpar os dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->ativo = $this->ativo ? 1 : 0;
        
        // Fazer o bind dos parâmetros
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':ativo', $this->ativo);
        
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        
        return false;
    }

    // Atualizar categoria
    public function atualizar() {
        $query = "UPDATE " . $this->table_name . " 
                  SET nome = :nome, descricao = :descricao, ativo = :ativo 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        // Limpar os dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->ativo = $this->ativo ? 1 : 0;
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Fazer o bind dos parâmetros
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':ativo', $this->ativo);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }

    // Deletar categoria (soft delete - marca como inativo)
    public function deletar() {
        $query = "UPDATE " . $this->table_name . " 
                  SET ativo = 0 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }
}
?>