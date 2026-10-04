import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState, getHistorical3MonthsTransactions } from '../agentContext';
import { formatCurrency, calculateMonthlyComparison } from '../../calculations/financialCalculations';

export const savingsAgent: FinancialAgent = {
  id: 'savings_agent',
  name: 'Savings Agent',
  description: 'Identifica oportunidades práticas de economia e redução de despesas.',
  priority: 'LOW',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const comp = calculateMonthlyComparison(state.transactions, state.categories, currentYM);

    if (comp.expenseVariationPercent < -5 && comp.previousExpense > 0) {
      const savedAmount = comp.previousExpense - comp.currentExpense;
      insights.push({
        id: `savings_positive_${currentYM}`,
        agentId: this.id,
        agentName: this.name,
        title: `👏 Excelente! Você economizou este mês`,
        summary: `Você gastou ${formatCurrency(savedAmount)} a menos que no mês passado (uma redução de ${Math.abs(comp.expenseVariationPercent).toFixed(1)}%).`,
        explanation: `Comparativo de todas as despesas acumuladas entre este mês e o mês anterior.`,
        priority: 'LOW',
        confidence: 'HIGH',
        category: 'Economia',
        createdAt: new Date().toISOString(),
        actionUrl: '/fechamento',
        actionLabel: 'Ver fechamento',
        metrics: {
          currentValue: comp.currentExpense,
          targetOrAverageValue: comp.previousExpense,
          percentageChange: comp.expenseVariationPercent,
        },
      });
    }

    return insights;
  }
};
