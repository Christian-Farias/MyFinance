import { getDB } from '../database/db';
import type { Transaction, CreditCard, Account, Invoice } from '../types';
import { accountService } from './accountService';
import { cardService } from './cardService';

export const transferService = {
  /**
   * Internal transfer between two bank accounts
   */
  async transferBetweenAccounts(params: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    description?: string;
    notes?: string;
  }): Promise<Transaction> {
    const { sourceAccountId, destinationAccountId, amount, date, description, notes } = params;

    if (amount <= 0) throw new Error('Valor da transferência deve ser maior que zero');
    if (sourceAccountId === destinationAccountId) throw new Error('Conta de origem e destino não podem ser iguais');

    const sourceAccount = await accountService.getById(sourceAccountId);
    const destAccount = await accountService.getById(destinationAccountId);

    if (!sourceAccount || !destAccount) throw new Error('Contas informadas não existem');

    const db = await getDB();
    const now = new Date().toISOString();
    const txId = `tx_trf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const transferTx: Transaction = {
      id: txId,
      type: 'transfer',
      amount,
      description: description || `Transferência: ${sourceAccount.name} → ${destAccount.name}`,
      date,
      categoryId: 'financas',
      accountId: sourceAccountId,
      destinationAccountId: destinationAccountId,
      paymentMethod: 'account',
      notes,
      createdAt: now,
      updatedAt: now,
    };

    // Atomic-like update: write transaction and adjust both balances
    await db.put('transactions', transferTx);
    await accountService.updateBalance(sourceAccountId, -amount);
    await accountService.updateBalance(destinationAccountId, amount);

    return transferTx;
  },

  /**
   * Credit card invoice payment:
   * - Deducts payment amount from bank account
   * - Restores credit card available limit
   * - Marks card invoice as paid
   * - Does NOT count as duplicate expense
   */
  async payCreditCardInvoice(params: {
    cardId: string;
    accountId: string;
    invoiceMonthYear: string;
    amount: number;
    paymentDate: string;
  }): Promise<{ transaction: Transaction; invoice?: Invoice }> {
    const { cardId, accountId, invoiceMonthYear, amount, paymentDate } = params;

    if (amount <= 0) throw new Error('Valor do pagamento deve ser maior que zero');

    const card = await cardService.getById(cardId);
    const account = await accountService.getById(accountId);

    if (!card) throw new Error('Cartão de crédito não encontrado');
    if (!account) throw new Error('Conta bancária não encontrada');

    const db = await getDB();
    const now = new Date().toISOString();
    const txId = `tx_cardpay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const paymentTx: Transaction = {
      id: txId,
      type: 'expense',
      amount,
      description: `Pagamento de Fatura: ${card.name} (${invoiceMonthYear})`,
      date: paymentDate,
      categoryId: 'financas',
      accountId,
      cardId,
      invoiceMonthYear,
      isCardInvoicePayment: true, // Critical: flags this so financialCalculations won't double count
      paymentMethod: 'account',
      createdAt: now,
      updatedAt: now,
    };

    await db.put('transactions', paymentTx);

    // 1. Deduct balance from bank account
    await accountService.updateBalance(accountId, -amount);

    // 2. Restore card available limit (up to card limit)
    const newAvailable = Math.min(card.limit, card.availableLimit + amount);
    await cardService.update({
      ...card,
      availableLimit: newAvailable,
    });

    // 3. Mark invoice as paid if exists in database
    const invoices = await cardService.getInvoices(cardId);
    let invoice = invoices.find(inv => inv.monthYear === invoiceMonthYear);

    if (invoice) {
      invoice.isPaid = true;
      invoice.paidAt = paymentDate;
      await cardService.saveInvoice(invoice);
    } else {
      invoice = {
        id: `inv_${cardId}_${invoiceMonthYear}`,
        cardId,
        monthYear: invoiceMonthYear,
        closingDate: paymentDate,
        dueDate: paymentDate,
        totalAmount: amount,
        isPaid: true,
        paidAt: paymentDate,
      };
      await cardService.saveInvoice(invoice);
    }

    return { transaction: paymentTx, invoice };
  },
};
