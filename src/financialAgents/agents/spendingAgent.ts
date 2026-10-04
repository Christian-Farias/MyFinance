import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState, getHistorical3MonthsTransactions, calculateAverage } from '../agentContext';
import { formatCurrency } from '../../calculations/financialCalculations';

export const spendingAgent: FinancialAgent = {
  id: 'spending_agent',
  name: 'Spending Agent',
  description: 'Monitora picos de consumo e variações em relação à média histórica.',
  priority: 'MEDIUM',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentTxs = state.transactions.filter(t => t.type === 'expense' && !t.isCardInvoicePayment && t.date.startsWith(currentYM));
    const histTxs = getHistorical3MonthsTransactions(state.transactions, currentYM).filter(t => t.type === 'expense' && !t.isCardInvoicePayment);

    if (histTxs.length < 5) return insights; // Evita falsos positivos com histórico insuficiente

    for (const cat of state.categories) {
      const currentCatTotal = currentTxs.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
      const histCatTxs = histTxs.filter(t => t.categoryId === cat.id);
      
      if (histCatTxs.length === 0 || currentCatTotal === 0) continue;

      const histMonthlyAvg = calculateAverage([
        histCatTxs.reduce((s, t) => s + t.amount, 0) / 3
      ]);

      if (histMonthlyAvg > 100 && currentCatTotal > histMonthlyAvg * 1.25) {
        const percentIncrease = ((currentCatTotal - histMonthlyAvg) / histMonthlyAvg) * 100;
        insights.push({
          id: `spending_spike_${cat.id}_${currentYM}`,
          agentId: this.id,
          agentName: this.name,
          title: `Gastos em ${cat.name} acima da média`,
          summary: `Você gastou ${percentIncrease.toFixed(0)}% a mais com ${cat.name} este mês (${formatCurrency(currentCatTotal)} vs média de ${formatCurrency(histMonthlyAvg)}).`,
          explanation: `Este alerta foi gerado porque o valor acumulado em ${cat.name} este mês (${formatCurrency(currentCatTotal)}) superou a média mensal dos últimos 3 meses (${formatCurrency(histMonthlyAvg)}).`,
          priority: percentIncrease > 50 ? 'HIGH' : 'MEDIUM',
          confidence: 'HIGH',
          category: cat.name,
          createdAt: new Date().toISOString(),
          actionUrl: '/gastos',
          actionLabel: 'Ver gastos',
          aiPromptContext: `Analise por que meus gastos com ${cat.name} aumentaram ${percentIncrease.toFixed(0)}% este mês.`,
          metrics: {
            currentValue: currentCatTotal,
            targetOrAverageValue: histMonthlyAvg,
            percentageChange: percentIncrease,
          },
        });
      }
    }

    return insights;
  }
};
