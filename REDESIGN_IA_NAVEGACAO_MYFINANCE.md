# Fase 5 — Redesign de IA e Navegação

Documento de implementação. Registra a auditoria prévia, as decisões tomadas,
o que mudou, o que não mudou e o que **não foi verificado**.

---

## 1. Escopo e limites

### Dentro do escopo
Shell de navegação (sidebar, top bar, bottom nav), rolagem, e a página do
assistente de IA com todos os seus estados.

### Fora do escopo (não tocado)
`src/calculations/**`, `src/financialAI/**` (`aiService`, `LocalAIProvider`,
`executeActionPlan`, parsers, `responseGenerator`), `src/financialAgents/**`,
`src/services/**`, `src/database/**`, `src/context/**`, `AuthContext`,
Supabase e as rotas de `src/App.tsx`.

Nenhuma regra de negócio, cálculo, formato de dado ou chamada de rede foi
alterada. A IA continua sendo inteiramente local: nenhum provedor externo
(OpenAI, Anthropic, Gemini, Ollama) foi introduzido ou consultado.

---

## 2. Auditoria prévia (antes de qualquer edição)

Nenhuma linha foi alterada antes desta auditoria. Ela revelou quatro problemas
estruturais que não eram visíveis no surface.

### 2.1 Dois modelos de rolagem coexistindo

```css
/* antes */
.app-shell { min-height: 100dvh }                       /* todos os tamanhos */
@media (max-width: 767px) {
  .app-shell  { height: 100dvh }                       /* trava */
  .app-scroll{ overflow-y: auto }                      /* scroll interno */
}
@media (min-width: 768px) {
  .app-shell  { height: auto }                         /* solta */
}
.sidebar     { position: sticky; top: 0; height: 100dvh }
```

No celular o shell era travado e o conteúdo rolava dentro dele. No desktop o
documento rolava e a sidebar se mantinha no lugar com `position: sticky`. O
mesmo produto se comportava de duas formas dependendo da largura da janela.

### 2.2 A sidebar sticky era uma muleta

`position: sticky` + `height: 100dvh` existiam só para compensar a rolagem do
documento. Com o shell travado, ela deixa de ser necessária: basta ser um filho
de uma linha de flex que se estica até a altura do shell.

### 2.3 O chat da IA nunca rolou no desktop

A página usava `flex-1 min-h-0 overflow-hidden` no wrapper e `flex-1
overflow-y-auto` na lista. Isso só resolve quando existe uma cadeia de alturas
definidas. No mobile ela existia (porque `.app-shell` era `height: 100dvh`). No
desktop, com `.app-shell { height: auto }`, não existia — a lista crescia com o
conteúdo e o `overflow-y: auto` nunca era acionado.

### 2.4 Não havia top bar

`AppLayout` era `Sidebar` + `main` + `BottomNavigation` + modais. Nenhum
`<header>`. Cada uma das 18 páginas escrevia seu próprio cabeçalho inline, e
`PageHeader` existia mas era usado por **1** delas.

---

## 3. Decisões tomadas

Quatro pontos foram decididos antes da implementação, por mudarem
materialmente o resultado.

| # | Questão | Decisão |
|---|---|---|
| 1 | Modelo de rolagem no desktop | Unificar no shell travado em **todos** os tamanhos |
| 2 | Aba "Assistentes" | Remover — o status `active`/`idle` vinha de um array literal |
| 3 | Mensagens iniciais da IA | Estado vazio com hero; guia do PWA fora do chat |
| 4 | Título no top bar | Barra de utilidade; o `<h1>` fica dentro de `<main>` |
| 5 | FAB na barra mobile | Remover; a ação migra para o menu "Mais" |
| 6 | Largura do conteúdo | `.page-width` desktop de 56rem → 68rem |

### 3.1 Por que o top bar não é uma barra de título

O §6 do pedido esboça o título da página dentro do header. Implementar isso
literalmente exigiria um mapa rota→título no layout e transformar as ações
específicas de cada página (botão Adicionar, upload de extrato, filtros) em
props do shell — alterando as 18 páginas com risco alto de regressão.

