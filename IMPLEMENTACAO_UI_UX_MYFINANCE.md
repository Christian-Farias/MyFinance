# Implementação UI/UX — MyFinance (Fase 2)

Documento de entrega da Fase 2. Complementa `AUDITORIA_UI_UX_MYFINANCE.md`, que registrou os 27 problemas encontrados (3 P0, 11 P1, 10 P2, 3 P3) e definiu o plano de correção.

**Data:** 04/10/2026 · **Escopo:** camada de apresentação — sem alteração de regra de negócio, persistência ou autenticação.

---

## 1. Estado final da validação

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Build de produção | `npm run build` | ✅ passou · PWA v2.0.0 · 37 entradas em precache (1.284 KiB) |
| Testes | `npx vitest run` | ✅ 8 arquivos · **90 testes** aprovados · 0 falhas |
| Lint (total) | `npm run lint` | ✅ 0 erros · 46 warnings (baseline: 137) |
| Lint (escopo desta fase) | `npm run lint` | ✅ 9 warnings, todos accepting (ver §7) |

Nenhum teste foi removido ou desabilitado para fazer as mudanças passarem.

---

## 2. Fundamentos: design system

### Tokens
`src/index.css` deixou de usar valores soltos e passou a expor um vocabulary único em `@theme`:

- **Superfícies** — `surface`, `surface-raised`, `edge`, `edge-subtle`, `edge-strong`, `field`
- **Semânticas** — `accent`, `positive`, `negative`, `negative-strong`, `warning`, `info`
- **Texto** — `ink`, `ink-muted`, `ink-faint`, `on-accent`, `on-positive`, `on-negative`
- **Interação** — `accent-hover`, `positive-hover`, `negative-hover`, `negative-strong-hover`

Cada token tem um **par foreground correspondente** (`on-*`). Essa separação é o que impede o erro que existia antes no código: fundo saturado (`bg-accent`) com texto escuro (`text-ink`), que rendia 3.00:1 — abaixo de 4.5:1.

### Componentes
Seis módulos em `src/components/ui/`, todos exportados por `index.ts`:

- `Modal` — portal, dialog semântico, foco inicial e restaurado, focus trap, scroll lock, `closeOnBackdrop`, `closeOnEscape`
- `Field` — `TextField`, `SelectField`, `TextAreaField`, `CheckboxField`, `AmountField`, `ColorSwatch`, `ColorSwatchRow`
- `Feedback` — `PageHeader`, `EmptyState`, `LoadingState`, `ErrorState`
- `Toast` — `ToastProvider` + `useToast`
- `ConfirmDialog` — confirmação destrutiva reutilizável
- `Controls` — `SegmentedControl`, `MonthStepper`

### Acessibilidade
- Alvos de toque ≥ 44 px; ícones decorativos com `aria-hidden`
- Foco visível consistente via `:focus-visible`
- `aria-label` em toda ação só-ícone; `aria-expanded` nos controles de expansão
- Estados de carregamento e erro em todas as páginas protegidas
- `prefers-reduced-motion` preservado — animações entram por `@media (prefers-reduced-motion: no-preference)`

---

## 3. Estrutura e navegação

- `AppLayout` substituiu o cabeçalho antigo: skip-link, sidebar em desktop, bottom nav em mobile, `Suspense` com `LoadingState`
- **17 rotas** em lazy loading; `AuthPage` fora do guard por não depender de `FinanceContext`
- Busca global (`GlobalSearchModal`) com atalho ⌘K / Ctrl+K, navegável por teclado
- `FinanceContext` expõe `error` e `retry`; as 17 páginas protegidas têm guard de carregamento

---

## 4. Modais

Os **15 modais** de `src/components/modals/` foram migrados para o `Modal` base. Antes, cada um repetia overlay, focus trap e wiring de Escape.

Um detalhe de correção que vale registrar: o `Modal` mantém uma pilha de diálogos abertos. Sem isso, um modal aberto sobre outro fazia os dois reagirem a Escape — o de baixo fechava junto. O `Modal` empilhado fecha apenas o do topo, e o cleanup remove a entrada da pilha.

Também foram corrigidos **estados invisíveis** — campos que eram salvos no banco mas não tinham controle na UI, então o usuário nunca conseguia preenchê-los:

| Modal | Campo oculto |
| --- | --- |
| `BillModal` | conta e cartão |
| `RecurringModal` | conta e cartão |
| `InvestmentModal` | observações |
| `ReceivableModal` | categoria |

---

## 5. Correções de cor

| Correção | Quantidade |
| --- | --- |
| `text-white` → `text-ink` | 231 ocorrências · 33 arquivos |
| `[var(--color-*)]` → utilitário nativo | 1.235 ocorrências · 44 arquivos |
| `pill-purple` (classe inexistente) → `pill-accent` | 2 arquivos |
| `last:border-0` / `last:border-none` → `last:border-b-0` | 2 arquivos |
| Fundo saturado com `text-ink` → `text-on-accent` | 30+ correções |
| Gradiente `from-accent to-accent` (no-op) → `from-accent to-info` | 2 arquivos |
| Badges de prioridade com alpha em hex → `bg-*/12`, `border-*/25` | 4 variantes |

Restam **0** `text-white` e **0** utilitários `[var(--color-*)]` em `src/`.

### Hexadecimais que permanecem — e por quê

37 ocorrências são intencionais e não devem ser tokenizadas:

- **Paleta de conta** (`Field`, `AccountModal`, `GoalModal`, `CardModal`) — são valores **escolhidos pelo usuário** e persistidos no banco, não cores de tema. Trocá-los por token quebraria a correspondência com o dado salvo.
- **`VisualCreditCard`** — artefato visual que reproduz o design real de um cartão.
- **`services/`, `calculations/`, `financialAI/`** — fora do escopo desta fase.

