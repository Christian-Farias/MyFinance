import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';

export const billAgent: FinancialAgent = {
  id: 'bill_agent',
  name: 'Bill Agent',
  description: 'Monitora contas a pagar próximas do vencimento, vencidas ou com aumentos.',
  priority: 'HIGH',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const in5DaysDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const in5DaysStr = in5DaysDate.toISOString().split('T')[0];

    for (const bill of state.bills) {
      if (bill.status === 'overdue' || (bill.status === 'pending' && bill.dueDate < todayStr)) {
        insights.push({
          id: `bill_overdue_${bill.id}`,
          agentId: this.id,
          agentName: this.name,
          title: `Conta em atraso: ${bill.description}`,
          summary: `A conta de ${bill.description} no valor de ${formatCurrency(bill.amount)} venceu em ${formatDateBR(bill.dueDate)}.`,
          explanation: `Identificamos uma conta pendente com data de vencimento anterior a hoje.`,
          priority: 'CRITICAL',
          confidence: 'HIGH',
          category: 'Contas a Pagar',
          createdAt: new Date().toISOString(),
          actionUrl: '/compromissos',
          actionLabel: 'Pagar conta',
          preparedAction: {
            intent: 'CREATE_EXPENSE',
            parameters: { amount: bill.amount, description: `Pagamento: ${bill.description}`, categoryId: bill.categoryId }
          }
        });
      } else if (bill.status === 'pending' && bill.dueDate === todayStr) {
        insights.push({
          id: `bill_today_${bill.id}`,
          agentId: this.id,
          agentName: this.name,
          title: `Conta vence hoje: ${bill.description}`,
          summary: `A conta de ${bill.description} (${formatCurrency(bill.amount)}) vence hoje!`,
          explanation: `Lembrete automático para evitar multas por atraso.`,
          priority: 'HIGH',
          confidence: 'HIGH',
          category: 'Contas a Pagar',
          createdAt: new Date().toISOString(),
          actionUrl: '/compromissos',
          actionLabel: 'Pagar conta',
        });
      } else if (bill.status === 'pending' && bill.dueDate > todayStr && bill.dueDate <= in5DaysStr) {
        insights.push({
          id: `bill_soon_${bill.id}`,
          agentId: this.id,
          agentName: this.name,
          title: `Conta vencendo em breve: ${bill.description}`,
          summary: `A conta de ${bill.description} (${formatCurrency(bill.amount)}) vence em ${formatDateBR(bill.dueDate)}.`,
          explanation: `Vencimento nos próximos 5 dias.`,
          priority: 'MEDIUM',
          confidence: 'HIGH',
          category: 'Contas a Pagar',
          createdAt: new Date().toISOString(),
          actionUrl: '/compromissos',
          actionLabel: 'Ver conta',
        });
      }
    }

    return insights;
  }
};
