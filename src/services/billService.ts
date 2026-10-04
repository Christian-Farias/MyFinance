import { getDB } from '../database/db';
import type { Bill, Transaction } from '../types';
import { accountService } from './accountService';

export const billService = {
  async getAll(): Promise<Bill[]> {
    const db = await getDB();
    const list = await db.getAll('bills');
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  async getById(id: string): Promise<Bill | undefined> {
    const db = await getDB();
    return db.get('bills', id);
  },

  async create(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newBill: Bill = {
      ...billData,
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    await db.put('bills', newBill);
    return newBill;
  },

  async update(bill: Bill): Promise<Bill> {
    const db = await getDB();
    const updated: Bill = {
      ...bill,
      updatedAt: new Date().toISOString(),
    };
    await db.put('bills', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('bills', id);
  },

  /**
   * Marks a bill as paid, integrates with transactions and safely updates account balance
   */
  async markAsPaid(billId: string, accountId?: string, paymentDate?: string): Promise<{ bill: Bill; transaction: Transaction }> {
    const db = await getDB();
    const bill = await this.getById(billId);
    if (!bill) throw new Error('Conta a pagar não encontrada');

    const paidDate = paymentDate || new Date().toISOString().split('T')[0];
    const targetAccountId = accountId || bill.accountId;
    const now = new Date().toISOString();

    // 1. Create matching transaction
    const txId = `tx_bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      id: txId,
      type: 'expense',
      amount: bill.amount,
      description: `Pagamento: ${bill.description}`,
      date: paidDate,
      categoryId: bill.categoryId,
      accountId: targetAccountId,
      cardId: bill.cardId,
      billId: bill.id,
      recurringId: bill.recurringId,
      isFixedExpense: bill.isFixedExpense,
      paymentMethod: bill.cardId ? 'credit_card' : 'account',
      createdAt: now,
      updatedAt: now,
    };

    await db.put('transactions', newTx);

    // 2. Deduct from account balance if account is specified
    if (targetAccountId) {
      await accountService.updateBalance(targetAccountId, -bill.amount);
    }

    // 3. Update bill status
    bill.status = 'paid';
    bill.paidAt = paidDate;
    bill.paidTransactionId = txId;
    if (targetAccountId) bill.accountId = targetAccountId;

    const updatedBill = await this.update(bill);

    // 4. If linked to a recurring rule, dynamically import recurringService to advance date without circular dependency
    if (bill.recurringId) {
      const { recurringService } = await import('./recurringService');
      await recurringService.advanceOccurrence(bill.recurringId);
    }

    return { bill: updatedBill, transaction: newTx };
  },

  /**
   * Proximity queries
   */
  async getDueToday(): Promise<Bill[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(b => (b.status === 'pending' || b.status === 'overdue') && b.dueDate === today);
  },

  async getNext7Days(): Promise<Bill[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(b => (b.status === 'pending' || b.status === 'overdue') && b.dueDate >= today && b.dueDate <= next7);
  },

  async getNext30Days(): Promise<Bill[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(b => (b.status === 'pending' || b.status === 'overdue') && b.dueDate >= today && b.dueDate <= next30);
  },

  async getOverdue(): Promise<Bill[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(b => (b.status === 'pending' || b.status === 'overdue') && b.dueDate < today);
  },

  async getPaid(): Promise<Bill[]> {
    const all = await this.getAll();
    return all.filter(b => b.status === 'paid');
  },
};
