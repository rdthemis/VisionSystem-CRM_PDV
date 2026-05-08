<?php
/**
 * BematechPrinter - Classe para impressão ESC/POS em impressoras Bematech via USB.
 *
 * Compatível com: MP-4200 TH, MP-100S TH, MP-2800 TH, MP-2500 TH e similares
 * Conexão: USB
 *   - Linux:   /dev/usb/lp0
 *   - Windows: Nome de compartilhamento (ex: \\localhost\BematechMP2500)
 *
 * @author Gelatto Mannia PDV
 *
 * @version 2.0.0 - Suporte multiplataforma (Windows + Linux)
 */
class BematechPrinter
{
    private string $device;
    private string $buffer = '';
    private int $columns;
    private bool $isWindows;

    // ── Comandos ESC/POS ──────────────────────────────────────────
    // Inicialização
    public const INIT = '\x1B\x40';
    // Controle básico
    public const ESC = "\x1B";
    public const GS = "\x1D";
    public const LF = "\x0A";
    public const CR = '\x0D';

    // CORTE DE PAPEL
    public const CUT = "\x1D\x56\x00";      // Corte total
    public const CUT_PARTIAL = "\x1D\x56\x01";      // Corte parcial
    public const CUT_FEED_CUT = '\x1D\x56\x42\x00';
    public const CUT_ALTERNATIVE_1 = '\x1D\x56\x30';
    public const CUT_ALTERNATIVE_2 = '\x1D\x56A\x00';
    public const CUT_ALTERNATIVE_3 = '\x1B\x69';
    public const CUT_ALTERNATIVE_4 = '\x1B\x6D';

    public const BEEP = "\x1B\x28\x41\x04\x00\x01\x64\x03\x0A"; // Bip sonoro

    // Alinhamento
    public const ALIGN_LEFT = "\x1B\x61\x00";
    public const ALIGN_CENTER = "\x1B\x61\x01";
    public const ALIGN_RIGHT = "\x1B\x61\x02";

    // Formatação de texto
    public const BOLD_ON = "\x1B\x45\x01";
    public const BOLD_OFF = "\x1B\x45\x00";
    public const DOUBLE_H_ON = "\x1B\x21\x10";      // Altura dupla
    public const DOUBLE_W_ON = "\x1B\x21\x20";      // Largura dupla
    public const DOUBLE_HW_ON = "\x1B\x21\x30";      // Altura e largura dupla
    public const NORMAL = "\x1B\x21\x00";       // Texto normal
    public const CONDENSADO = "\x1B\x21\x01";       // Texto condensado
    public const UNDERLINE_ON = "\x1B\x2D\x01";
    public const UNDERLINE_OFF = "\x1B\x2D\x00";
    public const INVERT_ON = "\x1D\x42\x01";       // Texto invertido (branco no preto)
    public const INVERT_OFF = "\x1D\x42\x00";

    // Espaçamento entre linhas
    public const LINE_SPACING_DEFAULT = "\x1B\x32";
    public const LINE_SPACING_TIGHT = "\x1B\x33\x10";

    // TAMANHOS DE FONTE
    public const FONT_SMALL = '\x1B\x21\x01';
    public const FONT_NORMAL = '\x1B\x21\x00';
    public const FONT_LARGE = '\x1B\x21\x08';
    public const DOUBLE_HEIGHT = '\x1B\x21\x10';
    public const DOUBLE_WIDTH = '\x1B\x21\x20';
    public const DOUBLE_SIZE = '\x1B\x21\x30';

    // DENSIDADE/INTENSIDADE DA IMPRESSÃO
    public const DENSITY_LIGHT = '\x1D\x7C\x00';
    public const DENSITY_NORMAL = '\x1D\x7C\x01';
    public const DENSITY_DARK = '\x1D\x7C\x02';

    // ALIMENTAÇÃO DE PAPEL
    public const FEED_LINE = '\x1B\x64\x02';
    public const FEED_LINES_3 = '\x1B\x64\x03';
    public const FEED_LINES_5 = '\x1B\x64\x05';

    // Abertura da gaveta
    public const OPEN_DRAWER = '\x1B\x70\x00\x19\xFA';

