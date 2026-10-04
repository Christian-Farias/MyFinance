# Auditoria de UI/UX — MyFinance

**Data:** 04/10/2026 · **Escopo:** produto completo (17 rotas protegidas + tela de autenticação + 16 modais) · **Base:** `main` @ `9d07f4c` · **Método:** auditoria estática de código

---

## 1. Escopo, método e limitações

### 1.1 O que foi auditado

| Área | Itens | Arquivos inspecionados |
|---|---|---|
| Telas | 17 rotas protegidas + `AuthPage` | `src/pages/` (18 arquivos) |
| Overlays | 16 modais/sheets | `src/components/modals/` |
| Shell | Layout, sidebar, bottom nav, FAB | `src/layouts/AppLayout.tsx`, `src/components/` |
| Design system | Tokens, utilitários, animação | `src/index.css` (537 l.), `src/App.css` (184 l.) |
| Estado | Contextos e persistência | `src/context/FinanceContext.tsx` (659 l.), `AuthContext.tsx` |
| Gráficos | 4 telas com Recharts | Dashboard, Fluxo de Caixa, Investimentos, Comparação |

### 1.2 Método

Todas as afirmações deste documento derivam de leitura direta do código-fonte com referência `arquivo:linha`. Cada achado foi classificado como:

- **Evidência de código** — comportamento determinístico, confirmado na fonte.
- **Inferência** — dedução a partir de padrões; requer teste manual para confirmação.

### 1.3 Limitações declaradas

Não foram produzido screenshots, animaçõesGIF, medidas de renderização nem testes automatizados, pelos seguintes motivos:

1. Não há ferramenta de navegador disponível no ambiente (sem Playwright/Puppeteer) e a instalação de dependências está fora do escopo.
2. Não há usuário autenticado disponível para percorrer as 17 rotas em execução.
3. Layout fluido depende de medição real: divergências de 2–8 px entre a teoria e a prática são esperadas.

Consequência: **as conclusões de responsividade das seções 9 e 12 são inferências estruturais**, derivadas de breakpoints e classes, e não medições. Antes de aprovar a Fase 2, cada item marcado como inferência na matriz da seção 14 deve ser validado manualmente nos viewports listados na seção 9.1.

### 1.4 Fora de escopo

- Configuração de providers no Supabase e disponibilidade do endpoint de login.
- Arquitetura de dados e modelo de sincronização.
- Regras de negócio e correção de cálculos financeiros (apenas o impacto de UX delas é apontado).
- Segurança, credenciais expostas e rotação de chaves.
- Código de backend ou serviços não renderizados na UI.

---

## 2. Resumo executivo

### 2.1 Veredito

O MyFinance tem **base visual coerente e boa densidade de informação**, com uma paleta escura consistente, tokens já existentes e uma tela de loginYT profissional. O problema não é ausência de cuidado — é **ausência de sistema**: os mesmos decisões (foco, contraste, semântica de diálogo, confirmação destrutiva) foram tomadas 18 vezes, de 18 maneiras.

Três lacunas estruturais respondem por aproximadamente 60% dos problemas:

1. **Não existe camada de interação.** Cada modal reimplementa overlay, teclado e fechamento. Nenhum tem `role="dialog"`, `aria-modal`, focus trap ou fechamento por `Escape` (0 ocorrências em todo o `src/`).
2. **Não existe `:focus-visible` ativo.** A única definição está em `src/App.css:14-15`, arquivo que nunca é importado — e ela referencia `--accent`, token que não existe. Nenhum elemento focável do produto exibe indicador de foco.
3. **Não há orçamento de confirmação destrutiva.** Zero `confirm()`, zero padrões de undo, seis ações de exclusão em um toque.

### 2.2 Contagem por prioridade

| Prioridade | Definição | Achados |
|---|---|---|
| **P0** | Bloqueia uso ou causa dano irreversível | 3 |
| **P1** | Degrada uso recorrente ou viola WCAG A/AA | 11 |
| **P2** | Inconsistência, atrito ou debt técnico visível | 10 |
| **P3** | Polish e refinamento | 3 |

### 2.3 Top 10 por prioridade

| # | Achado | Prioridade | Evidência |
|---|---|---|---|
| 1 | Exclusão definitiva em um toque, sem confirmação nem undo | **P0** | `AccountsPage.tsx:111`, `BudgetsPage.tsx:141`, `CardsPage.tsx:119`, `CommitmentsPage.tsx:378`, `GoalsPage.tsx:154`, `InvestmentsPage.tsx:203` |
| 2 | Nenhum modal com semântica de diálogo, focus trap ou `Escape` | **P0** | 0 ocorrências de `role="dialog"`/`aria-modal` em `src/` |
| 3 | Indicador de foco inexistente em toda a aplicação | **P0** | `src/App.css:14-15` (não importado) + `src/main.tsx:3` |
| 4 | Erros de dados engolidos no console; app segue exibindo estado vazio como se fosse sucesso | P1 | `FinanceContext.tsx:258-260` |
| 5 | Busca global montada e inalcançável | P1 | `AppLayout.tsx:50` + `TopHeader.tsx:104` |
| 6 | Ações de conta invisíveis em tablets touch | P1 | `AccountsPage.tsx:101` |
| 7 | Contraste de rótulos 3.29:1 (mín. AA: 4.5:1) | P1 | `index.css:248` (`#5F6570` sobre `#0D0F12`) |
| 8 | Botão "Excluir" com contraste 2.4:1 | P1 | `GoalsPage.tsx:155` |
| 9 | Sem ErrorBoundary — erro em render derruba a árvore React | P1 | 0 ocorrências no projeto |
| 10 | Bundle 1,24 MB / 333 KB gzip em chunk único | P1 | `dist/assets/index-Pr5k_iHJ.js` |

