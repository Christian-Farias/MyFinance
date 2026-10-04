import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState, getHistorical3MonthsTransactions, calculateAverage } from '../agentContext';
import { formatCurrency } from '../../calculations/financialCalculations';

export const incomeAgent: FinancialAgent = {
  id: 'income_agent',
  name: 'Income Agent',
  description: 'Acompanha variações e frequência das receitas registradas.',
  priority: 'MEDIUM',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentIncome = state.transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentYM))
      .reduce((s, t) => s + t.amount, 0);

    const histIncomeTxs = getHistorical3MonthsTransactions(state.transactions, currentYM).filter(t => t.type === 'income');

    if (histIncomeTxs.length >= 3) {
      const histMonthlyIncomeAvg = calculateAverage([histIncomeTxs.reduce((s, t) => s + t.amount, 0) / 3]);

      if (histMonthlyIncomeAvg > 500 && currentIncome < histMonthlyIncomeAvg * 0.85 && now.getDate() > 20) {
        const dropPct = ((histMonthlyIncomeAvg - currentIncome) / histMonthlyIncomeAvg) * 100;
        insights.push({
          id: `income_drop_${currentYM}`,
          agentId: this.id,
          agentName: this.name,
          title: `Renda registrada abaixo da média`,
          summary: `Sua renda registrada este mês (${formatCurrency(currentIncome)}) está ${dropPct.toFixed(0)}% abaixo da média recente (${formatCurrency(histMonthlyIncomeAvg)}).`,
          explanation: `Identificamos uma redução no volume de entradas em comparação aos 3 meses anteriores.`,
          priority: 'MEDIUM',
          confidence: 'MEDIUM',
          category: 'Receitas',
          createdAt: new Date().toISOString(),
          actionUrl: '/transacoes',
          actionLabel: 'Ver receitas',
          metrics: {
            currentValue: currentIncome,
            targetOrAverageValue: histMonthlyIncomeAvg,
            percentageChange: -dropPct,
          },
        });
      }
    }

    return insights;
  }
};
