# Vision UI — Arquitetura visual

## Objetivo

Criar uma linguagem visual reutilizável para o Vision System sem acoplar regras de negócio à apresentação. O PDV é o primeiro consumidor dessa base, mas os tokens e primitivas foram projetados para CRM, Caixa, Clientes, Relatórios e Configurações.

## Camadas

1. **Tokens (`vision-tokens.css`)** — valores sem contexto de tela: cores, espaçamentos, raios, sombras, duração e altura de controles.
2. **Primitivas (`vision-primitives.css`)** — contratos visuais reutilizáveis: botão, campo, card, badge e estado vazio.
3. **Padrões de módulo (`PdvV2.css`)** — composição e comportamento visual específicos do PDV.
4. **CSS legado (`Pedidos.css`)** — preservado como camada de compatibilidade durante a migração.

## Regras de arquitetura

- Regra de negócio permanece em hooks, services e componentes React.
- Tokens não devem conter seletores específicos de uma tela.
- Componentes novos devem preferir classes `vision-*`.
- Estilos de módulo devem ser escopados pelo contêiner do módulo.
- Não criar novas classes globais genéricas como `.btn-primary` ou `.card`.
- Uma ação principal por contexto; ações secundárias devem ter menor peso visual.
- Scroll é fallback, não estrutura principal de telas operacionais.
- Estados de `hover`, `focus-visible`, `active`, `disabled`, erro e vazio fazem parte do componente.

## Ordem de importação no PDV

```js
import '../../styles/vision/vision-tokens.css';
import '../../styles/vision/vision-primitives.css';
import './Pedidos.css';
import './PdvV2.css';
```

A ordem mantém o legado funcional e permite que a camada v2 faça apenas as substituições visuais necessárias.

## Próxima migração recomendada

1. Extrair botões e campos repetidos para componentes React compartilhados.
2. Adotar tokens no Dashboard e Caixa.
3. Remover gradualmente seletores globais conflitantes.
4. Criar catálogo visual de componentes e estados.
5. Adicionar testes visuais nas resoluções 1366×768 e 1920×1080.