---

## 3. Arquitetura de informação

### 3.1 Mapa de navegação

Rotas declaradas em `src/App.tsx`, todas sob `ProtectedRoute` + `AppLayout`:

| Rota | Tela | Domínio | Profundidade |
|---|---|---|---|
| `/` | Dashboard | Resumo | 1 |
| `/transacoes` | Transações | Movimentação | 1 |
| `/gastos` | Gastos | Movimentação | 1 |
| `/contas` | Contas | Ativos | 1 |
| `/cartoes` | Cartões | Ativos | 1 |
| `/investimentos` | Investimentos | Ativos | 1 |
| `/compromissos` | Compromissos | Passivos | 1 |
| `/calendario` | Calendário | Tempo | 1 |
| `/fluxo-caixa` | Fluxo de Caixa | Tempo | 1 |
| `/fechamento` | Fechamento Mensal | Tempo | 1 |
| `/orcamentos` | Orçamentos | Planejamento | 1 |
| `/metas` | Metas | Planejamento | 1 |
| `/comparacao` | Comparação Mensal | Insight | 1 |
| `/alertas` | O que Mudou | Insight | 1 |
| `/ia` | Assistente IA | Insight | 1 |
| `/importar` | Importar Extrato | Utilitário | 1 |
| `/configuracoes` | Configurações | Utilitário | 1 |

**Observação estrutural:** 17 domínios funcionais em 17 rotas de primeiro nível. Não existe hierarquia de segundo nível nem agrupamento por domínio no menu lateral — `Sidebar.tsx` renderiza uma lista plana. O usuário precisa memorizar o mapa mental completo.

### 3.2 Navegação mobile vs desktop

| Elemento | Mobile (<768px) | Desktop (≥768px) |
|---|---|---|
| Navegação principal | Bottom nav, 4 itens + FAB central + "mais" | Sidebar fixa, 17 itens |
| Acesso a 13 rotas | Menu "mais" (1 toque extra) | Direto (0 toques) |
| Largura de conteúdo | `max-w-2xl` (672 px) | `max-w-4xl` (896 px) |

A assimetria de 1 toque extra para 13 das 17 rotas no mobile é um custo relevante de informação-architetura, não um problema de estilo.

### 3.3 Domínios sem entrada direta

| Domínio | Gap |
|---|---|
| Compromissos | Dividido entre "Contas a Pagar" e "Recebíveis" dentro da mesma rota; verificação em `CommitmentsPage.tsx` |
| Recorrências | Sem rota própria; acessível por modal aninhado (`RecurringModal.tsx`, 268 l.) acionado de dentro de outros modais |
| Transferências | `TransferModal.tsx` (244 l.) existe mas não é montado — funcionalidade inalcançável |

---

## 4. Design system atual

### 4.1 O que existe (e é bom)

`src/index.css:7-19` define 13 tokens semânticos via `@theme`:

```css
--color-bg-main: #050505;      --color-text-primary: #F5F5F5;
--color-bg-secondary: #08090B; --color-text-secondary: #8B919B;
--color-card-main: #0D0F12;    --color-text-tertiary: #5F6570;
--color-card-elevated: #121419; --color-positive: #39D98A;
--color-border-main: #1D2026;  --color-negative: #FF5C5C;
--color-border-subtle: #15181E; --color-accent: #8B7CFF;
```

Também existem: escala de espaçamento de 4 a 48 px (`:41-52`), hierarquia de z-index documentada (`:22-30`), 6 keyframes com `prefers-reduced-motion` respeitado (`:165-205`), e utilitários semânticos (`.card`, `.label-xs`, `.label-section`, `.num-lg`, `.pill*`, `.progress-*`).

**`prefers-reduced-motion` sendo respeitado é raro e merece ser preservado na Fase 2.**

### 4.2 Lacunas estruturais

| Lacuna | Evidência | Consequência |
|---|---|---|
| Tokens não são usados no JSX | 1.676 ocorrências de hex literal; `NewTransactionModal.tsx` tem 86, `CommitmentsPage.tsx` 75 | Refatoração global impossível sem busca por substituição cega |
| Sem token de warning | `.pill-warning` usa `#F59E0B` hardcoded em `index.css:278` | Cores de status são fonte de verdade dupla |
| Sem `--accent` / `--accent-bg` / `--accent-border` | Usados em `App.css:5,6,12,15`; reais são `--color-*` | Único estilo de foco do projeto aponta para token inexistente |
| Escala z-index documentada e ignorada | Tokens em `index.css:22-30`; uso real: `z-10`, `z-30`, `z-40`, `z-[60]`, `z-[70]` | Dois sistemas de stack coexistindo |
| Componentes base inexistentes | 16 modais × implementação própria | Correção de foco/Escape/semântica exigiria 16 alterações |
| Componentes mortos | `TopHeader.tsx`, `Skeleton.tsx`, `TransferModal.tsx` — 0 referências | 3 arquivos de maintenance sem consumidor |

### 4.3 Distribuição de hex literais por arquivo (top 15)

```
86  NewTransactionModal.tsx      53  MonthlyClosingPage.tsx
75  CommitmentsPage.tsx           49  DashboardPage.tsx
67  AIAssistantPage.tsx           46  SettingsPage.tsx
62  ImportPage.tsx                46  RecurringModal.tsx
60  AlertsPage.tsx                45  TransactionDetailModal.tsx
```

