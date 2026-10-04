import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { 
  Account, 
  Transaction, 
  Category, 
  CreditCard, 
  Invoice, 
  InstallmentPlan, 
  Budget, 
  Goal, 
  Investment, 
  SmartAlert,
  RecurringTransaction,
  Bill,
  Receivable,
  Subscription,
  MonthlyClosing,
  UserSettings 
} from '../types';

export interface MyFinanceDBSchema extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-name': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-type': string;
      'by-account': string;
      'by-card': string;
      'by-category': string;
      'by-recurring': string;
      'by-bill': string;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
  cards: {
    key: string;
    value: CreditCard;
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: {
      'by-card': string;
      'by-month-year': string;
    };
  };
  installments: {
    key: string;
    value: InstallmentPlan;
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: {
      'by-category': string;
      'by-month-year': string;
    };
  };
  goals: {
    key: string;
    value: Goal;
  };
  investments: {
    key: string;
    value: Investment;
  };
  alerts: {
    key: string;
    value: SmartAlert;
    indexes: {
      'by-date': string;
      'by-read': number;
    };
  };
  recurring_transactions: {
    key: string;
    value: RecurringTransaction;
    indexes: {
      'by-status': string;
      'by-next-occurrence': string;
      'by-type': string;
    };
  };
  bills: {
    key: string;
    value: Bill;
    indexes: {
      'by-due-date': string;
      'by-status': string;
      'by-recurring': string;
    };
  };
  receivables: {
    key: string;
    value: Receivable;
    indexes: {
      'by-expected-date': string;
      'by-status': string;
      'by-recurring': string;
    };
  };
  subscriptions: {
    key: string;
    value: Subscription;
  };
  monthly_closings: {
    key: string;
    value: MonthlyClosing;
    indexes: {
      'by-month-year': string;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'MyFinanceDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<MyFinanceDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<MyFinanceDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MyFinanceDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // --- Version 1 Stores ---
        if (!db.objectStoreNames.contains('accounts')) {
          const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
          accountStore.createIndex('by-name', 'name');
        }

        let txStore;
        if (!db.objectStoreNames.contains('transactions')) {
          txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-type', 'type');
          txStore.createIndex('by-account', 'accountId');
          txStore.createIndex('by-card', 'cardId');
          txStore.createIndex('by-category', 'categoryId');
        } else {
          // If transaction store exists, we can access it via transaction if needed
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
          invoiceStore.createIndex('by-card', 'cardId');
          invoiceStore.createIndex('by-month-year', 'monthYear');
        }

        if (!db.objectStoreNames.contains('installments')) {
          db.createObjectStore('installments', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('budgets')) {
          const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
          budgetStore.createIndex('by-category', 'categoryId');
          budgetStore.createIndex('by-month-year', 'monthYear');
        }

        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('investments')) {
          db.createObjectStore('investments', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
          alertStore.createIndex('by-date', 'date');
          alertStore.createIndex('by-read', 'isRead');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // --- Version 2 Stores (New Financial Planning Entities) ---
        if (!db.objectStoreNames.contains('recurring_transactions')) {
          const recurringStore = db.createObjectStore('recurring_transactions', { keyPath: 'id' });
          recurringStore.createIndex('by-status', 'status');
          recurringStore.createIndex('by-next-occurrence', 'nextOccurrence');
          recurringStore.createIndex('by-type', 'type');
        }

        if (!db.objectStoreNames.contains('bills')) {
          const billStore = db.createObjectStore('bills', { keyPath: 'id' });
          billStore.createIndex('by-due-date', 'dueDate');
          billStore.createIndex('by-status', 'status');
          billStore.createIndex('by-recurring', 'recurringId');
        }

        if (!db.objectStoreNames.contains('receivables')) {
          const recStore = db.createObjectStore('receivables', { keyPath: 'id' });
          recStore.createIndex('by-expected-date', 'expectedDate');
          recStore.createIndex('by-status', 'status');
          recStore.createIndex('by-recurring', 'recurringId');
        }

        if (!db.objectStoreNames.contains('subscriptions')) {
          db.createObjectStore('subscriptions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('monthly_closings')) {
          const closingStore = db.createObjectStore('monthly_closings', { keyPath: 'id' });
          closingStore.createIndex('by-month-year', 'monthYear');
        }
      },
      blocked() {
        console.warn('Banco IndexedDB bloqueado aguardando fechamento de outras abas.');
      },
      blocking() {
        console.warn('Fechando conexão antiga do IndexedDB para atualização...');
        if (dbPromise) {
          dbPromise.then(db => db.close());
          dbPromise = null;
        }
      }
    });
  }
  return dbPromise;
}

export async function clearEntireDatabase(): Promise<void> {
  const db = await getDB();
  const storeNames = Array.from(db.objectStoreNames);
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map(name => tx.objectStore(name).clear()));
  await tx.done;
}
