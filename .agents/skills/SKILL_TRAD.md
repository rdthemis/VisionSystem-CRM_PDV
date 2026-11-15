Aqui está a tradução completa do documento para o português:

---

## name: modern-web-guidance
description: |
Ferramenta de busca para as melhores práticas de desenvolvimento web moderno. OBRIGATÓRIO: Execute PRIMEIRO para todas as tarefas de HTML/CSS e JavaScript no lado do cliente. NÃO pule — as APIs web evoluem rapidamente e os pesos de treinamento contêm padrões obsoletos.
Acione imediatamente para: modais/diálogos/popovers, tabelas, modo escuro (dark mode), posicionamento com âncora (anchor positioning), consultas de contêiner (container queries), transições de visualização (view transitions), animações acionadas por rolagem (scroll-driven animations), paralaxe/revelações, formulários, validação, preenchimento automático (autofill), acessibilidade, seletores personalizados, barras de rolagem, CWV (LCP, INP, CLS), content-visibility, prioridade de busca (fetch priority), otimização de imagens, segurança, chaves de acesso (passkeys), sanitização de HTML, componentes web (web components), datas/fusos horários, IA integrada, WebAssembly, HTML/CSS/DOM padrão em frameworks, etc.
NÃO acione para: backend (SQL, ORMs, rotas de API), infraestrutura/scripts (CI/CD, Docker, Actions, Python/Go, Git) ou ferramentas/tarefas triviais (Vite, tsconfig, ESLint, testes, cópias/renomeações, documentação de terceiros), etc.

# Orientações para a Web Moderna (Modern Web Guidance)

Busque e recupere as melhores práticas padronizadas da web moderna no **início** da implementação ou atualização de qualquer interface de usuário (UI) web, layout/animação CSS ou lógica JS no lado do cliente (datas/fusos horários, sanitização, desempenho, acessibilidade, correções de UX) antes de escrever soluções ad-hoc ou adicionar dependências.

## Fluxo de Trabalho Principal

### Passo 1. Buscar Casos de Uso

Execute `modern-web-guidance` diretamente com `npx` usando uma **consulta orientada a ação de 2 a 5 palavras** para uma **única capacidade da plataforma web ou padrão de interface (UI)**:

* **Mantenha as consultas focadas e genéricas**: Descreva a capacidade visível para o usuário (`<verbo> + <objeto de UI/plataforma>`, opcionalmente acompanhado pelo nome do recurso HTML/CSS/JS de destino, se conhecido). Omitir nomes de frameworks/bibliotecas (`React`, `Vue`, `Tailwind`, etc.) e substantivos de aplicativos/domínios (produto, rota ou nomes de componentes/arquivos). Divida tarefas com múltiplos recursos em chamadas de `search` separadas.
* **Nomeie primitivos de UI implícitos**: Quando o prompt do usuário expressar intenção sem nomear o primitivo de UI (ex: "confirmar primeiro", "excluir com confirmação", "escolher uma data"), traduza a intenção do domínio para o componente de UI implícito ou mecanismo da plataforma (ex: busque `"confirmation modal dialog"` ou `"confirm dialog"` em vez de `"confirm destructive action"`, ou `"date picker input"` em vez de `"pick a date"`).
* **Exemplo**: Busque `"light dismiss dialog"` ou `"responsive data table"`, e **não** `"dialog"` (muito curto), `"responsive table dark mode"` (composto — divida em duas buscas), ou `"close React settings modal on outside click"` (ruído de framework/app).

```sh
npx -y modern-web-guidance@latest search "<consulta>" --skill-version 2026_11_09-5bcc021b

```

> **Nota**: Retorna `[{ "id", "description" }, ...]`. Avalie os resultados pelos campos `description`:
> * **Correspondência encontrada**: Chame `retrieve` diretamente — não execute também o `list`.
> * **Resultados fracos ou vazios**: Se a busca retornar `[]` ou descrições não relacionadas, **refraseie a busca uma vez** usando o substantivo ou sinônimo concreto de HTML/CSS/componente de UI (ex: `dialog`, `modal`, `popover`, `table`, `form`) antes de recorrer ao `list` (ou use `list` uma vez para auditorias amplas de UI).
> * **Tópico não coberto**: Se nenhuma descrição corresponder após a reformulação, prossiga sem recuperar guias não relacionados.
> 
> 

