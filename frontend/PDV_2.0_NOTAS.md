# Vision System — PDV 2.0

## Alterações realizadas

- Criada camada visual isolada em `src/components/pedidos/PdvV2.css`.
- Importada após `Pedidos.css`, permitindo desativar o novo tema removendo apenas um import.
- Modernizado o layout de produtos e carrinho sem alterar handlers, services, hooks ou cálculos.
- Categorias convertidas visualmente em chips horizontais.
- Busca, inputs, botões, cards, totais, comandas e modais receberam novo acabamento.
- Adicionada responsividade para desktop, notebook, tablet e celular.
- Adicionados estados de foco e suporte a `prefers-reduced-motion`.
- Adicionado cabeçalho visual do catálogo com contador de produtos filtrados.

## Arquivos modificados

- `src/components/pedidos/Pedidos.jsx`
- `src/components/pedidos/components/GridProdutos.jsx`

## Arquivo criado

- `src/components/pedidos/PdvV2.css`

## Como voltar temporariamente ao visual anterior

Remova ou comente esta linha em `Pedidos.jsx`:

```js
import './PdvV2.css';
```

## Validação recomendada

Execute no seu ambiente local:

```bash
npm install
npm run build
npm start
```

Teste principalmente:

1. Nova comanda e seleção de cliente.
2. Filtros por categoria, nome e código.
3. Inclusão e edição de produtos com adicionais.
4. Produtos por peso.
5. Entrega e taxa de entrega.
6. Pagamento parcial e pagamento integral.
7. Impressão, conta e transferência de itens.
8. Lista de comandas em notebook e Full HD.

## Observação sobre o build neste ambiente

O `npm install` não pôde terminar porque o registry interno disponível não possui `@fortawesome/fontawesome-free@^7.1.0`. Nenhuma dependência foi alterada.

## Atualização 2.1 — Modais compactos

- Modal de produto reorganizado em grade para manter produto, quantidade, adicionais, observações e resumo visíveis em desktop.
- Cards de adicionais reduzidos e convertidos para um formato mais denso.
- Resumo detalhado dos adicionais ocultado dentro do modal para evitar duplicidade visual; os valores continuam refletidos no total.
- Modal de pagamento reorganizado em três áreas horizontais.
- Modais de cliente, entrega, transferência e conta passaram a aproveitar melhor a largura disponível.
- Em telas menores ou com menos de 700px de altura, a rolagem é reativada como fallback de segurança.
