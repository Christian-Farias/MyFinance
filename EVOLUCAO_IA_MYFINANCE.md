# EVOLUÇÃO INTELIGENTE DO MOTOR LOCAL DE IA | MYFINANCE (FASE 4)

## 1. Visão Geral e Missão Cumprida

Nesta **Fase 4**, o motor local de inteligência artificial do **MyFinance** ("Neguin 🐒") foi transformado em um assistente financeiro local altamente flexível, determinístico, contextual e seguro. 

O sistema opera **100% no dispositivo (on-device)** sem chamadas a modelos externos (LLMs na nuvem), garantindo privacidade total dos dados sensíveis do usuário, latência zero de rede e previsibilidade matemática absoluta em todos os cálculos.

---

## 2. Limitações da Implementação Anterior

Antes da Fase 4, a análise da implementação revelou:
1. **Fragrância de Regex e Palavras-chave Rígidas**: Perguntas semanticamente equivalentes ("Qual foi meu gasto total no mês atual?", "Quanto saiu da minha conta neste mês?") não eram reconhecidas ou caíam no fallback genérico `UNKNOWN`.
2. **Interpretação Temporal Básica**: O `dateParser.ts` reconhecia apenas ontem, amanhã, mês passado e semana passada. Não suportava nomes de meses ("outubro", "em setembro de 2026"), janelas móveis ("últimos 30 dias", "últimos 3 meses"), trimestres (Q1..Q4) nem intervalos ("entre os dias 5 e 20").
3. **Memória Conversacional Restrita**: O contexto apenas guardava `lastIntent` e `lastCategoryQuery`. Diálogos com elipses encadeadas falhavam:
   - Exemplo anterior que quebrava:
     1. "Quanto gastei com alimentação este mês?"
     2. "E no mês passado?" (perdia a categoria)
     3. "E transporte?" (perdia o período do mês passado)
     4. "Agora compara os dois." (impossível comparar, pois não havia memória das 2 últimas entidades).
4. **Consultas Financeiras Incompletas**: Não existiam ferramentas determinísticas para comparar categorias entre si, consultar carteira de investimentos, listar extrato filtrado, simular poupança mensal para metas nem visualizar despesas fixas recorrentes.
5. **Respostas Mecânicas e Visuais Limitados**: Ausência de suporte a gráficos de progresso para metas/simulações e ausência de avisos visuais ricos quando orçamentos eram excedidos.

---

## 3. Arquitetura Modular Evoluída

A arquitetura do motor foi refinada em módulos desacoplados com responsabilidades claras:

```
src/financialAI/
├── types/
│   └── index.ts                 # Definição de intenções, parâmetros, contexto e visuais
├── parsers/
│   ├── entityExtractor.ts       # Normalização (NFD/diacríticos), sinônimos e extração de entidades
│   ├── dateParser.ts            # Parser temporal avançado (relativo, nominal, rolling windows, trimestres)
│   ├── amountParser.ts          # Parser de valores (R$, centavos, números compostos por extenso, gírias)
│   └── intentParser.ts          # Classificador hierárquico com pontuação e tolerância informal
├── contextResolver.ts           # Resolução de diálogos multi-turno, elipses e rotação de memória
├── tools/
│   └── financialTools.ts        # Consultas determinísticas (saldos, faturas, extrato, comparações, investimentos)
├── calculators/
│   └── financialAICalculators.ts# Diagnóstico de saúde financeira e viabilidade de compras (Can I Spend?)
├── providers/
│   └── LocalAIProvider.ts       # Orquestrador local integrando parsing, memória, planejamento e resposta
├── actionPlanner.ts             # Planejador seguro de planos de ação (criações, mutações e exclusões)
├── actionExecutor.ts            # Executor com validação de confirmação explícita
├── confirmationService.ts       # Processador de confirmação via chat ("sim", "confirmar", "cancelar")
├── responseGenerator.ts         # Geração de linguagem natural rica, widgets visuais e alerta "Katrovou 🐒"
└── financialAI.test.ts          # Suíte de testes automatizados com cobertura ponta a ponta
```

---

## 4. Pipeline de Interpretação em 8 Etapas

Cada consulta do usuário passa sequencialmente pelo seguinte fluxo:

