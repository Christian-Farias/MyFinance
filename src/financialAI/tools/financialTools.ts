import {
  calculateTotalBalance,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCategoryBreakdown,
  calculateMonthlyComparison,
  calculateProjectedCashFlow,
  calculateFutureCommitments,
  calculateGoalProgress,
  calculateSubscriptionsSummary,
  calculateFixedVsVariableExpenses,
  formatCurrency,
} from '../../calculations/financialCalculations';
import type {
  Account,
  Transaction,
  Category,
  CreditCard,
  Goal,
  Budget,
  Bill,
  Receivable,
  RecurringTransaction,
  Subscription,
  Investment,
} from '../../types';

export interface FinancialState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  goals: Goal[];
  budgets: Budget[];
  bills: Bill[];
  receivables: Receivable[];
  recurring: RecurringTransaction[];
  subscriptions: Subscription[];
  investments: Investment[];
}

export const financialTools = {
  getBalance(state: FinancialState) {
    const totalBalance = calculateTotalBalance(state.accounts);
    return {
      totalBalance,
      formattedBalance: formatCurrency(totalBalance),
      accounts: state.accounts.map(a => ({
        id: a.id,
        name: a.name,
        balance: a.currentBalance,
        formatted: formatCurrency(a.currentBalance),
      })),
    };
  },

  getExpenses(state: FinancialState, monthYear?: string) {
    const total = calculateTotalExpenses(state.transactions, monthYear);
    const categoryBreakdown = calculateCategoryBreakdown(state.transactions, state.categories, monthYear);
    return {
      total,
      formattedTotal: formatCurrency(total),
      categoryBreakdown,
      count: state.transactions.filter(t => t.type === 'expense' && (!monthYear || t.date.startsWith(monthYear))).length,
    };
  },

  getIncome(state: FinancialState, monthYear?: string) {
    const total = calculateTotalIncome(state.transactions, monthYear);
    return {
      total,
      formattedTotal: formatCurrency(total),
    };
  },

  getCategorySpending(state: FinancialState, categoryIdOrName: string, monthYear?: string) {
    const cat = state.categories.find(
      c => c.id === categoryIdOrName || c.name.toLowerCase().includes(categoryIdOrName.toLowerCase())
    );
    const catId = cat ? cat.id : categoryIdOrName;
    const filtered = state.transactions.filter(
      t => t.type === 'expense' && t.categoryId === catId && (!monthYear || t.date.startsWith(monthYear))
    );
    const total = filtered.reduce((acc, t) => acc + t.amount, 0);
    return {
      categoryName: cat?.name || categoryIdOrName,
      total,
      formattedTotal: formatCurrency(total),
      transactions: filtered,
    };
  },

  getMonthlyComparison(state: FinancialState, monthYear?: string) {
    return calculateMonthlyComparison(state.transactions, state.categories, monthYear);
  },

  getCardBill(state: FinancialState) {
    const cardsInfo = state.cards.map(card => {
      const cardTxs = state.transactions.filter(t => t.cardId === card.id && t.type === 'expense');
      const usedLimit = cardTxs.reduce((sum, t) => sum + t.amount, 0);
      const availableLimit = Math.max(0, card.limit - usedLimit);
      return {
        cardId: card.id,
        cardName: card.name,
        limit: card.limit,
        usedLimit,
        availableLimit,
        formattedUsed: formatCurrency(usedLimit),
        formattedAvailable: formatCurrency(availableLimit),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
      };
    });
    const totalInvoice = cardsInfo.reduce((sum, c) => sum + c.usedLimit, 0);
    return {
      totalInvoice,
      formattedTotalInvoice: formatCurrency(totalInvoice),
      cards: cardsInfo,
    };
  },

  getBills(state: FinancialState) {
    const pending = state.bills.filter(b => b.status === 'pending' || b.status === 'overdue');
    const totalPending = pending.reduce((sum, b) => sum + b.amount, 0);
    return {
      pending,
      totalPending,
      formattedTotalPending: formatCurrency(totalPending),
    };
  },

  getReceivables(state: FinancialState) {
    const expected = state.receivables.filter(r => r.status === 'expected');
    const totalExpected = expected.reduce((sum, r) => sum + r.amount, 0);
    return {
      expected,
      totalExpected,
      formattedTotalExpected: formatCurrency(totalExpected),
    };
  },

  getSubscriptions(state: FinancialState) {
    return calculateSubscriptionsSummary(state.subscriptions);
  },

  getForecast(state: FinancialState, daysAhead = 30) {
    return calculateProjectedCashFlow(
      state.accounts,
      state.transactions,
      state.bills,
      state.receivables,
      state.recurring,
      daysAhead
    );
  },

  getCommitments(state: FinancialState, monthsAhead = 6) {
    return calculateFutureCommitments(state.bills, state.recurring, state.transactions, monthsAhead);
  },

  getGoals(state: FinancialState) {
    return state.goals.map(goal => ({
      goal,
      progress: calculateGoalProgress(goal),
    }));
  },

  getBudgets(state: FinancialState, monthYear?: string) {
    const currentYM = monthYear || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const categoryBreakdown = calculateCategoryBreakdown(state.transactions, state.categories, currentYM);
    return state.budgets.map(b => {
      const cat = state.categories.find(c => c.id === b.categoryId);
      const spent = categoryBreakdown.find(cb => cb.categoryId === b.categoryId)?.total || 0;
      const remaining = Math.max(0, b.limitAmount - spent);
      const percentage = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      return {
        budget: b,
        categoryName: cat?.name || 'Categoria',
        spent,
        remaining,
        percentage,
        isWarning: percentage >= 70 && percentage < 90,
        isCritical: percentage >= 90 && percentage <= 100,
        isExceeded: percentage > 100,
      };
    });
  },

  getFixedVsVariable(state: FinancialState, monthYear?: string) {
    return calculateFixedVsVariableExpenses(state.transactions, state.recurring, state.bills, monthYear);
  },

  getCategoryComparison(
    state: FinancialState,
    catAIdOrName: string,
    catBIdOrName: string,
    monthYear?: string
  ) {
    const spendA = this.getCategorySpending(state, catAIdOrName, monthYear);
    const spendB = this.getCategorySpending(state, catBIdOrName, monthYear);

    const diff = Math.abs(spendA.total - spendB.total);
    const higher = spendA.total >= spendB.total ? spendA : spendB;
    const lower = spendA.total >= spendB.total ? spendB : spendA;
    const ratio = lower.total > 0 ? ((higher.total - lower.total) / lower.total) * 100 : 0;

    return {
      categoryA: spendA,
      categoryB: spendB,
      difference: diff,
      formattedDifference: formatCurrency(diff),
      higherCategoryName: higher.categoryName,
      lowerCategoryName: lower.categoryName,
      percentageHigher: ratio,
      isEqual: spendA.total === spendB.total,
    };
  },

  getTransactions(
    state: FinancialState,
    options?: {
      monthYear?: string;
      categoryId?: string;
      type?: 'expense' | 'income';
      limit?: number;
    }
  ) {
    let filtered = [...state.transactions];
    if (options?.monthYear) {
      filtered = filtered.filter(t => t.date.startsWith(options.monthYear!));
    }
    if (options?.categoryId) {
      filtered = filtered.filter(t => t.categoryId === options.categoryId);
    }
    if (options?.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limit = options?.limit || 5;
    const items = filtered.slice(0, limit);

    return {
      totalFound: filtered.length,
      items: items.map(t => {
        const cat = state.categories.find(c => c.id === t.categoryId);
        return {
          id: t.id,
          description: t.description,
          amount: t.amount,
          formattedAmount: formatCurrency(t.amount),
          type: t.type,
          categoryName: cat?.name || 'Geral',
          date: t.date,
        };
      }),
    };
  },

  getInvestments(state: FinancialState) {
    const totalInvested = state.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalCost = state.investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const profitLoss = totalInvested - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    // Breakdown by type
    const byTypeMap: Record<string, number> = {};
    for (const inv of state.investments) {
      byTypeMap[inv.type] = (byTypeMap[inv.type] || 0) + inv.currentValue;
    }

    const typeBreakdown = Object.entries(byTypeMap).map(([type, value]) => ({
      type,
      value,
      formattedValue: formatCurrency(value),
      percentage: totalInvested > 0 ? (value / totalInvested) * 100 : 0,
    }));

    return {
      totalInvested,
      formattedTotalInvested: formatCurrency(totalInvested),
      totalCost,
      formattedTotalCost: formatCurrency(totalCost),
      profitLoss,
      formattedProfitLoss: formatCurrency(profitLoss),
      profitLossPercent,
      isPositive: profitLoss >= 0,
      count: state.investments.length,
      typeBreakdown,
      items: state.investments.map(inv => ({
        id: inv.id,
        name: inv.name,
        type: inv.type,
        currentValue: inv.currentValue,
        formattedValue: formatCurrency(inv.currentValue),
      })),
    };
  },

  getRecurring(state: FinancialState) {
    const active = state.recurring.filter(r => r.active);
    const totalMonthly = active.reduce((sum, r) => sum + r.amount, 0);
    return {
      activeCount: active.length,
      totalMonthly,
      formattedTotalMonthly: formatCurrency(totalMonthly),
      items: active.map(r => ({
        id: r.id,
        description: r.description,
        amount: r.amount,
        formattedAmount: formatCurrency(r.amount),
        type: r.type,
      })),
    };
  },

  simulateGoalSavings(state: FinancialState, goalIdOrName?: string, monthsAhead: number = 6) {
    const goal = goalIdOrName
      ? state.goals.find(g => g.id === goalIdOrName || g.name.toLowerCase().includes(goalIdOrName.toLowerCase()))
      : state.goals[0];

    if (!goal) {
      return {
        hasGoal: false,
        message: 'Nenhuma meta encontrada para simulação.',
      };
    }

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const safeMonths = Math.max(1, monthsAhead);
    const neededMonthly = remaining / safeMonths;

    return {
      hasGoal: true,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount: remaining,
      months: safeMonths,
      neededMonthly,
      formattedNeededMonthly: formatCurrency(neededMonthly),
      formattedRemaining: formatCurrency(remaining),
      formattedTarget: formatCurrency(goal.targetAmount),
      formattedCurrent: formatCurrency(goal.currentAmount),
    };
  }
};

