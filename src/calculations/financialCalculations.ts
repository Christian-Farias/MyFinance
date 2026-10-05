import type { 
  Account, 
  Transaction, 
  Category, 
  CreditCard, 
  Budget, 
  Goal, 
  Investment,
  BudgetStatus,
  RecurringTransaction,
  Bill,
  Receivable,
  Subscription,
  MonthlyClosing,
  FutureCommitmentItem,
  CashFlowPoint
} from '../types';

/* ═══════════════════════════════════════════════════════════════════════════
   PRECISE MONETARY ARITHMETIC (CENTS REPRESENTATION)
   Avoids IEEE-754 floating point issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
   ═══════════════════════════════════════════════════════════════════════════ */

export function toCents(amount: number): number {
  if (isNaN(amount) || amount === null || amount === undefined) return 0;
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

export function subMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

export function mulMoney(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor));
}

export function divMoney(amount: number, divisor: number): number {
  if (divisor === 0) return 0;
  return fromCents(Math.round(toCents(amount) / divisor));
}

export function sumMoney(amounts: number[]): number {
  const totalCents = amounts.reduce((acc, val) => acc + toCents(val), 0);
  return fromCents(totalCents);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORMATTING HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(val: number, includeSign = false): string {
  if (isNaN(val)) return '0%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1).replace('.', ',')}%`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterday) return 'Ontem';
  if (dateStr === tomorrow) return 'Amanhã';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CORE ACCOUNT & NET WORTH BALANCES
   ═══════════════════════════════════════════════════════════════════════════ */

export function calculateTotalBalance(accounts: Account[]): number {
  return sumMoney(accounts.map(a => (a.currentBalance !== undefined ? a.currentBalance : a.balance ?? 0)));
}

export function calculateTotalInvestments(investments: Investment[]): number {
  return sumMoney(investments.map(i => i.currentValue || 0));
}

export function calculateTotalCardLiabilities(cards: CreditCard[]): number {
  return sumMoney(cards.map(c => Math.max(0, subMoney(c.limit, c.availableLimit))));
}

export function calculateNetWorth(
  accounts: Account[], 
  investments: Investment[], 
  cards: CreditCard[] = []
): number {
  const accountsBalance = calculateTotalBalance(accounts);
  const totalInvested = calculateTotalInvestments(investments);
  return addMoney(accountsBalance, totalInvested);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSACTIONS & CATEGORY BREAKDOWNS
   ═══════════════════════════════════════════════════════════════════════════ */

export function filterTransactionsByMonth(
  transactions: Transaction[], 
  yearMonth?: string // "YYYY-MM" or "all"
): Transaction[] {
  if (!yearMonth || yearMonth === 'all') return transactions;
  return transactions.filter(t => t.date && t.date.startsWith(yearMonth));
}

export function calculateTotalIncome(transactions: Transaction[], yearMonth?: string): number {
  const filtered = filterTransactionsByMonth(transactions, yearMonth);
  return sumMoney(filtered.filter(t => t.type === 'income').map(t => t.amount));
}

export function calculateTotalExpenses(transactions: Transaction[], yearMonth?: string): number {
  const filtered = filterTransactionsByMonth(transactions, yearMonth);
  // Exclude internal transfers and credit card invoice payments to avoid double counting
  return sumMoney(
    filtered
      .filter(t => t.type === 'expense' && !t.isCardInvoicePayment)
      .map(t => t.amount)
  );
}

export function calculateMonthlyResult(income: number, expenses: number): number {
  return subMoney(income, expenses);
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

export function calculateCategoryBreakdown(
  transactions: Transaction[], 
  categories: Category[], 
  yearMonth?: string
): CategorySummary[] {
  const filtered = filterTransactionsByMonth(transactions, yearMonth);
  const expenseTransactions = filtered.filter(t => t.type === 'expense' && !t.isCardInvoicePayment);
  const totalExpense = sumMoney(expenseTransactions.map(t => t.amount));

  const categoryMap = new Map<string, number>();
  for (const t of expenseTransactions) {
    const catId = t.categoryId || 'outros';
    const current = categoryMap.get(catId) || 0;
    categoryMap.set(catId, addMoney(current, t.amount));
  }

  const result: CategorySummary[] = [];

  categoryMap.forEach((amount, catId) => {
    const category = categories.find(c => c.id === catId);
    result.push({
      categoryId: catId,
      categoryName: category?.name || 'Outros',
      categoryIcon: category?.icon || 'Tag',
      categoryColor: category?.color || '#9E9E9E',
      total: amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    });
  });

  return result.sort((a, b) => b.total - a.total);
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUDGET USAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BudgetStatusReport {
  budget: Budget;
  category?: Category;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
}

export function calculateBudgetUsage(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  yearMonth?: string
): BudgetStatusReport[] {
  const filtered = filterTransactionsByMonth(transactions, yearMonth);
  const expenses = filtered.filter(t => t.type === 'expense' && !t.isCardInvoicePayment);

  return budgets.map(budget => {
    const category = categories.find(c => c.id === budget.categoryId);
    const categoryExpenses = expenses.filter(t => t.categoryId === budget.categoryId);
    const spent = sumMoney(categoryExpenses.map(t => t.amount));
    const remaining = subMoney(budget.limitAmount, spent);
    const percentage = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;

    let status: BudgetStatus = 'normal';
    if (percentage > 100) {
      status = 'exceeded';
    } else if (percentage >= 90) {
      status = 'critical';
    } else if (percentage >= 70) {
      status = 'warning';
    }

    return {
      budget,
      category,
      spent,
      remaining,
      percentage,
      status,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   GOALS PROGRESS
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GoalProgressReport {
  percentage: number;
  remaining: number;
  isCompleted: boolean;
  monthlySavingsNeeded: number;
}

export function calculateGoalProgress(goal: Goal): GoalProgressReport {
  const percentage = goal.targetAmount > 0 
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;
  const remaining = Math.max(0, subMoney(goal.targetAmount, goal.currentAmount));
  let monthlySavingsNeeded = 0;
  if (goal.deadline && remaining > 0) {
    const diffMonths = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
    monthlySavingsNeeded = divMoney(remaining, diffMonths);
  }
  return {
    percentage,
    remaining,
    isCompleted: goal.currentAmount >= goal.targetAmount,
    monthlySavingsNeeded,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MONTHLY COMPARISON
   ═══════════════════════════════════════════════════════════════════════════ */

export interface MonthSummaryData {
  key: string;
  label: string;
  expenses: number;
  income: number;
  result: number;
  balance: number;
  transactionCount: number;
}

export interface MonthlyComparisonReport {
  currentMonth: MonthSummaryData;
  previousMonth: MonthSummaryData;
  currentIncome: number;
  previousIncome: number;
  incomeVariationPercent: number;
  currentExpense: number;
  previousExpense: number;
  expenseVariationPercent: number;
  currentBalance: number;
  previousBalance: number;
  currentTransactionCount: number;
  previousTransactionCount: number;
  categoryComparisons: Array<{
    categoryId: string;
    categoryName: string;
    currentTotal: number;
    previousTotal: number;
    variationPercent: number;
    difference: number;
  }>;
}

export function formatMonthYearLabel(monthYear: string): string {
  const [yearStr, monthStr] = monthYear.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const idx = parseInt(monthStr, 10) - 1;
  return `${monthNames[idx] || monthStr}/${yearStr.slice(2)}`;
}

export function getPreviousMonthYear(monthYear: string): string {
  const [yearStr, monthStr] = monthYear.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getNextMonthYear(monthYear: string): string {
  const [yearStr, monthStr] = monthYear.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month === 13) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function calculateMonthlyComparison(
  transactions: Transaction[],
  categories: Category[],
  currentMonthYear?: string
): MonthlyComparisonReport {
  const now = new Date();
  const curYM = currentMonthYear || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevYM = getPreviousMonthYear(curYM);

  const curIncome = calculateTotalIncome(transactions, curYM);
  const prevIncome = calculateTotalIncome(transactions, prevYM);
  const incomeVar = prevIncome > 0 ? ((curIncome - prevIncome) / prevIncome) * 100 : curIncome > 0 ? 100 : 0;

  const curExpense = calculateTotalExpenses(transactions, curYM);
  const prevExpense = calculateTotalExpenses(transactions, prevYM);
  const expenseVar = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : curExpense > 0 ? 100 : 0;

  const curTxs = filterTransactionsByMonth(transactions, curYM);
  const prevTxs = filterTransactionsByMonth(transactions, prevYM);

  const curResult = calculateMonthlyResult(curIncome, curExpense);
  const prevResult = calculateMonthlyResult(prevIncome, prevExpense);

  const curCats = calculateCategoryBreakdown(transactions, categories, curYM);
  const prevCats = calculateCategoryBreakdown(transactions, categories, prevYM);

  const allCatIds = Array.from(new Set([...curCats.map(c => c.categoryId), ...prevCats.map(c => c.categoryId)]));
  const categoryComparisons = allCatIds.map(catId => {
    const curC = curCats.find(c => c.categoryId === catId);
    const prevC = prevCats.find(c => c.categoryId === catId);
    const catObj = categories.find(c => c.id === catId);
    const curTot = curC?.total || 0;
    const prevTot = prevC?.total || 0;
    const diff = subMoney(curTot, prevTot);
    const varPct = prevTot > 0 ? ((curTot - prevTot) / prevTot) * 100 : curTot > 0 ? 100 : 0;

    return {
      categoryId: catId,
      categoryName: catObj?.name || curC?.categoryName || prevC?.categoryName || 'Outros',
      currentTotal: curTot,
      previousTotal: prevTot,
      variationPercent: varPct,
      difference: diff,
    };
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  const currentMonthData: MonthSummaryData = {
    key: curYM,
    label: formatMonthYearLabel(curYM),
    expenses: curExpense,
    income: curIncome,
    result: curResult,
    balance: curResult,
    transactionCount: curTxs.length,
  };

  const previousMonthData: MonthSummaryData = {
    key: prevYM,
    label: formatMonthYearLabel(prevYM),
    expenses: prevExpense,
    income: prevIncome,
    result: prevResult,
    balance: prevResult,
    transactionCount: prevTxs.length,
  };

  return {
    currentMonth: currentMonthData,
    previousMonth: previousMonthData,
    currentIncome: curIncome,
    previousIncome: prevIncome,
    incomeVariationPercent: incomeVar,
    currentExpense: curExpense,
    previousExpense: prevExpense,
    expenseVariationPercent: expenseVar,
    currentBalance: curResult,
    previousBalance: prevResult,
    currentTransactionCount: curTxs.length,
    previousTransactionCount: prevTxs.length,
    categoryComparisons,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   FIXED VS VARIABLE EXPENSES & COST OF LIVING
   ═══════════════════════════════════════════════════════════════════════════ */

export interface FixedVsVariableReport {
  fixedExpensesTotal: number;
  variableExpensesTotal: number;
  totalExpenses: number;
  fixedPercentage: number;
  variablePercentage: number;
  fixedItemsCount: number;
}

export function calculateFixedVsVariableExpenses(
  transactions: Transaction[],
  recurringRules: RecurringTransaction[] = [],
  bills: Bill[] = [],
  yearMonth?: string
): FixedVsVariableReport {
  const filtered = filterTransactionsByMonth(transactions, yearMonth).filter(t => t.type === 'expense' && !t.isCardInvoicePayment);
  
  let fixedSum = 0;
  let fixedCount = 0;
  let variableSum = 0;

  for (const t of filtered) {
    const isFixed = t.isFixedExpense || 
      t.recurringId !== undefined || 
      recurringRules.some(r => r.id === t.recurringId && r.isFixedExpense) ||
      bills.some(b => b.id === t.billId && b.isFixedExpense);

    if (isFixed) {
      fixedSum = addMoney(fixedSum, t.amount);
      fixedCount++;
    } else {
      variableSum = addMoney(variableSum, t.amount);
    }
  }

  const total = addMoney(fixedSum, variableSum);
  const fixedPct = total > 0 ? (fixedSum / total) * 100 : 0;
  const variablePct = total > 0 ? (variableSum / total) * 100 : 0;

  return {
    fixedExpensesTotal: fixedSum,
    variableExpensesTotal: variableSum,
    totalExpenses: total,
    fixedPercentage: fixedPct,
    variablePercentage: variablePct,
    fixedItemsCount: fixedCount,
  };
}

export function calculateCostOfLiving(
  transactions: Transaction[],
  recurringRules: RecurringTransaction[] = [],
  bills: Bill[] = []
): { estimatedMonthlyCost: number; hasEnoughData: boolean; message: string } {
  // Get distinct months recorded in transactions
  const months = Array.from(new Set(transactions.map(t => t.date?.substring(0, 7)).filter(Boolean)));
  
  if (months.length === 0 && recurringRules.length === 0 && bills.length === 0) {
    return {
      estimatedMonthlyCost: 0,
      hasEnoughData: false,
      message: 'Continue registrando seus gastos para calcular seu custo médio de vida.',
    };
  }

  // Sum active recurring monthly expenses
  const recurringMonthlyCost = sumMoney(
    recurringRules
      .filter(r => r.type === 'expense' && r.status === 'active')
      .map(r => {
        if (r.frequency === 'weekly') return mulMoney(r.amount, 4.33);
        if (r.frequency === 'biweekly') return mulMoney(r.amount, 2.16);
        if (r.frequency === 'monthly') return r.amount;
        if (r.frequency === 'bimonthly') return divMoney(r.amount, 2);
        if (r.frequency === 'quarterly') return divMoney(r.amount, 3);
        if (r.frequency === 'semiannual') return divMoney(r.amount, 6);
        if (r.frequency === 'annual') return divMoney(r.amount, 12);
        return r.amount;
      })
  );

  // If we have transaction months, average them
  let historicalMonthlyAverage = 0;
  if (months.length > 0) {
    const totalAllExpenses = sumMoney(
      transactions
        .filter(t => t.type === 'expense' && !t.isCardInvoicePayment)
        .map(t => t.amount)
    );
    historicalMonthlyAverage = divMoney(totalAllExpenses, months.length);
  }

  const estimatedMonthlyCost = historicalMonthlyAverage > 0 
    ? historicalMonthlyAverage 
    : recurringMonthlyCost;

  return {
    estimatedMonthlyCost,
    hasEnoughData: months.length >= 1 || recurringRules.length > 0,
    message: `Custo médio mensal estimado em ${formatCurrency(estimatedMonthlyCost)}.`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUBSCRIPTIONS ESTIMATES
   ═══════════════════════════════════════════════════════════════════════════ */

export function calculateSubscriptionsSummary(subscriptions: Subscription[]): {
  activeCount: number;
  totalMonthlyEstimate: number;
  totalAnnualEstimate: number;
} {
  const activeSubs = subscriptions.filter(s => s.isActive);
  const monthly = sumMoney(activeSubs.map(s => s.monthlyEstimate));
  const annual = sumMoney(activeSubs.map(s => s.annualEstimate));

  return {
    activeCount: activeSubs.length,
    totalMonthlyEstimate: monthly,
    totalAnnualEstimate: annual,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   FUTURE COMMITMENTS (PARCELAS, CONTAS, RECORRÊNCIAS, FATURAS)
   ═══════════════════════════════════════════════════════════════════════════ */

export function calculateFutureCommitments(
  bills: Bill[],
  recurringRules: RecurringTransaction[],
  transactions: Transaction[],
  monthsAhead = 6
): {
  monthlyTotals: Record<string, number>; // e.g. { "2026-10": 2430, "2026-11": 1980 }
  itemsByMonth: Record<string, FutureCommitmentItem[]>;
  totalFutureCommitments: number;
} {
  const now = new Date();
  const monthlyTotals: Record<string, number> = {};
  const itemsByMonth: Record<string, FutureCommitmentItem[]> = {};

  // Initialize next N months
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[ym] = 0;
    itemsByMonth[ym] = [];
  }

  // 1. Pending bills
  for (const bill of bills) {
    if (bill.status === 'pending' || bill.status === 'overdue') {
      const ym = bill.dueDate.substring(0, 7);
      if (monthlyTotals[ym] !== undefined) {
        monthlyTotals[ym] = addMoney(monthlyTotals[ym], bill.amount);
        itemsByMonth[ym].push({
          id: bill.id,
          description: bill.description,
          amount: bill.amount,
          date: bill.dueDate,
          type: bill.isSubscription ? 'subscription' : 'bill',
        });
      }
    }
  }

  // 2. Future installments in transactions
  for (const tx of transactions) {
    if (tx.installmentTotal && tx.installmentNumber && tx.invoiceMonthYear) {
      const ym = tx.invoiceMonthYear;
      // Only include if in future or current month and not already marked paid
      if (monthlyTotals[ym] !== undefined && tx.date >= now.toISOString().split('T')[0]) {
        // avoid duplicating if already in bills
        const alreadyInBills = itemsByMonth[ym].some(item => item.id === tx.id || item.description === tx.description);
        if (!alreadyInBills) {
          monthlyTotals[ym] = addMoney(monthlyTotals[ym], tx.amount);
          itemsByMonth[ym].push({
            id: tx.id,
            description: `${tx.description} (${tx.installmentNumber}/${tx.installmentTotal})`,
            amount: tx.amount,
            date: tx.date,
            type: 'installment',
          });
        }
      }
    }
  }

  // 3. Active recurring expenses not yet materialized into bills for future months
  for (const rec of recurringRules) {
    if (rec.type === 'expense' && rec.status === 'active') {
      for (let i = 1; i < monthsAhead; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        // Approximate monthly recurrence if within bounds
        if (monthlyTotals[ym] !== undefined) {
          const hasExisting = itemsByMonth[ym].some(item => item.description.includes(rec.description));
          if (!hasExisting) {
            monthlyTotals[ym] = addMoney(monthlyTotals[ym], rec.amount);
            itemsByMonth[ym].push({
              id: `rec_projected_${rec.id}_${ym}`,
              description: rec.description,
              amount: rec.amount,
              date: `${ym}-10`,
              type: rec.isSubscription ? 'subscription' : 'recurring_expense',
            });
          }
        }
      }
    }
  }

  const totalFuture = sumMoney(Object.values(monthlyTotals));

  return {
    monthlyTotals,
    itemsByMonth,
    totalFutureCommitments: totalFuture,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   CASH FLOW & PROJECTED BALANCE
   ═══════════════════════════════════════════════════════════════════════════ */

export function calculateProjectedCashFlow(
  accounts: Account[],
  transactions: Transaction[],
  bills: Bill[],
  receivables: Receivable[],
  recurringRules: RecurringTransaction[],
  daysAhead = 30
): {
  initialBalance: number;
  projectedEndBalance: number;
  totalInflows: number;
  totalOutflows: number;
  lowestProjectedBalance: number;
  lowestBalanceDate: string;
  points: CashFlowPoint[];
  hasLowBalanceRisk: boolean;
} {
  const initialBalance = calculateTotalBalance(accounts);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const points: CashFlowPoint[] = [];
  let runningBalance = initialBalance;
  let totalInflows = 0;
  let totalOutflows = 0;
  let lowestBalance = initialBalance;
  let lowestDate = todayStr;

  for (let d = 0; d < daysAhead; d++) {
    const targetDate = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayLabel = `${targetDate.getDate()}/${targetDate.getMonth() + 1}`;

    const items: Array<{ description: string; amount: number; type: 'inflow' | 'outflow'; category?: string }> = [];
    let dayInflow = 0;
    let dayOutflow = 0;

    // Receivables due on this date
    for (const rec of receivables) {
      if (rec.status === 'expected' && rec.expectedDate === dateStr) {
        dayInflow = addMoney(dayInflow, rec.amount);
        items.push({ description: rec.description, amount: rec.amount, type: 'inflow' });
      }
    }

    // Recurring incomes on this date
    for (const rule of recurringRules) {
      if (rule.type === 'income' && rule.status === 'active' && rule.nextOccurrence === dateStr) {
        // If not already in receivables
        if (!receivables.some(r => r.expectedDate === dateStr && r.description === rule.description)) {
          dayInflow = addMoney(dayInflow, rule.amount);
          items.push({ description: rule.description, amount: rule.amount, type: 'inflow' });
        }
      }
    }

    // Bills due on this date
    for (const bill of bills) {
      if ((bill.status === 'pending' || bill.status === 'overdue') && bill.dueDate === dateStr) {
        dayOutflow = addMoney(dayOutflow, bill.amount);
        items.push({ description: bill.description, amount: bill.amount, type: 'outflow' });
      }
    }

    // Recurring expenses on this date
    for (const rule of recurringRules) {
      if (rule.type === 'expense' && rule.status === 'active' && rule.nextOccurrence === dateStr) {
        if (!bills.some(b => b.dueDate === dateStr && b.description === rule.description)) {
          dayOutflow = addMoney(dayOutflow, rule.amount);
          items.push({ description: rule.description, amount: rule.amount, type: 'outflow' });
        }
      }
    }

    const netFlow = subMoney(dayInflow, dayOutflow);
    const dayStartBalance = runningBalance;
    runningBalance = addMoney(runningBalance, netFlow);

    totalInflows = addMoney(totalInflows, dayInflow);
    totalOutflows = addMoney(totalOutflows, dayOutflow);

    if (runningBalance < lowestBalance) {
      lowestBalance = runningBalance;
      lowestDate = dateStr;
    }

    points.push({
      date: dateStr,
      label: dayLabel,
      initialBalance: dayStartBalance,
      inflows: dayInflow,
      outflows: dayOutflow,
      netFlow,
      projectedBalance: runningBalance,
      items,
    });
  }

  const hasLowBalanceRisk = lowestBalance < 200 || (initialBalance > 0 && lowestBalance < initialBalance * 0.1);

  return {
    initialBalance,
    projectedEndBalance: runningBalance,
    totalInflows,
    totalOutflows,
    lowestProjectedBalance: lowestBalance,
    lowestBalanceDate: lowestDate,
    points,
    hasLowBalanceRisk,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MONTHLY CLOSING SNAPSHOT GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateMonthlyClosingSnapshot(
  monthYear: string,
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  investments: Investment[],
  recurringRules: RecurringTransaction[] = [],
  bills: Bill[] = []
): MonthlyClosing {
  const comparison = calculateMonthlyComparison(transactions, categories, monthYear);
  const fixedReport = calculateFixedVsVariableExpenses(transactions, recurringRules, bills, monthYear);
  const categoryBreakdown = calculateCategoryBreakdown(transactions, categories, monthYear);
  const currentTxs = filterTransactionsByMonth(transactions, monthYear).filter(t => t.type === 'expense' && !t.isCardInvoicePayment);

  let biggestExpDesc = 'Nenhuma despesa';
  let biggestExpAmount = 0;
  for (const t of currentTxs) {
    if (t.amount > biggestExpAmount) {
      biggestExpAmount = t.amount;
      biggestExpDesc = t.description;
    }
  }

  const topCategory = categoryBreakdown[0] || { categoryId: 'outros', categoryName: 'Nenhuma', total: 0 };
  const income = comparison.currentIncome;
  const expense = comparison.currentExpense;
  const result = subMoney(income, expense);
  const savingsRate = income > 0 && result > 0 ? (result / income) * 100 : 0;
  const netWorth = calculateNetWorth(accounts, investments);

  return {
    id: `closing_${monthYear}`,
    monthYear,
    totalIncome: income,
    totalExpenses: expense,
    netResult: result,
    savingsRate: Math.min(100, Math.max(0, savingsRate)),
    totalFixedExpenses: fixedReport.fixedExpensesTotal,
    totalVariableExpenses: fixedReport.variableExpensesTotal,
    topCategoryId: topCategory.categoryId,
    topCategoryName: topCategory.categoryName,
    topCategoryTotal: topCategory.total,
    biggestExpenseDescription: biggestExpDesc,
    biggestExpenseAmount: biggestExpAmount,
    transactionCount: comparison.currentTransactionCount,
    closingNetWorth: netWorth,
    comparedToPreviousMonth: {
      incomeVariationPercent: comparison.incomeVariationPercent,
      expenseVariationPercent: comparison.expenseVariationPercent,
      savingsVariationPercent: comparison.previousBalance !== 0 
        ? ((result - comparison.previousBalance) / Math.abs(comparison.previousBalance)) * 100 
        : 0,
    },
    generatedAt: new Date().toISOString(),
  };
}
