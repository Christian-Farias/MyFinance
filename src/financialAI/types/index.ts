import type { 
  TransactionType, 
  RecurrenceFrequency, 
  Account, 
  Category, 
  Transaction, 
  CreditCard, 
  Goal, 
  Budget, 
  Bill, 
  Receivable, 
  RecurringTransaction,
  Subscription, 
  Investment 
} from '../../types';

export type AIIntentType =
  | 'GET_BALANCE'
  | 'GET_EXPENSES'
  | 'GET_INCOME'
  | 'GET_TRANSACTIONS'
  | 'GET_CATEGORY_SPENDING'
  | 'GET_CATEGORY_COMPARISON'
  | 'GET_MONTHLY_COMPARISON'
  | 'GET_ACCOUNTS'
  | 'GET_CARD_BILL'
  | 'GET_INSTALLMENTS'
  | 'GET_SUBSCRIPTIONS'
  | 'GET_BILLS'
  | 'GET_RECEIVABLES'
  | 'GET_RECURRING'
  | 'GET_FORECAST'
  | 'GET_CASH_FLOW'
  | 'GET_BUDGET'
  | 'GET_GOAL'
  | 'GET_INVESTMENTS'
  | 'GET_COMMITMENTS'
  | 'GET_FINANCIAL_HEALTH'
  | 'CAN_I_SPEND'
  | 'SIMULATE_GOAL'
  | 'HELP_GREETING'
  | 'CREATE_EXPENSE'
  | 'CREATE_INCOME'
  | 'CREATE_TRANSFER'
  | 'CREATE_BILL'
  | 'CREATE_RECEIVABLE'
  | 'CREATE_RECURRING_TRANSACTION'
  | 'CREATE_SUBSCRIPTION'
  | 'CREATE_GOAL'
  | 'CREATE_BUDGET'
  | 'UPDATE_TRANSACTION'
  | 'UPDATE_GOAL'
  | 'UPDATE_BUDGET'
  | 'DELETE_TRANSACTION'
  | 'UNKNOWN';

export type AIRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  monthYear?: string;// YYYY-MM
  label: string;
  isRollingWindow?: boolean;
}

export interface IntentParameters {
  amount?: number;
  categoryQuery?: string;
  categoryId?: string;
  secondCategoryQuery?: string;
  secondCategoryId?: string;
  description?: string;
  date?: string;
  dateRange?: DateRange;
  accountId?: string;
  accountQuery?: string;
  destinationAccountId?: string;
  destinationAccountQuery?: string;
  cardId?: string;
  cardQuery?: string;
  frequency?: RecurrenceFrequency;
  dueDate?: string;
  expectedDate?: string;
  deadline?: string;
  targetAmount?: number;
  limitAmount?: number;
  transactionId?: string;
  goalId?: string;
  budgetId?: string;
  isFixed?: boolean;
  notes?: string;
  monthYearComparisonTarget?: 'previous' | 'current';
  transactionTypeFilter?: 'expense' | 'income' | 'all';
  limitCount?: number;
}

export interface ParsedIntent {
  intent: AIIntentType;
  parameters: IntentParameters;
  rawText: string;
  confidence: number;
  ambiguousMatches?: Array<{ id: string; name: string; type: string }>;
  needsClarification?: boolean;
  clarificationPrompt?: string;
}

export interface ActionPayload {
  type: AIIntentType;
  data: any;
  targetEntityId?: string;
}

export interface AIActionPlan {
  id: string;
  intent: AIIntentType;
  riskLevel: AIRiskLevel;
  title: string;
  summary: string;
  details: Record<string, any>;
  payload: ActionPayload;
  requiresConfirmation: boolean;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
  createdAt: string;
}

export type VisualType = 'category_ranking' | 'progress_bar' | 'math_breakdown' | 'comparison' | 'list' | 'alert_badge';

export interface VisualComponentData {
  type: VisualType;
  title?: string;
  items?: Array<{
    label: string;
    value: number;
    formattedValue: string;
    percentage?: number;
    color?: string;
    subtitle?: string;
  }>;
  breakdown?: Array<{
    label: string;
    amount: number;
    formattedAmount: string;
    isPositive?: boolean;
  }>;
  progress?: {
    current: number;
    target: number;
    percentage: number;
    formattedCurrent: string;
    formattedTarget: string;
    label?: string;
  };
}

export interface AIResponse {
  text: string;
  intent: AIIntentType;
  actionPlan?: AIActionPlan;
  visual?: VisualComponentData;
  followUpSuggestions?: string[];
  explanation?: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  visual?: VisualComponentData;
  actionPlan?: AIActionPlan;
  suggestions?: string[];
}

export interface AIConversationContext {
  lastIntent?: AIIntentType;
  lastCategoryQuery?: string;
  lastCategoryId?: string;
  secondLastCategoryQuery?: string;
  secondLastCategoryId?: string;
  lastDateRange?: DateRange;
  lastAccountId?: string;
  lastAccountQuery?: string;
  lastCardId?: string;
  lastCardQuery?: string;
  lastAmount?: number;
  lastGoalId?: string;
  lastTransactionType?: 'expense' | 'income' | 'all';
  pendingActionPlan?: AIActionPlan;
  messagesHistory: AIChatMessage[];
  lastInteractionTimestamp?: number;
}

export interface AIProvider {
  processQuery(
    query: string, 
    context: AIConversationContext,
    financialState: {
      accounts: Account[];
      transactions: Transaction[];
      categories: Category[];
      cards: CreditCard[];
      goals: Goal[];
      budgets: Budget[];
      bills: Bill[];
      receivables: Receivable[];
      recurring: RecurringTransaction[];
      subscriptions: Subscription[];
      investments: Investment[];
    }
  ): Promise<AIResponse>;
}
