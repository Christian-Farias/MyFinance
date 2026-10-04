import { getDB } from '../database/db';
import type { Subscription, RecurringTransaction, RecurrenceFrequency } from '../types';
import { mulMoney, divMoney } from '../calculations/financialCalculations';

export function calculateEstimates(amount: number, frequency: RecurrenceFrequency): { monthly: number; annual: number } {
  let monthly = amount;
  let annual = amount * 12;

  switch (frequency) {
    case 'weekly':
      monthly = mulMoney(amount, 4.333);
      annual = mulMoney(amount, 52);
      break;
    case 'biweekly':
      monthly = mulMoney(amount, 2.166);
      annual = mulMoney(amount, 26);
      break;
    case 'monthly':
      monthly = amount;
      annual = mulMoney(amount, 12);
      break;
    case 'bimonthly':
      monthly = divMoney(amount, 2);
      annual = mulMoney(amount, 6);
      break;
    case 'quarterly':
      monthly = divMoney(amount, 3);
      annual = mulMoney(amount, 4);
      break;
    case 'semiannual':
      monthly = divMoney(amount, 6);
      annual = mulMoney(amount, 2);
      break;
    case 'annual':
      monthly = divMoney(amount, 12);
      annual = amount;
      break;
  }

  return { monthly, annual };
}

export const subscriptionService = {
  async getAll(): Promise<Subscription[]> {
    const db = await getDB();
    const list = await db.getAll('subscriptions');
    return list.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
  },

  async getById(id: string): Promise<Subscription | undefined> {
    const db = await getDB();
    return db.get('subscriptions', id);
  },

  async create(subData: Omit<Subscription, 'id' | 'monthlyEstimate' | 'annualEstimate' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const db = await getDB();
    const now = new Date().toISOString();
    const { monthly, annual } = calculateEstimates(subData.amount, subData.frequency);

    const newSub: Subscription = {
      ...subData,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      monthlyEstimate: monthly,
      annualEstimate: annual,
      createdAt: now,
      updatedAt: now,
    };

    await db.put('subscriptions', newSub);
    return newSub;
  },

  async update(subscription: Subscription): Promise<Subscription> {
    const db = await getDB();
    const { monthly, annual } = calculateEstimates(subscription.amount, subscription.frequency);
    const updated: Subscription = {
      ...subscription,
      monthlyEstimate: monthly,
      annualEstimate: annual,
      updatedAt: new Date().toISOString(),
    };
    await db.put('subscriptions', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('subscriptions', id);
  },

  /**
   * Automatically synchronizes subscriptions with recurring transactions marked as subscriptions
   */
  async syncFromRecurringRules(recurringRules: RecurringTransaction[]): Promise<Subscription[]> {
    const db = await getDB();
    const currentSubs = await this.getAll();
    const subRecurringRules = recurringRules.filter(r => r.isSubscription);

    for (const rule of subRecurringRules) {
      const existing = currentSubs.find(s => s.recurringId === rule.id);
      const { monthly, annual } = calculateEstimates(rule.amount, rule.frequency);

      if (existing) {
        existing.name = rule.description;
        existing.amount = rule.amount;
        existing.frequency = rule.frequency;
        existing.nextBillingDate = rule.nextOccurrence;
        existing.categoryId = rule.categoryId;
        existing.cardId = rule.cardId;
        existing.accountId = rule.accountId;
        existing.monthlyEstimate = monthly;
        existing.annualEstimate = annual;
        existing.isActive = rule.status === 'active';
        existing.updatedAt = new Date().toISOString();
        await db.put('subscriptions', existing);
      } else {
        const now = new Date().toISOString();
        const newSub: Subscription = {
          id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: rule.description,
          amount: rule.amount,
          frequency: rule.frequency,
          nextBillingDate: rule.nextOccurrence,
          categoryId: rule.categoryId,
          cardId: rule.cardId,
          accountId: rule.accountId,
          recurringId: rule.id,
          monthlyEstimate: monthly,
          annualEstimate: annual,
          isActive: rule.status === 'active',
          createdAt: now,
          updatedAt: now,
        };
        await db.put('subscriptions', newSub);
      }
    }

    return this.getAll();
  },
};
