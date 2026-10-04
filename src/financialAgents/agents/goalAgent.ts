import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, calculateGoalProgress } from '../../calculations/financialCalculations';

export const goalAgent: FinancialAgent = {
  id: 'goal_agent',
  name: 'Goal Agent',
  description: 'Acompanha o progresso e ritmo de economia das metas financeiras.',
  priority: 'MEDIUM',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    for (const goal of state.goals) {
      const progress = calculateGoalProgress(goal);

      if (progress.isCompleted) {
        insights.push({
          id: `goal_completed_${goal.id}`,
          agentId: this.id,
          agentName: this.name,
          title: `🎉 Meta Atingida: ${goal.name}!`,
          summary: `Parabéns! Você alcançou 100% da sua meta de ${formatCurrency(goal.targetAmount)}.`,
          explanation: `O saldo acumulado na meta atingiu o objetivo estipulado.`,
          priority: 'HIGH',
          confidence: 'HIGH',
          category: 'Metas',
          createdAt: new Date().toISOString(),
          actionUrl: '/metas',
          actionLabel: 'Ver metas',
          metrics: {
            currentValue: goal.currentAmount,
            targetOrAverageValue: goal.targetAmount,
            percentageChange: 100,
          },
        });
      } else if (progress.percentage >= 50) {
        insights.push({
          id: `goal_progress_${goal.id}`,
          agentId: this.id,
          agentName: this.name,
          title: `Progresso na Meta: ${goal.name}`,
          summary: `Você atingiu ${progress.percentage}% da meta ${goal.name} (${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)}).`,
          explanation: `Falta ${formatCurrency(progress.remaining)} para completar seu objetivo.`,
          priority: 'LOW',
          confidence: 'HIGH',
          category: 'Metas',
          createdAt: new Date().toISOString(),
          actionUrl: '/metas',
          actionLabel: 'Ver meta',
          metrics: {
            currentValue: goal.currentAmount,
            targetOrAverageValue: goal.targetAmount,
            percentageChange: progress.percentage,
          },
        });
      }
    }

    return insights;
  }
};