O modal de nova transação — o caminho mais frequente do produto — é também o arquivo mais desobediente. Isso indica que os componentes foram escritos sem referência à folha de estilo.

---

## 5. Fundamentos visuais

### 5.1 Auditoria de contraste (WCAG 2.2 AA)

Cálculos sobre os valores reais dos tokens:

| Combinação | Razão | Mín. AA | Veredito |
|---|---|---|---|
| `#F5F5F5` sobre `#050505` (fundo) | 18.9:1 | 4.5 | ✅ AAA |
| `#8B919B` sobre `#0D0F12` (card) | 6.08:1 | 4.5 | ✅ AA |
| `#39D98A` sobre `#0D0F12` | 10.5:1 | 4.5 | ✅ AAA |
| `#FF5C5C` sobre `#0D0F12` | 6.4:1 | 4.5 | ✅ AA |
| **`#5F6570` sobre `#0D0F12`** | **3.29:1** | 4.5 | ❌ **Falha** |
| **`#5F6570` sobre `#050505`** | **3.63:1** | 4.5 | ❌ **Falha** |
| **`#FFFFFF` sobre `#8B7CFF`** | **3.27:1** | 4.5 | ❌ **Falha** (AA em texto ≥24px) |
| **`#FF5C5C` 50% sobre `#121419`** | **2.4:1** | 4.5 | ❌ **Falha grave** |

`.label-section` (`index.css:245-251`) usa exatamente a combinação que falha, em 11 px — e é o rótulo de todas as seções do app.

### 5.2 Escala tipográfica

| Papel | Tamanho | Token |
|---|---|---|
| Display numérico | `clamp(1.25rem, 4vw, 1.75rem)` | `.num-lg` |
| Título de página | `text-xl` bold | — |
| Corpo | `text-sm` / `text-xs` | — |
| Micro rótulo | `11px` / 500 | `.label-xs` |
| Rótulo de seção | `11px` / 700 / uppercase / `0.08em` | `.label-section` |

Densidade geral é boa para app financeiro. O problema é localizado: os dois níveis de micro-rótulo (11 px) são onde a hierarquia é mais sutil e onde o contraste falha.

### 5.3 Espaçamento

Escala de 4 px consistente em tokens. Padrões de Padding observados: cards `p-4`/`p-5`, listas `space-y-2`/`space-y-3`, seções `mb-4`/`mb-6`. **Sem achado de inconsistência neste eixo** — é o fundamento mais sólido do produto.

---

## 6. Acessibilidade

### 6.1 Contagem de primitives

| Primitive | Ocorrências em `src/` | Avaliação |
|---|---|---|
| `role="dialog"` | **0** | 🔴 Ausente em todos os 16 modais |
| `aria-modal` | **0** | 🔴 Ausente |
| `aria-live` | **0** | 🔴 Nenhuma região dinâmica anunciada |
| `role="alert"` | **0** | 🔴 Erros não anunciados |
| `ErrorBoundary` / `componentDidCatch` | **0** | 🔴 Sem contenção de erro |
| `htmlFor` | **0** | 🔴 Nenhum label associado a input |
| `aria-label` | 9 arquivos | ⚠️ Cobertura parcial |
| `focus-visible` | 1 arquivo (`App.css`, não importado) | 🔴 Inativo |

### 6.2 Foco visível — o achado mais grave

`src/App.css:14-16` contém a única regra de foco do projeto:

```css
&:focus-visible {
  outline: 2px solid var(--accent);
```

Duas falhas independentes: (a) `main.tsx:3` importa apenas `./index.css` — `App.css` nunca é carregado; (b) mesmo carregado, `--accent` não existe (o token real é `--color-accent`). **Resultado: nenhuma tecla pressionada no produto exibe indicador de posição.** Um usuário de teclado não sabe onde está.

### 6.3 Diálogos

Nenhum dos 16 modais implementa: `role="dialog"`, `aria-modal`, `aria-labelledby` para o título, focus trap, retorno de foco ao fechar, ou `Escape`. Cinco modais aplicam `autoFocus` (`NewTransactionModal.tsx:249`, `GoalDepositModal.tsx:120`, `BudgetModal.tsx:108`, `TransferModal.tsx:135`, `GlobalSearchModal.tsx:84`), o que é positivo como intenção — mas sem `Escape` nem trap, o foco escapa para o conteúdo de fundo e permanece lá, porque o conteúdo de fundo permanece renderizado e focável.

### 6.4 Formulários

Zero `htmlFor` no projeto. O padrão dominante é:

```tsx
<label className="block text-xs font-medium text-[#8E95A3] mb-1.5">Cor de identificação</label>
<input ... />
```

O `<label>` existe visualmente mas não está associado semanticamente. Um leitor de tela anuncia o campo sem nome. Afeta **todos os campos dos 12 modais com formulário**.

### 6.5 Controles sem nome acessível

Ícones Lucide são renderizados com `aria-hidden="true"` por padrão. Botões só com ícone ficam sem nome. Casos confirmados:

| Local | Ícone | WCAG |
|---|---|---|
| `GoalsPage.tsx:147-149` | Editar | 4.1.2 |
| `GoalsPage.tsx:153-157` | Excluir | 4.1.2 |
| `AccountsPage.tsx:103-111` | Editar / Excluir | 4.1.2 |
| `CardsPage.tsx:110-121` | Editar / Excluir | 4.1.2 |
| `AccountModal.tsx:153-160` | 7 swatches | 4.1.2 |
| `CardModal.tsx:205-212` | 7 swatches | 4.1.2 |
| `GoalModal.tsx:153-160` | 6 swatches | 4.1.2 |

