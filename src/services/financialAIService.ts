import type { 
  Transaction, 
  Account, 
  CreditCard, 
  Budget, 
  Goal, 
  Investment, 
  Category,
  Bill,
  Receivable,
  RecurringTransaction,
  Subscription,
  AIActionIntent
} from '../types';
import { 
  formatCurrency, 
  calculateTotalExpenses, 
  calculateTotalIncome, 
  calculateCategoryBreakdown,
  calculateBudgetUsage,
  calculateGoalProgress,
  calculateMonthlyComparison,
  calculateFixedVsVariableExpenses,
  calculateCostOfLiving,
  calculateSubscriptionsSummary,
  calculateProjectedCashFlow,
  calculateFutureCommitments,
  calculateTotalBalance
} from '../calculations/financialCalculations';

export interface FinancialAIContext {
  transactions: Transaction[];
  accounts: Account[];
  cards: CreditCard[];
  budgets: Budget[];
  goals: Goal[];
  investments: Investment[];
  categories: Category[];
  bills?: Bill[];
  receivables?: Receivable[];
  recurringRules?: RecurringTransaction[];
  subscriptions?: Subscription[];
  currentYearMonth: string;
}

export interface AIResponse {
  answer: string;
  category?: string;
  highlights?: Array<{ label: string; value: string }>;
  suggestedActions?: Array<{ label: string; link: string }>;
  actionIntent?: AIActionIntent;
}

