<?php

class BackupSimples
{
    private $db;
    private $backupDir;

    public function __construct($database)
    {
        $this->db = $database;

        // Usar pasta public/backups para facilitar acesso
        $this->backupDir = __DIR__.'/../public/backups/';

        error_log('🔧 BackupSimples - Diretório: '.$this->backupDir);

        // Criar diretório se não existir
        if (!file_exists($this->backupDir)) {
            if (mkdir($this->backupDir, 0755, true)) {
                error_log('📁 Diretório criado: '.$this->backupDir);
            } else {
                error_log('❌ Falha ao criar diretório');
            }
        }

        // Verificar permissões
        if (is_writable($this->backupDir)) {
            error_log('✅ Diretório tem permissão de escrita');
        } else {
            error_log('❌ Diretório SEM permissão de escrita');
        }
    }

    /**
     * Gerar backup básico.
     */
    public function gerarBackup()
    {
        try {
            $pdo = $this->db->conectar();

            // Nome do arquivo
            $timestamp = date('Y-m-d_H-i-s');
            $filename = "backup_{$timestamp}.sql";
            $filepath = $this->backupDir.$filename;

            error_log("🔄 Iniciando backup: {$filename}");
            error_log("📁 Caminho completo: {$filepath}");

            // Criar arquivo
            $handle = fopen($filepath, 'w+');
            if (!$handle) {
                throw new Exception('Não foi possível criar arquivo: '.$filepath);
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

            // Obter TODAS as tabelas do banco automaticamente (só tabelas, não views)
            error_log('🔍 Descobrindo tabelas do banco de dados...');
            $stmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
            $todasTabelas = $stmt->fetchAll(PDO::FETCH_COLUMN);

            error_log('📋 Tabelas encontradas: '.implode(', ', $todasTabelas));

            foreach ($todasTabelas as $tabela) {
                error_log("📦 Fazendo backup da tabela: {$tabela}");

                fwrite($handle, "-- Tabela: {$tabela}\n");
                fwrite($handle, "DROP TABLE IF EXISTS `{$tabela}`;\n\n");

                // Estrutura da tabela
                try {
                    $stmt = $pdo->query("SHOW CREATE TABLE `{$tabela}`");
                    $createTable = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($createTable && isset($createTable['Create Table'])) {
                        fwrite($handle, $createTable['Create Table'].";\n\n");
                    } else {
                        error_log("⚠️ Estrutura da tabela {$tabela} não encontrada");
                        continue;
                    }
                } catch (Exception $e) {
                    error_log("⚠️ Erro ao obter estrutura da tabela {$tabela}: ".$e->getMessage());
                    continue;
                }

                // Dados da tabela
                try {
                    $stmt = $pdo->query("SELECT * FROM `{$tabela}`");
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    if (!empty($rows)) {
                        $columns = array_keys($rows[0]);
                        $columnsList = '`'.implode('`, `', $columns).'`';

                        fwrite($handle, "INSERT INTO `{$tabela}` ({$columnsList}) VALUES\n");

                        $values = [];
                        foreach ($rows as $row) {
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
                        error_log("✅ Tabela {$tabela}: ".count($rows).' registros salvos');
                    } else {
                        fwrite($handle, "-- Tabela {$tabela} vazia\n\n");
                        error_log("ℹ️ Tabela {$tabela} está vazia");
                    }
                } catch (Exception $e) {
                    error_log("⚠️ Erro ao obter dados da tabela {$tabela}: ".$e->getMessage());
                    fwrite($handle, "-- Erro ao fazer backup da tabela {$tabela}\n\n");
                }
            }

            // Finalizar backup
            fwrite($handle, "\nCOMMIT;\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
            fwrite($handle, "SET AUTOCOMMIT = 1;\n\n");
            fwrite($handle, "-- =============================================\n");
            fwrite($handle, '-- Backup finalizado em: '.date('d/m/Y H:i:s')."\n");
            fwrite($handle, "-- =============================================\n");

            fclose($handle);

            // Verificar se o arquivo foi criado
            if (file_exists($filepath)) {
                $filesize = filesize($filepath);
                $filesizeFormatted = $this->formatBytes($filesize);

                error_log('✅ Backup criado com sucesso!');
                error_log("📄 Arquivo: {$filename}");
                error_log("📊 Tamanho: {$filesizeFormatted}");

                return [
                    'success' => true,
                    'message' => 'Backup gerado com sucesso!',
                    'data' => [
                        'filename' => $filename,
                        'size' => $filesizeFormatted,
                        'path' => $filepath,
                        'tables' => count($todasTabelas),
                    ],
                ];
            } else {
                throw new Exception('Arquivo não foi criado');
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao gerar backup: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao gerar backup: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Listar backups.
     */
    public function listarBackups()
    {
        try {
            error_log('🔍 Listando backups em: '.$this->backupDir);

            $backups = [];
            $pattern = $this->backupDir.'backup_*.sql';
            $files = glob($pattern);

            error_log('🔍 Pattern: '.$pattern);
            error_log('📂 Arquivos encontrados: '.count($files));

            foreach ($files as $file) {
                $filename = basename($file);
                $filesize = filesize($file);
                $filemtime = filemtime($file);

                error_log("📄 Arquivo: {$filename} - {$filesize} bytes");

                $backups[] = [
                    'nome' => $filename,
                    'arquivo' => $filename,
                    'data' => date('Y-m-d H:i:s', $filemtime),
                    'tamanho' => $this->formatBytes($filesize),
                    'size_bytes' => $filesize,
                ];
            }

            // Ordenar por data
            usort($backups, function ($a, $b) {
                return strtotime($b['data']) - strtotime($a['data']);
            });

            $ultimoBackup = !empty($backups) ? $backups[0]['data'] : null;

            error_log('✅ Total encontrados: '.count($backups));

            return [
                'success' => true,
                'data' => $backups,
                'ultimo_backup' => $ultimoBackup,
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao listar: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao listar backups',
            ];
        }
    }

    /**
     * Formatar bytes.
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

            error_log('📄 Arquivo lido: '.strlen($sql).' caracteres');

            // Limpar e dividir comandos mais eficientemente
            $sql = str_replace(["\r\n", "\r"], "\n", $sql);
            $commands = preg_split('/;\s*\n/', $sql);

            // Filtrar comandos válidos
            $validCommands = [];
            foreach ($commands as $command) {
                $command = trim($command);
                if (!empty($command)
                    && !preg_match('/^--/', $command)
                    && !preg_match('/^\/\*/', $command)
                    && !preg_match('/^SET/', $command)) {
                    $validCommands[] = $command;
                }
            }

            $totalCommands = count($validCommands);
            error_log('📋 Comandos válidos para executar: '.$totalCommands);

            // Executar restore
            $pdo->beginTransaction();

            try {
                // Desabilitar verificações
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
                $pdo->exec('SET AUTOCOMMIT = 0');

                error_log('🗑️ Removendo tabelas existentes...');

                // Primeiro: obter todas as tabelas que serão restauradas
                $tabelasParaRestaurar = [];
                foreach ($validCommands as $command) {
                    if (preg_match('/CREATE TABLE `?(\w+)`?/i', $command, $matches)) {
                        $tabelasParaRestaurar[] = $matches[1];
                    }
                }

                error_log('📋 Tabelas para restaurar: '.implode(', ', $tabelasParaRestaurar));

                // Remover tabelas na ordem correta (reversa para evitar FK issues)
                foreach (array_reverse($tabelasParaRestaurar) as $tabela) {
                    try {
                        $pdo->exec("DROP TABLE IF EXISTS `{$tabela}`");
                        error_log("🗑️ Tabela removida: {$tabela}");
                    } catch (Exception $e) {
                        error_log("⚠️ Erro ao remover tabela {$tabela}: ".$e->getMessage());
                    }
                }

                error_log('✅ Tabelas removidas. Iniciando restauração...');

                // Executar comandos de restore
                $executedCommands = 0;
                foreach ($validCommands as $command) {
                    $command = trim($command);

                    if (empty($command)) {
                        continue;
                    }

                    try {
                        $pdo->exec($command.';');
                        ++$executedCommands;

                        // Log a cada 10 comandos
                        if ($executedCommands % 1 === 0) {
                            error_log("📊 Executados: {$executedCommands}/{$totalCommands} comandos");
                        }
                    } catch (Exception $e) {
                        error_log('⚠️ Erro no comando '.($executedCommands + 1).': '.substr($command, 0, 100).'...');
                        error_log('⚠️ Erro: '.$e->getMessage());

                        // Se for erro crítico (CREATE TABLE), pare o restore
                        if (strpos($command, 'CREATE TABLE') !== false) {
                            throw new Exception('Erro crítico ao criar tabela: '.$e->getMessage());
                        }
                    }
                }

                // Salva todas as alterações
                $pdo->commit();

                // Reabilitar verificações
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
                $pdo->exec('SET AUTOCOMMIT = 1');

                error_log('✅ Restore concluído com sucesso!');
                error_log("📊 Comandos executados: {$executedCommands}/{$totalCommands}");
                error_log('📋 Tabelas restauradas: '.implode(', ', $tabelasParaRestaurar));

                return [
                    'success' => true,
                    'message' => 'Backup restaurado com sucesso!',
                    'data' => [
                        'filename' => $filename,
                        'commands_executed' => $executedCommands,
                        'total_commands' => $totalCommands,
                        'tables_restored' => $tabelasParaRestaurar,
                    ],
                ];
            } catch (Exception $e) {
                // Desfaz todas as alterações
                $pdo->rollBack();

                // Reabilitar verificações
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
                $pdo->exec('SET AUTOCOMMIT = 1');
                error_log('❌ Erro durante restore, fazendo rollback: '.$e->getMessage());
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
            if (!preg_match('/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/', $filename)) {
                throw new Exception('Nome de arquivo inválido');
            }

            $filepath = $this->backupDir.$filename;

            if (!file_exists($filepath)) {
                throw new Exception('Arquivo não encontrado');
            }

            if (unlink($filepath)) {
                error_log("🗑️ Backup deletado: {$filename}");

                return [
                    'success' => true,
                    'message' => 'Backup deletado com sucesso!',
                ];
            } else {
                throw new Exception('Não foi possível deletar');
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao deletar: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao deletar backup',
            ];
        }
    }
}