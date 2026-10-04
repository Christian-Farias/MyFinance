import { getDB } from '../database/db';
import type { MonthlyClosing, Transaction, Category, Account, Investment, RecurringTransaction, Bill } from '../types';
import { generateMonthlyClosingSnapshot } from '../calculations/financialCalculations';

export const monthlyClosingService = {
  async getAll(): Promise<MonthlyClosing[]> {
    const db = await getDB();
    const list = await db.getAll('monthly_closings');
    return list.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
  },

  async getByMonthYear(monthYear: string): Promise<MonthlyClosing | undefined> {
    const db = await getDB();
    return db.get('monthly_closings', `closing_${monthYear}`);
  },

  async saveClosing(closing: MonthlyClosing): Promise<MonthlyClosing> {
    const db = await getDB();
    await db.put('monthly_closings', closing);
    return closing;
  },

  /**
   * Generates and stores a monthly closing snapshot for a given month
   */
  async generateAndSave(
    monthYear: string,
    transactions: Transaction[],
    categories: Category[],
    accounts: Account[],
    investments: Investment[],
    recurringRules: RecurringTransaction[] = [],
    bills: Bill[] = []
  ): Promise<MonthlyClosing> {
    const snapshot = generateMonthlyClosingSnapshot(
      monthYear,
      transactions,
      categories,
      accounts,
      investments,
      recurringRules,
      bills
    );

    return this.saveClosing(snapshot);
  },
};
