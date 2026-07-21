<?php

/**
 * ComandaBuilder - Monta o layout da comanda para impressão térmica.
 *
 * Formata os dados do pedido no layout padrão de comanda:
 * - Cabeçalho da empresa
 * - Tipo (Delivery / Drive-Thru / Local / Mesa)
 * - Dados do cliente
 * - Itens com adicionais e observações
 * - Totais (subtotal + entrega = total)
 * - Forma de pagamento
 * - Rodapé
 *
 * @author Gelatto Mannia PDV
 *
 * @version 1.0.0
 */

require_once __DIR__ . '/BematechPrinter.php';

class ComandaBuilder
{
    private BematechPrinter $printer;
    private array $config;

    /**
     * @param string $device Caminho do dispositivo USB
     * @param array  $config Configurações da empresa
     */
    public function __construct(string $device = '/dev/usb/lp0', array $config = [])
    {
        $colunas = $config['colunas'] ?? 42;  // ← padrão 42, configurável
        $this->printer = new BematechPrinter($device, $colunas);
        $this->config = array_merge([
            'nome_empresa' => 'SORVETES GELATTO MANNIA',
            'endereco' => 'Corumbaí do Sul - PR',
            'telefone' => '',
            'cnpj' => '',
        ], $config);
    }

    /**
     * Gera e imprime a comanda completa.
     *
     * @param array $pedido Dados do pedido no formato:
     *                      [
     *                      'numero'        => 123,              // Número da comanda
     *                      'mesa'          => 5,                // Número da mesa (null se não for mesa)
     *                      'tipo'          => 'delivery',       // delivery | drive_thru | local | mesa
     *                      'cliente'       => 'João Silva',     // Nome do cliente
     *                      'telefone'      => '(44) 99999-0000',
     *                      'endereco'      => 'Rua....',        // Endereço de entrega (delivery)
     *                      'itens'         => [
     *                      [
     *                      'qtd'         => 2,
     *                      'descricao'   => 'Sorvete 500ml',
     *                      'valor_unit'  => 15.00,
     *                      'adicionais'  => [
     *                      ['descricao' => 'Calda de chocolate', 'valor' => 3.00],
     *                      ['descricao' => 'Granulado', 'valor' => 2.00],
     *                      ],
     *                      'observacao'  => 'Sem cobertura de morango',
     *                      ],
     *                      ],
     *                      'valor_entrega' => 5.00,            // Taxa de entrega (0 se não for delivery)
     *                      'desconto'      => 0.00,            // Desconto aplicado
     *                      'pagamento'     => 'PIX',           // Forma de pagamento
     *                      'troco_para'    => null,            // Troco (se dinheiro)
     *                      'observacao'    => '',              // Observação geral do pedido
     *                      ]
     *
     * @return array{success: bool, message: string}
     */
    public function imprimir(array $pedido): array
    {
        // Tipo de impressão: 'producao' (cozinha, sem valores) ou 'conta' (cliente, com valores)
        $tipoImpressao = $pedido['tipo_impressao'] ?? 'producao';

        $this->printer->initialize();

        $this->imprimirCabecalho($pedido);
        $this->imprimirTipoPedido($pedido);
        $this->imprimirCliente($pedido);
        $this->imprimirItens($pedido['itens'] ?? [], $tipoImpressao);

        // Só imprime totais/pagamento se for a conta do cliente
        if ($tipoImpressao === 'conta') {
            $this->imprimirTotais($pedido);
            $this->imprimirPagamento($pedido);
        }

        $this->imprimirObservacaoGeral($pedido);
        $this->imprimirRodape($pedido);

        $this->printer->cut(true);

        return $this->printer->print();
    }

    /**
     * Retorna preview em texto (sem imprimir).
     */
    public function preview(array $pedido): string
    {
        $this->printer->initialize();

        $this->imprimirCabecalho($pedido);
        $this->imprimirTipoPedido($pedido);
        $this->imprimirCliente($pedido);
        $this->imprimirItens($pedido['itens'] ?? []);
        $this->imprimirTotais($pedido);
        $this->imprimirPagamento($pedido);
        $this->imprimirObservacaoGeral($pedido);
        $this->imprimirRodape($pedido);

        return $this->printer->getPreviewText();
    }

    // ── Seções da Comanda ─────────────────────────────────────────

    private function imprimirCabecalho(array $pedido): void
    {
        $this->printer->alignCenter();

        // Nome da empresa em destaque (apenas negrito, sem esticar a fonte)
        $this->printer->bold(true);
        $this->printer->line($this->config['nome_empresa']);
        $this->resetFormat();

        // Dados da empresa
        if (!empty($this->config['endereco'])) {
            $this->printer->line($this->config['endereco']);
        }
        if (!empty($this->config['telefone'])) {
            $this->printer->line('Fone: ' . $this->config['telefone']);
        }
        // if (!empty($this->config['cnpj'])) {
        //    $this->printer->line('CNPJ: '.$this->config['cnpj']);
        // }

        $this->printer->doubleSeparator();

        // Número da comanda (negrito, tamanho normal - só o essencial em destaque)
        $this->printer->bold(true);
        $numero = $pedido['numero'] ?? '---';
        $this->printer->line("COMANDA {$numero}");
        $this->resetFormat();

        // Data e hora
        $this->printer->line(date('d/m/Y H:i:s'));

        $this->printer->alignLeft();
    }

