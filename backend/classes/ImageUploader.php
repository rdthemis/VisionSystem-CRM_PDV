<?php
/**
 * ImageUploader - Upload, validação e thumbnail de imagens de produtos
 * 
 * Funcionalidades:
 * - Upload com validação de tipo e tamanho
 * - Geração automática de thumbnail (200x200)
 * - Nomeação segura com slug do produto
 * - Remoção de imagem antiga ao atualizar
 * 
 * Estrutura de pastas criada automaticamente:
 *   backend/uploads/produtos/          ← imagens originais (redimensionadas)
 *   backend/uploads/produtos/thumbs/   ← thumbnails para o grid
 * 
 * @author Gelatto Mannia PDV
 * @version 1.0.0
 */

class ImageUploader
{
    // Diretórios de upload
    private string $uploadDir;
    private string $thumbDir;

    // Configurações
    private int $maxFileSize;         // bytes
    private int $imgWidth;            // largura da imagem principal
    private int $thumbWidth;          // largura do thumbnail
    private int $jpegQuality;         // qualidade JPEG (0-100)
    private array $allowedTypes;

    public function __construct(array $config = [])
    {
        $baseDir = $config['base_dir'] ?? __DIR__ . '/../uploads/produtos';

        $this->uploadDir  = rtrim($baseDir, '/');
        $this->thumbDir   = $this->uploadDir . '/thumbs';

        $this->maxFileSize  = $config['max_file_size'] ?? 5 * 1024 * 1024; // 5MB
        $this->imgWidth     = $config['img_width']     ?? 600;              // 600px
        $this->thumbWidth   = $config['thumb_width']   ?? 200;              // 200px
        $this->jpegQuality  = $config['jpeg_quality']  ?? 80;

        $this->allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        // Criar diretórios se não existirem
        $this->criarDiretorio($this->uploadDir);
        $this->criarDiretorio($this->thumbDir);
    }

    // ══════════════════════════════════════════════════════════════
    // UPLOAD PRINCIPAL
    // ══════════════════════════════════════════════════════════════

