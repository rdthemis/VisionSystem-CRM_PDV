<?php

// models/Produto.php

class Produto
{
    private $conn;
    private $table_name = 'produtos';

    // Propriedades do produto
    public $id;
    public $nome;
    public $descricao;
    public $preco;
    public $categoria_id;
    public $categoria_nome; // Para joins
    public $ativo;
    public $created_at;
    public $updated_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Buscar todos os produtos ativos com nome da categoria
    public function buscarTodos()
    {
        $query = 'SELECT 
                    p.id, p.nome, p.descricao, p.preco, 
                    p.categoria_id, p.ativo, p.created_at, p.updated_at,
                    c.nome as categoria_nome
                  FROM '.$this->table_name.' p
                  LEFT JOIN categorias c ON p.categoria_id = c.id
                  WHERE p.ativo = 1 
                  ORDER BY p.nome';

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Buscar produtos por categoria
    public function buscarPorCategoria($categoria_id)
    {
        $query = 'SELECT 
                    p.id, p.nome, p.descricao, p.preco, 
                    p.categoria_id, p.ativo, p.created_at, p.updated_at,
                    c.nome as categoria_nome
                  FROM '.$this->table_name.' p
                  LEFT JOIN categorias c ON p.categoria_id = c.id
                  WHERE p.ativo = 1 AND p.categoria_id = :categoria_id
                  ORDER BY p.nome';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':categoria_id', $categoria_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    // Buscar produto por ID
    public function buscarPorId($id)
    {
        $query = 'SELECT 
                    p.id, p.nome, p.descricao, p.preco, 
                    p.categoria_id, p.ativo, p.created_at, p.updated_at,
                    c.nome as categoria_nome
                  FROM '.$this->table_name.' p
                  LEFT JOIN categorias c ON p.categoria_id = c.id
                  WHERE p.id = :id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    // Criar novo produto
    public function criar()
    {
        $query = 'INSERT INTO '.$this->table_name.' 
                  (nome, descricao, preco, categoria_id, ativo) 
                  VALUES (:nome, :descricao, :preco, :categoria_id, :ativo)';

        $stmt = $this->conn->prepare($query);

        // Limpar os dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->preco = floatval($this->preco);
        $this->categoria_id = intval($this->categoria_id);
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

    // Atualizar produto
    public function atualizar()
    {
        $query = 'UPDATE '.$this->table_name.' 
                  SET nome = :nome, descricao = :descricao, preco = :preco, 
                      categoria_id = :categoria_id, ativo = :ativo 
                  WHERE id = :id';

        $stmt = $this->conn->prepare($query);

        // Limpar os dados
        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->descricao = htmlspecialchars(strip_tags($this->descricao));
        $this->preco = floatval($this->preco);
        $this->categoria_id = intval($this->categoria_id);
        $this->ativo = $this->ativo ? 1 : 0;
        $this->id = intval($this->id);

        // Fazer o bind dos parâmetros
        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':descricao', $this->descricao);
        $stmt->bindParam(':preco', $this->preco);
        $stmt->bindParam(':categoria_id', $this->categoria_id);
        $stmt->bindParam(':ativo', $this->ativo);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Deletar produto (soft delete)
    public function deletar()
    {
        $query = 'UPDATE '.$this->table_name.' 
                  SET ativo = 0 
                  WHERE id = :id';

        $stmt = $this->conn->prepare($query);
        $this->id = intval($this->id);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Validar se categoria existe
    public function categoriaExiste($categoria_id)
    {
        $query = 'SELECT id FROM categorias WHERE id = :id AND ativo = 1';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $categoria_id);
        $stmt->execute();

        return $stmt->fetch() !== false;
    }

    // Buscar produtos mais vendidos (para relatórios futuros)
    public function buscarMaisVendidos($limite = 10)
    {
        $query = 'SELECT 
                    p.id, p.nome, p.preco,
                    c.nome as categoria_nome,
                    COALESCE(SUM(pi.quantidade), 0) as total_vendido
                  FROM '.$this->table_name.' p
                  LEFT JOIN categorias c ON p.categoria_id = c.id
                  LEFT JOIN pedido_itens pi ON p.id = pi.produto_id
                  WHERE p.ativo = 1
                  GROUP BY p.id, p.nome, p.preco, c.nome
                  ORDER BY total_vendido DESC
                  LIMIT :limite';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}