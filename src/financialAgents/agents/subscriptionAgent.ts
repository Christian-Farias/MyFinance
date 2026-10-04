import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, calculateSubscriptionsSummary } from '../../calculations/financialCalculations';

export const subscriptionAgent: FinancialAgent = {
  id: 'subscription_agent',
  name: 'Subscription Agent',
  description: 'Acompanha serviços por assinatura e seus impactos mensais e anuais.',
  priority: 'MEDIUM',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const summary = calculateSubscriptionsSummary(state.subscriptions);

    if (summary.activeCount > 0) {
      insights.push({
        id: `subscription_summary_${state.subscriptions.length}`,
        agentId: this.id,
        agentName: this.name,
        title: `Resumo de Assinaturas (${summary.activeCount} ativas)`,
        summary: `Suas assinaturas somam ${formatCurrency(summary.totalMonthlyEstimate)} por mês (${formatCurrency(summary.totalAnnualEstimate)} ao ano).`,
        explanation: `Soma de todos os serviços recorrentes ativos (como streaming, nuvem, softwares e academias).`,
        priority: summary.totalMonthlyEstimate > 300 ? 'MEDIUM' : 'LOW',
        confidence: 'HIGH',
        category: 'Assinaturas',
        createdAt: new Date().toISOString(),
        actionUrl: '/compromissos',
        actionLabel: 'Ver assinaturas',
        aiPromptContext: `Quanto gasto por ano com assinaturas e como posso economizar?`,
        metrics: {
          currentValue: summary.totalMonthlyEstimate,
          targetOrAverageValue: summary.totalAnnualEstimate,
        },
      });
    }

    return insights;
  }
};