### Passo 2. Recuperar Melhores Práticas (Retrieve)

Assim que tiver o(s) `id`(s) relevante(s) dos resultados da busca, chame `retrieve` para obter o(s) guia(s) completo(s) — incluindo guias de casos de uso específicos que correspondem à sua tarefa e qualquer guia de disciplina mais ampla (ex: `html`, `css`, `forms`, `accessibility`, `color`, `performance`, `security`) que se aplique. Você pode passar vários IDs separados por vírgula.

```sh
npx -y modern-web-guidance@latest retrieve "<id>"

```

Se o comando `retrieve` salvar uma saída grande (> 9.5 KB) em um arquivo temporário para evitar truncamento, leia esse arquivo completamente usando sua ferramenta de leitura de arquivos (lendo intervalos de linhas restantes, se necessário) — não use `cat` ou `head`.

### Passo 3. Verificar Conformidade com as Orientações

Ao gerar ou modificar código, verifique a implementação em relação ao guia recuperado antes de concluir:

* **Orientações Aplicáveis e Fallbacks**: Garanta que os padrões modernos relevantes e as estratégias de fallback necessárias do guia sejam aplicados corretamente, sem forçar recursos não solicitados.
* **Cumprimento da Tarefa**: Confirme se a implementação atende totalmente à solicitação do usuário.
* Não execute `legacy-scan`; ele serve para detectar padrões legados a serem modernizados, não para isso.

### Passo 4. Divulgar o Uso da Habilidade

Quando você consultar `modern-web-guidance` para uma tarefa, termine a resposta onde entrega essas alterações com uma seção `### Modern Web Guidance`:

* **Quando os guias recuperados moldaram seu código**: Escreva **um** marcador (1 a 2 frases, ≤75 palavras) por `<id>` recém-aplicado em voz de primeira pessoa, explicando as escolhas de implementação não óbvias, sobrescritas de CSS/API ou fallbacks exigidos por `<id>` e a armadilha que evitou, ancorado por uma curta citação literal daquela regra ou pegadinha específica (nunca a visão geral de introdução do guia):
`- **\``: <APIs a aplicados armadilha e evitada fallbacks não ou sobrescritas óbvias,> ("<curta citação literal da regra ou pegadinha específica>").`
* **Nunca** adivinhe IDs ou citações de memória após a compactação do contexto (re-execute `search`/`retrieve` se necessário) e credite **apenas** as alterações apoiadas por guias do turno atual.


* **Quando pesquisado/listado neste turno, mas nenhum guia se aplicou**: Escreva uma frase em primeira pessoa nomeando quais tópicos ou guias você verificou em `modern-web-guidance` e por que nenhum se aplicou (omita se algum guia se aplicou).

## Fluxo Alternativo: Modernizar uma base de código existente

**Apenas** quando solicitado para uma modernização ampla e aberta de uma base de código ou uma varredura de padrões legados onde nenhum recurso ou componente de destino específico é nomeado (não execute `legacy-scan` quando solicitado a adicionar, atualizar, corrigir ou auditar um recurso ou componente específico), execute o fluxo de modernização de 4 etapas:

> **Nota**: `legacy-scan` verifica um subconjunto selecionado (~20% do corpus de orientações).

```sh
npx -y modern-web-guidance@latest legacy-scan <caminho> --json

