<?php

class Backup
{
    private $db;
    private $backupDir;

    public function __construct($database)
    {
        error_log('Chegando na entrada do backup');
        $this->db = $database;
        $this->backupDir = __DIR__.'../backups';

        error_log('🔧 Backup - Diretório configurado: '.$this->backupDir);

        // Criar diretório de backups se não existir
        if (!file_exists($this->backupDir)) {
            if (mkdir($this->backupDir, 0755, true)) {
                error_log('📁 Diretório de backup criado: '.$this->backupDir);
            } else {
                error_log('❌ Falha ao criar diretório: '.$this->backupDir);
            }
        } else {
            error_log('📁 Diretório já existe: '.$this->backupDir);
        }

        // Verificar permissões de escrita
        if (is_writable($this->backupDir)) {
            error_log('✅ Diretório tem permissão de escrita');
        } else {
            error_log('❌ Diretório SEM permissão de escrita!');
        }
    }

    /**
     * Gerar backup completo do banco de dados.
     */
    public function gerarBackup()
    {
        try {
            $pdo = $this->db->conectar();

            // Nome do arquivo com timestamp
            $timestamp = date('Y-m-d_H-i-s');
            $filename = "backup_{$timestamp}.sql";
            $filepath = $this->backupDir.$filename;

            error_log("🔄 Iniciando backup: {$filename}");

            // Abrir arquivo para escrita
            $handle = fopen($filepath, 'w+');
            if (!$handle) {
                throw new Exception('Não foi possível criar arquivo de backup');
            }

            // Cabeçalho do backup
            fwrite($handle, "-- =============================================\n");
            fwrite($handle, "-- BACKUP AUTOMÁTICO DO SISTEMA CRM\n");
            fwrite($handle, '-- Data: '.date('d/m/Y H:i:s')."\n");
            fwrite($handle, "-- Arquivo: {$filename}\n");
            fwrite($handle, "-- =============================================\n\n");

            fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n");
            fwrite($handle, "SET AUTOCOMMIT = 0;\n");
            fwrite($handle, "START TRANSACTION;\n\n");

            // Obter lista de tabelas
            $stmt = $pdo->query('SHOW TABLES');
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            error_log('📋 Encontradas '.count($tables).' tabelas para backup');

            foreach ($tables as $table) {
                error_log("📦 Fazendo backup da tabela: {$table}");

                // Estrutura da tabela
                fwrite($handle, "-- =============================================\n");
                fwrite($handle, "-- Estrutura da tabela: {$table}\n");
                fwrite($handle, "-- =============================================\n\n");

                fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n\n");

                $stmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
                $createTable = $stmt->fetch(PDO::FETCH_ASSOC);
                fwrite($handle, $createTable['Create Table'].";\n\n");

                // Dados da tabela
                fwrite($handle, "-- =============================================\n");
                fwrite($handle, "-- Dados da tabela: {$table}\n");
                fwrite($handle, "-- =============================================\n\n");

                $stmt = $pdo->query("SELECT * FROM `{$table}`");
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($rows)) {
                    $columns = array_keys($rows[0]);
                    $columnsList = '`'.implode('`, `', $columns).'`';

                    // Inserir dados em lotes
                    $batchSize = 100;
                    $totalRows = count($rows);

                    for ($i = 0; $i < $totalRows; $i += $batchSize) {
                        $batch = array_slice($rows, $i, $batchSize);

                        if (!empty($batch)) {
                            fwrite($handle, "INSERT INTO `{$table}` ({$columnsList}) VALUES\n");

                            $values = [];
                            foreach ($batch as $row) {
                                $escapedValues = [];
                                foreach ($row as $value) {
                                    if ($value === null) {
                                        $escapedValues[] = 'NULL';
                                    } else {
                                        $escapedValues[] = "'".addslashes($value)."'";
                                    }
                                }
                                $values[] = '('.implode(', ', $escapedValues).')';
                            }

                            fwrite($handle, implode(",\n", $values).";\n\n");
                        }
                    }
                } else {
                    fwrite($handle, "-- Tabela vazia\n\n");
                }
            }

            // Finalizar backup
            fwrite($handle, "COMMIT;\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
            fwrite($handle, "SET AUTOCOMMIT = 1;\n\n");
            fwrite($handle, '-- Backup finalizado em: '.date('d/m/Y H:i:s')."\n");

            fclose($handle);

            // Verificar tamanho do arquivo
            $filesize = filesize($filepath);
            $filesizeFormatted = $this->formatBytes($filesize);

            error_log("✅ Backup concluído: {$filename} ({$filesizeFormatted})");

            // Salvar registro do backup
            $this->salvarRegistroBackup($filename, $filesize);

            return [
                'success' => true,
                'message' => 'Backup gerado com sucesso!',
                'data' => [
                    'filename' => $filename,
                    'size' => $filesizeFormatted,
                    'path' => $filepath,
                    'tables' => count($tables),
                ],
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar backup: '.$e->getMessage());

            // Remover arquivo parcial se existir
            if (isset($filepath) && file_exists($filepath)) {
                unlink($filepath);
            }

            return [
                'success' => false,
                'message' => 'Erro ao gerar backup: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Listar backups disponíveis.
     */
    public function listarBackups()
    {
        try {
            error_log('🔍 Listando backups no diretório: '.$this->backupDir);

            $backups = [];
            $pattern = $this->backupDir.'backup_*.sql';
            $files = glob($pattern);

            error_log('🔍 Pattern de busca: '.$pattern);
            error_log('📂 Arquivos encontrados: '.count($files));

            if (!empty($files)) {
                error_log('📋 Lista de arquivos: '.implode(', ', $files));
            }

            foreach ($files as $file) {
                $filename = basename($file);
                $filesize = filesize($file);
                $filemtime = filemtime($file);

                error_log("📄 Processando arquivo: {$filename} - Tamanho: {$filesize} bytes");

                $backups[] = [
                    'nome' => $filename,
                    'arquivo' => $filename,
                    'data' => date('Y-m-d H:i:s', $filemtime),
                    'tamanho' => $this->formatBytes($filesize),
                    'size_bytes' => $filesize,
                ];
            }

            // Ordenar por data (mais recente primeiro)
            usort($backups, function ($a, $b) {
                return strtotime($b['data']) - strtotime($a['data']);
            });

            $ultimoBackup = !empty($backups) ? $backups[0]['data'] : null;

            error_log('✅ Total de backups encontrados: '.count($backups));

            return [
                'success' => true,
                'data' => $backups,
                'ultimo_backup' => $ultimoBackup,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar backups: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao listar backups: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Download de backup.
     */
    public function downloadBackup($filename)
    {
        try {
            // Validar nome do arquivo
            if (!preg_match('/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/', $filename)) {
                throw new Exception('Nome de arquivo inválido');
            }

            $filepath = $this->backupDir.$filename;

            if (!file_exists($filepath)) {
                throw new Exception('Arquivo de backup não encontrado');
            }

            // Headers para download
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="'.$filename.'"');
            header('Content-Length: '.filesize($filepath));
            header('Cache-Control: must-revalidate');
            header('Pragma: public');

            // Enviar arquivo
            readfile($filepath);
            exit;
        } catch (Exception $e) {
            error_log('❌ Erro no download do backup: '.$e->getMessage());
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Erro no download: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Restaurar backup.
     */
    public function restaurarBackup($filename)
    {
        try {
            // Validar nome do arquivo
            if (!preg_match('/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/', $filename)) {
                throw new Exception('Nome de arquivo inválido');
            }

            $filepath = $this->backupDir.$filename;

            if (!file_exists($filepath)) {
                throw new Exception('Arquivo de backup não encontrado');
            }

            error_log("🔄 Iniciando restore do backup: {$filename}");

            $pdo = $this->db->conectar();

            // Ler arquivo SQL
            $sql = file_get_contents($filepath);
            if ($sql === false) {
                throw new Exception('Não foi possível ler o arquivo de backup');
            }

            // Dividir em comandos individuais
            $commands = explode(';', $sql);

            // Executar comandos
            $pdo->beginTransaction();

            try {
                foreach ($commands as $command) {
                    $command = trim($command);

                    // Pular comandos vazios e comentários
                    if (empty($command) || strpos($command, '--') === 0) {
                        continue;
                    }

                    $pdo->exec($command);
                }

                $pdo->commit();

                error_log("✅ Restore concluído com sucesso: {$filename}");

                return [
                    'success' => true,
                    'message' => 'Backup restaurado com sucesso!',
                ];
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao restaurar backup: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao restaurar backup: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Deletar backup.
     */
    public function deletarBackup($filename)
    {
        try {
            // Validar nome do arquivo
            if (!preg_match('/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/', $filename)) {
                throw new Exception('Nome de arquivo inválido');
            }

            $filepath = $this->backupDir.$filename;

            if (!file_exists($filepath)) {
                throw new Exception('Arquivo de backup não encontrado');
            }

            if (unlink($filepath)) {
                error_log("🗑️ Backup deletado: {$filename}");

                return [
                    'success' => true,
                    'message' => 'Backup deletado com sucesso!',
                ];
            } else {
                throw new Exception('Não foi possível deletar o arquivo');
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao deletar backup: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao deletar backup: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Formatar bytes em formato legível.
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; ++$i) {
            $bytes /= 1024;
        }

        return round($bytes, $precision).' '.$units[$i];
    }

    /**
     * Salvar registro do backup (opcional).
     */
    private function salvarRegistroBackup($filename, $filesize)
    {
        try {
            $pdo = $this->db->conectar();

            // Criar tabela de logs de backup se não existir
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS backup_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    filesize BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ');

            $stmt = $pdo->prepare('
                INSERT INTO backup_logs (filename, filesize) 
                VALUES (?, ?)
            ');

            $stmt->execute([$filename, $filesize]);
        } catch (Exception $e) {
            // Não falhar se não conseguir salvar o log
            error_log('⚠️ Erro ao salvar log do backup: '.$e->getMessage());
        }
    }

    /**
     * Limpeza automática de backups antigos.
     */
    public function limparBackupsAntigos($diasParaManter = 30)
    {
        try {
            $files = glob($this->backupDir.'backup_*.sql');
            $agora = time();
            $segundosParaManter = $diasParaManter * 24 * 60 * 60;
            $deletados = 0;

            foreach ($files as $file) {
                $filemtime = filemtime($file);

                if (($agora - $filemtime) > $segundosParaManter) {
                    if (unlink($file)) {
                        ++$deletados;
                        error_log('🗑️ Backup antigo deletado: '.basename($file));
                    }
                }
            }

            return [
                'success' => true,
                'message' => "Limpeza concluída. {$deletados} backup(s) antigo(s) removido(s).",
                'deletados' => $deletados,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro na limpeza de backups: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro na limpeza de backups',
            ];
        }
    }
}