1. **Normalização do Texto**: Conversão para minúsculas, remoção de diacríticos com `normalize('NFD')`, limpeza de pontuações preservando símbolos financeiros.
2. **Interpretação Temporal (`dateParser.ts`)**:
   - Dias relativos: `hoje`, `ontem`, `anteontem`, `amanhã`.
   - Meses nominais: `janeiro` a `dezembro`, com ano opcional (ex: `outubro`, `de setembro de 2026`).
   - Janelas móveis (`isRollingWindow`): `últimos 7 dias`, `últimos 15 dias`, `últimos 30 dias`, `últimos 3 meses`, `últimos 6 meses`, `últimos 12 meses`.
   - Trimestres: `1º trimestre / Q1`, `2º trimestre / Q2`, `3º trimestre / Q3`, `4º trimestre / Q4`.
   - Intervalos e dias: `entre os dias 5 e 20`, `desde o início do mês`, `dia 10`.
3. **Extração de Entidades (`entityExtractor.ts` & `amountParser.ts`)**:
   - **Valores**: Suporte a R$ 1.500,50, 50,00, termos coloquiais (`50 pila`, `100 conto`), e numerais por extenso compostos (`cento e cinquenta`, `dois mil e quinhentos`, `dez mil`).
   - **Categorias**: Mapeamento inteligente por aliases e sinônimos (ex: refeição/supermercado/almoço -> Alimentação; uber/gasolina/etanol -> Transporte; aluguel/luz/condomínio -> Moradia; cinema/viagem/steam -> Lazer; etc.). Suporta extração simultânea de 2 categorias para comparação.
   - **Contas e Cartões**: Correspondência por nome da instituição (Nubank, Itaú, Inter, Carteira) e identificação de conta de origem vs destino para transferências.
   - **Metas**: Reconhecimento de metas cadastradas pelo usuário.
4. **Classificação de Intenção (`intentParser.ts`)**:
   - Cobertura ampla: consultas (`GET_BALANCE`, `GET_ACCOUNTS`, `GET_EXPENSES`, `GET_INCOME`, `GET_TRANSACTIONS`, `GET_CATEGORY_SPENDING`, `GET_CATEGORY_COMPARISON`, `GET_MONTHLY_COMPARISON`, `GET_CARD_BILL`, `GET_INSTALLMENTS`, `GET_BILLS`, `GET_RECEIVABLES`, `GET_RECURRING`, `GET_FORECAST`, `GET_BUDGET`, `GET_GOAL`, `SIMULATE_GOAL`, `GET_INVESTMENTS`, `GET_FINANCIAL_HEALTH`, `CAN_I_SPEND`), ações (`CREATE_EXPENSE`, `CREATE_INCOME`, `CREATE_TRANSFER`, `CREATE_BILL`, `CREATE_GOAL`, `CREATE_BUDGET`, `DELETE_TRANSACTION`) e ajuda/saudação (`HELP_GREETING`).
5. **Resolução de Contexto (`contextResolver.ts`)**:
   - Tratamento de elipses ("E no mês passado?", "E transporte?", "Agora compara os dois").
   - Herança de datas e categorias do turno anterior.
   - Rotação de memória para comparação de 2 categorias consecutivas.
   - Regra de expiração temporal (10 minutos) e descarte de contaminação ao trocar de assunto.
6. **Avaliação de Confiança**: Cálculo de `confidence` (0.0 a 1.0) garantindo que consultas vagas retornem pedido de esclarecimento amigável.
7. **Detecção de Ambiguidades**: Proteção contra ações não determinísticas quando os parâmetros forem vagos.
8. **Planejamento e Execução Segura**: Classificação de risco (`LOW`, `MEDIUM`, `HIGH`) e bloqueio de execução automática sem confirmação explícita do usuário.

---

## 5. Novos Recursos de Raciocínio Financeiro Determinístico

1. **Comparativo Entre Duas Categorias (`GET_CATEGORY_COMPARISON`)**:
   - Compara gastos de 2 categorias (ex: Alimentação vs Transporte) no período especificado.
   - Apresenta diferença absoluta em reais, variação percentual e widget visual comparativo lado a lado.
2. **Simulação de Metas (`SIMULATE_GOAL`)**:
   - Calcula deterministicamente a economia mensal necessária para atingir uma meta em N meses.
   - Exibe barra de progresso visual com percentual concluído e montante restante.
