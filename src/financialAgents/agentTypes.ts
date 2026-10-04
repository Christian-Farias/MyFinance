import type { AIIntentType } from '../financialAI/types';

export type InsightPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InsightConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type FinancialEventType =
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  | 'TRANSACTION_DELETED'
  | 'BILL_CREATED'
  | 'BILL_PAID'
  | 'CARD_UPDATED'
  | 'INVOICE_UPDATED'
  | 'GOAL_UPDATED'
  | 'BUDGET_UPDATED'
  | 'ACCOUNT_UPDATED'
  | 'PERIODIC_CHECK';

export interface FinancialInsight {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  summary: string;
  explanation: string;
  priority: InsightPriority;
  confidence: InsightConfidence;
  category?: string;
  createdAt: string;
  lastShownAt?: string;
  dismissedAt?: string;
  isDismissed?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  aiPromptContext?: string;
  preparedAction?: {
    intent: AIIntentType;
    parameters: Record<string, any>;
  };
  metrics?: {
    currentValue?: number;
    targetOrAverageValue?: number;
    percentageChange?: number;
  };
}

export interface AgentAnalysisContext {
  stateVersion: string; // Hash or timestamp of current data
  data: any;
}

export interface FinancialAgent {
  id: string;
  name: string;
  description: string;
  priority: InsightPriority;
  run(context: any): Promise<FinancialInsight[]>;
}