Mantendo o `<h1>` dentro de `<main>` via `PageHeader`, o objetivo do §6
("evitar duplicação de títulos") é atingido sem esse custo. O top bar ficou com
o que não tem lugar em nenhuma página.

### 3.2 Por que a aba "Assistentes" foi removida

Seis cards com `status: 'active' | 'idle'` hardcoded em `proactiveAgents`. É o
mesmo problema de UI sem dado real já corrigido em Settings na Fase 2: a tela
afirmava um estado que o sistema não calculava. Os agentes reais existem e rodam
em `/alertas` (`financialAgents/agentService`). Nenhuma capacidade foi perdida.

### 3.3 Por que o FAB foi removido, e não só escondido

A barra mobile tinha seis alvos: quatro abas, "Mais" e um FAB. Em 360px isso é
apertado, e o FAB ainda exigia uma verificação de rota (`isAIPage`) para não
cobrir o composer.

Ele **não** foi simplesmente apagado: abria `QuickActionSheet`, e essa ação
continua existindo como o primeiro item do menu "Mais", chamando o mesmo
`setQuickActionOpen`.

Remover a aba "Cartões" (para chegar a quatro slots) teria órfão `/cartoes` no
celular, porque ele **não** constava do menu "Mais". Por isso "Cartões" foi
adicionado à seção "Organização" da sheet.

---

## 4. Bugs latentes encontrados e corrigidos

Estes não faziam parte do pedido. Foram encontrados na auditoria e corrigidos
porque estão no mesmo código.

### 4.1 Token inexistente: `--color-bg`

`.app-shell` usava `background: var(--color-bg)`, que não existe. A
declaração é inválida e o shell renderizava **transparente** — mascarado
apenas porque `body` por acaso carrega `--color-base`.

### 4.2 Token inexistente: `--z-nav`

`.sidebar` e `.bottom-nav` usavam `z-index: var(--z-nav)`, que não existe.
Ambas recebiam `z-index: auto` implícito e dependiam puramente da ordem do DOM.
Isso violava a regra escrita no próprio arquivo
(*"Components must reference these, never a magic number"*). Havia um
`--z-bottom-nav` definido e nunca usado — o token do sidebar é que estava
errado.

### 4.3 Espaçamento em branco duplicado (~264px)

`--page-bottom-pad` era aplicado **duas vezes**: em `.page-content` e em
`.page-width`. Como `.page-content` está sempre aninhado dentro de
`.page-width`, as duas declaração se somavam. Com 16 das 18 páginas usando
`.page-content`, toda página tinha cerca de 264px de espaço morto no rodapé no
celular.

### 4.4 Skip link sem stacking

`.skip-link` usava `z-index: 100` hardcoded. O token `--z-skip-link` existia e
não era usado.

### 4.5 Cores hexadecimais fora do sistema de tokens

`#050505` em `html`/`body` e `rgb(5 5 5 / 0.94)` no `.bottom-nav` eram
literais, embora os tokens correspondentes existissem. Um `--color-base` trocado
não teria atingido nenhum deles.

### 4.6 `progressbar` com valor impossível

`AIResponseVisual` limitava a largura da barra a 100% mas anunciava
`aria-valuenow` com o valor cru. Um goal acima da meta produzia
`aria-valuenow="140"` contra `aria-valuemax="100"` — inválido. O clamp agora é
calculado uma vez e aplicado à largura, ao valor anunciado e ao texto.

---

## 5. Arquitetura do shell

```
#root                    min-height:100dvh
└── .app-shell           height:100dvh; overflow:hidden; display:flex
    ├── .sidebar         md+ · align-self:stretch · nav com overflow-y:auto
    ├── .app-main        flex column · min-width:0 · min-height:0
    │   ├── .app-topbar  shrink-0 · nunca rola · barra de utilidade
    │   └── .app-scroll  flex:1 · min-height:0 · overflow-y:auto · único scroll
    │       └── .page-width
    └── .bottom-nav      mobile · position:fixed
```

