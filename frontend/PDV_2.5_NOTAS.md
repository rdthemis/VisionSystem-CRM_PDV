# Vision System — PDV 2.5

## Objetivo

Rodada exclusivamente visual, sem alterações em regras de negócio, serviços, hooks, cálculos, pagamentos ou impressão.

## Refinamentos aplicados

- profundidade e contraste mais discretos nas superfícies;
- catálogo com cabeçalho e chips mais compactos;
- busca tratada visualmente como uma única ferramenta;
- cards de produtos com ritmo uniforme e imagens melhor enquadradas;
- painel do pedido organizado em contexto, itens, resumo e ação principal;
- carrinho mais denso, com quantidade, adicionais e observações mais legíveis;
- total financeiro com alinhamento e peso visual mais claros;
- ações secundárias silenciosas e pagamento dominante;
- modais com espaçamento e cabeçalhos consistentes;
- cards de adicionais realmente compactos;
- refinamento específico para notebooks com pouca altura;
- ajustes para touch sem inflar a interface desktop.

## Arquitetura

A camada `PdvV25.css` é carregada depois de `PdvV2.css`. Ela contém somente acabamento visual e pode ser removida isoladamente para comparar a versão anterior.

## Validação recomendada

Testar principalmente em:

- 1366×768;
- 1920×1080;
- navegador com zoom em 100%;
- carrinho vazio e carrinho com muitos itens;
- produtos com e sem imagem;
- modal de produto com muitos adicionais;
- modal de pagamento com múltiplas formas adicionadas.