    /**
     * Processa upload de imagem do produto
     * 
     * @param array  $arquivo     $_FILES['imagem']
     * @param string $nomeProduto Nome do produto (para gerar slug)
     * @param int    $produtoId   ID do produto
     * @param string|null $imagemAnterior Nome da imagem atual (para remover)
     * 
     * @return array{success: bool, filename?: string, message?: string}
     */
    public function upload(array $arquivo, string $nomeProduto, int $produtoId, ?string $imagemAnterior = null): array
    {
        // 1. Validar arquivo
        $validacao = $this->validar($arquivo);
        if (!$validacao['success']) {
            return $validacao;
        }

        // 2. Gerar nome do arquivo
        $extensao = $this->getExtensao($arquivo['type']);
        $nomeArquivo = $this->gerarNomeArquivo($nomeProduto, $produtoId, $extensao);

        // 3. Caminhos de destino
        $caminhoOriginal = $this->uploadDir . '/' . $nomeArquivo;
        $caminhoThumb    = $this->thumbDir . '/' . $nomeArquivo;

        try {
            // 4. Processar imagem principal (redimensionar)
            $this->processarImagem(
                $arquivo['tmp_name'],
                $caminhoOriginal,
                $this->imgWidth,
                $arquivo['type']
            );

            // 5. Gerar thumbnail
            $this->processarImagem(
                $arquivo['tmp_name'],
                $caminhoThumb,
                $this->thumbWidth,
                $arquivo['type']
            );

            // 6. Remover imagem anterior (se existir e for diferente)
            if ($imagemAnterior && $imagemAnterior !== $nomeArquivo) {
                $this->remover($imagemAnterior);
            }

            return [
                'success'  => true,
                'filename' => $nomeArquivo,
                'message'  => 'Imagem enviada com sucesso!',
            ];

        } catch (\Exception $e) {
            // Limpar arquivos parciais em caso de erro
            @unlink($caminhoOriginal);
            @unlink($caminhoThumb);

            return [
                'success' => false,
                'message' => 'Erro ao processar imagem: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Upload a partir de base64 (para uploads via fetch/API)
     * 
     * @param string $base64Data String base64 (com ou sem prefixo data:image/...)
     * @param string $nomeProduto
     * @param int    $produtoId
     * @param string|null $imagemAnterior
     * 
     * @return array{success: bool, filename?: string, message?: string}
     */
    public function uploadBase64(string $base64Data, string $nomeProduto, int $produtoId, ?string $imagemAnterior = null): array
    {
        // Extrair tipo e dados do base64
        $tipo = 'image/jpeg'; // padrão
        if (preg_match('/^data:(image\/\w+);base64,/', $base64Data, $matches)) {
            $tipo = $matches[1];
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        }

        // Validar tipo
        if (!in_array($tipo, $this->allowedTypes)) {
            return [
                'success' => false,
                'message' => 'Tipo de imagem não permitido. Use: JPG, PNG ou WebP.',
            ];
        }

        // Decodificar
        $dados = base64_decode($base64Data);
        if ($dados === false) {
            return [
                'success' => false,
                'message' => 'Dados de imagem inválidos.',
            ];
        }

        // Validar tamanho
        if (strlen($dados) > $this->maxFileSize) {
            $maxMB = round($this->maxFileSize / 1024 / 1024, 1);
            return [
                'success' => false,
                'message' => "Imagem muito grande. Máximo: {$maxMB}MB.",
            ];
        }

        // Salvar em arquivo temporário e processar
        $tmpFile = tempnam(sys_get_temp_dir(), 'img_');
        file_put_contents($tmpFile, $dados);

        $arquivo = [
            'tmp_name' => $tmpFile,
            'type'     => $tipo,
            'size'     => strlen($dados),
            'error'    => UPLOAD_ERR_OK,
        ];

        $resultado = $this->upload($arquivo, $nomeProduto, $produtoId, $imagemAnterior);

        // Limpar temporário
        @unlink($tmpFile);

        return $resultado;
    }

    // ══════════════════════════════════════════════════════════════
    // REMOÇÃO
    // ══════════════════════════════════════════════════════════════

    /**
     * Remove imagem e thumbnail do produto
     */
    public function remover(string $nomeArquivo): bool
    {
        $removidos = 0;

        $caminhoOriginal = $this->uploadDir . '/' . $nomeArquivo;
        $caminhoThumb    = $this->thumbDir . '/' . $nomeArquivo;

        if (file_exists($caminhoOriginal)) {
            unlink($caminhoOriginal);
            $removidos++;
        }

        if (file_exists($caminhoThumb)) {
            unlink($caminhoThumb);
            $removidos++;
        }

        return $removidos > 0;
    }

    // ══════════════════════════════════════════════════════════════
    // URLs PÚBLICAS
    // ══════════════════════════════════════════════════════════════

    /**
     * Retorna URL da imagem principal
     */
    public function getImagemUrl(string $nomeArquivo): string
    {
        return '/uploads/produtos/' . $nomeArquivo;
    }

    /**
     * Retorna URL do thumbnail
     */
    public function getThumbUrl(string $nomeArquivo): string
    {
        return '/uploads/produtos/thumbs/' . $nomeArquivo;
    }

    // ══════════════════════════════════════════════════════════════
    // VALIDAÇÃO
    // ══════════════════════════════════════════════════════════════

    /**
     * Valida o arquivo de upload
     */
    private function validar(array $arquivo): array
    {
        // Verificar erro de upload
        if ($arquivo['error'] !== UPLOAD_ERR_OK) {
            $erros = [
                UPLOAD_ERR_INI_SIZE   => 'Arquivo excede o limite do servidor.',
                UPLOAD_ERR_FORM_SIZE  => 'Arquivo excede o limite do formulário.',
                UPLOAD_ERR_PARTIAL    => 'Upload incompleto.',
                UPLOAD_ERR_NO_FILE    => 'Nenhum arquivo enviado.',
                UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária não encontrada.',
                UPLOAD_ERR_CANT_WRITE => 'Erro ao gravar no disco.',
            ];

            return [
                'success' => false,
                'message' => $erros[$arquivo['error']] ?? 'Erro desconhecido no upload.',
            ];
        }

        // Verificar tipo MIME
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $tipoReal = $finfo->file($arquivo['tmp_name']);

        if (!in_array($tipoReal, $this->allowedTypes)) {
            return [
                'success' => false,
                'message' => 'Tipo de arquivo não permitido. Use: JPG, PNG ou WebP.',
            ];
        }

        // Verificar tamanho
        if ($arquivo['size'] > $this->maxFileSize) {
            $maxMB = round($this->maxFileSize / 1024 / 1024, 1);
            return [
                'success' => false,
                'message' => "Arquivo muito grande. Máximo: {$maxMB}MB.",
            ];
        }

        // Verificar se é realmente uma imagem válida
        $imageInfo = @getimagesize($arquivo['tmp_name']);
        if ($imageInfo === false) {
            return [
                'success' => false,
                'message' => 'Arquivo não é uma imagem válida.',
            ];
        }

        return ['success' => true];
    }

    // ══════════════════════════════════════════════════════════════
    // PROCESSAMENTO DE IMAGEM
    // ══════════════════════════════════════════════════════════════

    /**
     * Redimensiona e salva a imagem
     */
    private function processarImagem(string $origem, string $destino, int $larguraMax, string $mimeType): void
    {
        // Criar recurso GD a partir do tipo
        switch ($mimeType) {
            case 'image/jpeg':
                $imgOrigem = imagecreatefromjpeg($origem);
                break;
            case 'image/png':
                $imgOrigem = imagecreatefrompng($origem);
                break;
            case 'image/webp':
                $imgOrigem = imagecreatefromwebp($origem);
                break;
            default:
                throw new \RuntimeException("Tipo não suportado: {$mimeType}");
        }

        if ($imgOrigem === false) {
            throw new \RuntimeException('Não foi possível ler a imagem.');
        }

        // Dimensões originais
        $larguraOrig = imagesx($imgOrigem);
        $alturaOrig  = imagesy($imgOrigem);

        // Calcular novas dimensões mantendo proporção
        if ($larguraOrig > $larguraMax) {
            $ratio       = $larguraMax / $larguraOrig;
            $novaLargura = $larguraMax;
            $novaAltura  = (int) round($alturaOrig * $ratio);
        } else {
            // Imagem já é menor que o limite — manter tamanho
            $novaLargura = $larguraOrig;
            $novaAltura  = $alturaOrig;
        }

        // Criar imagem redimensionada
        $imgNova = imagecreatetruecolor($novaLargura, $novaAltura);

        // Preservar transparência (PNG/WebP)
        if ($mimeType === 'image/png' || $mimeType === 'image/webp') {
            imagealphablending($imgNova, false);
            imagesavealpha($imgNova, true);
            $transparente = imagecolorallocatealpha($imgNova, 0, 0, 0, 127);
            imagefilledrectangle($imgNova, 0, 0, $novaLargura, $novaAltura, $transparente);
        }

        // Redimensionar com qualidade
        imagecopyresampled(
            $imgNova, $imgOrigem,
            0, 0, 0, 0,
            $novaLargura, $novaAltura,
            $larguraOrig, $alturaOrig
        );

        // Salvar sempre como JPEG (menor tamanho, melhor para PDV)
        $destinoJpeg = preg_replace('/\.(png|webp)$/i', '.jpg', $destino);
        
        if (!imagejpeg($imgNova, $destinoJpeg, $this->jpegQuality)) {
            throw new \RuntimeException('Erro ao salvar imagem processada.');
        }

        // Liberar memória
        imagedestroy($imgOrigem);
        imagedestroy($imgNova);
    }

    // ══════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════

    /**
     * Gera nome do arquivo a partir do nome do produto
     * Ex: "Sorvete de Chocolate 500ml" → "sorvete-de-chocolate-500ml_42.jpg"
     */
    private function gerarNomeArquivo(string $nomeProduto, int $produtoId, string $extensao): string
    {
        $slug = $this->slugify($nomeProduto);
        // Sempre salva como .jpg (convertido no processamento)
        return "{$slug}_{$produtoId}.jpg";
    }

    /**
     * Converte texto para slug seguro
     */
    private function slugify(string $texto): string
    {
        // Converter acentos
        $texto = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
        // Minúsculas
        $texto = strtolower($texto);
        // Remover caracteres especiais
        $texto = preg_replace('/[^a-z0-9\-]/', '-', $texto);
        // Remover hífens duplicados
        $texto = preg_replace('/-+/', '-', $texto);
        // Remover hífens nas pontas
        $texto = trim($texto, '-');

        // Limitar tamanho
        return substr($texto, 0, 80);
    }

    /**
     * Retorna extensão baseada no MIME type
     */
    private function getExtensao(string $mimeType): string
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        return $map[$mimeType] ?? 'jpg';
    }

    /**
     * Cria diretório com permissões adequadas
     */
    private function criarDiretorio(string $caminho): void
    {
        if (!is_dir($caminho)) {
            if (!mkdir($caminho, 0755, true)) {
                throw new \RuntimeException("Não foi possível criar diretório: {$caminho}");
            }
        }
    }
}