    /**
     * @param string $device  Caminho do dispositivo USB ou nome de compartilhamento Windows
     * @param int    $columns Número de colunas (48 para 80mm, 32 para 58mm)
     */
    public function __construct(string $device = '', int $columns = 41)
    {
        $this->isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

        // Se nenhum device informado, usa o padrão do SO
        if (empty($device)) {
            $this->device = $this->isWindows
                ? 'MP-2500 TH'  // Nome de compartilhamento padrão
                : '/dev/usb/lp0';
        } else {
            $this->device = $device;
        }

        $this->columns = $columns;
    }

    // ── Métodos de Formatação ─────────────────────────────────────

    public function initialize(): self
    {
        $this->buffer .= self::ESC.'@'; // Reset da impressora

        return $this;
    }

    public function feed(int $lines = 1): self
    {
        $this->buffer .= str_repeat(self::LF, $lines);

        return $this;
    }

    public function DENSITY_LIGHT(): self
    {
        $this->buffer .= self::DENSITY_LIGHT;

        return $this;
    }

    public function DENSITY_NORMAL(): self
    {
        $this->buffer .= self::DENSITY_NORMAL;

        return $this;
    }

    public function DENSITY_DARK(): self
    {
        $this->buffer .= self::DENSITY_DARK;

        return $this;
    }

    public function CUT(bool $partial = false): self
    {
        $this->feed(3);
        $this->buffer .= $partial ? self::CUT_PARTIAL : self::CUT;

        return $this;
    }

    public function beep(): self
    {
        $this->buffer .= self::BEEP;

        return $this;
    }

    public function alignLeft(): self
    {
        $this->buffer .= self::ALIGN_LEFT;

        return $this;
    }

    public function alignCenter(): self
    {
        $this->buffer .= self::ALIGN_CENTER;

        return $this;
    }

    public function alignRight(): self
    {
        $this->buffer .= self::ALIGN_RIGHT;

        return $this;
    }

    public function bold(bool $on = true): self
    {
        $this->buffer .= $on ? self::BOLD_ON : self::BOLD_OFF;

        return $this;
    }

    public function doubleHeight(): self
    {
        $this->buffer .= self::DOUBLE_H_ON;

        return $this;
    }

    public function doubleWidth(): self
    {
        $this->buffer .= self::DOUBLE_W_ON;

        return $this;
    }

    public function doubleSize(): self
    {
        $this->buffer .= self::DOUBLE_HW_ON;

        return $this;
    }

    public function normal(): self
    {
        $this->buffer .= self::NORMAL;

        return $this;
    }

    public function underline(bool $on = true): self
    {
        $this->buffer .= $on ? self::UNDERLINE_ON : self::UNDERLINE_OFF;

        return $this;
    }

    public function invert(bool $on = true): self
    {
        $this->buffer .= $on ? self::INVERT_ON : self::INVERT_OFF;

        return $this;
    }

    public function tightSpacing(): self
    {
        $this->buffer .= self::LINE_SPACING_TIGHT;

        return $this;
    }

    public function defaultSpacing(): self
    {
        $this->buffer .= self::LINE_SPACING_DEFAULT;

        return $this;
    }

    // ── Métodos de Conteúdo ───────────────────────────────────────

    public function text(string $text): self
    {
        $this->buffer .= $this->encode($text);

        return $this;
    }

    public function line(string $text = ''): self
    {
        $this->buffer .= $this->encode($text).self::LF;

        return $this;
    }

    /**
     * Imprime texto à esquerda e à direita na mesma linha.
     */
    public function twoColumns(string $left, string $right, string $fill = ' '): self
    {
        $left = $this->sanitize($left);
        $right = $this->sanitize($right);

        $leftLen = mb_strlen($left);
        $rightLen = mb_strlen($right);
        $space = $this->columns - $leftLen - $rightLen;

        if ($space < 1) {
            // Se não cabe, quebra em duas linhas
            $this->line($left);
            // $this->alignRight();
            $this->line($right);
            $this->alignLeft();
        } else {
            $this->line($left.str_repeat($fill, $space).$right);
        }

        return $this;
    }

