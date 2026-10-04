export interface AgentRuleConfig {
  minimumTransactionsForPattern: number;
  anomalyStdDevThreshold: number;
  spendingSpikeThresholdPercent: number;
  budgetWarningPercent: number;
  budgetCriticalPercent: number;
  cardLimitUsageWarningPercent: number;
  lowBalanceThreshold: number;
  dismissedInsightIds: Set<string>;
  silencedAgentIds: Set<string>;
}

export const defaultAgentRules: AgentRuleConfig = {
  minimumTransactionsForPattern: 5,
  anomalyStdDevThreshold: 2.0,
  spendingSpikeThresholdPercent: 20,
  budgetWarningPercent: 75,
  budgetCriticalPercent: 90,
  cardLimitUsageWarningPercent: 80,
  lowBalanceThreshold: 200,
  dismissedInsightIds: new Set<string>(),
  silencedAgentIds: new Set<string>(),
};

export const agentRulesManager = {
  config: { ...defaultAgentRules },

  dismissInsight(insightId: string): void {
    this.config.dismissedInsightIds.add(insightId);
  },

  silenceAgent(agentId: string): void {
    this.config.silencedAgentIds.add(agentId);
  },

  isInsightDismissed(insightId: string): boolean {
    return this.config.dismissedInsightIds.has(insightId);
  },

  isAgentSilenced(agentId: string): boolean {
    return this.config.silencedAgentIds.has(agentId);
  }
};
