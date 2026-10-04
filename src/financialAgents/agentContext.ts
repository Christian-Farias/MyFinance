import type { Transaction, Account, Category, CreditCard, Goal, Budget, Bill, Receivable, RecurringTransaction, Subscription, Investment } from '../types';

export interface FullFinancialState {
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

export function computeStateHash(state: FullFinancialState): string {
  const counts = `${state.transactions.length}-${state.accounts.length}-${state.bills.length}-${state.goals.length}-${state.budgets.length}-${state.cards.length}`;
  const lastTxId = state.transactions[state.transactions.length - 1]?.id || 'none';
  const lastTxDate = state.transactions[state.transactions.length - 1]?.updatedAt || 'none';
  return `${counts}_${lastTxId}_${lastTxDate}`;
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateStandardDeviation(values: number[], mean?: number): number {
  if (values.length <= 1) return 0;
  const avg = mean ?? calculateAverage(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

export function getHistorical3MonthsTransactions(transactions: Transaction[], currentMonthYear: string): Transaction[] {
  const [yearStr, monthStr] = currentMonthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const prevMonths: string[] = [];
  for (let i = 1; i <= 3; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    prevMonths.push(`${y}-${String(m).padStart(2, '0')}`);
  }

  return transactions.filter(t => t.date && prevMonths.some(pm => t.date.startsWith(pm)));
}