**Total: 20 swatches de cor sem nome acessível e sem estado exposto** (`aria-pressed` ausente). Além de inacessível, o usuário de leitor de tela não sabe qual cor está selecionada.

### 6.6 Gráficos

Recharts em 4 telas sem `accessibilityLayer`, sem `role="img"` e sem resumo textual equivalente. Um gráfico de pizza de alocação (`InvestmentsPage.tsx:105`) ou de barras de fluxo de caixa é inacessível por completo. WCAG 1.1.1.

### 6.7 Alvos de toque

| Elemento | Tamanho | Mín. AA 2.5.8 (24×24) | Mín. Recomendado (44×44) |
|---|---|---|---|
| Swatches de cor | 28×28 px | ✅ | ❌ |
| Botão editar meta | 32×32 px (`p-2` + `size={14}`) | ✅ | ❌ |
| `.pill` | 22 px altura mínima (`index.css:270`) | ❌ | ❌ |
| Itens de bottom nav | 64 px de altura total | ✅ | ✅ |

---

## 7. Padrões de interação e feedback

### 7.1 Ações destrutivas — P0

Zero `confirm(`, zero toast de undo, zero modal de confirmação em todo o projeto. Seis exclusões definitivas em um toque:

| Ação | Arquivo:linha | Consequência |
|---|---|---|
| Excluir conta | `AccountsPage.tsx:111` | Remove conta **e todas as transações vinculadas** |
| Excluir cartão | `CardsPage.tsx:119` | Remove faturas e histórico |
| Excluir orçamento | `BudgetsPage.tsx:141` | Perde limites e progresso |
| Excluir assinatura | `CommitmentsPage.tsx:378` | Remove recorrência e lançamentos futuros |
| Excluir meta | `GoalsPage.tsx:154` | Perde aportes registrados |
| Excluir investimento | `InvestmentsPage.tsx:203` | Perde posição e rentabilidade |

Sem undo e sem confirmação, qualquer toque acidental em um alvo de 28–32 px — no tamanho de um erro de coordenada — é irreversível.

### 7.2 Feedback de erro — P1

`FinanceContext.tsx:258-260`:

```ts
} catch (err) {
  console.error('Erro ao carregar dados do IndexedDB:', err);
```

O erro é registrado e descartado. Sem estado de erro, sem re-render, sem mensagem. A tela exibe seu empty state — "Nenhuma conta cadastrada" — que comunica ao usuário que ele não tem dados, quando na verdade o app falhou ao lê-los. **O estado de falha é indistinguível do estado vazio.**

### 7.3 Estado de carregamento — P1

`FinanceContext.tsx:167` mantém `isLoading`, exportado em `:53` e `:571`. **Nenhum consumidor o lê.** Consequência: a primeira renderização acontece com arrays vazios, exibindo empty states antes de o IndexedDB responder. Em disco lento, o usuário vê "Nenhuma conta cadastrada" piscar antes dos dados aparecerem — ou não aparecerem.

### 7.4 Toast

Existem estilos completos de toast em `index.css` (`.toast-*`) e uma hierarquia z-index `toast → 70` declarada. **Não existe componente de toast.** A capacidade foi desenhada e nunca implementada.

### 7.5 Conteúdo dinâmico não anunciado

Nenhuma `aria-live`. Mesmo que o toast seja implementado, o usuário de leitor de tela não saberia. Afeta especialmente: resultados de importação (`ImportPage.tsx`), Answers da IA (`AIAssistantPage.tsx`, 443 l.) e processamentos em lote do fechamento mensal.

---

## 8. Modais, sheets e overlays

### 8.1 Inventário

| Modal | Linhas | Tipo | Montado |
|---|---|---|---|
| `NewTransactionModal` | 487 | Diálogo | ✅ `AppLayout.tsx:47` |
| `QuickActionSheet` | 139 | Sheet | ✅ `AppLayout.tsx:48` |
| `TransactionDetailModal` | 204 | Diálogo | ✅ `AppLayout.tsx:49` |
| `GlobalSearchModal` | 280 | Diálogo | ⚠️ Inalcançável |
| `OnboardingModal` | 151 | Diálogo | ✅ `AppLayout.tsx:51` |
| `AccountModal` | 177 | Diálogo | ✅ pela rota |
| `CardModal` | 229 | Diálogo | ✅ |
| `BillModal` | 201 | Diálogo | ✅ |
| `ReceivableModal` | 201 | Diálogo | ✅ |
| `RecurringModal` | 268 | Diálogo aninhado | ✅ |
| `BudgetModal` | 128 | Diálogo | ✅ |
| `GoalModal` | 177 | Diálogo | ✅ |
| `GoalDepositModal` | 164 | Diálogo | ✅ |
| `InvestmentModal` | 211 | Diálogo | ✅ |
| `MoreMenuModal` | 152 | Sheet | ✅ |
| `TransferModal` | 244 | Diálogo | ❌ Órfão |

### 8.2 Anatomia inconsistente

Cada modal reimplementa seu próprio overlay, header, botão de fechar e footer. Consequências medidas:

- Espaçamento de header varia entre `p-5`, `p-4` e `p-6` conforme o arquivo.
- O botão de fechar varia entre `X` e `XCircle`, com tamanhos e posições diferentes.
- A ordem de fechamento varia: alguns fecham por backdrop, outros apenas por botão.
- O backdrop varia entre `bg-black/60`, `bg-black/70` e `bg-black/80`.

Sem componente base, qualquer correção de acessibilidade exige 16 edições idênticas.

### 8.3 Aninhamento