    private function imprimirTipoPedido(array $pedido): void
    {
        // Aceita 'tipo' OU 'tipo_pedido' (compatibilidade com frontend)
        $tipo = strtolower($pedido['tipo_pedido'] ?? $pedido['tipo'] ?? 'ENTREGA');

        $labels = [
            // 'delivery' => 'DELIVERY',
            'Retirada' => 'RETIRADA',
            'Entrega Gratis' => 'ENTREGA',
            'Centro' => 'ENTREGA',
            'Bairro Próximo' => 'ENTREGA',
            'Bairro Distante' => 'ENTREGA',
            'Zona Rural' => 'ENTREGA',
            // 'mesa' => 'MESA',
        ];

        $label = $labels[$tipo] ?? strtoupper($tipo);

        if ($tipo === 'mesa' && !empty($pedido['mesa'])) {
            $label .= ' ' . $pedido['mesa'];
        }

        $this->printer->feed(1);
        $this->printer->alignCenter();

        if (strtolower($tipo) === 'local' || strtolower($tipo) === 'mesa') {
            $this->printer->bold(true);
            $this->printer->line('*** CONSUMO LOCAL ***');
            $this->printer->bold(false);
        } elseif (strtolower($tipo) === 'drive_thru') {
            $this->printer->bold(true);
            $this->printer->line('*** RETIRADA ***');
            $this->printer->bold(false);
        } else {
            $endereco = $pedido['endereco_entrega'] ?? $pedido['endereco'] ?? '---';
            $this->printer->line('Tipo Pedido: ' . ($label ?: 'ENTREGA'));
            $this->printer->line('Endereço: ' . $endereco);
        }

        $this->printer->alignLeft();
    }

    private function imprimirCliente(array $pedido): void
    {
        $this->printer->separator();

        if (!empty($pedido['cliente'])) {
            // Nome do cliente em destaque (apenas negrito, sem esticar a fonte)
            $this->printer->alignCenter();
            $this->printer->bold(true);
            $this->printer->line('Cliente: ' . $pedido['cliente']);
            $this->resetFormat();
            $this->printer->alignLeft();
        }

        if (!empty($pedido['telefone'])) {
            $this->printer->line('Fone: ' . $pedido['telefone']);
        }

        if (
            strtolower($pedido['tipo_pedido'] ?? $pedido['tipo'] ?? '') === 'delivery'
            && !empty($pedido['endereco_entrega'] ?? $pedido['endereco'] ?? '')
        ) {
            $endereco = $pedido['endereco_entrega'] ?? $pedido['endereco'];
            $this->printer->line('Entrega: ' . $endereco);
        }

        $this->printer->separator();
    }

    private function imprimirItens(array $itens, string $tipoImpressao = 'producao'): void
    {
        $this->printer->feed(1);
        $this->printer->bold(true);

        if ($tipoImpressao === 'conta') {
            $this->printer->threeColumns('QTD', 'DESCRICAO', 'VALOR');
        } else {
            $this->printer->line('QTD  DESCRICAO');
        }

        $this->printer->bold(false);
        $this->printer->separator();

        $total = count($itens);

        foreach ($itens as $index => $item) {
            $qtd = $item['qtd'] ?? $item['quantidade'] ?? 1;
            $descricao = $item['descricao'] ?? $item['nome'] ?? 'Item';
            // Aceita ambos os nomes (valor_unit do PHP docs OU preco do frontend)
            $valorUnit = floatval($item['valor_unit'] ?? $item['preco'] ?? 0);
            $subtotal = $qtd * $valorUnit;

            // Item principal em negrito + altura dupla: única linha em destaque do
            // bloco, para contrastar com os adicionais (sem negrito e recuados) logo
            // abaixo. Tamanho antes do negrito (ver resetFormat()).
            $this->printer->doubleHeight();
            $this->printer->bold(true);

            if ($tipoImpressao === 'conta') {
                $this->printer->threeColumns(
                    $qtd . ' x ',
                    $descricao,
                    $this->formatarValor($subtotal)
                );
            } else {
                $this->printer->line($qtd . ' x  ' . $descricao);
            }

            $this->resetFormat();

            // Adicionais (recuados, sem negrito, para não competir com o item)
            if (!empty($item['adicionais'])) {
                foreach ($item['adicionais'] as $adicional) {
                    $descAdd = $adicional['descricao'] ?? $adicional['nome'] ?? '';
                    $valorAdd = floatval($adicional['valor'] ?? $adicional['preco'] ?? 0);

                    if (empty($descAdd)) {
                        continue;
                    }

                    if ($tipoImpressao === 'conta') {
                        $this->printer->threeColumns(
                            '',
                            '   - ' . $descAdd,
                            $valorAdd > 0 ? $this->formatarValor($valorAdd * $qtd) : ''
                        );
                    } else {
                        $this->printer->line('      - ' . $descAdd);
                    }
                }
            }

            $obs = $item['observacao'] ?? $item['observacoes'] ?? '';
            if (!empty($obs)) {
                $this->printer->tightSpacing();
                $this->printer->line('      OBS: ' . $obs);
                $this->printer->defaultSpacing();
            }

            // Espaço entre itens para não confundir onde um termina e o outro começa
            if ($index < $total - 1) {
                $this->printer->feed(1);
            }
        }

        $this->printer->separator();
    }

