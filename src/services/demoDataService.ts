import { getDB, clearEntireDatabase } from '../database/db';
import { DEFAULT_CATEGORIES } from './categoryService';
import type { 
  Account, 
  CreditCard, 
  Transaction, 
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

export const demoDataService = {
  async loadDemoData(): Promise<void> {
    await clearEntireDatabase();
    const db = await getDB();

    // 1. Categories
    const catTx = db.transaction('categories', 'readwrite');
    for (const cat of DEFAULT_CATEGORIES) {
      await catTx.store.put(cat);
    }
    await catTx.done;

    // Current date helpers (anchored in 2026-10 or current date)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const currentYearMonth = `${year}-${month}`;

    // 2. Accounts
    const accounts: Account[] = [
      {
        id: 'acc_nubank',
        name: 'Nubank',
        institution: 'Nubank',
        type: 'checking',
        initialBalance: 3000.00,
        currentBalance: 3000.00,
        color: '#8B7CFF',
        icon: 'CreditCard',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'acc_inter',
        name: 'Banco Inter',
        institution: 'Inter',
        type: 'checking',
        initialBalance: 2400.00,
        currentBalance: 2400.00,
        color: '#3B82F6',
        icon: 'Building2',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'acc_dinheiro',
        name: 'Carteira (Dinheiro)',
        institution: 'Espécie',
        type: 'cash',
        initialBalance: 400.00,
        currentBalance: 400.00,
        color: '#39D98A',
        icon: 'Coins',
        createdAt: todayStr,
        updatedAt: todayStr
      }
    ];

    const accTx = db.transaction('accounts', 'readwrite');
    for (const a of accounts) await accTx.store.put(a);
    await accTx.done;

    // 3. Credit Cards
    const cards: CreditCard[] = [
      {
        id: 'card_nubank',
        name: 'Nubank Ultravioleta',
        institution: 'Nubank',
        brand: 'mastercard',
        limit: 4000.00,
        availableLimit: 2800.00,
        closingDay: 5,
        dueDay: 12,
        lastDigits: '4821',
        color: '#8B7CFF',
        isActive: true,
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'card_inter',
        name: 'Inter Black',
        institution: 'Inter',
        brand: 'mastercard',
        limit: 5000.00,
        availableLimit: 4500.00,
        closingDay: 15,
        dueDay: 22,
        lastDigits: '9032',
        color: '#1E293B',
        isActive: true,
        createdAt: todayStr,
        updatedAt: todayStr
      }
    ];

    const cardTx = db.transaction('cards', 'readwrite');
    for (const c of cards) await cardTx.store.put(c);
    await cardTx.done;

    // 4. Installments & Transactions (Including multi-month installment demo Notebook)
    const planId = 'plan_notebook_dell';
    const transactions: Transaction[] = [
      // Income
      {
        id: 'tx_salario',
        type: 'income',
        amount: 3500.00,
        description: 'Salário Mensal',
        date: `${year}-${month}-05`,
        categoryId: 'trabalho',
        accountId: 'acc_nubank',
        paymentMethod: 'account',
        isRecurring: true,
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'tx_freela',
        type: 'income',
        amount: 850.00,
        description: 'Projeto Freelance Website',
        date: `${year}-${month}-02`,
        categoryId: 'trabalho',
        accountId: 'acc_inter',
        paymentMethod: 'account',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      // Fixed Expenses
      {
        id: 'tx_aluguel',
        type: 'expense',
        amount: 900.00,
        description: 'Aluguel do Apartamento',
        date: `${year}-${month}-10`,
        categoryId: 'moradia',
        accountId: 'acc_nubank',
        isFixedExpense: true,
        paymentMethod: 'account',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'tx_internet',
        type: 'expense',
        amount: 100.00,
        description: 'Internet Fibra 500MB',
        date: `${year}-${month}-15`,
        categoryId: 'moradia',
        accountId: 'acc_nubank',
        isFixedExpense: true,
        paymentMethod: 'account',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      // Variable Expenses
      {
        id: 'tx_supermercado',
        type: 'expense',
        amount: 342.80,
        description: 'Supermercado Mensal',
        date: yesterdayStr,
        categoryId: 'alimentacao',
        accountId: 'acc_nubank',
        paymentMethod: 'account',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'tx_uber',
        type: 'expense',
        amount: 38.50,
        description: 'Uber Ida e Volta Reunião',
        date: todayStr,
        categoryId: 'transporte',
        cardId: 'card_nubank',
        paymentMethod: 'credit_card',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'tx_farmacia',
        type: 'expense',
        amount: 85.90,
        description: 'Farmácia Drogasil',
        date: yesterdayStr,
        categoryId: 'saude',
        accountId: 'acc_inter',
        paymentMethod: 'account',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      // Installment demo: Notebook Dell R$ 1.200 em 6x de R$ 200 (Parcela 3 de 6)
      {
        id: 'tx_notebook_3',
        type: 'expense',
        amount: 200.00,
        description: 'Notebook Dell Inspiron',
        date: `${year}-${month}-12`,
        categoryId: 'compras',
        cardId: 'card_nubank',
        installmentId: planId,
        installmentNumber: 3,
        installmentTotal: 6,
        invoiceMonthYear: currentYearMonth,
        paymentMethod: 'credit_card',
        createdAt: todayStr,
        updatedAt: todayStr
      }
    ];

    const txStore = db.transaction('transactions', 'readwrite');
    for (const t of transactions) await txStore.store.put(t);
    await txStore.done;

    // 5. Budgets
    const budgets: Budget[] = [
      {
        id: 'b_alimentacao',
        categoryId: 'alimentacao',
        monthYear: currentYearMonth,
        limitAmount: 800.00,
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'b_transporte',
        categoryId: 'transporte',
        monthYear: currentYearMonth,
        limitAmount: 300.00,
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'b_lazer',
        categoryId: 'lazer',
        monthYear: currentYearMonth,
        limitAmount: 400.00,
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'b_moradia',
        categoryId: 'moradia',
        monthYear: currentYearMonth,
        limitAmount: 1200.00,
        createdAt: todayStr,
        updatedAt: todayStr
      }
    ];

    const bTx = db.transaction('budgets', 'readwrite');
    for (const b of budgets) await bTx.store.put(b);
    await bTx.done;

    // 6. Goals
    const goals: Goal[] = [
      {
        id: 'goal_reserva',
        name: 'Reserva de Emergência',
        targetAmount: 5000.00,
        currentAmount: 3500.00,
        deadline: `${year}-12-31`,
        color: '#39D98A',
        icon: 'Shield',
        category: 'investimentos',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'goal_viagem',
        name: 'Viagem de Férias',
        targetAmount: 4000.00,
        currentAmount: 1850.00,
        deadline: `${year + 1}-02-28`,
        color: '#8B7CFF',
        icon: 'Plane',
        category: 'lazer',
        createdAt: todayStr,
        updatedAt: todayStr
      }
    ];

    const gTx = db.transaction('goals', 'readwrite');
    for (const g of goals) await gTx.store.put(g);
    await gTx.done;

    // 7. Investments
    const investments: Investment[] = [
      {
        id: 'inv_selic',
        assetName: 'Tesouro Selic 2029',
        ticker: 'LFT2029',
        type: 'fixed_income',
        quantity: 1,
        averagePrice: 4200.00,
        currentPrice: 4325.50,
        totalInvested: 4200.00,
        currentValue: 4325.50,
        yieldPercentage: 2.98,
        institution: 'NuInvest',
        date: `${year}-01-15`,
        notes: 'Reserva de liquidez diária',
        createdAt: todayStr,
        updatedAt: todayStr
      },
      {
        id: 'inv_fii',
        assetName: 'Kinea Rendimentos Imobiliários',
        ticker: 'KNCR11',
        type: 'funds',
        quantity: 30,
        averagePrice: 101.50,
        currentPrice: 104.20,
        totalInvested: 3045.00,
        currentValue: 3126.00,
        yieldPercentage: 2.66,
        institution: 'Inter DTVM',
        date: `${year}-03-10`,
        notes: 'FII de papel com dividendos mensais',
        createdAt: todayStr,
        updatedAt: todayStr
      }
    ];

    const invTx = db.transaction('investments', 'readwrite');
    for (const inv of investments) await invTx.store.put(inv);
    await invTx.done;

    // 8. Recurring Rules (Salário, Aluguel, Internet, Netflix, Spotify, Academia)
    const recurringRules: RecurringTransaction[] = [
      {
        id: 'rec_salario',
        description: 'Salário Mensal',
        amount: 3500.00,
        type: 'income',
        categoryId: 'trabalho',
        accountId: 'acc_nubank',
        frequency: 'monthly',
        startDate: `${year}-01-05`,
        nextOccurrence: `${year}-${month}-05`,
        status: 'active',
        isRecurringIncome: true,
        notes: 'Salário empresa CLT',
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'rec_aluguel',
        description: 'Aluguel do Apartamento',
        amount: 900.00,
        type: 'expense',
        categoryId: 'moradia',
        accountId: 'acc_nubank',
        frequency: 'monthly',
        startDate: `${year}-01-10`,
        nextOccurrence: `${year}-${month}-10`,
        status: 'active',
        isFixedExpense: true,
        notes: 'Boleto imobiliária',
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'rec_internet',
        description: 'Internet Fibra 500MB',
        amount: 100.00,
        type: 'expense',
        categoryId: 'moradia',
        accountId: 'acc_nubank',
        frequency: 'monthly',
        startDate: `${year}-01-15`,
        nextOccurrence: `${year}-${month}-15`,
        status: 'active',
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'rec_netflix',
        description: 'Netflix Padrão',
        amount: 39.90,
        type: 'expense',
        categoryId: 'lazer',
        cardId: 'card_nubank',
        frequency: 'monthly',
        startDate: `${year}-01-10`,
        nextOccurrence: `${year}-${month}-10`,
        status: 'active',
        isSubscription: true,
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'rec_spotify',
        description: 'Spotify Premium',
        amount: 21.90,
        type: 'expense',
        categoryId: 'lazer',
        cardId: 'card_nubank',
        frequency: 'monthly',
        startDate: `${year}-01-14`,
        nextOccurrence: `${year}-${month}-14`,
        status: 'active',
        isSubscription: true,
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'rec_academia',
        description: 'Academia SmartFit',
        amount: 89.90,
        type: 'expense',
        categoryId: 'saude',
        cardId: 'card_inter',
        frequency: 'monthly',
        startDate: `${year}-01-05`,
        nextOccurrence: `${year}-${month}-05`,
        status: 'active',
        isSubscription: true,
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      }
    ];

    const recTx = db.transaction('recurring_transactions', 'readwrite');
    for (const r of recurringRules) await recTx.store.put(r);
    await recTx.done;

    // 9. Bills (Contas a Pagar)
    const bills: Bill[] = [
      {
        id: 'bill_aluguel',
        description: 'Aluguel do Apartamento',
        amount: 900.00,
        dueDate: `${year}-${month}-10`,
        categoryId: 'moradia',
        accountId: 'acc_nubank',
        recurringId: 'rec_aluguel',
        status: 'pending',
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'bill_internet',
        description: 'Internet Fibra',
        amount: 100.00,
        dueDate: `${year}-${month}-15`,
        categoryId: 'moradia',
        accountId: 'acc_nubank',
        recurringId: 'rec_internet',
        status: 'pending',
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'bill_energia',
        description: 'Conta de Luz Enel',
        amount: 145.30,
        dueDate: `${year}-${month}-18`,
        categoryId: 'moradia',
        accountId: 'acc_inter',
        status: 'pending',
        isFixedExpense: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'bill_netflix',
        description: 'Netflix Padrão',
        amount: 39.90,
        dueDate: `${year}-${month}-10`,
        categoryId: 'lazer',
        cardId: 'card_nubank',
        recurringId: 'rec_netflix',
        status: 'pending',
        isSubscription: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'bill_academia',
        description: 'Academia SmartFit',
        amount: 89.90,
        dueDate: `${year}-${month}-05`,
        categoryId: 'saude',
        cardId: 'card_inter',
        recurringId: 'rec_academia',
        status: 'paid',
        paidAt: `${year}-${month}-05`,
        isSubscription: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      }
    ];

    const billStore = db.transaction('bills', 'readwrite');
    for (const b of bills) await billStore.store.put(b);
    await billStore.done;

    // 10. Receivables (Contas a Receber)
    const receivables: Receivable[] = [
      {
        id: 'rec_salario_10',
        description: 'Salário CLT',
        amount: 3500.00,
        expectedDate: `${year}-${month}-05`,
        categoryId: 'trabalho',
        accountId: 'acc_nubank',
        recurringId: 'rec_salario',
        status: 'received',
        receivedAt: `${year}-${month}-05`,
        isRecurringIncome: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'rec_freela_10',
        description: 'Freelance UI/UX Design',
        amount: 600.00,
        expectedDate: `${year}-${month}-22`,
        categoryId: 'trabalho',
        accountId: 'acc_inter',
        status: 'expected',
        origin: 'Cliente Particular',
        createdAt: todayStr,
        updatedAt: todayStr,
      }
    ];

    const recItemStore = db.transaction('receivables', 'readwrite');
    for (const r of receivables) await recItemStore.store.put(r);
    await recItemStore.done;

    // 11. Subscriptions
    const subscriptions: Subscription[] = [
      {
        id: 'sub_netflix',
        name: 'Netflix Padrão',
        amount: 39.90,
        frequency: 'monthly',
        nextBillingDate: `${year}-${month}-10`,
        categoryId: 'lazer',
        cardId: 'card_nubank',
        recurringId: 'rec_netflix',
        monthlyEstimate: 39.90,
        annualEstimate: 478.80,
        isActive: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'sub_spotify',
        name: 'Spotify Premium',
        amount: 21.90,
        frequency: 'monthly',
        nextBillingDate: `${year}-${month}-14`,
        categoryId: 'lazer',
        cardId: 'card_nubank',
        recurringId: 'rec_spotify',
        monthlyEstimate: 21.90,
        annualEstimate: 262.80,
        isActive: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      },
      {
        id: 'sub_academia',
        name: 'Academia SmartFit',
        amount: 89.90,
        frequency: 'monthly',
        nextBillingDate: `${year}-${month}-05`,
        categoryId: 'saude',
        cardId: 'card_inter',
        recurringId: 'rec_academia',
        monthlyEstimate: 89.90,
        annualEstimate: 1078.80,
        isActive: true,
        createdAt: todayStr,
        updatedAt: todayStr,
      }
    ];

    const subStore = db.transaction('subscriptions', 'readwrite');
    for (const s of subscriptions) await subStore.store.put(s);
    await subStore.done;

    // 12. Smart Alerts
    const alerts: SmartAlert[] = [
      {
        id: 'al_contas',
        type: 'bill_due',
        title: 'Contas a vencer este mês',
        message: 'Você tem 3 contas a pagar somando R$ 1.045,30 previstas para os próximos dias.',
        date: todayStr,
        isRead: false,
        isImportant: true,
        actionUrl: '/compromissos'
      },
      {
        id: 'al_reserva',
        type: 'goal',
        title: 'Meta de Reserva no rumo!',
        message: 'Você já completou 70% da sua meta de Reserva de Emergência (R$ 3.500 de R$ 5.000).',
        date: yesterdayStr,
        isRead: false,
        isImportant: false,
        actionUrl: '/metas'
      }
    ];

    const alTx = db.transaction('alerts', 'readwrite');
    for (const al of alerts) await alTx.store.put(al);
    await alTx.done;

    // 13. Settings
    const defaultSettings: UserSettings = {
      name: 'Christian Farias',
      email: 'christian@exemplo.com',
      currency: 'BRL',
      firstDayOfMonth: 1,
      theme: 'dark',
      language: 'pt-BR',
      hasSeenOnboarding: true,
      hasLoadedDemoData: true
    };

    const sTx = db.transaction('settings', 'readwrite');
    await sTx.store.put(defaultSettings, 'user_settings');
    await sTx.done;
  }
};
