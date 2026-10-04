import type { FinancialAgent } from './agentTypes';
import { spendingAgent } from './agents/spendingAgent';
import { budgetAgent } from './agents/budgetAgent';
import { cardAgent } from './agents/cardAgent';
import { billAgent } from './agents/billAgent';
import { subscriptionAgent } from './agents/subscriptionAgent';
import { installmentAgent } from './agents/installmentAgent';
import { goalAgent } from './agents/goalAgent';
import { cashFlowAgent } from './agents/cashFlowAgent';
import { incomeAgent } from './agents/incomeAgent';
import { savingsAgent } from './agents/savingsAgent';
import { anomalyAgent } from './agents/anomalyAgent';
import { duplicateAgent } from './agents/duplicateAgent';
import { summaryAgent } from './agents/summaryAgent';
import { financialHealthAgent } from './agents/financialHealthAgent';

export const agentRegistry: FinancialAgent[] = [
  spendingAgent,
  budgetAgent,
  cardAgent,
  billAgent,
  subscriptionAgent,
  installmentAgent,
  goalAgent,
  cashFlowAgent,
  incomeAgent,
  savingsAgent,
  anomalyAgent,
  duplicateAgent,
  summaryAgent,
  financialHealthAgent,
];

export function getRegisteredAgents(): FinancialAgent[] {
  return agentRegistry;
}

export function getAgentById(id: string): FinancialAgent | undefined {
  return agentRegistry.find(a => a.id === id);
}