    /**
     * Imprime três colunas (qtd | descrição | valor).
     */
    public function threeColumns(string $col1, string $col2, string $col3): self
    {
        $col1 = $this->sanitize($col1);
        $col2 = $this->sanitize($col2);
        $col3 = $this->sanitize($col3);

        $col1Width = 5;
        $col3Width = 10;
        $col2Width = $this->columns - $col1Width - $col3Width;

        $col1Pad = str_pad($col1, $col1Width);
        $col2Pad = mb_strlen($col2) > $col2Width
            ? mb_substr($col2, 0, $col2Width)
            : str_pad($col2, $col2Width);
        $col3Pad = str_pad($col3, $col3Width, ' ', STR_PAD_LEFT);

        $this->line($col1Pad.$col2Pad.$col3Pad);

        return $this;
    }

    /**
     * Linha separadora.
     */
    public function separator(string $char = '-'): self
    {
        $this->line(str_repeat($char, $this->columns));

        return $this;
    }

    /**
     * Separador duplo.
     */
    public function doubleSeparator(): self
    {
        $this->separator('=');

        return $this;
    }

    /**
     * Texto dentro de uma "caixa" invertida (destaque).
     */
    public function highlight(string $text): self
    {
        $text = $this->sanitize($text);
        $padded = str_pad($text, $this->columns, ' ', STR_PAD_BOTH);
        $this->invert(true);
        $this->bold(true);
        $this->line($padded);
        $this->bold(false);
        $this->invert(false);

        return $this;
    }

    // ── Método de Impressão (MULTIPLATAFORMA) ─────────────────────