---

## 6. Páginas — correções funcionais

Além da padronização visual, a auditoria expôs fluxos incompletos que foram implementados:

**`AlertsPage`** — os alertas do sistema apareciam apenas como **contagem** na aba "Sistema"; a lista nunca era renderizada. `markAlertAsRead` estava declarado e nunca chamado, então o contador de não-lidas nunca diminuía. Agora a lista renderiza com tom por tipo, expansão de explicabilidade, "marcar como lido" e ação de navegação. `ALERT_VISUALS` deixou de usar hex com alpha e passou a mapear tokens.

**`CalendarPage`** — os totais de entrada e saída do dia selecionado eram calculados e nunca exibidos. Agora aparecem como cards acima da lista de eventos. O estado `viewMode` órfão (sem qualquer controle na UI) foi removido.

**`ImportPage`** — o texto dizia "Arraste o arquivo aqui", mas a área não acceptava drop. O nome do arquivo escolhido também nunca era mostrado. Agora há drag-and-drop real, highlight no hover e confirmação visual com nome, tamanho e ícone.

**`CommitmentsPage`** — os handlers `deleteBill`, `deleteReceivable` e `deleteRecurring` existiam mas nenhuma aba tinha botão de excluir. As quatro abas agora usam `ConfirmDialog`.

**`SettingsPage`** — ver §8.

**`DashboardPage`** — o cabeçalho era um `div` próprio, agora usa `PageHeader` com slot `leading`.

---

## 7. Estado de uma hora

Vale registrar por que não é zero.

**`new Date()` durante render.** O compilador do React sinalizou impureza em 7 lugares. Um deles era um bug real de comportamento: `CalendarPage` chamava `new Date()` **42 vezes por render**, uma para cada célula do mês. Agora existe um único `today` derivado uma vez. Nos modais, o caso era o inicializador de `useState` — corrigido com inicializador preguiçoso.

**Os 9 warnings restantes no escopo:**

| Tipo | Onde | Decisão |
| --- | --- | --- |
| `only-export-components` (4) | `Toast`, `Field`, `AuthContext`, `FinanceContext` | Hook e componente no mesmo arquivo é o padrão idiomático de context. Separar causaria churn na superfície de import por um ganho que é só de fast-refresh em dev. |
| `set-state-in-effect` (3) | `AuthContext`, `FinanceContext`, `NewTransactionModal` | Carregamento de dados e reset de formulário a partir de props. Refatorar para o padrão "ajustar estado durante render" nos 13 setters do formulário de transação tem risco de regressão desproporcional ao benefício. |
| `purity` (2) | `AIAssistantPage:92,95` | Falso positivo — `Date.now()` e `new Date()` estão dentro de um event handler, não de render. |

---

## 8. Uma decisão que fugiu do plano original

O plano previa **implementar seis preferências** em Settings. Ao verificar os dados, ficou claro que elas não tinham como funcionar:

- `theme` e `language` existem em `UserSettings`, mas **nenhum código os lê** — não há tema light nem i18n no projeto
- nada no app **cria alertas** — a página de alertas apenas lista os que já existem
- as linhas de Segurança e Privacidade eram decorativas

Implementá-las não era possível sem inventar persistência e um tema inexistente. A solução foi o inverso: **perfil real + honestidade**.

- `settings.name` e `settings.email` passaram a ser **editáveis e persistidos**
- Aparência e Idioma viraram linhas **somente leitura**, mostrando o valor real
- Notificações, Segurança e Privacidade foram **removidas**
- `alert()` nativo foi substituído por `ToastProvider`

---

## 9. Bugs de contraste encontrados na auditoria

O mais relevante: a migration inicial trocou `text-white` por `text-ink` **globalmente**. Isso estava correto para texto sobre superfície escura, mas **errado** para texto sobre fundo saturado — e o resultado ficou pior que o original, porque `text-ink` sobre `bg-accent` dá 3.00:1.

A correção exigiu varrer cada combinação de fundo com token saturado e trocar por `text-on-accent`. O processo gerou duas regressões que precisei corrigir (`text-on-accent-muted` e `text-on-accent-faint`, resultantes de substituição por substring), e a verificação final classes-a-classes foi feita contra o CSS gerado, não contra o código-fonte.

Também: **gradientes não são cobertos por `bg-<token>`**. A auditoria procurava `bg-accent` e não encontrou `from-accent`, então deixou passar um `from-accent to-accent` com `text-ink` por cima. A varredura seguinte cobriu `from-`/`via-`/`to-`.

---

## 10. O que não foi feito

Estes pontos estão fora do escopo e seguem abertos:

- **Validação visual em navegador.** Não há browser integrado. Os viewports 360/390/768/1024/1366/1920 px **não** foram verificados — nenhuma captura de tela foi gerada ou simulada.
- **Login em runtime.** O provider de e-mail do Supabase está desabilitado; a tela renderiza e os erros são traduzidos, mas não há sessão real.
- **Lazy load do Supabase.** Hoje o cliente é importado estaticamente pelo entry, dentro do gate de autenticação. Tornar o import efetivo exigiria reestruturar esse gate. Registrado como warning `INEFFECTIVE_DYNAMIC_IMPORT` no build para `recurringService`, e bundle acima de 500 kB — ambos pré-existentes.
- **32 warnings de lint** em `src/services/`, `src/financialAI/` e `src/calculations/` — diretórios que a fase não podia tocar.
- **Header unificado em todas as páginas.** O `PageHeader` está pronto e adotado no Dashboard; as demais páginas mantêm cabeçalhos próprios, ainda consistentes com os tokens.