import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState, getHistorical3MonthsTransactions, calculateAverage } from '../agentContext';
import { formatCurrency } from '../../calculations/financialCalculations';

export const cardAgent: FinancialAgent = {
  id: 'card_agent',
  name: 'Card Agent',
  description: 'Monitora utilização de limite e crescimento das faturas de cartão.',
  priority: 'HIGH',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const card of state.cards) {
      const cardTxs = state.transactions.filter(t => t.cardId === card.id && t.type === 'expense');
      const usedLimit = cardTxs.reduce((s, t) => s + t.amount, 0);
      const usagePercentage = card.limit > 0 ? (usedLimit / card.limit) * 100 : 0;

      // 1. High limit utilization (> 80%)
      if (usagePercentage >= 80) {
        insights.push({
          id: `card_limit_${card.id}_${currentYM}`,
          agentId: this.id,
          agentName: this.name,
          title: `Alto uso do limite: ${card.name}`,
          summary: `Você já utilizou ${usagePercentage.toFixed(0)}% do limite do cartão ${card.name} (${formatCurrency(usedLimit)} de ${formatCurrency(card.limit)}).`,
          explanation: `Restam ${formatCurrency(card.limit - usedLimit)} de limite disponível neste cartão.`,
          priority: usagePercentage >= 95 ? 'HIGH' : 'MEDIUM',
          confidence: 'HIGH',
          category: 'Cartão de Crédito',
          createdAt: new Date().toISOString(),
          actionUrl: '/cartoes',
          actionLabel: 'Ver cartões',
          metrics: {
            currentValue: usedLimit,
            targetOrAverageValue: card.limit,
            percentageChange: usagePercentage,
          },
        });
      }

      // 2. Invoice growth vs 3-month average
      const currentInvoiceTxs = cardTxs.filter(t => t.invoiceMonthYear === currentYM || t.date.startsWith(currentYM));
      const currentInvoiceTotal = currentInvoiceTxs.reduce((s, t) => s + t.amount, 0);

      const histCardTxs = getHistorical3MonthsTransactions(state.transactions, currentYM).filter(t => t.cardId === card.id && t.type === 'expense');
      if (histCardTxs.length >= 3) {
        const histInvoiceAvg = calculateAverage([histCardTxs.reduce((s, t) => s + t.amount, 0) / 3]);
        if (histInvoiceAvg > 200 && currentInvoiceTotal > histInvoiceAvg * 1.2) {
          const increasePct = ((currentInvoiceTotal - histInvoiceAvg) / histInvoiceAvg) * 100;
          insights.push({
            id: `card_invoice_spike_${card.id}_${currentYM}`,
            agentId: this.id,
            agentName: this.name,
            title: `Fatura de ${card.name} acima da média`,
            summary: `Sua fatura atual de ${formatCurrency(currentInvoiceTotal)} está ${increasePct.toFixed(0)}% maior que a média recente (${formatCurrency(histInvoiceAvg)}).`,
            explanation: `Compara o valor acumulado no cartão com os últimos 3 meses anteriores.`,
            priority: 'HIGH',
            confidence: 'HIGH',
            category: 'Cartão de Crédito',
            createdAt: new Date().toISOString(),
            actionUrl: '/cartoes',
            actionLabel: 'Ver fatura',
            aiPromptContext: `Minha fatura do cartão ${card.name} subiu ${increasePct.toFixed(0)}%. Quais compras causaram essa alta?`,
            metrics: {
              currentValue: currentInvoiceTotal,
              targetOrAverageValue: histInvoiceAvg,
              percentageChange: increasePct,
            },
          });
        }
      }
    }

    return insights;
  }
};