`html` e `body` **mantêm** `min-height` em vez de altura travada, de propósito:
`AuthPage` e o estado de carregamento do `ProtectedRoute` renderizam fora do
`.app-shell` e precisam continuar roláveis em viewports baixas.

### 5.1 Scroll interno intencional

O chat gerencia seu próprio scroll interno (a lista rola, o composer fica
fixo). Isso exige tirar o scroller externo do caminho e dar altura definida à
coluna. Em vez de tornar isso global, é opt-in por rota:

```css
.app-scroll--locked  { overflow: hidden }
.page-width--full    { max-width: none; height: 100%; padding-bottom: 0 }
```

`AppLayout` aplica as duas classes quando `location.pathname.startsWith('/ia')`.
Qualquer outra rota mantém o comportamento normal.

### 5.2 Why `min-height: 0` aparece em três lugares

`.app-main`, `.app-scroll` e o `<nav>` interno da sidebar. Sem isso, um filho
flex com `min-height: auto` (o padrão) recusa encolher, e o shell travado
transborda em vez de rolar. O `<nav>` da sidebar precisava disso antes também —
ganhou `min-h-0` junto com a remoção do `sticky`.

---

## 6. Barra de utilidade

Novo `src/components/layout/AppTopBar.tsx`. Carrega apenas o que não tem lugar
em nenhuma página:

- **marca** — a sidebar some abaixo de `md`, então o mobile não tinha identidade
- **status offline** — antes só existia no rodapé da sidebar, ou seja, só no desktop
- **sino de alertas + contador** — no mobile isso ficava dois toques atrás, dentro
  da sheet "Mais": um alerta era invisível até você ir procurar
- **avatar** — único atalho para Configurações no mobile

O contador é derivado (`alerts.filter(a => !a.isRead).length`), não armazenado,
para que o badge da top bar e o da sidebar nunca discordem.

Os avisos usam `aria-label` com a contagem por extenso e o badge numérico é
`aria-hidden`, para não anunciar o mesmo número duas vezes.

---

## 7. Redesign da IA

### 7.1 Estrutura

```
AIAssistantPage                    flex column · h-full · min-h-0
├── faixa de identidade            shrink-0 · <h1>Neguin</h1>
├── transcripto                    flex:1 · min-h-0 · overflow-y:auto
│                                  role="log" aria-live="polite"
│   ├── AIEmptyState               quando não há mensagens
│   ├── ChatMessage[]
│   └── TypingIndicator
│   └── [pill "Nova mensagem"]     quando o leitor não está no fim
└── ChatComposer                   shrink-0 · fixo abaixo do transcripto
```

### 7.2 Componentes extraídos

O arquivo tinha 508 linhas com renderização de mensagem, três variantes de
visual, action plan, sugestões, aba de agentes e composer tudo inline. Agora:

| Componente | Linhas | Responsabilidade |
|---|---|---|
| `ChatMessage.tsx` | 149 | Bolha + delega visual, plano, explicação, sugestões |
| `AIResponseVisual.tsx` | 131 | `items` / `progress` / `breakdown` |
| `ChatComposer.tsx` | 117 | Textarea com auto-grow, Enter envia |
| `AIEmptyState.tsx` | 99 | Hero + starters clicáveis |
| `TypingIndicator.tsx` | 31 | Três pontos com `role="status"` |
| `AIInsightCard.tsx` | 24 | `explanation` como raciocínio |

A página caiu de 508 para 313 linhas.

### 7.3 Rolagem automática condicional

O `scrollIntoView` incondicional em `[messages, isTyping]` era o problema mais
visível da tela: toda resposta puxava a viewport de quem estivesse relendo o
histórico.

```
distância do fim = scrollHeight - scrollTop - clientHeight
seguir           = distância ≤ 80px
```

Com o leitor no fim, a conversa acompanha. Com o leitor acima, a posição é
preservada e aparece o pill "Nova mensagem", que traz a visão de volta ao clicar.

