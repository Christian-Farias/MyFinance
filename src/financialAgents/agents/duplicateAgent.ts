import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';

export const duplicateAgent: FinancialAgent = {
  id: 'duplicate_agent',
  name: 'Duplicate Agent',
  description: 'Identifica lançamentos potencialmente duplicados.',
  priority: 'MEDIUM',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const txs = state.transactions;
    const checkedPairs = new Set<string>();

    for (let i = 0; i < txs.length; i++) {
      for (let j = i + 1; j < txs.length; j++) {
        const t1 = txs[i];
        const t2 = txs[j];

        const pairKey = [t1.id, t2.id].sort().join('_');
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        const sameAmount = Math.abs(t1.amount - t2.amount) < 0.01;
        const sameDate = t1.date === t2.date;
        const desc1 = t1.description.toLowerCase().trim();
        const desc2 = t2.description.toLowerCase().trim();
        const similarDesc = desc1 === desc2 || desc1.includes(desc2) || desc2.includes(desc1);

        if (sameAmount && sameDate && similarDesc) {
          insights.push({
            id: `duplicate_${pairKey}`,
            agentId: this.id,
            agentName: this.name,
            title: `Possível lançamento duplicado`,
            summary: `Encontramos duas movimentações muito parecidas de ${formatCurrency(t1.amount)} ("${t1.description}") em ${formatDateBR(t1.date)}.`,
            explanation: `Movimentações com o mesmo valor, mesma data e descrição similar no mesmo dia.`,
            priority: 'HIGH',
            confidence: 'HIGH',
            category: 'Duplicidades',
            createdAt: new Date().toISOString(),
            actionUrl: '/transacoes',
            actionLabel: 'Ver lançamentos',
            aiPromptContext: `Encontrei lançamentos duplicados de ${formatCurrency(t1.amount)}. Deseja apagar um deles?`,
            preparedAction: {
              intent: 'DELETE_TRANSACTION',
              parameters: { transactionId: t2.id, description: t2.description, amount: t2.amount }
            }
          });
        }
      }
    }

    return insights;
  }
};
