import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { 
  Account, 
  Transaction, 
  Category, 
  CreditCard, 
  Budget, 
  Goal, 
  Investment, 
  SmartAlert, 
  RecurringTransaction,
  Bill,
  Receivable,
  Subscription,
  MonthlyClosing,
  UserSettings,
  TransactionType
} from '../types';
import { getDB } from '../database/db';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { cardService } from '../services/cardService';
import { budgetService } from '../services/budgetService';
import { goalService } from '../services/goalService';
import { investmentService } from '../services/investmentService';
import { alertService } from '../services/alertService';
import { demoDataService } from '../services/demoDataService';
import { recurringService } from '../services/recurringService';
import { billService } from '../services/billService';
import { receivableService } from '../services/receivableService';
import { subscriptionService } from '../services/subscriptionService';
import { transferService } from '../services/transferService';
import { monthlyClosingService } from '../services/monthlyClosingService';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  budgets: Budget[];
  goals: Goal[];
  investments: Investment[];
  alerts: SmartAlert[];
  recurringTransactions: RecurringTransaction[];
  bills: Bill[];
  receivables: Receivable[];
  subscriptions: Subscription[];
  monthlyClosings: MonthlyClosing[];
  settings: UserSettings;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  isLoading: boolean;
  /** Set when IndexedDB could not be read. Null when healthy. */
  error: string | null;
  /** Re-runs the full read from IndexedDB. */
  retry: () => Promise<void>;
  isOffline: boolean;
  isFirstRun: boolean;

  // Actions
  refreshAll: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, installmentsCount?: number) => Promise<Transaction[]>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  addAccount: (data: Omit<Account, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'> & { currentBalance?: number }) => Promise<Account>;
  updateAccount: (account: Account) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;

  addCard: (data: Omit<CreditCard, 'id' | 'availableLimit' | 'createdAt' | 'updatedAt'>) => Promise<CreditCard>;
  updateCard: (card: CreditCard) => Promise<CreditCard>;
  deleteCard: (id: string) => Promise<void>;

  addGoal: (data: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'> & { currentAmount?: number }) => Promise<Goal>;
  updateGoal: (goal: Goal) => Promise<Goal>;
  depositToGoal: (goalId: string, amount: number, fromAccountId?: string) => Promise<void>;
  withdrawFromGoal: (goalId: string, amount: number, toAccountId?: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (budget: Budget) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;

  addInvestment: (data: Omit<Investment, 'id' | 'totalInvested' | 'currentValue' | 'yieldPercentage' | 'createdAt' | 'updatedAt'>) => Promise<Investment>;
  updateInvestment: (inv: Investment) => Promise<Investment>;
  deleteInvestment: (id: string) => Promise<void>;

  // Advanced Financial Features Actions
  addRecurring: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RecurringTransaction>;
  updateRecurring: (rule: RecurringTransaction) => Promise<RecurringTransaction>;
  deleteRecurring: (id: string) => Promise<void>;
  skipRecurringOccurrence: (id: string) => Promise<void>;

  addBill: (data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Bill>;
  updateBill: (bill: Bill) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
  markBillAsPaid: (billId: string, accountId?: string, paymentDate?: string) => Promise<void>;

  addReceivable: (data: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Receivable>;
  updateReceivable: (receivable: Receivable) => Promise<Receivable>;
  deleteReceivable: (id: string) => Promise<void>;
  markReceivableAsReceived: (receivableId: string, accountId?: string, receivedDate?: string) => Promise<void>;

  addSubscription: (data: Omit<Subscription, 'id' | 'monthlyEstimate' | 'annualEstimate' | 'createdAt' | 'updatedAt'>) => Promise<Subscription>;
  updateSubscription: (subscription: Subscription) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;

  transferBetweenAccounts: (params: { sourceAccountId: string; destinationAccountId: string; amount: number; date: string; description?: string }) => Promise<Transaction>;
  payCreditCardInvoice: (params: { cardId: string; accountId: string; invoiceMonthYear: string; amount: number; paymentDate: string }) => Promise<void>;
  generateMonthlyClosing: (monthYear: string) => Promise<MonthlyClosing>;

  markAlertAsRead: (id: string) => Promise<void>;
  markAllAlertsAsRead: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  loadDemoData: () => Promise<void>;
  resetAllData: () => Promise<void>;

  // UI state modals
  isNewTxModalOpen: boolean;
  newTxDefaultType: TransactionType;
  transactionToEdit: Transaction | null;
  openNewTxModal: (type?: TransactionType, txToEdit?: Transaction) => void;
  closeNewTxModal: () => void;

  isQuickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;

  selectedTxForDetail: Transaction | null;
  openTxDetail: (tx: Transaction) => void;
  closeTxDetail: () => void;

  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  name: 'Christian Farias',
  email: 'christian@exemplo.com',
  currency: 'BRL',
  firstDayOfMonth: 1,
  theme: 'dark',
  language: 'pt-BR',
  hasSeenOnboarding: false,
  hasLoadedDemoData: false
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>([]);

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  // A failed read used to land in console.error and leave every array
  // empty, which is indistinguishable from "you have no data yet".
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isFirstRun, setIsFirstRun] = useState<boolean>(false);

  // Modal UI state
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [newTxDefaultType, setNewTxDefaultType] = useState<TransactionType>('expense');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isQuickActionOpen, setQuickActionOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh all state from IndexedDB
  const refreshAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDB();

      // Ensure categories exist
      const cats = await categoryService.getAll();
      if (cats.length === 0) {
        await categoryService.initDefaults();
      }

      // Process pending recurring transactions for selected period
      await recurringService.processRecurringForPeriod(selectedPeriod);

      const [
        accs,
        txs,
        allCats,
        creditCards,
        bgs,
        gls,
        invs,
        als,
        recs,
        bls,
        rcvs,
        subs,
        closings,
        savedSettings
      ] = await Promise.all([
        accountService.getAll(),
        transactionService.getAll(),
        categoryService.getAll(),
        cardService.getAll(),
        budgetService.getAll(),
        goalService.getAll(),
        investmentService.getAll(),
        alertService.getAll(),
        recurringService.getAll(),
        billService.getAll(),
        receivableService.getAll(),
        subscriptionService.getAll(),
        monthlyClosingService.getAll(),
        db.get('settings', 'user_settings')
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setCategories(allCats);
      setCards(creditCards);
      setBudgets(bgs);
      setGoals(gls);
      setInvestments(invs);
      setAlerts(als);
      setRecurringTransactions(recs);
      setBills(bls);
      setReceivables(rcvs);
      setSubscriptions(subs);
      setMonthlyClosings(closings);

      if (savedSettings) {
        setSettings(savedSettings as UserSettings);
        setIsFirstRun(!(savedSettings as UserSettings).hasSeenOnboarding);
      } else {
        setIsFirstRun(true);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do IndexedDB:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível ler o armazenamento local do navegador.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Transaction CRUD
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, installmentsCount = 1) => {
    const created = await transactionService.create(data, installmentsCount);
    await refreshAll();
    return created;
  };

  const updateTransaction = async (tx: Transaction) => {
    const updated = await transactionService.update(tx);
    await refreshAll();
    return updated;
  };

  const deleteTransaction = async (id: string) => {
    await transactionService.delete(id);
    await refreshAll();
  };

  // Account CRUD
  const addAccount = async (data: Omit<Account, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'> & { currentBalance?: number }) => {
    const created = await accountService.create(data);
    await refreshAll();
    return created;
  };

  const updateAccount = async (account: Account) => {
    const updated = await accountService.update(account);
    await refreshAll();
    return updated;
  };

  const deleteAccount = async (id: string) => {
    await accountService.delete(id);
    await refreshAll();
  };

  // Card CRUD
  const addCard = async (data: Omit<CreditCard, 'id' | 'availableLimit' | 'createdAt' | 'updatedAt'>) => {
    const created = await cardService.create(data);
    await refreshAll();
    return created;
  };

  const updateCard = async (card: CreditCard) => {
    const updated = await cardService.update(card);
    await refreshAll();
    return updated;
  };

  const deleteCard = async (id: string) => {
    await cardService.delete(id);
    await refreshAll();
  };

  // Goal CRUD
  const addGoal = async (data: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'> & { currentAmount?: number }) => {
    const created = await goalService.create(data);
    await refreshAll();
    return created;
  };

  const updateGoal = async (goal: Goal) => {
    const updated = await goalService.update(goal);
    await refreshAll();
    return updated;
  };

  const depositToGoal = async (goalId: string, amount: number, fromAccountId?: string) => {
    await goalService.deposit(goalId, amount, fromAccountId);
    await refreshAll();
  };

  const withdrawFromGoal = async (goalId: string, amount: number, toAccountId?: string) => {
    await goalService.withdraw(goalId, amount, toAccountId);
    await refreshAll();
  };

  const deleteGoal = async (id: string) => {
    await goalService.delete(id);
    await refreshAll();
  };

  // Budget CRUD
  const addBudget = async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await budgetService.create(data);
    await refreshAll();
    return created;
  };

  const updateBudget = async (budget: Budget) => {
    const updated = await budgetService.update(budget);
    await refreshAll();
    return updated;
  };

  const deleteBudget = async (id: string) => {
    await budgetService.delete(id);
    await refreshAll();
  };

  // Investment CRUD
  const addInvestment = async (data: Omit<Investment, 'id' | 'totalInvested' | 'currentValue' | 'yieldPercentage' | 'createdAt' | 'updatedAt'>) => {
    const created = await investmentService.create(data);
    await refreshAll();
    return created;
  };

  const updateInvestment = async (inv: Investment) => {
    const updated = await investmentService.update(inv);
    await refreshAll();
    return updated;
  };

  const deleteInvestment = async (id: string) => {
    await investmentService.delete(id);
    await refreshAll();
  };

  // Recurring Transactions CRUD
  const addRecurring = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await recurringService.create(data);
    await refreshAll();
    return created;
  };

  const updateRecurring = async (rule: RecurringTransaction) => {
    const updated = await recurringService.update(rule);
    await refreshAll();
    return updated;
  };

  const deleteRecurring = async (id: string) => {
    await recurringService.delete(id);
    await refreshAll();
  };

  const skipRecurringOccurrence = async (id: string) => {
    await recurringService.skipOccurrence(id);
    await refreshAll();
  };

  // Bills CRUD
  const addBill = async (data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await billService.create(data);
    await refreshAll();
    return created;
  };

  const updateBill = async (bill: Bill) => {
    const updated = await billService.update(bill);
    await refreshAll();
    return updated;
  };

  const deleteBill = async (id: string) => {
    await billService.delete(id);
    await refreshAll();
  };

  const markBillAsPaid = async (billId: string, accountId?: string, paymentDate?: string) => {
    await billService.markAsPaid(billId, accountId, paymentDate);
    await refreshAll();
  };

  // Receivables CRUD
  const addReceivable = async (data: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await receivableService.create(data);
    await refreshAll();
    return created;
  };

  const updateReceivable = async (receivable: Receivable) => {
    const updated = await receivableService.update(receivable);
    await refreshAll();
    return updated;
  };

  const deleteReceivable = async (id: string) => {
    await receivableService.delete(id);
    await refreshAll();
  };

  const markReceivableAsReceived = async (receivableId: string, accountId?: string, receivedDate?: string) => {
    await receivableService.markAsReceived(receivableId, accountId, receivedDate);
    await refreshAll();
  };

  // Subscriptions CRUD
  const addSubscription = async (data: Omit<Subscription, 'id' | 'monthlyEstimate' | 'annualEstimate' | 'createdAt' | 'updatedAt'>) => {
    const created = await subscriptionService.create(data);
    await refreshAll();
    return created;
  };

  const updateSubscription = async (subscription: Subscription) => {
    const updated = await subscriptionService.update(subscription);
    await refreshAll();
    return updated;
  };

  const deleteSubscription = async (id: string) => {
    await subscriptionService.delete(id);
    await refreshAll();
  };

  // Transfers & Invoice Payment
  const transferBetweenAccounts = async (params: { sourceAccountId: string; destinationAccountId: string; amount: number; date: string; description?: string }) => {
    const tx = await transferService.transferBetweenAccounts(params);
    await refreshAll();
    return tx;
  };

  const payCreditCardInvoice = async (params: { cardId: string; accountId: string; invoiceMonthYear: string; amount: number; paymentDate: string }) => {
    await transferService.payCreditCardInvoice(params);
    await refreshAll();
  };

  const generateMonthlyClosing = async (monthYear: string) => {
    const closing = await monthlyClosingService.generateAndSave(
      monthYear,
      transactions,
      categories,
      accounts,
      investments,
      recurringTransactions,
      bills
    );
    await refreshAll();
    return closing;
  };

  // Alerts & Settings
  const markAlertAsRead = async (id: string) => {
    await alertService.markAsRead(id);
    await refreshAll();
  };

  const markAllAlertsAsRead = async () => {
    await alertService.markAllAsRead();
    await refreshAll();
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const db = await getDB();
    const updated = { ...settings, ...newSettings };
    await db.put('settings', updated, 'user_settings');
    setSettings(updated);
    if (newSettings.hasSeenOnboarding !== undefined) {
      setIsFirstRun(!newSettings.hasSeenOnboarding);
    }
  };

  const loadDemoData = async () => {
    await demoDataService.loadDemoData();
    await refreshAll();
  };

  const resetAllData = async () => {
    const db = await getDB();
    const storeNames = Array.from(db.objectStoreNames);
    const tx = db.transaction(storeNames, 'readwrite');
    for (const name of storeNames) {
      await tx.objectStore(name).clear();
    }
    await tx.done;
    await refreshAll();
  };

  // Modal handlers
  const openNewTxModal = (type: TransactionType = 'expense', txToEdit: Transaction | null = null) => {
    setNewTxDefaultType(type);
    setTransactionToEdit(txToEdit);
    setIsNewTxModalOpen(true);
  };

  const closeNewTxModal = () => {
    setIsNewTxModalOpen(false);
    setTransactionToEdit(null);
  };

  const openTxDetail = (tx: Transaction) => setSelectedTxForDetail(tx);
  const closeTxDetail = () => setSelectedTxForDetail(null);

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        cards,
        budgets,
        goals,
        investments,
        alerts,
        recurringTransactions,
        bills,
        receivables,
        subscriptions,
        monthlyClosings,
        settings,
        selectedPeriod,
        setSelectedPeriod,
        isLoading,
        error,
        retry: refreshAll,
        isOffline,
        isFirstRun,

        refreshAll,
        addTransaction,
        updateTransaction,
        deleteTransaction,

        addAccount,
        updateAccount,
        deleteAccount,

        addCard,
        updateCard,
        deleteCard,

        addGoal,
        updateGoal,
        depositToGoal,
        withdrawFromGoal,
        deleteGoal,

        addBudget,
        updateBudget,
        deleteBudget,

        addInvestment,
        updateInvestment,
        deleteInvestment,

        addRecurring,
        updateRecurring,
        deleteRecurring,
        skipRecurringOccurrence,

        addBill,
        updateBill,
        deleteBill,
        markBillAsPaid,

        addReceivable,
        updateReceivable,
        deleteReceivable,
        markReceivableAsReceived,

        addSubscription,
        updateSubscription,
        deleteSubscription,

        transferBetweenAccounts,
        payCreditCardInvoice,
        generateMonthlyClosing,

        markAlertAsRead,
        markAllAlertsAsRead,
        updateSettings,
        loadDemoData,
        resetAllData,

        isNewTxModalOpen,
        newTxDefaultType,
        transactionToEdit,
        openNewTxModal,
        closeNewTxModal,

        isQuickActionOpen,
        setQuickActionOpen,

        selectedTxForDetail,
        openTxDetail,
        closeTxDetail,

        isGlobalSearchOpen,
        setGlobalSearchOpen
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de um FinanceProvider');
  }
  return context;
};
