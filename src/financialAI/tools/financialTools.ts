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
  }
};
