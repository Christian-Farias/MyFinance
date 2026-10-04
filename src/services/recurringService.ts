import { getDB } from '../database/db';
import type { RecurringTransaction, RecurrenceFrequency, Bill, Receivable, Transaction } from '../types';
import { billService } from './billService';
import { receivableService } from './receivableService';

/**
 * Calculates the next occurrence date based on frequency
 */
export function calculateNextDate(currentDateStr: string, frequency: RecurrenceFrequency): string {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly': {
      const targetMonth = date.getMonth() + 1;
      date.setMonth(targetMonth);
      // Handle month end clipping (e.g. Jan 31 -> Feb 28)
      if (date.getMonth() !== targetMonth % 12) {
        date.setDate(0);
      }
      break;
    }
    case 'bimonthly': {
      const targetMonth = date.getMonth() + 2;
      date.setMonth(targetMonth);
      if (date.getMonth() !== targetMonth % 12) {
        date.setDate(0);
      }
      break;
    }
    case 'quarterly': {
      const targetMonth = date.getMonth() + 3;
      date.setMonth(targetMonth);
      if (date.getMonth() !== targetMonth % 12) {
        date.setDate(0);
      }
      break;
    }
    case 'semiannual': {
      const targetMonth = date.getMonth() + 6;
      date.setMonth(targetMonth);
      if (date.getMonth() !== targetMonth % 12) {
        date.setDate(0);
      }
      break;
    }
    case 'annual': {
      date.setFullYear(date.getFullYear() + 1);
      break;
    }
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().split('T')[0];
}

export const recurringService = {
  async getAll(): Promise<RecurringTransaction[]> {
    const db = await getDB();
    const list = await db.getAll('recurring_transactions');
    return list.sort((a, b) => a.nextOccurrence.localeCompare(b.nextOccurrence));
  },

  async getActive(): Promise<RecurringTransaction[]> {
    const db = await getDB();
    const list = await db.getAllFromIndex('recurring_transactions', 'by-status', 'active');
    return list.sort((a, b) => a.nextOccurrence.localeCompare(b.nextOccurrence));
  },

  async getById(id: string): Promise<RecurringTransaction | undefined> {
    const db = await getDB();
    return db.get('recurring_transactions', id);
  },

  async create(ruleData: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newRule: RecurringTransaction = {
      ...ruleData,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    await db.put('recurring_transactions', newRule);

    // Auto-generate the immediate upcoming bill/receivable
    await this.materializeOccurrence(newRule);

    return newRule;
  },

  async update(rule: RecurringTransaction): Promise<RecurringTransaction> {
    const db = await getDB();
    const updated: RecurringTransaction = {
      ...rule,
      updatedAt: new Date().toISOString(),
    };
    await db.put('recurring_transactions', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('recurring_transactions', id);
  },

  async pause(id: string): Promise<void> {
    const rule = await this.getById(id);
    if (!rule) return;
    rule.status = 'paused';
    await this.update(rule);
  },

  async resume(id: string): Promise<void> {
    const rule = await this.getById(id);
    if (!rule) return;
    rule.status = 'active';
    await this.update(rule);
  },

  /**
   * Generates a single bill or receivable for the next occurrence date
   */
  async materializeOccurrence(rule: RecurringTransaction): Promise<void> {
    if (rule.status !== 'active') return;

    if (rule.type === 'expense') {
      const existingBills = await billService.getAll();
      const alreadyExists = existingBills.some(
        b => b.recurringId === rule.id && b.dueDate === rule.nextOccurrence
      );

      if (!alreadyExists) {
        await billService.create({
          description: rule.description,
          amount: rule.amount,
          dueDate: rule.nextOccurrence,
          categoryId: rule.categoryId,
          accountId: rule.accountId,
          cardId: rule.cardId,
          recurringId: rule.id,
          status: 'pending',
          isFixedExpense: rule.isFixedExpense,
          isSubscription: rule.isSubscription,
          notes: rule.notes,
        });
      }
    } else {
      const existingReceivables = await receivableService.getAll();
      const alreadyExists = existingReceivables.some(
        r => r.recurringId === rule.id && r.expectedDate === rule.nextOccurrence
      );

      if (!alreadyExists) {
        await receivableService.create({
          description: rule.description,
          amount: rule.amount,
          expectedDate: rule.nextOccurrence,
          categoryId: rule.categoryId,
          accountId: rule.accountId,
          recurringId: rule.id,
          status: 'expected',
          origin: rule.notes || 'Recorrência',
          isRecurringIncome: rule.isRecurringIncome,
          notes: rule.notes,
        });
      }
    }
  },

  /**
   * Advances the next occurrence date after an occurrence is generated or skipped
   */
  async advanceOccurrence(ruleId: string): Promise<RecurringTransaction | null> {
    const rule = await this.getById(ruleId);
    if (!rule) return null;

    const nextDate = calculateNextDate(rule.nextOccurrence, rule.frequency);

    // Check if passed end date
    if (rule.endDate && nextDate > rule.endDate) {
      rule.status = 'completed';
    } else {
      rule.nextOccurrence = nextDate;
    }

    const updated = await this.update(rule);
    await this.materializeOccurrence(updated);
    return updated;
  },

  /**
   * Skips current occurrence and moves to next
   */
  async skipOccurrence(ruleId: string): Promise<RecurringTransaction | null> {
    return this.advanceOccurrence(ruleId);
  },

  /**
   * Checks all active rules and ensures upcoming occurrences within target period exist
   */
  async processRecurringForPeriod(targetPeriodMonthYear?: string): Promise<void> {
    const activeRules = await this.getActive();
    const today = new Date().toISOString().split('T')[0];
    const thresholdMonthYear = targetPeriodMonthYear || today.substring(0, 7);

    for (const rule of activeRules) {
      if (rule.nextOccurrence.substring(0, 7) <= thresholdMonthYear) {
        await this.materializeOccurrence(rule);
      }
    }
  },
};