    private function imprimirTotais(array $pedido): void
    {
        $itens = $pedido['itens'] ?? [];
        $subtotal = 0;

        foreach ($itens as $item) {
            $qtd = $item['qtd'] ?? $item['quantidade'] ?? 1;
            $valorUnit = floatval($item['valor_unit'] ?? $item['preco'] ?? 0);
            $subtotal += $qtd * $valorUnit;

            if (!empty($item['adicionais'])) {
                foreach ($item['adicionais'] as $adicional) {
                    $valorAdd = floatval($adicional['valor'] ?? $adicional['preco'] ?? 0);
                    $subtotal += $valorAdd * $qtd;
                }
            }
        }

        $valorEntrega = floatval($pedido['taxa_entrega'] ?? $pedido['valor_entrega'] ?? 0);
        $desconto = floatval($pedido['desconto'] ?? 0);
        $total = $subtotal + $valorEntrega - $desconto;

        $this->printer->twoColumns('SUBTOTAL:', $this->formatarValor($subtotal));

        if ($valorEntrega > 0) {
            $this->printer->twoColumns('ENTREGA:', $this->formatarValor($valorEntrega));
        }

        if ($desconto > 0) {
            $this->printer->twoColumns('DESCONTO:', '-' . $this->formatarValor($desconto));
        }

        $this->printer->doubleSeparator();
        // Ordem importa: tamanho primeiro, negrito por último, para o negrito não ser
        // sobrescrito pelo comando de tamanho na impressora.
        $this->printer->doubleHeight();
        $this->printer->bold(true);
        $this->printer->twoColumns('TOTAL:', $this->formatarValor($total));
        $this->resetFormat();
        $this->printer->doubleSeparator();
    }

    private function imprimirPagamento(array $pedido): void
    {
        $pagamento = $pedido['pagamento'] ?? '';
        if (empty($pagamento)) {
            return;
        }

        $this->printer->feed(1);
        $this->printer->bold();
        $this->printer->twoColumns('PAGAMENTO:', strtoupper($pagamento));
        $this->printer->bold(false);

        // Troco (se for dinheiro)
        if (
            strtolower($pagamento) === 'dinheiro'
            && !empty($pedido['troco_para'])
        ) {
            $trocoPara = floatval($pedido['troco_para']);
            $total = $this->calcularTotal($pedido);
            $troco = $trocoPara - $total;

            $this->printer->twoColumns('Valor recebido:', $this->formatarValor($trocoPara));
            if ($troco > 0) {
                $this->printer->bold();
                $this->printer->twoColumns('TROCO:', $this->formatarValor($troco));
                $this->printer->bold(false);
            }
        }
    }

    private function imprimirObservacaoGeral(array $pedido): void
    {
        if (empty($pedido['observacao'])) {
            return;
        }

        $this->printer->feed(1);
        $this->printer->separator();
        $this->printer->bold();
        $this->printer->line('OBSERVACOES:');
        $this->printer->bold(false);
        $this->printer->line($pedido['observacao']);
        $this->printer->separator();
    }

    private function imprimirRodape(array $pedido): void
    {
        $this->printer->feed(1);
        $this->printer->alignCenter();
        $this->printer->line('Obrigado pela preferencia!');
        $this->printer->line($this->config['nome_empresa']);
        $this->printer->feed(1);
        $this->printer->alignLeft();
        $this->printer->CUT(true);  // Avança 2 linhas para cortar a comanda sem rasgar o texto
    }

    // ── Helpers ───────────────────────────────────────────────────

    /**
     * Reseta negrito e tamanho de fonte, sempre na mesma ordem,
     * evitando que um formato "vaze" para o texto seguinte.
     */
    private function resetFormat(): void
    {
        $this->printer->bold(false);
        $this->printer->normal();
    }

    private function formatarValor(float $valor): string
    {
        return 'R$ ' . number_format($valor, 2, ',', '.');
    }

    private function calcularTotal(array $pedido): float
    {
        $subtotal = 0;
        foreach ($pedido['itens'] ?? [] as $item) {
            $qtd = $item['qtd'] ?? 1;
            $valorUnit = $item['valor_unit'] ?? 0;
            $subtotal += $qtd * $valorUnit;

            if (!empty($item['adicionais'])) {
                foreach ($item['adicionais'] as $adicional) {
                    $subtotal += ($adicional['valor'] ?? 0) * $qtd;
                }
            }
        }

        return $subtotal
            + floatval($pedido['valor_entrega'] ?? 0)
            - floatval($pedido['desconto'] ?? 0);
    }
}
