import { getDB } from '../database/db';
import type { Receivable, Transaction } from '../types';
import { accountService } from './accountService';

export const receivableService = {
  async getAll(): Promise<Receivable[]> {
    const db = await getDB();
    const list = await db.getAll('receivables');
    return list.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
  },

  async getById(id: string): Promise<Receivable | undefined> {
    const db = await getDB();
    return db.get('receivables', id);
  },

  async create(recData: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt'>): Promise<Receivable> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newRec: Receivable = {
      ...recData,
      id: `rec_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    await db.put('receivables', newRec);
    return newRec;
  },

  async update(receivable: Receivable): Promise<Receivable> {
    const db = await getDB();
    const updated: Receivable = {
      ...receivable,
      updatedAt: new Date().toISOString(),
    };
    await db.put('receivables', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('receivables', id);
  },

  /**
   * Marks a receivable as received, creates matching income transaction and safely adds to account balance
   */
  async markAsReceived(receivableId: string, accountId?: string, receivedDate?: string): Promise<{ receivable: Receivable; transaction: Transaction }> {
    const db = await getDB();
    const rec = await this.getById(receivableId);
    if (!rec) throw new Error('Recebível não encontrado');

    const recDate = receivedDate || new Date().toISOString().split('T')[0];
    const targetAccountId = accountId || rec.accountId;
    const now = new Date().toISOString();

    // 1. Create matching income transaction
    const txId = `tx_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      id: txId,
      type: 'income',
      amount: rec.amount,
      description: `Recebimento: ${rec.description}`,
      date: recDate,
      categoryId: rec.categoryId,
      accountId: targetAccountId,
      receivableId: rec.id,
      recurringId: rec.recurringId,
      paymentMethod: 'account',
      createdAt: now,
      updatedAt: now,
    };

    await db.put('transactions', newTx);

    // 2. Add to account balance
    if (targetAccountId) {
      await accountService.updateBalance(targetAccountId, rec.amount);
    }

    // 3. Update receivable status
    rec.status = 'received';
    rec.receivedAt = recDate;
    rec.receivedTransactionId = txId;
    if (targetAccountId) rec.accountId = targetAccountId;

    const updatedRec = await this.update(rec);

    // 4. Advance linked recurring rule if present
    if (rec.recurringId) {
      const { recurringService } = await import('./recurringService');
      await recurringService.advanceOccurrence(rec.recurringId);
    }

    return { receivable: updatedRec, transaction: newTx };
  },

  /**
   * Proximity queries
   */
  async getExpectedToday(): Promise<Receivable[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(r => (r.status === 'expected' || r.status === 'delayed') && r.expectedDate === today);
  },

  async getNext7Days(): Promise<Receivable[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(r => (r.status === 'expected' || r.status === 'delayed') && r.expectedDate >= today && r.expectedDate <= next7);
  },

  async getNext30Days(): Promise<Receivable[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(r => (r.status === 'expected' || r.status === 'delayed') && r.expectedDate >= today && r.expectedDate <= next30);
  },

  async getDelayed(): Promise<Receivable[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(r => (r.status === 'expected' || r.status === 'delayed') && r.expectedDate < today);
  },

  async getReceived(): Promise<Receivable[]> {
    const all = await this.getAll();
    return all.filter(r => r.status === 'received');
  },
};
