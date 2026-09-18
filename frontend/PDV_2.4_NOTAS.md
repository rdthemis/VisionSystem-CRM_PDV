# Vision System — PDV 2.4

## Objetivo

Consolidar a arquitetura visual criada nas versões anteriores sem alterar regras de negócio.

## Mudanças

- Novo arquivo `src/styles/vision/vision-patterns.css` com padrões de composição reutilizáveis.
- `Pedidos.jsx` passa a importar tokens, primitivas e padrões nessa ordem.
- Aliases locais do PDV foram centralizados no início de `PdvV2.css`, removendo duplicação interna.
- Modais receberam shell consistente em três regiões: cabeçalho, corpo flexível e rodapé estável.
- Estados de foco e seleção foram padronizados em produtos, categorias, adicionais e formas de pagamento.
- Valores monetários usam numerais tabulares para facilitar comparação visual.
- Cards de comandas passaram a manter ações alinhadas mesmo com conteúdos de tamanhos diferentes.
- Ajustes adicionais para telas de baixa altura.

## Segurança da mudança

Não foram alterados hooks, services, cálculos, pagamentos, impressão, transferência, autosave ou manipulação do carrinho.

## Ordem arquitetural

1. `vision-tokens.css`: decisões fundamentais.
2. `vision-primitives.css`: componentes atômicos.
3. `vision-patterns.css`: composições reutilizáveis.
4. `Pedidos.css`: compatibilidade legada.
5. `PdvV2.css`: adaptação específica do PDV.

Essa ordem deve ser preservada em futuras evoluções.
