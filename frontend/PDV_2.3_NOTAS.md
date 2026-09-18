# Vision System — PDV 2.3

## Entrega

Esta versão transforma a evolução visual do PDV em uma arquitetura reutilizável.

### Novos arquivos

- `src/styles/vision/vision-tokens.css`
- `src/styles/vision/vision-primitives.css`
- `docs/VISION_UI_ARCHITECTURE.md`

### Alterações

- `Pedidos.jsx` importa a fundação do Vision UI antes das camadas do módulo.
- `PdvV2.css` passa a consumir tokens compartilhados por aliases compatíveis.
- Refinada a hierarquia entre catálogo, carrinho e ação de pagamento.
- Estados vazios, controles destrutivos, touch e telas 1366×768 receberam regras explícitas.

## Segurança

Nenhum service, hook, cálculo, impressão ou fluxo de pagamento foi alterado.

## Estratégia de migração

O CSS legado continua carregado. A remoção dele deve ser gradual, apenas depois de comparar todos os estados da tela e dos modais.