Exceção deliberada: **perguntar** uma nova coisa sempre retorna ao fim. Enviar
uma pergunta é um pedido explícito para ver a resposta.

O listener é `{ passive: true }` e tem cleanup — um listener de scroll órfão
continuaria atualizando estado em um nó morto.

### 7.4 Estado vazio

Substitui as duas mensagens fixas que eram semeadas em `messages` na montagem.
Elas tinham um segundo custo: a grade de sugestões era condicionada a
`messages.length <= 2`, então a conversa nunca alcançava um estado vazio real —
starters e transcript disputavam a mesma tela.

O hero usa o primeiro nome de `settings.name` (não o nome completo, que
estouraria a largura) e saúda conforme a hora.

O guia do PWA saiu do chat e permanece em `PWAInstallPrompt`, que já detectava
a plataforma e traz as três etapas do iOS. **Nada foi perdido** — a instrução
existia nos dois lugares.

### 7.5 Composer

`<input type="text">` virou `<textarea>`:

- `Enter` envia, `Shift+Enter` insere nova linha
- auto-grow até 120px, depois rolagem interna
- `enterKeyHint="send"` rotula a tecla corretamente no iOS
- `font-size: 16px` — abaixo disso o Safari dá zoom no foco
- foco volta ao campo após o envio, para o teclado não fechar
- durante `isTyping`, o envio é bloqueado e o botão mostra estado ocupado

### 7.6 Estado de erro

Antes: uma mensagem de texto genérica, sem como repetir. Agora a mensagem
carrega a pergunta original e exibe "Tentar novamente", que reenvia exatamente
ela. O erro cru nunca chega à tela.

### 7.7 Plano de ação

A confirmação continua obrigatória — nada executa sem o clique. Duas mudanças:

- `plan.status` era **escrito diretamente** no objeto que vive dentro de
  `messages`. Esse estado nunca foi rastreado pelo React, então um re-render
  podia ressuscitar um plano já resolvido como pendente. A resolução agora é
  estado local por `plan.id`.
- O executor recebe uma **cópia** (`{ ...plan, status: 'confirmed' }`), sem
  tocar no objeto guardado em estado.

---

## 8. Navegação mobile

```
antes:  [FAB]  Início · Gastos · Neguin · Cartões · Mais      (6 alvos)
depois:         Início · Gastos · IA · Mais                    (4 alvos)
```

- FAB removido; ação "Nova operação" no topo da sheet "Mais"
- Aba "Neguin" → "IA", alinhada ao ícone e aos outros rótulos (o assistente
  continua se chamando Neguin no cabeçalho do chat)
- Aba "Cartões" removida e **adicionada à sheet "Mais"**, para `/cartoes` não
  ficar sem caminho no celular
- As larguras equalizadas dos slots não foram tocadas — o `grid` que corrigiu o
  desalinhamento "IA" × "Cartões" continua valendo

---

## 9. Acessibilidade

| Elemento | Mecanismo |
|---|---|
| Transcripto | `role="log"`, `aria-live="polite"`, `aria-relevant="additions"` |
| Transcripto | `tabIndex={0}` — rolagável por teclado |
| Bolhas | `<article aria-label>` distingue "Você" de "Neguin" |
| Composer | `<label class="sr-only">`, `aria-label` no botão de envio |
| Indicador | `role="status"` + texto oculto; pontos com `aria-hidden` |
| Barra de progresso | `role="progressbar"` com valor clampado |
| Pill de nova mensagem | `aria-label="Ir para a mensagem mais recente"` |
| Imagens decorativas | `alt=""` + `aria-hidden` — o logo repete o nome já próximo |
| Landmarks | `<header>` = banner, `<main>`, `<nav>` interno da sidebar rotulado |
| Foco | anel global único preservado; nenhum `:focus` foi removido |
| Idioma | `lang="pt-BR"` já presente |

