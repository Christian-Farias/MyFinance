import { getDB } from '../database/db';
import type { Account } from '../types';

export const accountService = {
  async getAll(): Promise<Account[]> {
    const db = await getDB();
    return db.getAll('accounts');
  },

  async getById(id: string): Promise<Account | undefined> {
    const db = await getDB();
    return db.get('accounts', id);
  },

  async create(account: Omit<Account, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'> & { currentBalance?: number }): Promise<Account> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...account,
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      currentBalance: account.currentBalance ?? account.initialBalance ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('accounts', newAccount);
    return newAccount;
  },

  async update(account: Account): Promise<Account> {
    const db = await getDB();
    const updated = {
      ...account,
      updatedAt: new Date().toISOString()
    };
    await db.put('accounts', updated);
    return updated;
  },

  async adjustBalance(accountId: string, delta: number): Promise<Account | undefined> {
    const db = await getDB();
    const account = await db.get('accounts', accountId);
    if (!account) return undefined;

    account.currentBalance = (account.currentBalance || 0) + delta;
    account.updatedAt = new Date().toISOString();
    await db.put('accounts', account);
    return account;
  },

  async updateBalance(accountId: string, delta: number): Promise<Account | undefined> {
    return this.adjustBalance(accountId, delta);
  },

  async transfer(fromAccountId: string, toAccountId: string, amount: number): Promise<boolean> {
    const db = await getDB();
    const tx = db.transaction('accounts', 'readwrite');
    const from = await tx.store.get(fromAccountId);
    const to = await tx.store.get(toAccountId);

    if (!from || !to) {
      await tx.done;
      return false;
    }

    from.currentBalance -= amount;
    to.currentBalance += amount;
    from.updatedAt = new Date().toISOString();
    to.updatedAt = new Date().toISOString();

    await tx.store.put(from);
    await tx.store.put(to);
    await tx.done;
    return true;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('accounts', id);
  }
};
