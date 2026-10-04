export type TransactionType = 'expense' | 'income' | 'transfer';

export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'cash' 
  | 'digital_wallet' 
  | 'investment' 
  | 'other';

export type CardBrand = 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'other';

export type BudgetStatus = 'normal' | 'warning' | 'critical' | 'exceeded';

export type InvestmentType = 
  | 'fixed_income' 
  | 'stocks' 
  | 'crypto' 
  | 'funds' 
  | 'etfs' 
  | 'other';

export type AlertType = 
  | 'budget' 
  | 'invoice' 
  | 'expense_spike' 
  | 'duplicate' 
  | 'goal' 
  | 'installment' 
  | 'saving'
  | 'bill_due'
  | 'receivable_due'
  | 'projected_balance_low'
  | 'system';

export type RecurrenceFrequency = 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'quarterly' 
  | 'semiannual' 
  | 'annual';

export type RecurrenceStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type ReceivableStatus = 'expected' | 'received' | 'delayed' | 'cancelled';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  initialBalance?: number;
  currentBalance: number;
  balance?: number;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  accountId?: string;
  destinationAccountId?: string; // For transfers
  cardId?: string; // For card purchases
  invoiceMonthYear?: string; // e.g. "2026-10"
  installmentId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
  recurringId?: string; // Linked recurring transaction rule
  billId?: string; // Linked bill
  receivableId?: string; // Linked receivable
  isCardInvoicePayment?: boolean; // Payment of a credit card bill (no double expense count)
  isFixedExpense?: boolean;
  notes?: string;
  paymentMethod?: 'account' | 'credit_card' | 'pix' | 'cash';
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  institution: string;
  brand: CardBrand;
  limit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  lastDigits: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  cardId: string;
  monthYear: string; // e.g. "2026-10"
  closingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  totalAmount: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  cardId: string;
  categoryId: string;
  startDate: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthYear: string; // "2026-10" or "all"
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  color: string;
  icon?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  assetName: string;
  ticker?: string;
  type: InvestmentType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  yieldPercentage: number;
  institution: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  isImportant?: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UserSettings {
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  firstDayOfMonth: number;
  theme: 'dark' | 'light';
  language: string;
  hasSeenOnboarding: boolean;
  hasLoadedDemoData: boolean;
}

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: 'increase' | 'decrease' | 'saving' | 'warning' | 'tip';
  date: string;
  relatedCategory?: string;
  percentageChange?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADVANCED FINANCIAL PLANNING ENTITIES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId?: string;
  cardId?: string;
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  nextOccurrence: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: RecurrenceStatus;
  isSubscription?: boolean;
  isFixedExpense?: boolean;
  isRecurringIncome?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  categoryId: string;
  accountId?: string;
  cardId?: string;
  recurringId?: string;
  status: BillStatus;
  paidAt?: string;
  paidTransactionId?: string;
  isFixedExpense?: boolean;
  isSubscription?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receivable {
  id: string;
  description: string;
  amount: number;
  expectedDate: string; // YYYY-MM-DD
  categoryId: string;
  accountId?: string;
  recurringId?: string;
  status: ReceivableStatus;
  receivedAt?: string;
  receivedTransactionId?: string;
  origin?: string;
  isRecurringIncome?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: RecurrenceFrequency;
  nextBillingDate: string; // YYYY-MM-DD
  categoryId: string;
  cardId?: string;
  accountId?: string;
  recurringId?: string;
  monthlyEstimate: number;
  annualEstimate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyClosing {
  id: string; // e.g. "closing_2026-09"
  monthYear: string; // "2026-09"
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  savingsRate: number; // percentage (0-100)
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  topCategoryId: string;
  topCategoryName: string;
  topCategoryTotal: number;
  biggestExpenseDescription: string;
  biggestExpenseAmount: number;
  transactionCount: number;
  closingNetWorth: number;
  comparedToPreviousMonth: {
    incomeVariationPercent: number;
    expenseVariationPercent: number;
    savingsVariationPercent: number;
  };
  generatedAt: string;
}

export interface FutureCommitmentItem {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'bill' | 'installment' | 'subscription' | 'card_invoice' | 'recurring_expense';
  sourceName?: string;
  categoryName?: string;
  isPaid?: boolean;
}

export interface CashFlowPoint {
  date: string; // YYYY-MM-DD
  label: string;
  initialBalance: number;
  inflows: number;
  outflows: number;
  netFlow: number;
  projectedBalance: number;
  items: Array<{
    description: string;
    amount: number;
    type: 'inflow' | 'outflow';
    category?: string;
  }>;
}

export interface AIActionIntent {
  actionType: 'create_expense' | 'create_income' | 'transfer' | 'pay_bill' | 'receive_receivable' | 'create_recurring' | 'create_goal';
  payload: Record<string, any>;
  confirmationPrompt: string;
  status: 'pending_confirmation' | 'confirmed' | 'cancelled' | 'executed';
}