3. **Resumo de Investimentos (`GET_INVESTMENTS`)**:
   - Total aplicado vs valor atual, rentabilidade em R$ e %, e quebra por classe de ativos.
4. **Extrato Filtrado (`GET_TRANSACTIONS`)**:
   - Listagem rápida das últimas movimentações com badge de entrada/saída e categoria.
5. **Despesas Fixas e Recorrentes (`GET_RECURRING`)**:
   - Total mensal comprometido em assinaturas e recorrências fixas ativas.
6. **Alertas e Personalidade ("Katrovou 🐒")**:
   - O assistente insere o bordão solicitado `"Katrovou 🐒"` exatamente nos cenários de indicadores desfavoráveis:
     - Gastos aumentaram em relação ao mês anterior no comparativo mensal.
     - Compra simulada que deixaria o saldo negativo ou margem perigosa (`CAN_I_SPEND`).
     - Saldo projetado para os próximos 30 dias for negativo (`GET_FORECAST`).
     - Saúde financeira com diagnóstico `'atenção'` ou `'crítico'` (`GET_FINANCIAL_HEALTH`).
     - Orçamento mensal de alguma categoria for estourado (`GET_BUDGET`).
     - Rentabilidade acumulada de investimentos for negativa (`GET_INVESTMENTS`).

---

## 6. Resultados dos Testes Automatizados

A suíte de testes do projeto foi ampliada e executada via **Vitest**:

* **Total de Test Files**: 8 passed (8)
* **Total de Testes**: **98 passed (98)**
* **Tempo de Execução**: ~4.7s
* **Taxa de Sucesso**: **100%**

### Principais Cenários Validados no `financialAI.test.ts`:
- ✅ Interpretação de dias relativos (`hoje`, `ontem`, `anteontem`, `amanhã`).
- ✅ Reconhecimento de meses nominais com/sem ano (`outubro`, `setembro de 2026`).
- ✅ Janelas móveis (`últimos 30 dias`) vs meses de calendário (`mês passado`).
- ✅ Intervalos de dias (`entre os dias 5 e 20`).
- ✅ Trimestres (`Q1`, `primeiro trimestre`).
- ✅ Valores monetários formais e coloquiais (`R$ 1.500,50`, `50 pila`, `100 conto`, `cento e cinquenta reais`, `dez mil`).
- ✅ Múltiplas formulações para a mesma intenção de despesa.
- ✅ Sinônimos informais de categorias (`comida`, `uber`, `luz`).
- ✅ Diálogo multi-turno encadeado em 4 etapas com elipses e comparação final.
- ✅ Simulação de metas e cálculo de aporte mensal necessário.
- ✅ Disparo determinístico de `"Katrovou 🐒"` em orçamentos estourados e compras inviáveis.
- ✅ Segurança: bloqueio de execução de planos não confirmados (`status: pending`).

---

## 7. Status do Build de Produção

A compilação de produção com o Vite (`npm run build`) foi executada com sucesso total:
```
dist/assets/index-D_m2kYgA.css         87.49 kB │ gzip:  15.11 kB
dist/assets/vendor-forms-Dk07-LgO.js   18.17 kB │ gzip:   6.35 kB
dist/assets/vendor-icons-D_49e7tW.js   30.01 kB │ gzip:   7.93 kB
dist/assets/vendor-charts-D4P1rKxJ.js 164.24 kB │ gzip:  53.07 kB
dist/assets/index-DRm1d6-8.js         411.02 kB │ gzip: 122.18 kB
✓ built in 8.35s
```
Zero erros de TypeScript e zero advertências de lint.

---

## 8. Limitações Restantes e Recomendações Futuras

1. **Linguagem Natural Extremamente Imprecisa**: Expressões que misturam múltiplos tópicos desconexos em uma única frase ("quanto gastei no mercado e me diz a previsão do tempo para amanhã") são classificadas com baixa confiança e acionam o pedido amigável de esclarecimento.
2. **Suporte a Histórico de Mais de 2 Categorias**: O sistema armazena a categoria atual e a imediatamente anterior para permitir "compara os dois". Comparações de 3 ou mais categorias simultâneas no diálogo em elipse podem ser adicionadas futuramente.
