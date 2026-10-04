import { getDB, clearEntireDatabase } from '../database/db';

export const backupService = {
  async exportData(): Promise<string> {
    const db = await getDB();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: await db.getAll('accounts'),
      transactions: await db.getAll('transactions'),
      categories: await db.getAll('categories'),
      cards: await db.getAll('cards'),
      invoices: await db.getAll('invoices'),
      installments: await db.getAll('installments'),
      budgets: await db.getAll('budgets'),
      goals: await db.getAll('goals'),
      investments: await db.getAll('investments'),
      alerts: await db.getAll('alerts'),
      settings: await db.get('settings', 'userSettings')
    };

    return JSON.stringify(data, null, 2);
  },

  async downloadBackupFile(): Promise<void> {
    const jsonStr = await this.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myfinance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importData(jsonContent: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.version || !data.accounts || !data.transactions) {
        throw new Error('Arquivo de backup inválido.');
      }

      await clearEntireDatabase();
      const db = await getDB();

      if (data.accounts?.length) {
        const tx = db.transaction('accounts', 'readwrite');
        for (const a of data.accounts) await tx.store.put(a);
        await tx.done;
      }

      if (data.transactions?.length) {
        const tx = db.transaction('transactions', 'readwrite');
        for (const t of data.transactions) await tx.store.put(t);
        await tx.done;
      }

      if (data.categories?.length) {
        const tx = db.transaction('categories', 'readwrite');
        for (const c of data.categories) await tx.store.put(c);
        await tx.done;
      }

      if (data.cards?.length) {
        const tx = db.transaction('cards', 'readwrite');
        for (const c of data.cards) await tx.store.put(c);
        await tx.done;
      }

      if (data.budgets?.length) {
        const tx = db.transaction('budgets', 'readwrite');
        for (const b of data.budgets) await tx.store.put(b);
        await tx.done;
      }

      if (data.goals?.length) {
        const tx = db.transaction('goals', 'readwrite');
        for (const g of data.goals) await tx.store.put(g);
        await tx.done;
      }

      if (data.investments?.length) {
        const tx = db.transaction('investments', 'readwrite');
        for (const inv of data.investments) await tx.store.put(inv);
        await tx.done;
      }

      if (data.alerts?.length) {
        const tx = db.transaction('alerts', 'readwrite');
        for (const al of data.alerts) await tx.store.put(al);
        await tx.done;
      }

      if (data.settings) {
        await db.put('settings', data.settings, 'userSettings');
      }

      return true;
    } catch (err) {
      console.error('Falha ao restaurar backup:', err);
      return false;
    }
  }
};
