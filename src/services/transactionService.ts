import { getDB } from '../database/db';
import type { Transaction, SmartAlert } from '../types';
import { accountService } from './accountService';
import { cardService } from './cardService';

/**
 * Safe add months without day-of-month overflow (e.g. Oct 31 + 1 month = Nov 30, not Dec 1)
 */
function safeAddMonths(baseDate: Date, monthsToAdd: number): Date {
  const result = new Date(baseDate.getTime());
  const expectedMonth = (result.getMonth() + monthsToAdd) % 12;
  result.setMonth(result.getMonth() + monthsToAdd);
  // If month overflowed due to day count difference, roll back to last day of expected month
  if (result.getMonth() !== expectedMonth) {
    result.setDate(0);
  }
  return result;
}

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const db = await getDB();
    const list = await db.getAll('transactions');
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getById(id: string): Promise<Transaction | undefined> {
    const db = await getDB();
    return db.get('transactions', id);
  },

  async getRecent(limit = 5): Promise<Transaction[]> {
    const all = await this.getAll();
    return all.slice(0, limit);
  },

  async getByCard(cardId: string): Promise<Transaction[]> {
    const db = await getDB();
    const list = await db.getAllFromIndex('transactions', 'by-card', cardId);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Duplicate detection: checks if a transaction with same amount, date, and description exists
   * Excludes the transaction itself by id if provided.
   */
  async detectDuplicate(newTx: Partial<Transaction>, excludeId?: string): Promise<Transaction | null> {
    if (!newTx.amount || !newTx.date) return null;
    const db = await getDB();
    const allTxs = await db.getAllFromIndex('transactions', 'by-date', newTx.date);
    
    const duplicate = allTxs.find(t => {
      if (excludeId && t.id === excludeId) return false;
      if (newTx.id && t.id === newTx.id) return false;
      const sameAmount = Math.abs(t.amount - (newTx.amount || 0)) < 0.01;
      const sameDesc = t.description?.toLowerCase().trim() === newTx.description?.toLowerCase().trim();
      const sameAccount = t.accountId && newTx.accountId ? t.accountId === newTx.accountId : true;
      const sameCard = t.cardId && newTx.cardId ? t.cardId === newTx.cardId : true;
      return sameAmount && sameDesc && sameAccount && sameCard;
    });

    return duplicate || null;
  },

  /**
   * Creates a transaction and automatically handles balance, card limits, and installments
   */
  async create(
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    installmentsCount = 1
  ): Promise<Transaction[]> {
    const db = await getDB();
    const now = new Date().toISOString();
    const createdTransactions: Transaction[] = [];

    // Check duplicate BEFORE saving
    const duplicate = await this.detectDuplicate(txData);

    // Installments handling
    if (installmentsCount > 1 && txData.type === 'expense') {
      const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const installmentAmount = Math.round((txData.amount / installmentsCount) * 100) / 100;
      const baseDate = new Date(txData.date + 'T12:00:00');

      for (let i = 1; i <= installmentsCount; i++) {
        const instDate = safeAddMonths(baseDate, i - 1);
        const dateStr = instDate.toISOString().split('T')[0];
        const monthYear = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}`;

        const instTx: Transaction = {
          ...txData,
          id: `tx_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
          amount: installmentAmount,
          date: dateStr,
          installmentId: planId,
          installmentNumber: i,
          installmentTotal: installmentsCount,
          invoiceMonthYear: monthYear,
          createdAt: now,
          updatedAt: now,
        };

        await db.put('transactions', instTx);
        createdTransactions.push(instTx);
      }

      // If tied to card, recalculate limit
      if (txData.cardId) {
        await cardService.recalculateCardLimits(txData.cardId);
      }
    } else {
      // Single transaction
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        invoiceMonthYear: txData.date.substring(0, 7),
        createdAt: now,
        updatedAt: now,
      };

      await db.put('transactions', newTx);
      createdTransactions.push(newTx);

      // Adjust account balance if regular account transaction
      if (newTx.accountId) {
        if (newTx.type === 'expense') {
          await accountService.adjustBalance(newTx.accountId, -newTx.amount);
        } else if (newTx.type === 'income') {
          await accountService.adjustBalance(newTx.accountId, newTx.amount);
        } else if (newTx.type === 'transfer' && newTx.destinationAccountId) {
          await accountService.transfer(newTx.accountId, newTx.destinationAccountId, newTx.amount);
        }
      }

      // Adjust card limits if card purchase
      if (newTx.cardId) {
        await cardService.recalculateCardLimits(newTx.cardId);
      }
    }

    // Trigger duplicate alert ONLY if genuinely duplicate of an older transaction
    if (duplicate) {
      const alert: SmartAlert = {
        id: `alert_dup_${Date.now()}`,
        type: 'duplicate',
        title: 'Transação suspeita de duplicidade',
        message: `Uma transação de R$ ${txData.amount?.toFixed(2)} com a descrição "${txData.description}" já foi registrada em ${txData.date}.`,
        date: new Date().toISOString(),
        isRead: false,
        isImportant: true,
      };
      await db.put('alerts', alert);
    }

    return createdTransactions;
  },

  /**
   * Updates an existing transaction, reverting old balance effect and applying new
   */
  async update(tx: Transaction): Promise<Transaction> {
    const db = await getDB();
    const oldTx = await db.get('transactions', tx.id);
    if (!oldTx) {
      await db.put('transactions', tx);
      return tx;
    }

    // 1. Revert old transaction effect on account
    if (oldTx.accountId) {
      if (oldTx.type === 'expense') {
        await accountService.adjustBalance(oldTx.accountId, oldTx.amount);
      } else if (oldTx.type === 'income') {
        await accountService.adjustBalance(oldTx.accountId, -oldTx.amount);
      } else if (oldTx.type === 'transfer' && oldTx.destinationAccountId) {
        await accountService.transfer(oldTx.destinationAccountId, oldTx.accountId, oldTx.amount);
      }
    }

    // 2. Apply new transaction effect on account
    if (tx.accountId) {
      if (tx.type === 'expense') {
        await accountService.adjustBalance(tx.accountId, -tx.amount);
      } else if (tx.type === 'income') {
        await accountService.adjustBalance(tx.accountId, tx.amount);
      } else if (tx.type === 'transfer' && tx.destinationAccountId) {
        await accountService.transfer(tx.accountId, tx.destinationAccountId, tx.amount);
      }
    }

    // 3. Save updated transaction in DB
    const updated: Transaction = {
      ...tx,
      invoiceMonthYear: tx.invoiceMonthYear || tx.date.substring(0, 7),
      updatedAt: new Date().toISOString()
    };
    await db.put('transactions', updated);

    // 4. Recalculate card limits if old or new has card
    if (oldTx.cardId) await cardService.recalculateCardLimits(oldTx.cardId);
    if (tx.cardId && tx.cardId !== oldTx.cardId) await cardService.recalculateCardLimits(tx.cardId);

    return updated;
  },

  /**
   * Deletes a transaction and restores account balance / card limit
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    const tx = await db.get('transactions', id);
    if (!tx) return;

    // Revert account balance
    if (tx.accountId) {
      if (tx.type === 'expense') {
        await accountService.adjustBalance(tx.accountId, tx.amount);
      } else if (tx.type === 'income') {
        await accountService.adjustBalance(tx.accountId, -tx.amount);
      } else if (tx.type === 'transfer' && tx.destinationAccountId) {
        await accountService.transfer(tx.destinationAccountId, tx.accountId, tx.amount);
      }
    }

    await db.delete('transactions', id);

    // Revert card limit
    if (tx.cardId) {
      await cardService.recalculateCardLimits(tx.cardId);
    }
  }
};
