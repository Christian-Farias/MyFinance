import type { FinancialAgent, FinancialInsight } from '../agentTypes';
import { FullFinancialState } from '../agentContext';
import { formatCurrency, calculateTotalBalance, calculateTotalExpenses, calculateTotalIncome } from '../../calculations/financialCalculations';

export const summaryAgent: FinancialAgent = {
  id: 'summary_agent',
  name: 'Summary Agent',
  description: 'Gera resumos financeiros diários, semanais e mensais.',
  priority: 'LOW',

  async run(state: FullFinancialState): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const balance = calculateTotalBalance(state.accounts);
    const todayTxs = state.transactions.filter(t => t.date === todayStr && t.type === 'expense');
    const todayExpensesSum = todayTxs.reduce((s, t) => s + t.amount, 0);

    // 1. Daily Briefing
    insights.push({
      id: `daily_briefing_${todayStr}`,
      agentId: this.id,
      agentName: this.name,
      title: `Resumo do dia`,
      summary: `Seu saldo atual é ${formatCurrency(balance)}. Você gastou ${formatCurrency(todayExpensesSum)} hoje.`,
      explanation: `Briefing financeiro atualizado com o saldo total disponível e despesas do dia.`,
      priority: 'LOW',
      confidence: 'HIGH',
      category: 'Resumo Diário',
      createdAt: new Date().toISOString(),
      actionUrl: '/fluxo-caixa',
      actionLabel: 'Ver fluxo de caixa',
    });

    // 2. Monthly Summary
    const monthlyIncome = calculateTotalIncome(state.transactions, currentYM);
    const monthlyExpenses = calculateTotalExpenses(state.transactions, currentYM);
    const result = monthlyIncome - monthlyExpenses;

    insights.push({
      id: `monthly_summary_${currentYM}`,
      agentId: this.id,
      agentName: this.name,
      title: `Resumo do mês (${currentYM})`,
      summary: `Receitas: ${formatCurrency(monthlyIncome)} | Despesas: ${formatCurrency(monthlyExpenses)} | Resultado: ${formatCurrency(result)}.`,
      explanation: `Resumo do fechamento parcial das movimentações do mês vigente.`,
      priority: 'LOW',
      confidence: 'HIGH',
      category: 'Resumo Mensal',
      createdAt: new Date().toISOString(),
      actionUrl: '/fechamento',
      actionLabel: 'Ver fechamento',
    });

    return insights;
  }
};
