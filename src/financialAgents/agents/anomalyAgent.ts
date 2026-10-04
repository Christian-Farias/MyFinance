import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState, calculateMedian, calculateStandardDeviation } from '../agentContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';

export const anomalyAgent: FinancialAgent = {
  id: 'anomaly_agent',
  name: 'Anomaly Agent',
  description: 'Detecta movimentações estatisticamente atípicas usando a média e o histórico individual.',
  priority: 'HIGH',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const expenses = state.transactions.filter(t => t.type === 'expense' && !t.isCardInvoicePayment);

    // Regra 29: Evita falsos positivos com histórico insuficiente
    if (expenses.length < 5) return insights;

    const amounts = expenses.map(e => e.amount);
    const median = calculateMedian(amounts);
    const stdDev = calculateStandardDeviation(amounts);

    // Recent transactions in last 7 days
    const now = new Date();
    const last7DaysStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentExpenses = expenses.filter(e => e.date >= last7DaysStr);

    for (const tx of recentExpenses) {
      // Anomaly threshold: Amount > median + 2.5 * stdDev and > R$ 150
      const threshold = median + Math.max(100, 2.5 * stdDev);
      if (tx.amount > threshold && tx.amount > median * 3) {
        insights.push({
          id: `anomaly_tx_${tx.id}`,
          agentId: this.id,
          agentName: this.name,
          title: `Possível gasto fora do padrão`,
          summary: `Identificamos uma movimentação de ${formatCurrency(tx.amount)} em "${tx.description}" (${formatDateBR(tx.date)}) acima do seu padrão recente.`,
          explanation: `Sua mediana de gastos por transação é ${formatCurrency(median)}. Este lançamento está significativamente acima do desvio padrão do seu histórico.`,
          priority: 'HIGH',
          confidence: 'HIGH',
          category: 'Detecção de Anomalias',
          createdAt: new Date().toISOString(),
          actionUrl: '/transacoes',
          actionLabel: 'Ver lançamento',
          aiPromptContext: `Explique por que o lançamento de ${formatCurrency(tx.amount)} em ${tx.description} foi sinalizado como atípico.`,
          metrics: {
            currentValue: tx.amount,
            targetOrAverageValue: median,
          },
        });
      }
    }

    return insights;
  }
};
