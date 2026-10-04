import { getDB } from '../database/db';
import type { Goal } from '../types';
import { accountService } from './accountService';

export const goalService = {
  async getAll(): Promise<Goal[]> {
    const db = await getDB();
    return db.getAll('goals');
  },

  async getById(id: string): Promise<Goal | undefined> {
    const db = await getDB();
    return db.get('goals', id);
  },

  async create(goal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'> & { currentAmount?: number }): Promise<Goal> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currentAmount: goal.currentAmount ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('goals', newGoal);
    return newGoal;
  },

  async update(goal: Goal): Promise<Goal> {
    const db = await getDB();
    const updated = {
      ...goal,
      updatedAt: new Date().toISOString()
    };
    await db.put('goals', updated);
    return updated;
  },

  async addDeposit(goalId: string, amount: number, fromAccountId?: string): Promise<Goal | undefined> {
    const db = await getDB();
    const goal = await db.get('goals', goalId);
    if (!goal) return undefined;

    goal.currentAmount = (goal.currentAmount || 0) + amount;
    goal.updatedAt = new Date().toISOString();
    await db.put('goals', goal);

    if (fromAccountId) {
      await accountService.adjustBalance(fromAccountId, -amount);
    }
    return goal;
  },

  async deposit(goalId: string, amount: number, fromAccountId?: string): Promise<Goal | undefined> {
    return this.addDeposit(goalId, amount, fromAccountId);
  },

  async withdraw(goalId: string, amount: number, toAccountId?: string): Promise<Goal | undefined> {
    const db = await getDB();
    const goal = await db.get('goals', goalId);
    if (!goal) return undefined;

    goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - amount);
    goal.updatedAt = new Date().toISOString();
    await db.put('goals', goal);

    if (toAccountId) {
      await accountService.adjustBalance(toAccountId, amount);
    }
    return goal;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('goals', id);
  }
};