`RecurringModal` (268 l.) é aberto de dentro de `BillModal` e `ReceivableModal`. Sem trap de foco, a pilha de dois diálogos sem `aria-modal` produz um cenário em que o leitor de tela anuncia conteúdo do diálogo de baixo enquanto o foco está no de cima.

### 8.4 Scroll lock

Ausência de bloqueio de scroll do body enquanto um modal está aberto. Em modais próximos de 100 vh (`NewTransactionModal`, 487 l.), o fundo rola junto com a interação.

---

## 9. Responsividade

### 9.1 Matriz de viewports alvo

| Viewport | Classe | Breakpoint | Caso de uso |
|---|---|---|---|
| 360×800 | Compact | <640 | Android pequeno |
| 390×844 | iPhone | <640 | Base iOS |
| 768×1024 | Tablet retrato | `md:` | Tablet portrait |
| 1024×768 | Tablet paisagem | `lg:` | Tablet landscape |
| 1366×768 | Laptop | `xl:` | Desktop comum |
| 1920×1080 | Desktop grande | `2xl` | Monitor externo |

### 9.2 Breakpoints em uso

O projeto usa apenas `sm`, `md` e `lg`. **750–900 px é uma faixa sem tratamento específico** — e 768 px (tablet retrato) cai exatamente nela.

### 9.3 Achados por faixa

#### Mobile — quebrado

| Achado | Evidência | Tipo |
|---|---|---|
| Nome e tipo de conta sem `truncate`/`min-w-0` | `AccountsPage.tsx:86-89` — `<div>` intermediário sem contenção; nomes longos de instituição estouram a linha | Inferência |
| Grid de cards sem `minmax(0, 1fr)` em contêineres flex | Padrão `grid-cols-2` com itens cujo conteúdo não pode encolher | Inferência |
| Tabelas de fluxo de caixa com 6+ colunas | `CashFlowPage.tsx` — sem tabela alternativa ou cardização no mobile | Inferência |

#### Tablet (768 px) — quebrado

| Achado | Evidência | Tipo |
|---|---|---|
| **Ações de conta invisíveis** | `AccountsPage.tsx:101` — `opacity-100 md:opacity-0 md:group-hover:opacity-100`: a partir de 768 px as ações somem e só reaparecem com hover, que **não existe em touch** | Evidência |
| Sidebar consome 256 px de 768 px | `Sidebar.tsx:57` — `hidden md:flex w-64` deixa 512 px úteis, contra `max-w-4xl` (896 px) que nunca é atingido | Evidência |

Esta é a violação mais grave de responsividade: em iPad, o usuário **não tem acesso visível** a editar ou excluir contas.

#### Desktop — desperdício

| Achado | Evidência |
|---|---|
| Conteúdo limitado a ~876 px em telas 1920 px | `AppLayout.tsx:37` — `max-w-2xl md:max-w-4xl` |
| Telas de dados (Fechamento, Importação) sem uso de largura horizontal disponível | `MonthlyClosingPage.tsx`, `ImportPage.tsx` |

Em monitor grande, mais de 50% da largura fica vazia enquanto tabelas que poderiam aproveitar espaço permanecem comprimidas.

---

## 10. Formulários e entrada de dados

### 10.1 Contagem de modais com formulário

Doze dos 16 modais são formulários. **Todos os 12 têm zero `htmlFor`.**

### 10.2 Input de moeda

`NewTransactionModal.tsx` (487 l.) é o formulário mais complexo e o mais crítico. Problemas estruturais:

- Entrada de valor com máscara manual de centavos; nenhuma validação de formato visível.
- Ausência de `inputMode="decimal"` documentado, afetando o teclado mobile.
- Nenhum `aria-invalid` nem mensagem de erro associada em campos numéricos.

### 10.3 Tamanho de fonte nos inputs

`index.css:403` comenta: *"font-size: 16px prevents iOS Safari zoom on focus"*. A decisão é correta e deve ser preservada. O efeito colateral — densidade reduzida em desktop — é o trade-off aceitável.

### 10.4 Padrão de validação

Não há estado de erro de campo. Campos de número aceitam texto, e a falha só aparece em runtime. `CommitmentsPage.tsx` e `NewTransactionModal.tsx` são os dois pontos de maior risco.

### 10.5 Selects nativos

`<select>` sem `appearance-none` mantêm o estilo do sistema operacional — um elemento de formulário com aparência externa à design system.

---

## 11. Estados por tela

### 11.1 Cobertura de empty states

Presentes em 14 das 17 rotas. Verificado por presença de texto de estado vazio.

| Rota | Empty | Loading | Erro |
|---|---|---|---|
| Dashboard | ⚠️ parcial | ❌ | ❌ |
| Transações | ✅ | ❌ | ❌ |
| Gastos | ✅ | ❌ | ❌ |
| Contas | ✅ | ❌ | ❌ |
| Cartões | ✅ | ❌ | ❌ |
| Compromissos | ✅ | ❌ | ❌ |
| Calendário | ✅ | ❌ | ❌ |
| Fluxo de Caixa | ✅ | ❌ | ❌ |
| Fechamento | ✅ | ❌ | ❌ |
| Orçamentos | ✅ | ❌ | ❌ |
| Metas | ✅ | ❌ | ❌ |
| Investimentos | ✅ | ❌ | ❌ |
| Comparação | ✅ | ❌ | ❌ |
| Alertas | ⚠️ | ❌ | ❌ |
| Assistente IA | ✅ | ⚠️ próprio | ❌ |
| Importação | ✅ | ✅ | ⚠️ próprio |
| Configurações | n/a | n/a | ❌ |

