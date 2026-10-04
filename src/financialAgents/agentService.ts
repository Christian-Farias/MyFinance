import { globalAgentScheduler } from './agentScheduler';
import { agentRulesManager } from './agentRules';
import type { FinancialInsight, FinancialEventType } from './agentTypes';
import type { FullFinancialState } from './agentContext';

export const agentService = {
  async analyze(state: FullFinancialState, eventType: FinancialEventType = 'PERIODIC_CHECK'): Promise<FinancialInsight[]> {
    return globalAgentScheduler.triggerAnalysis(eventType, state);
  },

  getCachedInsights(): FinancialInsight[] {
    return globalAgentScheduler.getCachedInsights();
  },

  dismissInsight(insightId: string): void {
    agentRulesManager.dismissInsight(insightId);
  },

  silenceAgent(agentId: string): void {
    agentRulesManager.silenceAgent(agentId);
  }
};