    /**
     * Envia o buffer para a impressora
     * Detecta automaticamente Windows ou Linux.
     *
     * @return array{success: bool, message: string}
     */
    public function print(): array
    {
        try {
            if ($this->isWindows) {
                return $this->printWindows();
            } else {
                return $this->printLinux();
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Impressão no Windows via compartilhamento de impressora.
     */
    private function printWindows(): array
    {
        // ── Método 1: Arquivo temporário + copy /b (mais confiável) ──
        $tempFile = tempnam(sys_get_temp_dir(), 'comanda_');

        if ($tempFile === false) {
            return [
                'success' => false,
                'message' => 'Erro ao criar arquivo temporário.',
            ];
        }

        // Escreve o buffer ESC/POS no arquivo temporário
        $written = file_put_contents($tempFile, $this->buffer);

        if ($written === false) {
            @unlink($tempFile);

            return [
                'success' => false,
                'message' => 'Erro ao gravar dados no arquivo temporário.',
            ];
        }

        // Monta o caminho de compartilhamento
        $sharePath = $this->getWindowsSharePath();

        // Envia para a impressora usando copy /b (modo binário)
        $command = 'copy /b "'.$tempFile.'" "'.$sharePath.'"';

        // Executa o comando
        $output = [];
        $returnCode = 0;
        exec($command.' 2>&1', $output, $returnCode);

        // Limpa o arquivo temporário
        @unlink($tempFile);

        if ($returnCode !== 0) {
            $errorMsg = implode(' ', $output);

            // Tenta método alternativo: escrita direta via fopen
            $result = $this->printWindowsDirect($sharePath);
            if ($result['success']) {
                return $result;
            }

            return [
                'success' => false,
                'message' => "Erro ao imprimir. Verifique se a impressora '{$this->device}' "
                    ."está compartilhada e acessível.\n"
                    ."Caminho usado: {$sharePath}\n"
                    ."Detalhe: {$errorMsg}\n\n"
                    ."DICA: Compartilhe a impressora em:\n"
                    .'Painel de Controle > Impressoras > Botão direito > Propriedades > Compartilhamento',
            ];
        }

        $this->buffer = '';

        return [
            'success' => true,
            'message' => 'Comanda impressa com sucesso!',
        ];
    }

    /**
     * Método alternativo Windows: escrita direta via fopen no compartilhamento.
     */
    private function printWindowsDirect(string $sharePath): array
    {
        $fp = @fopen($sharePath, 'wb');

        if ($fp === false) {
            return [
                'success' => false,
                'message' => "Não foi possível abrir a impressora em: {$sharePath}",
            ];
        }

        $written = @fwrite($fp, $this->buffer);
        @fclose($fp);

        if ($written === false) {
            return [
                'success' => false,
                'message' => 'Erro ao enviar dados para a impressora.',
            ];
        }

        $this->buffer = '';

        return [
            'success' => true,
            'message' => 'Comanda impressa com sucesso!',
        ];
    }

    /**
     * Monta o caminho de compartilhamento Windows
     * Aceita formatos:
     *   - "BematechMP2500"           → \\localhost\BematechMP2500
     *   - "\\localhost\Bematech"     → usa como está
     *   - "\\192.168.1.100\Bematech" → usa como está (impressora de rede)
     *   - "LPT1"                     → usa como está
     */
    private function getWindowsSharePath(): string
    {
        $device = $this->device;

        // Se já é um caminho UNC (\\...) ou porta direta (LPT1, COM1), usa direto
        if (
            str_starts_with($device, '\\\\')
            || preg_match('/^(LPT|COM)\d+$/i', $device)
        ) {
            return $device;
        }

        // Caso contrário, assume que é o nome de compartilhamento
        return '\\\\localhost\\'.$device;
    }

    /**
     * Impressão no Linux via dispositivo USB.
     */
    private function printLinux(): array
    {
        // Verifica se o dispositivo existe
        if (!file_exists($this->device)) {
            $altDevices = ['/dev/usb/lp0', '/dev/usb/lp1', '/dev/lp0'];
            $found = false;
            foreach ($altDevices as $alt) {
                if (file_exists($alt)) {
                    $this->device = $alt;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                return [
                    'success' => false,
                    'message' => "Impressora não encontrada em {$this->device}. Verifique a conexão USB.",
                ];
            }
        }

        // Verifica permissão de escrita
        if (!is_writable($this->device)) {
            return [
                'success' => false,
                'message' => "Sem permissão de escrita em {$this->device}. Execute: sudo chmod 666 {$this->device}",
            ];
        }

        // Envia dados para a impressora
        $fp = fopen($this->device, 'w');
        if ($fp === false) {
            return [
                'success' => false,
                'message' => "Não foi possível abrir {$this->device}.",
            ];
        }

        $written = fwrite($fp, $this->buffer);
        fclose($fp);

        if ($written === false) {
            return [
                'success' => false,
                'message' => 'Erro ao enviar dados para a impressora.',
            ];
        }

        $this->buffer = '';

        return [
            'success' => true,
            'message' => 'Comanda impressa com sucesso!',
        ];
    }

    /**
     * Retorna o buffer sem imprimir (útil para debug/preview).
     */
    public function getBuffer(): string
    {
        return $this->buffer;
    }

    /**
     * Retorna preview em texto plano (sem comandos ESC/POS).
     */
    public function getPreviewText(): string
    {
        $clean = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/', '', $this->buffer);
        $clean = preg_replace('/\x1B[^\x1B]*/', '', $clean);
        $clean = preg_replace('/\x1D[^\x1D]*/', '', $clean);

        return $clean;
    }

    /**
     * Limpa o buffer.
     */
    public function clear(): self
    {
        $this->buffer = '';

        return $this;
    }

    /**
     * Retorna informações sobre o ambiente de impressão (útil para debug).
     */
    public function getInfo(): array
    {
        return [
            'so' => $this->isWindows ? 'Windows' : 'Linux',
            'device' => $this->device,
            'sharePath' => $this->isWindows ? $this->getWindowsSharePath() : $this->device,
            'columns' => $this->columns,
            'php_os' => PHP_OS,
        ];
    }

    // ── Helpers Privados ──────────────────────────────────────────

    /**
     * Codifica texto para CP850 (charset padrão Bematech).
     */
    private function encode(string $text): string
    {
        return mb_convert_encoding($text, 'CP850', 'UTF-8');
    }

    /**
     * Remove acentos para compatibilidade (fallback).
     */
    private function sanitize(string $text): string
    {
        $encoded = @mb_convert_encoding($text, 'CP850', 'UTF-8');
        if ($encoded !== false) {
            return $text;
        }

        $map = [
            'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a', 'é' => 'e', 'ê' => 'e',
            'í' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ü' => 'u',
            'ç' => 'c', 'Á' => 'A', 'À' => 'A', 'Ã' => 'A', 'Â' => 'A', 'É' => 'E',
            'Ê' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ú' => 'U',
            'Ü' => 'U', 'Ç' => 'C',
        ];

        return strtr($text, $map);
    }
}
