<?php
// models/Adicional.php

class Adicional
{
    private $conn;
    private $table_name = 'adicionais';

    // Propriedades da Adicional
    public $id;
    public $nome;
    public $descricao;
    public $preco;
    public $categoria_id;
    public $ativo;
    public $created_at;
    public $updated_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Buscar todos os adicionais ativos
    public function buscarTodos()
    {
        $query = 'SELECT 
                    a.id, 
                    a.nome, 
                    a.descricao, 
                    a.preco, 
                    a.categoria_id,
                    c.nome as categoria_nome,
                    a.ativo, 
                    a.created_at, 
                    a.updated_at 
                  FROM '.$this->table_name.' a
                  LEFT JOIN categorias c ON a.categoria_id = c.id
                  ORDER BY c.nome, a.nome';

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar adicionais por categoria
    public function buscarPorCategoria($categoria_id)
    {
        $query = 'SELECT 
                    a.id, 
                    a.nome, 
                    a.descricao, 
                    a.preco, 
                    a.categoria_id,
                    c.nome as categoria_nome,
                    a.ativo, 
                    a.created_at, 
                    a.updated_at 
                  FROM '.$this->table_name.' a
                  LEFT JOIN categorias c ON a.categoria_id = c.id
                  WHERE a.categoria_id = :categoria_id 
                  AND a.ativo = 1
                  ORDER BY a.nome';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':categoria_id', $categoria_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar adicional por ID
    public function buscarPorId($id)
    {
        $query = 'SELECT 
                    a.id, 
                    a.nome, 
                    a.descricao, 
                    a.preco, 
                    a.categoria_id,
                    c.nome as categoria_nome,
                    a.ativo, 
                    a.created_at, 
                    a.updated_at 
                  FROM '.$this->table_name.' a
                  LEFT JOIN categorias c ON a.categoria_id = c.id
                  WHERE a.id = :id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Criar novo adicional
    public function criar()
    {
        $query = 'INSERT INTO '.$this->table_name.' 
                  (nome, descricao, preco, categoria_id, ativo) 
                  VALUES (:nome, :descricao, :preco, :categoria_id, :ativo)';

        $stmt = $this->conn->prepare($query);

        // Limpar os dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->preco = htmlspecialchars(strip_tags($this->preco));
        $this->categoria_id = htmlspecialchars(strip_tags($this->categoria_id));
        $this->ativo = $this->ativo ? 1 : 0;

        // Fazer o bind dos parâmetros
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':preco', $this->preco);
        $stmt->bindParam(':categoria_id', $this->categoria_id);
        $stmt->bindParam(':ativo', $this->ativo);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Atualizar adicional
    public function atualizar()
    {
        $query = 'UPDATE '.$this->table_name.' 
                  SET nome = :nome, 
                      descricao = :descricao, 
                      preco = :preco, 
                      categoria_id = :categoria_id, 
                      ativo = :ativo 
                  WHERE id = :id';

        $stmt = $this->conn->prepare($query);

        // Limpar os dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->preco = htmlspecialchars(strip_tags($this->preco));
        $this->categoria_id = htmlspecialchars(strip_tags($this->categoria_id));
        $this->ativo = $this->ativo ? 1 : 0;
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Fazer o bind dos parâmetros
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':preco', $this->preco);
        $stmt->bindParam(':categoria_id', $this->categoria_id);
        $stmt->bindParam(':ativo', $this->ativo);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Deletar adicional (soft delete - marca como inativo)
    public function deletar()
    {
        $query = 'UPDATE '.$this->table_name.' 
                  SET ativo = 0 
                  WHERE id = :id';

        $stmt = $this->conn->prepare($query);
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}