import { agentRegistry } from './agentRegistry';
import { agentRulesManager } from './agentRules';
import { computeStateHash, FullFinancialState } from './agentContext';
import type { FinancialInsight, FinancialEventType } from './agentTypes';

export class AgentScheduler {
  private cachedInsights: FinancialInsight[] = [];
  private lastStateHash = '';
  private lastAnalysisTimestamp = 0;
  private isRunning = false;

  async triggerAnalysis(
    eventType: FinancialEventType,
    state: FullFinancialState,
    force = false
  ): Promise<FinancialInsight[]> {
    const stateHash = computeStateHash(state);

    // Skip if state hash hasn't changed and not forced
    if (!force && stateHash === this.lastStateHash && this.cachedInsights.length > 0) {
      return this.cachedInsights;
    }

    if (this.isRunning) {
      return this.cachedInsights;
    }

    this.isRunning = true;
    try {
      const allInsights: FinancialInsight[] = [];

      for (const agent of agentRegistry) {
        if (agentRulesManager.isAgentSilenced(agent.id)) continue;
        try {
          const agentInsights = await agent.run(state);
          for (const ins of agentInsights) {
            if (!agentRulesManager.isInsightDismissed(ins.id)) {
              allInsights.push(ins);
            }
          }
        } catch (err) {
          console.warn(`[AgentScheduler] Error running agent ${agent.id}:`, err);
        }
      }

      // Priority sort: CRITICAL -> HIGH -> MEDIUM -> LOW
      const priorityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      allInsights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      this.cachedInsights = allInsights;
      this.lastStateHash = stateHash;
      this.lastAnalysisTimestamp = Date.now();

      return allInsights;
    } finally {
      this.isRunning = false;
    }
  }

  getCachedInsights(): FinancialInsight[] {
    return this.cachedInsights;
  }
}

export const globalAgentScheduler = new AgentScheduler();
