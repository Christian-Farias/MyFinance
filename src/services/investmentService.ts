import { getDB } from '../database/db';
import type { Investment } from '../types';

export const investmentService = {
  async getAll(): Promise<Investment[]> {
    const db = await getDB();
    return db.getAll('investments');
  },

  async getById(id: string): Promise<Investment | undefined> {
    const db = await getDB();
    return db.get('investments', id);
  },

  async create(data: Omit<Investment, 'id' | 'totalInvested' | 'currentValue' | 'yieldPercentage' | 'createdAt' | 'updatedAt'> & {
    totalInvested?: number;
    currentValue?: number;
    yieldPercentage?: number;
  }): Promise<Investment> {
    const db = await getDB();
    const now = new Date().toISOString();
    const totalInvested = data.totalInvested ?? (data.quantity * data.averagePrice);
    const currentValue = data.currentValue ?? (data.quantity * data.currentPrice);
    const yieldPercentage = data.yieldPercentage ?? (totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0);

    const newInv: Investment = {
      ...data,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      totalInvested,
      currentValue,
      yieldPercentage,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('investments', newInv);
    return newInv;
  },

  async update(inv: Investment): Promise<Investment> {
    const db = await getDB();
    const totalInvested = inv.quantity * inv.averagePrice;
    const currentValue = inv.quantity * inv.currentPrice;
    const yieldPercentage = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    const updated: Investment = {
      ...inv,
      totalInvested,
      currentValue,
      yieldPercentage,
      updatedAt: new Date().toISOString()
    };
    await db.put('investments', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('investments', id);
  }
};
