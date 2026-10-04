import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, calculateFutureCommitments } from '../../calculations/financialCalculations';

export const installmentAgent: FinancialAgent = {
  id: 'installment_agent',
  name: 'Installment Agent',
  description: 'Monitora o comprometimento com compras parceladas e vencimentos.',
  priority: 'MEDIUM',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const commitments = calculateFutureCommitments(state.bills, state.recurring, state.transactions, 6);

    if (commitments.totalFutureCommitments > 0) {
      insights.push({
        id: `installment_commitments_6m`,
        agentId: this.id,
        agentName: this.name,
        title: `Comprometimento com parcelas e futuras despesas`,
        summary: `Você possui um total de ${formatCurrency(commitments.totalFutureCommitments)} em despesas futuras e parcelas já comprometidas para os próximos 6 meses.`,
        explanation: `Soma das parcelas de cartão a vencer, contas agendadas e despesas fixas recorrentes.`,
        priority: commitments.totalFutureCommitments > 3000 ? 'HIGH' : 'MEDIUM',
        confidence: 'HIGH',
        category: 'Parcelamentos',
        createdAt: new Date().toISOString(),
        actionUrl: '/compromissos',
        actionLabel: 'Ver comprometimento',
        metrics: {
          currentValue: commitments.totalFutureCommitments,
        },
      });
    }

    return insights;
  }
};
