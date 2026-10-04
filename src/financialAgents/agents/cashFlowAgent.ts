import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, calculateProjectedCashFlow, formatDateBR } from '../../calculations/financialCalculations';

export const cashFlowAgent: FinancialAgent = {
  id: 'cash_flow_agent',
  name: 'Cash Flow Agent',
  description: 'Monitora a projeção de fluxo de caixa e identifica riscos de saldo baixo.',
  priority: 'HIGH',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const forecast = calculateProjectedCashFlow(state.accounts, state.transactions, state.bills, state.receivables, state.recurring, 30);

    if (forecast.hasLowBalanceRisk) {
      const isNegative = forecast.lowestProjectedBalance < 0;
      insights.push({
        id: `cash_flow_risk_${forecast.lowestBalanceDate}`,
        agentId: this.id,
        agentName: this.name,
        title: isNegative ? `Alerta Crítico: Risco de Saldo Negativo` : `Aviso: Saldo Projetado Baixo`,
        summary: `Seu saldo projetado pode cair para ${formatCurrency(forecast.lowestProjectedBalance)} no dia ${formatDateBR(forecast.lowestBalanceDate)}.`,
        explanation: `Calculado com base em contas a pagar, faturas e despesas recorrentes até aquela data.`,
        priority: isNegative ? 'CRITICAL' : 'HIGH',
        confidence: 'HIGH',
        category: 'Fluxo de Caixa',
        createdAt: new Date().toISOString(),
        actionUrl: '/fluxo-caixa',
        actionLabel: 'Ver fluxo de caixa',
        aiPromptContext: `Meu saldo projetado pode cair para ${formatCurrency(forecast.lowestProjectedBalance)}. Como organizar minhas contas?`,
        metrics: {
          currentValue: forecast.lowestProjectedBalance,
          targetOrAverageValue: forecast.initialBalance,
        },
      });
    }

    return insights;
  }
};