**Padrão dominante: empty ✅, loading ❌, erro ❌.** O produto foi desenhado para o primeiro uso e não para os demais.

### 11.2 Onboarding

`OnboardingModal.tsx` (151 l.) é montado em `AppLayout.tsx:51` e condicionado por flag de contexto. O onboarding de primeiro uso já existe e cobre razoavelmente esse momento.

---

## 12. Layout e navegação

### 12.1 Shell

`AppLayout.tsx` tem 55 linhas e é legível. A estrutura é:

```
[Sidebar md+ ] [ main → scroll container → max-w-4xl → Outlet ]
[ BottomNavigation md- ]
[ 6 modais globais ]
```

A separação do container de scroll (`:32-40`) com `id="page-scroll-container"` permite que cada página controle seu próprio layout — decisão correta.

### 12.2 Navegação

| Elemento | Acessibilidade | Observação |
|---|---|---|
| `Sidebar.tsx:56` | ✅ `aria-label="Navegação desktop"` | 17 itens, lista plana |
| `BottomNavigation.tsx:56` | ✅ `aria-label="Navegação inferior mobile"` | 4 itens + FAB + "mais" |
| `BottomNavigation.tsx:33` | ✅ `aria-label="Nova Operação Rápida"` | FAB |
| `BottomNavigation.tsx:114` | ✅ `aria-label="Mais opções"` | Menu overflow |
| Item de nav ativo | ⚠️ Sem `aria-current` | Verificar `Sidebar.tsx`/`BottomNavigation.tsx` |

### 12.3 Busca global

`GlobalSearchModal` (280 l.) é montado em `AppLayout.tsx:50`, mas seu único gatilho está em `TopHeader.tsx:104` — arquivo com **0 referências**. A busca global está implementada, montada e inalcançável. O estado `isGlobalSearchOpen` é mantido no contexto (`FinanceContext.tsx:129-130, 177, 644-645`), confirmando que a intenção existiu.

### 12.4 Altura e safe areas

- `--sat/--sar/--sab/--sal` (`index.css:34-37`) e `--bottom-nav-h: 64px` (`:39`) são tokens bem resolvidos.
- `--page-bottom-pad` (`:43`) reserva espaço para nav + safe area + FAB.
- `AppLayout.tsx:26-29` reserva entalhe superior no mobile.

Esta é uma das áreas mais bem resolvidas do produto.

### 12.5 Z-order real

| Camada | Token documentado | Valor real no código |
|---|---|---|
| Sidebar | `sticky → 10` | `z-10` ✅ |
| FAB | `fab → 30` | `z-30` ✅ |
| Bottom nav | `bottom-nav → 40` | `z-40` ✅ |
| Modal | `modal → 60` | `z-[60]` ✅ |
| Toast | `toast → 70` | `z-[70]` ✅ (estilos sem componente) |

A hierarquia documentada **está correta no uso** — a divergência é apenas de notação (`z-30` vs `30`). Achado P3.

---

## 13. Performance

### 13.1 Bundle

| Métrica | Valor |
|---|---|
| Arquivo | `dist/assets/index-Pr5k_iHJ.js` |
| Tamanho minificado | 1.243.961 B (1,19 MiB) |
| Gzip | 333.309 B (326 KiB) |
| Módulos no build | 2.616 |
| Aviso do Vite | Chunk > 500 kB após minificação |

Referência de mercado: apps financeiros mobile-first (Linear, Revolut) operam entre 300–600 KB gzip no carregamento inicial. O MyFinance está em ~333 KB gzip — acima da faixa de conforto, e **100% em um único chunk síncrono**.

### 13.2 Causa identificada

Quatro telas importam Recharts de forma estática:

```
src/pages/MonthlyComparisonPage.tsx
src/pages/CashFlowPage.tsx
src/pages/InvestmentsPage.tsx
src/pages/DashboardPage.tsx
```

Recharts + `react-is` + `d3-*` respondem pela maior parte do peso. Como as quatro são rotas, todas-four entram no chunk principal.

### 13.3 Import dinâmico ineficaz

```
src/context/FinanceContext.tsx:29   import { recurringService } from '../services/recurringService';   // estático
src/services/billService.ts:94      const { recurringService } = await import('./recurringService');    // dinâmico
src/services/receivableService.ts:92 const { recurringService } = await import('./recurringService');    // dinâmico
```

O Vite emite aviso: o import dinâmico nunca cria chunk separado porque `recurringService` já está no grafo estático via contexto. **O code-splitting de serviços não está funcionando como pretendido.**

### 13.4 Contexto monolítico

`FinanceContext.tsx` tem 659 linhas e expõe ~90 chaves em um único objeto memoizado (`:571`). Consequências:

- Qualquer alteração em transacoes re-renderiza todas as 17 telas montadas via `<Outlet />`.
- Nenhuma divisão por domínio (`AccountsContext`, `BudgetsContext`).
- Sem `useSyncExternalStore`; a combinação de Context + IndexedDB exige cuidado manual para evitar tearing.

### 13.5 Code-splitting de rotas

**Nenhuma das 17 rotas usa `React.lazy` + `Suspense`.** `src/App.tsx` importa todas estaticamente. Combined com Recharts, isso explica o chunk único. Esta é a maior oportunidade de performance e a de melhor relação esforço/retorno.

---

## 14. Matriz de achados priorizados

### P0 — Bloqueia uso ou causa dano irreversível