Abreviação: `<strong>` dentro da bolha do usuário herdava `text-on-accent` em vez
de `text-ink`, que era o que o código antigo forçava.

---

## 10. Testes

| Arquivo | Casos |
|---|---|
| `ChatMessage.test.tsx` | 15 |
| `ChatComposer.test.tsx` | 9 |
| `autoScroll.test.tsx` | 8 |
| `AIEmptyState.test.tsx` | 5 |

**Antes:** 8 arquivos, 98 testes.
**Depois:** 12 arquivos, 135 testes.

Casos que cobrem regressões concretas, não só cobertura:

- Enter envia e Shift+Enter **não** envia (era um `<input>`)
- O auto-grow respeita o teto de 120px e alterna `overflow-y`
- Envio bloqueado com entrada em branco e durante `isTyping`
- Leitor no fim **acompanha**; leitor acima **não é arrastado**; o pill traz de volta
- Perguntar de novo retoma o acompanhamento
- `**` ímpar não engole a mensagem
- `aria-valuenow` clampado em 100
- `plan.status` original continua `pending` após confirmar
- Plano confirmado **não** reaparece após re-render
- Retry reenvia a pergunta original, e o erro cru não vaza

---

## 11. Validação

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` | sem erros |
| `npm run build` | ✓ 1.40s, 39 entradas em precache |
| `npx vitest run` | 135/135 em 12 arquivos |
| `npm run lint` | 44 warnings, **0** nos arquivos tocados |

Os 44 warnings restantes são pré-existentes e estão fora do escopo visual
(imports e parâmetros não usados em `services/`, `financialAI/`, `database/`;
`set-state-in-effect` e fast-refresh). O total caiu de 46.

---

## 12. Não verificado

Não existe browser ou preview integrado neste ambiente. Portanto **não foram
executados**:

- renderização visual real em 360, 390, 768, 1024, 1440 e 1920px
- comportamento com teclado físico em iOS e Android
- altura real do composer com o teclado virtual aberto
- contraste medido com os valores finais dos tokens
- `dvh` real sob a barra de endereço do Safari

Nada nesta seção deve ser lido como aprovado. Os testes automatizados validam
comportamento e marcado, não aparência.

Também segue pendente de validação em dispositivo, da fase anterior: o ícone
PWA foi conferido por build, não no launcher — iOS e Android mantêm cache do
ícone antigo e exigem desinstalar o app ou limpar os dados antes do teste.

---

## 13. Pendente registrado (fora de escopo, por decisão)

Editar e excluir transações **existem** em `TransactionDetailModal`, mas:

- `TransactionItem` é um `<div onClick>` — sem `role`, sem `tabIndex`, inacessível por teclado
- Só 3 das 9 telas que listam transações abrem o detalhe: `DashboardPage`, `TransactionsPage`, `CardsPage`
- `ExpensesPage`, `CashFlowPage`, `CalendarPage`, `MonthlyClosingPage`, `BudgetsPage` e `MonthlyComparisonPage` mostram lançamentos sem caminho para editá-los

---

## 14. Arquivos

### Alterados
```
src/index.css                                shell, scroll, tokens, top bar, chat
src/layouts/AppLayout.tsx                    top bar, scroll lock por rota
src/components/BottomNavigation.tsx          FAB removido, 4 slots
src/components/modals/MoreMenuModal.tsx      Cartões + Nova operação
src/components/Sidebar.tsx                   min-h-0 no nav, label do landmark
src/components/PWAInstallPrompt.tsx          clearance do FAB removido
src/pages/AIAssistantPage.tsx                508 → 313 linhas
```

### Novos
```
src/components/layout/AppTopBar.tsx
src/components/ai/ChatMessage.tsx
src/components/ai/ChatComposer.tsx
src/components/ai/AIResponseVisual.tsx
src/components/ai/AIActionCard.tsx
src/components/ai/AIEmptyState.tsx
src/components/ai/AIInsightCard.tsx
src/components/ai/TypingIndicator.tsx
src/components/ai/__tests__/*.test.tsx
```