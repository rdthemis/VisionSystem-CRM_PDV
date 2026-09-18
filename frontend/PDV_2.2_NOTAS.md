# Vision System — PDV 2.2

## Objetivo desta versão

Consolidar o PDV como núcleo do futuro Vision Design System, mantendo integralmente a lógica de negócio existente.

## Evoluções aplicadas

- hierarquia mais clara entre busca, catálogo, carrinho, total e pagamento;
- foco de teclado consistente e acessível;
- áreas de toque preparadas para dispositivos touch;
- estados vazios orientativos e menos agressivos;
- cards de produto com indicação visual de adição;
- carrinho mais compacto e legível;
- adicionais do carrinho convertidos em etiquetas compactas;
- cliente e entrega agrupados como contexto do pedido;
- total financeiro com leitura imediata;
- ações secundárias visualmente reduzidas;
- feedback de autosave e mensagens refinado;
- scrollbars padronizadas;
- densidade específica para notebooks 1366x768;
- respeito à configuração `prefers-reduced-motion` do sistema operacional.

## Segurança da alteração

A versão 2.2 altera apenas a camada visual `PdvV2.css`. Não foram modificados services, hooks, cálculos, persistência, pagamentos, impressão ou regras do carrinho.

## Próximos blocos sugeridos

1. validar visualmente nas resoluções reais do caixa;
2. consolidar componentes compartilhados do Vision UI;
3. padronizar lista de comandas e estados de status;
4. migrar os padrões aprovados para Caixa, Clientes e Dashboard;
5. avaliar melhorias funcionais somente após aprovação explícita.