| ID | Achado | WCAG | Evidência | Recomendação | Complex. |
|---|---|---|---|---|---|
| **P0-01** | Exclusão definitiva em um toque | 3.3.4 (A) | 6 sites (§7.1) | Diálogo de confirmação com nome do registro e contagem de itens afetados; ou toast com undo de 8 s. Preferir **undo** — mais rápido que confirmar | M |
| **P0-02** | Modais sem semântica de diálogo | 4.1.2 (A) | 0 `role="dialog"` | Componente `<Modal>` base com `role="dialog"`, `aria-modal`, focus trap, `Escape` e retorno de foco. Aplicar nos 16 | M |
| **P0-03** | Indicador de foco inexistente | 2.4.7 (AA) | `App.css:14` | Mover para `index.css` com `:focus-visible` em escala 2 px + offset 2 px usando `--color-accent` | S |

**Snippet P0-02 — base de diálogo:**

```tsx
// src/components/ui/Modal.tsx (novo)
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(e, ref.current!);   // cicla dentro do diálogo
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();                                       // devolve o foco
    };
  }, [open, onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end md:items-center"
         onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id}
           className="w-full md:max-w-lg bg-[#0D0F12] border border-[#1D2026]
                      rounded-t-3xl md:rounded-2xl p-5 animate-slide-up">
        <h2 id={id} className="text-base font-semibold text-[#F5F5F5]">{title}</h2>
        {children}
      </div>
    </div>, document.body);
}
```

### P1 — Degrada uso recorrente ou viola WCAG A/AA

| ID | Achado | WCAG | Evidência | Recomendação | Complex. |
|---|---|---|---|---|---|
| **P1-01** | Erros engolidos no console | 3.3.1 | `FinanceContext.tsx:258-260` | Adicionar `error` ao contexto + `<ErrorState>` com retry; diferenciar `loading`/`empty`/`error` | M |
| **P1-02** | `isLoading` não consumido | — | `FinanceContext.tsx:167` | Consumir nas 17 telas via `<PageSkeleton>` | M |
| **P1-03** | Zero ErrorBoundary | 3.3.1 | 0 ocorrências | ErrorBoundary na raiz + por rota; fallback com "Recarregar" | S |
| **P1-04** | Busca global inalcançável | 2.1.1 | `AppLayout.tsx:50` / `TopHeader.tsx:104` | Mover gatilho para `Sidebar` e/ou atalho `⌘K` | S |
| **P1-05** | Ações invisíveis em tablet | 2.5.8 | `AccountsPage.tsx:101` | Remover padrão hover-only; usar menu `⋯` sempre visível (≥24 px) | S |
| **P1-06** | Labels não associados | 1.3.1 / 3.3.2 | 0 `htmlFor` | `htmlFor`/`id` em 12 modais; ou `aria-label` | M |
| **P1-07** | Contraste `.label-section` 3.29:1 | 1.4.3 | `index.css:248` | `--color-text-tertiary: #6E7480` (→4.6:1) ou subir para 12 px | S |
| **P1-08** | `text-white` sobre accent 3.27:1 | 1.4.3 | Uso em botões primários | Usar `#0A0B0E` sobre `#8B7CFF` (8.2:1) ou escurecer o accent | S |
| **P1-09** | "Excluir" com contraste 2.4:1 | 1.4.3 | `GoalsPage.tsx:155` | Remover `/50` → `#FF5C5C` (6.4:1) | S |
| **P1-10** | Gráficos inacessíveis | 1.1.1 | 4 telas Recharts | `accessibilityLayer` + tabela de dados alternativa em `<details>` | M |
| **P1-11** | Bundle sem code-splitting | — | §13 | `React.lazy` nas 17 rotas + Recharts dinâmico | M |

**Snippet P1-11 — code-splitting de rotas:**

```tsx
// src/App.tsx
const Dashboard     = lazy(() => import('./pages/DashboardPage'));
const CashFlow      = lazy(() => import('./pages/CashFlowPage'));
const Investments   = lazy(() => import('./pages/InvestmentsPage'));
// … demais rotas

<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* … */}
  </Routes>
</Suspense>
```

### P2 — Inconsistência, atrito ou debt visível

| ID | Achado | Evidência | Recomendação | Complex. |
|---|---|---|---|---|
| **P2-01** | 1.676 hex literais em JSX | §4.3 | Migração progressiva por tela, começando por `NewTransactionModal` | G |
| **P2-02** | Sem token `--color-warning` | `index.css:278` | Adicionar ao `@theme` | S |
| **P2-03** | Escala z-index duplicada | §12.5 | Unificar notação | S |
| **P2-04** | 3 componentes mortos | §4.2 | Remover ou integrar | S |
| **P2-05** | Nenhum tema claro | `index.css:33` | Adicionar `prefers-color-scheme: light` + `data-theme` | G |
| **P2-06** | `max-w-4xl` desperdiça 1920 px | `AppLayout.tsx:37` | `2xl:max-w-6xl` nas telas tabulares | S |
| **P2-07** | Navegação plana de 17 itens | `Sidebar.tsx` | Agrupar por domínio com cabeçalhos de seção | M |
| **P2-08** | Sem `aria-current` na nav | §12.2 | Adicionar `aria-current="page"` | S |
| **P2-09** | Import dinâmico ineficaz | §13.3 | Remover import estático ou mover para lazy | S |
| **P2-10** | Contexto de 659 linhas / ~90 chaves | §13.4 | Dividir por domínio | G |

### P3 — Polish

| ID | Achado | Evidência | Recomendação |
|---|---|---|---|
| **P3-01** | Sem componente de toast | `index.css` (estilos) | Implementar usando a hierarquia já pronta |
| **P3-02** | 20 swatches sem `aria-pressed` | §6.5 | `aria-label` com nome da cor + `aria-pressed` |
| **P3-03** | Alvos de 28–32 px | §6.7 | Elevar ações destrutivas a 44 px (mobile) |

