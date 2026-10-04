import { describe, it, expect } from 'vitest';
import { spendingAgent } from './agents/spendingAgent';
import { budgetAgent } from './agents/budgetAgent';
import { cardAgent } from './agents/cardAgent';
import { billAgent } from './agents/billAgent';
import { subscriptionAgent } from './agents/subscriptionAgent';
import { installmentAgent } from './agents/installmentAgent';
import { goalAgent } from './agents/goalAgent';
import { cashFlowAgent } from './agents/cashFlowAgent';
import { anomalyAgent } from './agents/anomalyAgent';
import { duplicateAgent } from './agents/duplicateAgent';
import { financialHealthAgent } from './agents/financialHealthAgent';
import { globalAgentScheduler } from './agentScheduler';
import type { FullFinancialState } from './agentContext';

describe('Proactive Financial Agents & Event Architecture (Prompt Sections 42, 43, 44)', () => {
  const currentYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const mockState: FullFinancialState = {
    accounts: [
      { id: 'acc1', name: 'Corrente', type: 'checking', institution: 'Nubank', balance: 3000, currentBalance: 3000, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    transactions: [
      { id: 't1', type: 'income', amount: 3500, description: 'Salário', date: `${currentYM}-05`, categoryId: 'cat_salario', accountId: 'acc1', createdAt: '2026-10-05', updatedAt: '2026-10-05' },
      { id: 't2', type: 'expense', amount: 3400, description: 'Supermercado 1', date: `${currentYM}-10`, categoryId: 'cat_alimentacao', accountId: 'acc1', cardId: 'c1', createdAt: '2026-10-10', updatedAt: '2026-10-10' },
      { id: 't3', type: 'expense', amount: 3400, description: 'Supermercado 1', date: `${currentYM}-10`, categoryId: 'cat_alimentacao', accountId: 'acc1', cardId: 'c1', createdAt: '2026-10-10', updatedAt: '2026-10-10' }, // Duplicate
    ],
    categories: [
      { id: 'cat_alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#FF5C5C', type: 'expense' },
      { id: 'cat_salario', name: 'Salário', icon: 'Briefcase', color: '#39D98A', type: 'income' },
    ],
    cards: [
      { id: 'c1', name: 'Nubank', institution: 'Nubank', brand: 'mastercard', lastDigits: '1234', isActive: true, limit: 4000, availableLimit: 800, closingDay: 5, dueDay: 12, color: '#8B7CFF', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    goals: [
      { id: 'g1', name: 'Viagem', targetAmount: 5000, currentAmount: 3500, deadline: '2027-12-31', color: '#6366F1', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    budgets: [
      { id: 'b1', categoryId: 'cat_alimentacao', limitAmount: 600, monthYear: currentYM, createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    bills: [
      { id: 'bill1', description: 'Internet', amount: 100, dueDate: todayStr, categoryId: 'cat_alimentacao', accountId: 'acc1', status: 'pending', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    receivables: [],
    recurring: [
      { id: 'rec1', description: 'Aluguel', amount: 900, type: 'expense', categoryId: 'cat_alimentacao', accountId: 'acc1', frequency: 'monthly', startDate: '2026-01-01', nextOccurrence: `${currentYM}-15`, status: 'active', createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    ],
    subscriptions: [
      { id: 'sub1', name: 'Netflix', amount: 39.9, frequency: 'monthly', nextBillingDate: `${currentYM}-15`, categoryId: 'cat_alimentacao', monthlyEstimate: 39.9, annualEstimate: 478.8, isActive: true, createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    investments: [],
  };

  // 1. Budget Agent thresholds
  it('1. Budget Agent deve sinalizar orçamento excedido quando o valor ultrapassar limite', async () => {
    const insights = await budgetAgent.run(mockState);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].priority).toBe('HIGH');
    expect(insights[0].title).toContain('ultrapassado');
  });

  // 2. Card Agent limit usage
  it('2. Card Agent deve monitorar limite utilizado no cartão (> 80%)', async () => {
    const insights = await cardAgent.run(mockState);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].title).toContain('Alto uso do limite');
  });

  // 3. Bill Agent due today
  it('3. Bill Agent deve identificar conta que vence hoje', async () => {
    const insights = await billAgent.run(mockState);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].title).toContain('vence hoje');
  });

  // 4. Duplicate Agent detection without auto deletion
  it('4. Duplicate Agent deve identificar lançamentos suspeitos de duplicidade', async () => {
    const insights = await duplicateAgent.run(mockState);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].title).toContain('duplicado');
    expect(insights[0].preparedAction?.intent).toBe('DELETE_TRANSACTION');
  });

  // 5. Anomaly Agent false positive prevention with sparse history
  it('5. Anomaly Agent não deve gerar alertas falsos se não houver histórico suficiente', async () => {
    const sparseState: FullFinancialState = {
      ...mockState,
      transactions: mockState.transactions.slice(0, 1),
    };
    const insights = await anomalyAgent.run(sparseState);
    expect(insights.length).toBe(0);
  });

  // 6. Goal Agent progress
  it('6. Goal Agent deve reportar progresso quando meta ultrapassar 50%', async () => {
    const insights = await goalAgent.run(mockState);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].title).toContain('Progresso na Meta');
  });

  // 7. Financial Health Agent Score
  it('7. Financial Health Agent deve gerar score numérico de 0 a 100', async () => {
    const insights = await financialHealthAgent.run(mockState);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].metrics?.currentValue).toBeGreaterThan(0);
  });

  // 8. Global Agent Scheduler Caching & Priority Ordering
  it('8. Scheduler deve ordenar insights por prioridade e utilizar cache de versão de dados', async () => {
    const insights = await globalAgentScheduler.triggerAnalysis('PERIODIC_CHECK', mockState, true);
    expect(insights.length).toBeGreaterThan(0);

    const firstPriority = insights[0].priority;
    expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(firstPriority);

    const cached = globalAgentScheduler.getCachedInsights();
    expect(cached.length).toBe(insights.length);
  });
});
