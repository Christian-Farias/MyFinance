import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  calculateTotalBalance,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateMonthlyResult,
  calculateCategoryBreakdown,
  calculateBudgetUsage,
  calculateGoalProgress,
  calculateMonthlyComparison,
  calculateNetWorth
} from './financialCalculations';
import type { Account, Transaction, Category, Budget, Goal, Investment } from '../types';

describe('Financial Calculation Engine Tests', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Nubank',
      institution: 'Nubank',
      type: 'checking',
      initialBalance: 1000,
      currentBalance: 4820.30,
      color: '#8A05BE',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    },
    {
      id: 'acc2',
      name: 'Inter',
      institution: 'Inter',
      type: 'checking',
      initialBalance: 500,
      currentBalance: 3200.20,
      color: '#FF7A00',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    }
  ];

  const mockCategories: Category[] = [
    { id: 'alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
    { id: 'moradia', name: 'Moradia', icon: 'Home', color: '#3B82F6', type: 'expense' },
    { id: 'salario', name: 'Salário', icon: 'Wallet', color: '#35D07F', type: 'income' },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      type: 'expense',
      amount: 628,
      description: 'Supermercado',
      date: '2026-10-03',
      categoryId: 'alimentacao',
      accountId: 'acc1',
      createdAt: '2026-10-03',
      updatedAt: '2026-10-03'
    },
    {
      id: 't2',
      type: 'expense',
      amount: 600,
      description: 'Aluguel',
      date: '2026-10-01',
      categoryId: 'moradia',
      accountId: 'acc1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    },
    {
      id: 't3',
      type: 'income',
      amount: 6500,
      description: 'Salário Mensal',
      date: '2026-10-05',
      categoryId: 'salario',
      accountId: 'acc2',
      createdAt: '2026-10-05',
      updatedAt: '2026-10-05'
    },
    // Previous month (2026-09)
    {
      id: 't_prev_1',
      type: 'expense',
      amount: 500,
      description: 'Supermercado Setembro',
      date: '2026-09-15',
      categoryId: 'alimentacao',
      accountId: 'acc1',
      createdAt: '2026-09-15',
      updatedAt: '2026-09-15'
    },
    {
      id: 't_prev_2',
      type: 'income',
      amount: 6000,
      description: 'Salário Setembro',
      date: '2026-09-05',
      categoryId: 'salario',
      accountId: 'acc2',
      createdAt: '2026-09-05',
      updatedAt: '2026-09-05'
    }
  ];

  it('1. Deve calcular o saldo total de contas corretamente', () => {
    const total = calculateTotalBalance(mockAccounts);
    expect(total).toBeCloseTo(8020.50, 2);
  });

  it('2. Deve formatar moeda no padrão Real brasileiro (R$)', () => {
    const formatted = formatCurrency(1234.56);
    expect(formatted).toContain('1.234,56');
    expect(formatted).toContain('R$');
  });

  it('3. Deve calcular receitas e despesas filtrando por mês', () => {
    const incomeOct = calculateTotalIncome(mockTransactions, '2026-10');
    const expensesOct = calculateTotalExpenses(mockTransactions, '2026-10');

    expect(incomeOct).toBe(6500);
    expect(expensesOct).toBe(1228);

    const result = calculateMonthlyResult(incomeOct, expensesOct);
    expect(result).toBe(5272);
  });

  it('4. Deve calcular agrupamento de despesas por categoria', () => {
    const breakdown = calculateCategoryBreakdown(mockTransactions, mockCategories, '2026-10');
    expect(breakdown.length).toBe(2);
    expect(breakdown[0].categoryName).toBe('Alimentação');
    expect(breakdown[0].total).toBe(628);
    expect(breakdown[1].categoryName).toBe('Moradia');
    expect(breakdown[1].total).toBe(600);
  });

  it('5. Deve calcular orçamento e emitir status correto (warning, critical, exceeded)', () => {
    const budgets: Budget[] = [
      {
        id: 'b1',
        categoryId: 'alimentacao',
        monthYear: '2026-10',
        limitAmount: 700,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01'
      }
    ];

    const reports = calculateBudgetUsage(budgets, mockTransactions, mockCategories, '2026-10');
    expect(reports.length).toBe(1);
    expect(reports[0].spent).toBe(628);
    expect(reports[0].remaining).toBe(72);
    // 628 / 700 = 89.7% -> status: warning/critical
    expect(reports[0].percentage).toBeGreaterThan(85);
    expect(['warning', 'critical']).toContain(reports[0].status);
  });

  it('6. Deve calcular progresso de metas e valor restante', () => {
    const goal: Goal = {
      id: 'g1',
      name: 'Comprar PC',
      targetAmount: 5000,
      currentAmount: 3200,
      deadline: '2027-04-30',
      color: '#6366F1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    };

    const status = calculateGoalProgress(goal);
    expect(status.percentage).toBe(64);
    expect(status.remaining).toBe(1800);
  });

  it('7. Deve calcular comparação entre mês atual e mês anterior', () => {
    const comp = calculateMonthlyComparison(mockTransactions, mockCategories, '2026-10');
    expect(comp.currentMonth.expenses).toBe(1228);
    expect(comp.previousMonth.expenses).toBe(500);
    expect(comp.expenseVariationPercent).toBeGreaterThan(0);
  });

  it('8. Deve calcular patrimônio líquido incluindo investimentos', () => {
    const mockInvestments: Investment[] = [
      {
        id: 'inv1',
        assetName: 'Tesouro Selic',
        type: 'fixed_income',
        quantity: 1,
        averagePrice: 7000,
        currentPrice: 7470,
        totalInvested: 7000,
        currentValue: 7470,
        yieldPercentage: 6.71,
        institution: 'Inter',
        date: '2026-10-01',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01'
      }
    ];

    const netWorth = calculateNetWorth(mockAccounts, mockInvestments);
    // 8020.50 + 7470 = 15490.50
    expect(netWorth).toBeCloseTo(15490.50, 2);
  });
});