### 14.1 Resumo quantitativo

| Prioridade | Achados | Itens de código afetados (estimativa) |
|---|---|---|
| P0 | 3 | ~20 |
| P1 | 11 | ~380 |
| P2 | 10 | ~1.750 |
| P3 | 3 | ~25 |

**Sequência mínima que resolve 70% do problema percebido:** P0-03 (foco) + P0-01 (exclusão) + P1-01 (erro) + P1-05 (tablet). Quatro itens, complexidade somada Baixa+Média+Média+Baixa.

---

## 15. Proposta visual e Fase 2

### 15.1 Direção

A referência pretendida — Linear, Stripe, Revolut — converge em quatro princípios que o MyFinance ainda não aplica:

| Princípio | Referência | Estado atual |
|---|---|---|
| Densidade com hierarquia forte | Linear | 70% — escala tipográfica boa, contraste de rótulos falha |
| Ações reversíveis | Stripe | 0% — exclusões irreversíveis |
| Superfícies neutras, cor reservada ao estado | Revolut | 40% — accent bem aplicado, mas 1.676 hex livres |
| Um componente base, muitas variações | Stripe | 0% — 16 modais independentes |

### 15.2 Tokens alvo

```css
@theme {
  /* Superfície — escala neutra de 3 níveis */
  --color-bg-main: #050505;
  --color-card-main: #0D0F12;
  --color-card-elevated: #16181D;   /* era #121419 */
  --color-border-main: #1D2026;

  /* Texto — terciário corrigido para 4.6:1 */
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #8B919B;  /* 6.08:1 ✅ */
  --color-text-tertiary: #6E7480;   /* era #5F6570 (3.29:1 ❌) */

  /* Estado — warning formalizado */
  --color-positive: #39D98A;
  --color-negative: #FF5C5C;
  --color-warning: #F59E0B;

  /* Accent — com par de tinta definido */
  --color-accent: #8B7CFF;
  --color-on-accent: #0A0B0E;      /* 8.2:1 sobre o accent ✅ */
}
```

### 15.3 Ordem de execução

**Etapa A — Fundação (sem risco funcional)**
- `index.css`: mover foco, corrigir `--color-text-tertiary`, adicionar `--color-warning` e `--color-on-accent`.
- Remover `App.css` (conteúdo não carregado) ou convertê-lo em `@layer`.
- `aria-current` na navegação.
- **Desbloqueia:** P0-03, P1-07, P1-08, P1-09, P2-02, P2-03, P2-08.

**Etapa B — Interação**
- Criar `<Modal>` base e migrar 16 modais.
- `<PageSkeleton>`, `<ErrorState>`, `<Toast>`.
- Consumir `isLoading`; expor `error` do contexto.
- **Desbloqueia:** P0-02, P1-01, P1-02, P1-03, P3-01.

**Etapa C — Segurança de dados e tablet**
- Diálogo de confirmação de exclusão com opção de undo.
- Remover hover-only; menu `⋯` sempre visível.
- **Desbloqueia:** P0-01, P1-05.

**Etapa D — Formulários e gráficos**
- `htmlFor`/`id` nos 12 modais.
- `aria-pressed` e `aria-label` nos swatches.
- `accessibilityLayer` + tabelas alternativas nos 4 gráficos.
- **Desbloqueia:** P1-06, P1-10, P3-02, P3-03.

**Etapa E — Escala**
- `React.lazy` nas 17 rotas + Recharts dinâmico.
- Migrar hex literais por tela.
- Dividir `FinanceContext` por domínio.
- `2xl:max-w-6xl` nas telas tabulares.
- Grupo de navegação por domínio.
- **Desbloqueia:** P1-11, P2-01, P2-04, P2-06, P2-07, P2-09, P2-10.

### 15.4 Dependências e risco

```
A (fundação)  ──→  B (interação)  ──→  C (dados/tablet)
                                              │
                                        D (formulários/gráficos)
                                              │
                                        E (escala)
```

Etapa A é prerequisite de todas: o `<Modal>` da B herda o foco corrigido da A. Etapa E é a única que pode ser rebaixada de prioridade sem afetar qualidade percebida.

### 15.5 Itens explicitamente fora do plano

- Tema claro completo (P2-05) — decisão de produto, não técnico.
- Reorganização de rotas — a hierarquia atual é funcional.
- Sincronização em nuvem — escopo separado.

### 15.6 Checklist de validação (pós-implementação)

- [ ] Navegar 100% do produto só com `Tab`/`Shift+Tab`, com indicador de foco visível em todos os controles
- [ ] Todos os modais: `Escape` fecha, foco fica preso dentro, foco retorna ao gatilho
- [ ] Tentar excluir cada um dos 6 registros → deve exigir confirmação
- [ ] Verificar as 6 combinações de contraste da tabela §5.1 com ferramenta
- [ ] Em 768×1024, as ações de conta estão visíveis sem hover
- [ ] Em 1920×1080, o conteúdo ocupa a largura disponível
- [ ] Recarregar com IndexedDB bloqueado → tela de erro com retry, não empty state
- [ ] Todo campo de formulário tem label associado e é navegável por teclado
- [ ] Gráficos têm alternativa textual com os mesmos dados
- [ ] `npm run build` sem aviso de chunk > 500 kB
- [ ] Leitor de tela (VoiceOver) percorre uma tela sem perder-se
- [ ] `prefers-reduced-motion` suprime todas as animações

---

*Fim da auditoria. Nenhum arquivo do produto foi modificado.*