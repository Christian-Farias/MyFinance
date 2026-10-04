import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { calculateTotalBalance, calculateTotalExpenses, calculateTotalIncome, formatCurrency } from '../../calculations/financialCalculations';

export const financialHealthAgent: FinancialAgent = {
  id: 'financial_health_agent',
  name: 'Financial Health Agent',
  description: 'Avalia a saúde financeira global e gera um score com pontos positivos e de atenção.',
  priority: 'HIGH',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const balance = calculateTotalBalance(state.accounts);
    const income = calculateTotalIncome(state.transactions, currentYM);
    const expenses = calculateTotalExpenses(state.transactions, currentYM);

    if (state.transactions.length < 3) return insights;

    let score = 75;
    const positivePoints: string[] = [];
    const attentionPoints: string[] = [];

    // 1. Income vs Expense ratio
    if (income > 0) {
      const ratio = (expenses / income) * 100;
      if (ratio <= 70) {
        score += 15;
        positivePoints.push(`Boa taxa de poupança (${(100 - ratio).toFixed(0)}% da renda livre)`);
      } else if (ratio > 90) {
        score -= 15;
        attentionPoints.push(`Alto comprometimento da renda (${ratio.toFixed(0)}% gasto)`);
      }
    }

    // 2. Total Balance state
    if (balance > 1000) {
      score += 10;
      positivePoints.push(`Reserva financeira positiva (${formatCurrency(balance)})`);
    } else if (balance < 200) {
      score -= 20;
      attentionPoints.push(`Reserva financeira reduzida (${formatCurrency(balance)})`);
    }

    // 3. Budgets check
    const exceededCount = state.budgets.filter(b => (expenses > b.limitAmount)).length;
    if (exceededCount > 0) {
      score -= 10;
      attentionPoints.push(`${exceededCount} orçamento(s) excedido(s)`);
    }

    const finalScore = Math.min(100, Math.max(0, score));

    insights.push({
      id: `health_score_${currentYM}`,
      agentId: this.id,
      agentName: this.name,
      title: `Saúde Financeira: ${finalScore}/100`,
      summary: `Score geral calculado em ${finalScore}/100 com base no seu padrão de receitas, despesas e orçamentos.`,
      explanation: `Pontos Positivos:\n${positivePoints.map(p => `• ${p}`).join('\n')}\n\nPontos de Atenção:\n${attentionPoints.map(a => `• ${a}`).join('\n')}`,
      priority: finalScore < 60 ? 'HIGH' : 'MEDIUM',
      confidence: 'HIGH',
      category: 'Saúde Financeira',
      createdAt: new Date().toISOString(),
      actionUrl: '/fechamento',
      actionLabel: 'Ver saúde financeira',
      metrics: {
        currentValue: finalScore,
        targetOrAverageValue: 100,
      },
    });

    return insights;
  }
};