export const financialAIService = {
  /**
   * Main entry point for financial queries and natural language action understanding
   */
  async ask(question: string, context: FinancialAIContext): Promise<AIResponse> {
    const q = question.toLowerCase().trim();
    const { 
      transactions, 
      accounts,
      cards, 
      budgets, 
      goals, 
      investments, 
      categories, 
      bills = [],
      receivables = [],
      recurringRules = [],
      subscriptions = [],
      currentYearMonth 
    } = context;

    // Filter current month transactions
    const currentMonthTxs = transactions.filter(t => t.date?.startsWith(currentYearMonth));
    const totalExpenses = calculateTotalExpenses(transactions, currentYearMonth);
    const totalIncome = calculateTotalIncome(transactions, currentYearMonth);
    const balanceResult = totalIncome - totalExpenses;
    const categoryBreakdown = calculateCategoryBreakdown(transactions, categories, currentYearMonth);
    const totalCurrentBalance = calculateTotalBalance(accounts);

    // ── 0. ACTION INTENT PARSING WITH MANDATORY CONFIRMATION ──

    // "Crie uma despesa de R$ 80 em alimentação" / "Adicionar gasto de 50 no uber"
    const expenseMatch = q.match(/(?:crie|criar|adicione|adicionar|registre|registrar|novo gasto|nova despesa)(?:\s+uma despesa|\s+um gasto|\s+gasto|\s+despesa)?\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(?:em|com|no|na|de)?\s*([a-záàâãéèêíïóôõöúçñ\s]+)?/i);
    if (expenseMatch && !q.includes('quanto') && !q.includes('como') && !q.includes('qual')) {
      const amountVal = parseFloat(expenseMatch[1].replace(',', '.'));
      const descCandidate = (expenseMatch[2] || 'Gasto geral').trim();
      const matchedCat = categories.find(c => descCandidate.toLowerCase().includes(c.name.toLowerCase())) || categories[0];

      return {
        answer: `Identifiquei uma solicitação para registrar uma nova despesa de **${formatCurrency(amountVal)}** (${descCandidate}).\n\nPor favor, confirme abaixo para salvar:`,
        highlights: [
          { label: 'Valor', value: formatCurrency(amountVal) },
          { label: 'Descrição', value: descCandidate },
          { label: 'Categoria', value: matchedCat?.name || 'Outros' }
        ],
        actionIntent: {
          actionType: 'create_expense',
          payload: {
            amount: amountVal,
            description: descCandidate,
            categoryId: matchedCat?.id || 'outros',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'account',
            accountId: accounts[0]?.id
          },
          confirmationPrompt: `Confirmar registro de despesa de ${formatCurrency(amountVal)} em "${descCandidate}"?`,
          status: 'pending_confirmation'
        }
      };
    }

    // "Transfira 200 da conta corrente para a carteira"
    const transferMatch = q.match(/(?:transfira|transferir|mova|mover)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
    if (transferMatch && accounts.length >= 2 && !q.includes('quanto')) {
      const amountVal = parseFloat(transferMatch[1].replace(',', '.'));
      const source = accounts[0];
      const dest = accounts[1];

      return {
        answer: `Identifiquei uma solicitação de transferência interna de **${formatCurrency(amountVal)}** de **${source.name}** para **${dest.name}**.\n\nTransferências não afetam suas despesas/receitas no mês. Confirme para processar:`,
        highlights: [
          { label: 'Valor', value: formatCurrency(amountVal) },
          { label: 'Origem', value: source.name },
          { label: 'Destino', value: dest.name }
        ],
        actionIntent: {
          actionType: 'transfer',
          payload: {
            amount: amountVal,
            sourceAccountId: source.id,
            destinationAccountId: dest.id,
            date: new Date().toISOString().split('T')[0]
          },
          confirmationPrompt: `Transferir ${formatCurrency(amountVal)} de ${source.name} para ${dest.name}?`,
          status: 'pending_confirmation'
        }
      };
    }

    // ── 1. PROJECTED BALANCE & CASH FLOW ──
    // "Quanto vou ter no fim do mês?" / "Como ficará meu saldo?" / "Saldo projetado"
    if (q.includes('fim do mês') || q.includes('saldo projetado') || q.includes('quanto vou ter') || q.includes('saldo futuro') || q.includes('previsão de saldo')) {
      const cashFlow = calculateProjectedCashFlow(accounts, transactions, bills, receivables, recurringRules, 30);
      return {
        answer: `Seu saldo em contas hoje é de **${formatCurrency(totalCurrentBalance)}**.\n\nConsiderando suas contas a pagar (${formatCurrency(cashFlow.totalOutflows)}) e receitas previstas (${formatCurrency(cashFlow.totalInflows)}) para os próximos 30 dias, seu **saldo final projetado** é de **${formatCurrency(cashFlow.projectedEndBalance)}**.\n\n*Esta é uma projeção financeira baseada nos seus compromissos e recorrências cadastrados.*`,
        highlights: [
          { label: 'Saldo Atual', value: formatCurrency(totalCurrentBalance) },
          { label: 'Receitas Previstas', value: `+${formatCurrency(cashFlow.totalInflows)}` },
          { label: 'Contas/Gastos Previstos', value: `-${formatCurrency(cashFlow.totalOutflows)}` },
          { label: 'Saldo Projetado', value: formatCurrency(cashFlow.projectedEndBalance) }
        ],
        suggestedActions: [
          { label: 'Ver Fluxo de Caixa Completo', link: '/fluxo-caixa' },
          { label: 'Ver Compromissos', link: '/compromissos' }
        ]
      };
    }

    // ── 2. BILLS & UPCOMING PAYMENTS ──
    // "Quais contas vencem essa semana?" / "Contas a pagar" / "Quais contas tenho?"
    if (q.includes('vencem') || q.includes('contas a pagar') || q.includes('contas essa semana') || q.includes('próximas contas')) {
      const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue');
      if (pendingBills.length === 0) {
        return {
          answer: 'Você não possui nenhuma conta pendente de pagamento cadastrada no momento. Parabéns!',
          suggestedActions: [{ label: 'Adicionar Conta a Pagar', link: '/compromissos' }]
        };
      }

      const totalPending = pendingBills.reduce((acc, b) => acc + b.amount, 0);
      const topBillsList = pendingBills.slice(0, 4).map(b => `• **${b.description}**: ${formatCurrency(b.amount)} (Vence em ${b.dueDate})`).join('\n');

      return {
        answer: `Você possui **${pendingBills.length} conta(s) pendente(s)** totalizando **${formatCurrency(totalPending)}**:\n\n${topBillsList}\n\nVocê pode marcar como paga diretamente na tela de compromissos.`,
        highlights: [
          { label: 'Contas Pendentes', value: `${pendingBills.length}` },
          { label: 'Total a Pagar', value: formatCurrency(totalPending) }
        ],
        suggestedActions: [
          { label: 'Ver Todas as Contas', link: '/compromissos' },
          { label: 'Ver Calendário', link: '/calendario' }
        ]
      };
    }

    // ── 3. SUBSCRIPTIONS ──
    // "Quanto gasto com assinaturas?" / "Assinaturas ativas"
    if (q.includes('assinatura') || q.includes('streaming') || q.includes('netflix') || q.includes('spotify')) {
      const subSummary = calculateSubscriptionsSummary(subscriptions);
      if (subSummary.activeCount === 0) {
        return {
          answer: 'Você não possui assinaturas cadastradas no momento.',
          suggestedActions: [{ label: 'Cadastrar Assinaturas', link: '/compromissos' }]
        };
      }

      const subList = subscriptions.filter(s => s.isActive).map(s => `• **${s.name}**: ${formatCurrency(s.amount)} (${s.frequency})`).join('\n');

      return {
        answer: `Você possui **${subSummary.activeCount} assinatura(s) ativa(s)**:\n\n${subList}\n\nIsso representa um custo estimado de **${formatCurrency(subSummary.totalMonthlyEstimate)} por mês** (cerca de **${formatCurrency(subSummary.totalAnnualEstimate)} ao ano**).`,
        highlights: [
          { label: 'Assinaturas Ativas', value: `${subSummary.activeCount}` },
          { label: 'Custo Mensal', value: formatCurrency(subSummary.totalMonthlyEstimate) },
          { label: 'Custo Anual', value: formatCurrency(subSummary.totalAnnualEstimate) }
        ],
        suggestedActions: [
          { label: 'Gerenciar Assinaturas', link: '/compromissos' }
        ]
      };
    }

    // ── 4. FUTURE INSTALLMENTS & CARDS ──
    // "Quanto ainda falta pagar do cartão?" / "Quanto tenho em parcelas futuras?"
    if (q.includes('parcelas') || q.includes('parcelamentos') || q.includes('falta pagar') || q.includes('fatura futura')) {
      const installmentTxs = transactions.filter(t => Boolean(t.installmentTotal && t.installmentNumber));
      const plansMap = new Map<string, { desc: string; total: number; current: number; count: number; totalAmount: number }>();

      for (const t of installmentTxs) {
        if (t.installmentId) {
          if (!plansMap.has(t.installmentId)) {
            plansMap.set(t.installmentId, {
              desc: t.description,
              total: t.installmentTotal || 1,
              current: t.installmentNumber || 1,
              count: 0,
              totalAmount: (t.installmentTotal || 1) * t.amount
            });
          }
        }
      }

      const totalCardDebt = cards.reduce((s, c) => s + Math.max(0, c.limit - c.availableLimit), 0);

      return {
        answer: `Atualmente seu limite de cartões comprometido em faturas/parcelas é de **${formatCurrency(totalCardDebt)}**.\n\nVocê possui **${plansMap.size} compras parceladas ativas**.`,
        highlights: [
          { label: 'Dívida em Cartões', value: formatCurrency(totalCardDebt) },
          { label: 'Compras Parceladas', value: `${plansMap.size}` }
        ],
        suggestedActions: [
          { label: 'Ver Cartões e Faturas', link: '/cartoes' },
          { label: 'Ver Futuro Comprometido', link: '/compromissos' }
        ]
      };
    }

    // ── 5. FIXED VS VARIABLE COSTS & COST OF LIVING ──
    // "Quanto é meu custo fixo?" / "Qual meu custo de vida?"
    if (q.includes('custo fixo') || q.includes('despesas fixas') || q.includes('custo de vida') || q.includes('custo médio')) {
      const fixedReport = calculateFixedVsVariableExpenses(transactions, recurringRules, bills, currentYearMonth);
      const costOfLiving = calculateCostOfLiving(transactions, recurringRules, bills);

      return {
        answer: `Neste mês, suas **despesas fixas** somam **${formatCurrency(fixedReport.fixedExpensesTotal)}** (${fixedReport.fixedPercentage.toFixed(0)}% dos seus gastos), enquanto suas **despesas variáveis** somam **${formatCurrency(fixedReport.variableExpensesTotal)}** (${fixedReport.variablePercentage.toFixed(0)}%).\n\n${costOfLiving.message}`,
        highlights: [
          { label: 'Despesas Fixas', value: formatCurrency(fixedReport.fixedExpensesTotal) },
          { label: 'Despesas Variáveis', value: formatCurrency(fixedReport.variableExpensesTotal) },
          { label: 'Custo Médio de Vida', value: formatCurrency(costOfLiving.estimatedMonthlyCost) }
        ],
        suggestedActions: [
          { label: 'Ver Recorrências & Fixos', link: '/compromissos' },
          { label: 'Ver Fechamento Mensal', link: '/fechamento' }
        ]
      };
    }

    // ── 6. "Quanto gastei este mês?" ──
    if (q.includes('quanto gastei') || q.includes('total de gastos') || q.includes('total gasto') || q.includes('despesas deste mês')) {
      const topCategory = categoryBreakdown[0];
      return {
        answer: `Você gastou um total de **${formatCurrency(totalExpenses)}** no período atual (${currentYearMonth}).\n\nSua maior fatia de gastos foi com **${topCategory?.categoryName || 'Diversos'}**, representando **${topCategory?.percentage.toFixed(1) || 0}%** (${formatCurrency(topCategory?.total || 0)}) de todas as despesas.`,
        highlights: [
          { label: 'Total Gasto', value: formatCurrency(totalExpenses) },
          { label: 'Maior Categoria', value: topCategory?.categoryName || '-' },
          { label: 'Saldo do Mês', value: formatCurrency(balanceResult) }
        ],
        suggestedActions: [
          { label: 'Ver Extrato de Gastos', link: '/gastos' },
          { label: 'Comparar com Mês Anterior', link: '/fechamento' }
        ]
      };
    }

    // ── 7. "Qual minha maior despesa?" ──
    if (q.includes('maior despesa') || q.includes('maior gasto') || q.includes('gastei mais')) {
      const expenseTxs = currentMonthTxs.filter(t => t.type === 'expense' && !t.isCardInvoicePayment);
      if (expenseTxs.length === 0) {
        return { answer: 'Você ainda não possui despesas registradas neste mês.' };
      }
      const sortedByAmount = [...expenseTxs].sort((a, b) => b.amount - a.amount);
      const biggest = sortedByAmount[0];
      const category = categories.find(c => c.id === biggest.categoryId);

      return {
        answer: `Sua maior despesa individual este mês foi **${biggest.description}** no valor de **${formatCurrency(biggest.amount)}**, registrada na categoria **${category?.name || 'Geral'}** em ${biggest.date}.`,
        highlights: [
          { label: 'Maior Despesa', value: biggest.description },
          { label: 'Valor', value: formatCurrency(biggest.amount) },
          { label: 'Categoria', value: category?.name || 'Geral' }
        ],
        suggestedActions: [
          { label: 'Ver Todas as Transações', link: '/transacoes' }
        ]
      };
    }

    // ── 8. "Onde estou gastando mais?" ──
    if (q.includes('onde estou gastando') || q.includes('categorias') || q.includes('onde foi o dinheiro')) {
      const top3 = categoryBreakdown.slice(0, 3);
      const lines = top3.map((c, i) => `${i + 1}. **${c.categoryName}**: ${formatCurrency(c.total)} (${c.percentage.toFixed(0)}%)`).join('\n');

      return {
        answer: `As 3 categorias onde você mais concentrou seus gastos este mês foram:\n\n${lines}\n\nJuntas, elas representam ${top3.reduce((s, c) => s + c.percentage, 0).toFixed(0)}% do seu orçamento mensal.`,
        highlights: top3.map(c => ({ label: c.categoryName, value: formatCurrency(c.total) })),
        suggestedActions: [
          { label: 'Definir Orçamentos', link: '/orcamentos' },
          { label: 'Ver Gráficos Detalhados', link: '/gastos' }
        ]
      };
    }

    // ── 9. "Quanto posso gastar?" ──
    if (q.includes('quanto posso gastar') || q.includes('limite para gastar') || q.includes('orçamento restante')) {
      const budgetReports = calculateBudgetUsage(budgets, transactions, categories, currentYearMonth);
      const totalBudgetLimit = budgets.reduce((s, b) => s + b.limitAmount, 0);
      const totalBudgetSpent = budgetReports.reduce((s, r) => s + r.spent, 0);
      const totalBudgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

      if (totalBudgetLimit > 0) {
        return {
          answer: `Considerando seus orçamentos configurados, você ainda dispõe de **${formatCurrency(totalBudgetRemaining)}** para utilizar até o encerramento do mês.\n\nVocê já consumiu **${((totalBudgetSpent / totalBudgetLimit) * 100).toFixed(0)}%** do teto estipulado.`,
          highlights: [
            { label: 'Teto Total Orçado', value: formatCurrency(totalBudgetLimit) },
            { label: 'Gasto até agora', value: formatCurrency(totalBudgetSpent) },
            { label: 'Disponível', value: formatCurrency(totalBudgetRemaining) }
          ],
          suggestedActions: [
            { label: 'Gerenciar Orçamentos', link: '/orcamentos' }
          ]
        };
      } else {
        const safeMargin = Math.max(0, balanceResult);
        return {
          answer: `Você ainda não cadastrou limites de orçamentos por categoria, mas baseado na sua receita atual menos despesas, seu saldo positivo do mês é de **${formatCurrency(safeMargin)}**.`,
          highlights: [
            { label: 'Saldo Atual', value: formatCurrency(balanceResult) }
          ],
          suggestedActions: [
            { label: 'Criar Meu Primeiro Orçamento', link: '/orcamentos' }
          ]
        };
      }
    }

    // ── 10. "Como estão minhas metas?" ──
    if (q.includes('metas') || q.includes('objetivos') || q.includes('poupança') || q.includes('economizar')) {
      if (goals.length === 0) {
        return {
          answer: 'Você ainda não cadastrou metas financeiras. Criar metas ajuda a manter o foco em economizar para viagens, compras e reserva de emergência.',
          suggestedActions: [{ label: 'Criar Minha Primeira Meta', link: '/metas' }]
        };
      }

      const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
      const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
      const overallPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
      const goalsList = goals.map(g => `• **${g.name}**: ${formatCurrency(g.currentAmount)} de ${formatCurrency(g.targetAmount)} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}%)`).join('\n');

      return {
        answer: `Você possui **${goals.length} metas ativas** e já acumulou um total de **${formatCurrency(totalSaved)}** de um objetivo global de **${formatCurrency(totalTarget)}** (${overallPercent.toFixed(0)}%):\n\n${goalsList}`,
        highlights: [
          { label: 'Total Guardado', value: formatCurrency(totalSaved) },
          { label: 'Objetivo Total', value: formatCurrency(totalTarget) },
          { label: 'Progresso Médio', value: `${overallPercent.toFixed(0)}%` }
        ],
        suggestedActions: [
          { label: 'Ver Painel de Metas', link: '/metas' }
        ]
      };
    }

    // Default Fallback
    return {
      answer: `Posso te ajudar a entender seus gastos, contas a pagar, fluxo de caixa, assinaturas, metas e projeção de saldo.\n\nExperimente perguntar:\n• *"Quanto vou ter no fim do mês?"*\n• *"Quais contas vencem essa semana?"*\n• *"Quanto gasto com assinaturas?"*\n• *"Quanto é meu custo fixo?"*\n• *"Quanto gastei este mês?"*`,
      suggestedActions: [
        { label: 'Ver Fluxo de Caixa', link: '/fluxo-caixa' },
        { label: 'Ver Compromissos', link: '/compromissos' },
        { label: 'Ver Gastos', link: '/gastos' }
      ]
    };
  }
};
