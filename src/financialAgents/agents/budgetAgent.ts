import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, calculateCategoryBreakdown } from '../../calculations/financialCalculations';

export const budgetAgent: FinancialAgent = {
  id: 'budget_agent',
  name: 'Budget Agent',
  description: 'Acompanha orçamentos definidos e alerta sobre limites.',
  priority: 'HIGH',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const categoryBreakdown = calculateCategoryBreakdown(state.transactions, state.categories, currentYM);

    for (const budget of state.budgets) {
      const cat = state.categories.find(c => c.id === budget.categoryId);
      const categoryName = cat?.name || 'Categoria';
      const spent = categoryBreakdown.find(cb => cb.categoryId === budget.categoryId)?.total || 0;
      const percentage = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;

      if (percentage >= 100) {
        insights.push({
          id: `budget_exceeded_${budget.id}_${currentYM}`,
          agentId: this.id,
          agentName: this.name,
          title: `Orçamento de ${categoryName} ultrapassado`,
          summary: `Você gastou ${formatCurrency(spent)} de ${formatCurrency(budget.limitAmount)} (${percentage.toFixed(0)}%).`,
          explanation: `Você ultrapassou em ${formatCurrency(spent - budget.limitAmount)} o limite definido para ${categoryName}.`,
          priority: 'HIGH',
          confidence: 'HIGH',
          category: categoryName,
          createdAt: new Date().toISOString(),
          actionUrl: '/orcamentos',
          actionLabel: 'Ver orçamentos',
          aiPromptContext: `Meu orçamento de ${categoryName} foi estourado em ${percentage.toFixed(0)}%. O que posso fazer?`,
          preparedAction: {
            intent: 'CREATE_BUDGET',
            parameters: { budgetId: budget.id, categoryId: budget.categoryId, limitAmount: budget.limitAmount * 1.2 }
          },
          metrics: {
            currentValue: spent,
            targetOrAverageValue: budget.limitAmount,
            percentageChange: percentage,
          },
        });
      } else if (percentage >= 90) {
        insights.push({
          id: `budget_critical_${budget.id}_${currentYM}`,
          agentId: this.id,
          agentName: this.name,
          title: `Alerta crítico: Orçamento de ${categoryName}`,
          summary: `Você já utilizou ${percentage.toFixed(0)}% do orçamento de ${categoryName} (${formatCurrency(spent)} de ${formatCurrency(budget.limitAmount)}).`,
          explanation: `Resta apenas ${formatCurrency(budget.limitAmount - spent)} para gastos nesta categoria até o fim do mês.`,
          priority: 'HIGH',
          confidence: 'HIGH',
          category: categoryName,
          createdAt: new Date().toISOString(),
          actionUrl: '/orcamentos',
          actionLabel: 'Ver orçamento',
          aiPromptContext: `Estou em ${percentage.toFixed(0)}% do meu orçamento de ${categoryName}. Como evitar ultrapassar?`,
          metrics: {
            currentValue: spent,
            targetOrAverageValue: budget.limitAmount,
            percentageChange: percentage,
          },
        });
      } else if (percentage >= 75) {
        insights.push({
          id: `budget_warning_${budget.id}_${currentYM}`,
          agentId: this.id,
          agentName: this.name,
          title: `Atenção no orçamento de ${categoryName}`,
          summary: `Seu consumo em ${categoryName} atingiu ${percentage.toFixed(0)}% do limite.`,
          explanation: `Você consumiu ${formatCurrency(spent)} dos ${formatCurrency(budget.limitAmount)} planejados.`,
          priority: 'MEDIUM',
          confidence: 'HIGH',
          category: categoryName,
          createdAt: new Date().toISOString(),
          actionUrl: '/orcamentos',
          actionLabel: 'Acompanhar orçamento',
          metrics: {
            currentValue: spent,
            targetOrAverageValue: budget.limitAmount,
            percentageChange: percentage,
          },
        });
      }
    }

    return insights;
  }
};
