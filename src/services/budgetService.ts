import { getDB } from '../database/db';
import type { Budget } from '../types';

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    const db = await getDB();
    return db.getAll('budgets');
  },

  async getByMonth(monthYear: string): Promise<Budget[]> {
    const all = await this.getAll();
    return all.filter(b => b.monthYear === monthYear || b.monthYear === 'all');
  },

  async create(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newBudget: Budget = {
      ...budget,
      id: `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('budgets', newBudget);
    return newBudget;
  },

  async update(budget: Budget): Promise<Budget> {
    const db = await getDB();
    const updated = {
      ...budget,
      updatedAt: new Date().toISOString()
    };
    await db.put('budgets', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('budgets', id);
  }
};
