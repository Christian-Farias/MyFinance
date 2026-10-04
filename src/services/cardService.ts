import { getDB } from '../database/db';
import type { CreditCard, Invoice, Transaction } from '../types';

export const cardService = {
  async getAll(): Promise<CreditCard[]> {
    const db = await getDB();
    return db.getAll('cards');
  },

  async getById(id: string): Promise<CreditCard | undefined> {
    const db = await getDB();
    return db.get('cards', id);
  },

  async create(card: Omit<CreditCard, 'id' | 'availableLimit' | 'createdAt' | 'updatedAt'> & { availableLimit?: number }): Promise<CreditCard> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newCard: CreditCard = {
      ...card,
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      availableLimit: card.availableLimit ?? card.limit,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('cards', newCard);
    return newCard;
  },

  async update(card: CreditCard): Promise<CreditCard> {
    const db = await getDB();
    const updated = {
      ...card,
      updatedAt: new Date().toISOString()
    };
    await db.put('cards', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('cards', id);
  },

  /**
   * Recalculates available limit and active invoices for a card based on transactions
   */
  async recalculateCardLimits(cardId: string): Promise<{ usedLimit: number; availableLimit: number; currentInvoice: number }> {
    const db = await getDB();
    const card = await db.get('cards', cardId);
    if (!card) return { usedLimit: 0, availableLimit: 0, currentInvoice: 0 };

    const transactions = await db.getAllFromIndex('transactions', 'by-card', cardId);
    
    // Total unpaid credit card expenses
    const usedLimit = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const availableLimit = Math.max(0, card.limit - usedLimit);

    card.availableLimit = availableLimit;
    card.updatedAt = new Date().toISOString();
    await db.put('cards', card);

    // Current month invoice
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentInvoice = transactions
      .filter(t => t.type === 'expense' && (t.invoiceMonthYear === currentMonthYear || t.date?.startsWith(currentMonthYear)))
      .reduce((sum, t) => sum + t.amount, 0);

    return { usedLimit, availableLimit, currentInvoice };
  },

  async getInvoices(cardId: string): Promise<Invoice[]> {
    const db = await getDB();
    const invoices = await db.getAll('invoices');
    return invoices.filter(i => i.cardId === cardId);
  },

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const db = await getDB();
    await db.put('invoices', invoice);
    return invoice;
  }
};