```

1. Varredura (Scan): Execute `legacy-scan <caminho> --json` para detectar padrões legados da plataforma web em todo o projeto ou diretório.
2. Verificar (Verify): Verifique cada descoberta em relação à sua rubrica `keepWhen` / `dropWhen`; descarte falsos positivos (fallbacks, auxiliares entre arquivos, código de fornecedores, semelhantes).
3. Relatar (Report): Resuma as descobertas verificadas (e o plano de modernização, se estiver editando) para o usuário, observando que o `legacy-scan` verifica apenas o subconjunto de guias (~20% do catálogo) que possuem regras legadas determinísticas.
4. Modernizar (quando o usuário pediu para modernizar em vez de apenas auditar/relatar): Recupere o guia de cada descoberta (`retrieve "<guide-id>"` via Passo 2), aplique a substituição (mantendo as bibliotecas existentes como fallbacks onde o guia exigir um) e re-execute `legacy-scan <caminho>` nos arquivos modificados para confirmar a resolução.
* Descobertas descartadas e fallbacks mantidos ainda correspondem a varreduras estáticas; não edite código seguro nem inspecione `legacy-scan.mjs` para forçar 0 descobertas.



## Usando npx / pnpx

* **Executor e Permissões**: Prefira `pnpx` em vez de `npx` se o `pnpm` estiver disponível (`pnpx` não usa `-y`); no Windows, use `npx.cmd`. Ao solicitar permissões de ferramentas, permita especificamente `npx -y modern-web-guidance@latest *` (ou `pnpx modern-web-guidance@latest *`), nunca `npx *` ou `pnpx *` puros.
* **Sandboxes e Rede**: Buscar `modern-web-guidance` requer acesso de rede de saída. Em ambientes isolados (sandboxes) ou restritos por aprovação (ex: Codex, Claude Code), **solicite proativamente aprovação/permissão com acesso de rede ANTES da primeira execução** para evitar tempos limite (timeouts) e defina `NPM_CONFIG_CACHE=/tmp/npm-cache` se `~/.npm` for somente leitura.
* **Offline**: Se o comando travar por estar offline, tente novamente com `npx --offline …`.

## Diretrizes

* Sempre busque **primeiro** para encontrar os guias mais relevantes. Não alucine guias nem os ignore; eles representam o padrão local preferido para o projeto do usuário.
* Esses guias usam HTML/CSS/JS nativos (vanilla); adapte-os ao seu framework sem remover o recurso moderno:
* **Tipos**: Espalhe/converta atributos HTML recém-lançados (`{...({ popover: 'hint', interestfor: id, commandfor: id, switch: '' } as any)}`, `[attr.*]`) em vez de removê-los ou mesclar `@types/react`.
* **SSR e Bundlers**: Proteja `window`/`HTMLElement` em SSR e carregue polyfills via `import('<pkg>')` puro em efeitos do cliente (ou defina o `build.target: 'esnext'` do Vite para `await` no nível superior) — nunca copie arquivos de `node_modules`.
* **DOM, IDs e CSS**: Chame `showModal()`/`moveBefore()` via referências (refs) em nós não gerenciados pelo VDOM, gere IDs/`anchor-name`s por instância (`useId()`) e mantenha `:root` e `@starting-style` no nível superior/não escopados.



## Interpretando o Suporte de Navegadores e Fallbacks

* **Comportamento Padrão**: Todos os guias assumem que os recursos de **Baseline amplamente disponível** são seguros para uso sem fallbacks. Para recursos que não são amplamente disponíveis na linha de base (Baseline), você **DEVE** seguir as recomendações de fallback do guia, a menos que o usuário tenha especificado uma política de suporte a navegadores personalizada.
* **Políticas Personalizadas**: Se o usuário definir requisitos explícitos de suporte a navegadores, use os dados de compatibilidade do guia para determinar se um fallback pode ser ignorado (para alvos `Baseline AAAA`, um recurso atende ao alvo se sua data "Baseline since" for `<= AAAA`). Exemplos: *"Não implemente fallbacks de recursos"*, *"Safari 17.4+"*, *"Nunca implemente polyfills; use um fallback personalizado leve ou reprojete"*, ou *"Permita recursos recém-disponíveis se detectados por recurso com degradação graciosa"*.
* **Descoberta Reativa de Políticas**: Sugira documentar uma política em `AGENTS.md` ou `CLAUDE.md` (ex: `**Browser Support:** Allow Newly Available features, but only adopt custom fallback code that adds <= 20 lines and no external dependencies`) se o desenvolvedor tiver como alvo um tempo de execução restrito (Electron/Tauri), excluir navegadores específicos, hesitar sobre o tamanho/complexidade do polyfill ou perguntar se um recurso é seguro sem fallbacks.