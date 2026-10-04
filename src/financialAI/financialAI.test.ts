import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageDate } from './parsers/dateParser';
import { parseNaturalLanguageAmount } from './parsers/amountParser';
import { parseUserIntent } from './parsers/intentParser';
import { createActionPlan } from './actionPlanner';
import { executeActionPlan } from './actionExecutor';
import { calculateAffordability, diagnoseFinancialHealth } from './calculators/financialAICalculators';
import { aiService } from './aiService';
import type { Category, Account, Transaction, Bill, Goal, CreditCard } from '../types';
import type { FinancialState } from './tools/financialTools';

describe('Financial AI Architecture & Safety Tests (Prompt Sections 43 & 44)', () => {
  const mockCategories: Category[] = [
    { id: 'cat_alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#FF5C5C', type: 'expense' },
    { id: 'cat_moradia', name: 'Moradia', icon: 'Home', color: '#6366F1', type: 'expense' },
    { id: 'cat_salario', name: 'Salário', icon: 'Briefcase', color: '#39D98A', type: 'income' },
  ];

  const mockAccounts: Account[] = [
    { id: 'acc_checking', name: 'Conta Corrente', institution: 'Nubank', type: 'checking', balance: 3000, currentBalance: 3000, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
    { id: 'acc_wallet', name: 'Carteira', institution: 'Físico', type: 'cash', balance: 200, currentBalance: 200, color: '#FFB800', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
  ];

  // 1. Interpretação de datas em linguagem natural
  it('1. Deve interpretar termos de data em linguagem natural', () => {
    const todayRange = parseNaturalLanguageDate('gastei hoje');
    expect(todayRange.label).toBe('Este Mês');

    const yesterdayRange = parseNaturalLanguageDate('gastei ontem');
    expect(yesterdayRange.label).toBe('Ontem');

    const lastMonthRange = parseNaturalLanguageDate('quanto gastei no mês passado');
    expect(lastMonthRange.label).toBe('Mês Passado');

    const nextMonthRange = parseNaturalLanguageDate('quanto vou pagar no próximo mês');
    expect(nextMonthRange.label).toBe('Próximo Mês');
  });

  // 2. Interpretação de valores em linguagem natural
  it('2. Deve interpretar valores numéricos e por extenso', () => {
    expect(parseNaturalLanguageAmount('R$ 50,00')).toBe(50);
    expect(parseNaturalLanguageAmount('50 reais')).toBe(50);
    expect(parseNaturalLanguageAmount('cinquenta reais')).toBe(50);
    expect(parseNaturalLanguageAmount('R$ 1.500,50')).toBe(1500.5);
    expect(parseNaturalLanguageAmount('mil e quinhentos')).toBe(1500);
    expect(parseNaturalLanguageAmount('dez mil')).toBe(10000);
  });

  // 3. Reconhecimento de Intenções de Consulta
  it('3. Deve mapear frases em linguagem natural para intenções corretas', () => {
    const p1 = parseUserIntent('Quanto eu tenho?', mockCategories, mockAccounts);
    expect(p1.intent).toBe('GET_BALANCE');

    const p2 = parseUserIntent('Quanto gastei com comida?', mockCategories, mockAccounts);
    expect(p2.intent).toBe('GET_CATEGORY_SPENDING');
    expect(p2.parameters.categoryId).toBe('cat_alimentacao');

    const p3 = parseUserIntent('Gastei mais que mês passado?', mockCategories, mockAccounts);
    expect(p3.intent).toBe('GET_MONTHLY_COMPARISON');

    const p4 = parseUserIntent('Quais contas vencem essa semana?', mockCategories, mockAccounts);
    expect(p4.intent).toBe('GET_BILLS');

    const p5 = parseUserIntent('Posso gastar R$ 500?', mockCategories, mockAccounts);
    expect(p5.intent).toBe('CAN_I_SPEND');
    expect(p5.parameters.amount).toBe(500);
  });

  // 4. Reconhecimento de Intenções de Ação
  it('4. Deve identificar intenções de mutação e extrair parâmetros', () => {
    const pExp = parseUserIntent('Gastei 50 reais no supermercado', mockCategories, mockAccounts);
    expect(pExp.intent).toBe('CREATE_EXPENSE');
    expect(pExp.parameters.amount).toBe(50);

    const pTrans = parseUserIntent('Transfira 200 da conta corrente para carteira', mockCategories, mockAccounts);
    expect(pTrans.intent).toBe('CREATE_TRANSFER');
    expect(pTrans.parameters.amount).toBe(200);

    const pDel = parseUserIntent('Apague a despesa de R$ 50', mockCategories, mockAccounts);
    expect(pDel.intent).toBe('DELETE_TRANSACTION');
  });

  // 5. Nível de Risco e Planos de Ação
  it('5. Deve classificar risco e exigir confirmação para ações de mutação', () => {
    const parsedExp = parseUserIntent('Gastei 50 no mercado', mockCategories, mockAccounts);
    const planExp = createActionPlan(parsedExp.intent, parsedExp.parameters, mockCategories, mockAccounts);
    expect(planExp?.riskLevel).toBe('MEDIUM');
    expect(planExp?.requiresConfirmation).toBe(true);

    const parsedTransfer = parseUserIntent('Transfira 200 para carteira', mockCategories, mockAccounts);
    const planTransfer = createActionPlan(parsedTransfer.intent, parsedTransfer.parameters, mockCategories, mockAccounts);
    expect(planTransfer?.riskLevel).toBe('HIGH');
    expect(planTransfer?.requiresConfirmation).toBe(true);
  });

  // 6. Segurança: Ação não executada sem confirmação explícita
  it('6. Segurança: Não deve executar plano de ação com status pending', async () => {
    const parsedExp = parseUserIntent('Gastei 50 no mercado', mockCategories, mockAccounts);
    const planExp = createActionPlan(parsedExp.intent, parsedExp.parameters, mockCategories, mockAccounts);
    
    // Status ainda é 'pending'
    const result = await executeActionPlan(planExp!);
    expect(result.success).toBe(false);
    expect(result.message).toContain('não foi confirmada');
  });

  // 7. Análise de Viabilidade Financeira (Can I Spend?)
  it('7. Deve calcular se o usuário pode gastar com base no saldo e compromissos', () => {
    const state: FinancialState = {
      accounts: mockAccounts,
      transactions: [],
      categories: mockCategories,
      cards: [],
      goals: [],
      budgets: [],
      bills: [
        { id: 'b1', description: 'Aluguel', amount: 2000, dueDate: new Date().toISOString().split('T')[0], categoryId: 'cat_moradia', accountId: 'acc_checking', status: 'pending', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
      ],
      receivables: [],
      recurring: [],
      subscriptions: [],
      investments: [],
    };

    const res = calculateAffordability(1500, state);
    // Saldo = 3200, Bills próximos 7 dias = 2000. Disponível seguro = 1200 < 1500.
    expect(res.canAfford).toBe(false);
    expect(res.advice).toContain('deixaria uma margem muito apertada');
  });

  // 8. Diagnóstico de Saúde Financeira
  it('8. Deve fornecer diagnóstico objetivo de saúde financeira', () => {
    const state: FinancialState = {
      accounts: mockAccounts,
      transactions: [
        { id: 't1', type: 'income', amount: 3000, description: 'Salário', date: '2026-10-05', categoryId: 'cat_salario', accountId: 'acc_checking', createdAt: '2026-10-05', updatedAt: '2026-10-05' },
        { id: 't2', type: 'expense', amount: 1200, description: 'Mercado', date: '2026-10-10', categoryId: 'cat_alimentacao', accountId: 'acc_checking', createdAt: '2026-10-10', updatedAt: '2026-10-10' }
      ],
      categories: mockCategories,
      cards: [],
      goals: [],
      budgets: [],
      bills: [],
      receivables: [],
      recurring: [],
      subscriptions: [],
      investments: [],
    };

    const health = diagnoseFinancialHealth(state);
    expect(health.status).toBe('excelente');
    expect(health.summary).toContain('ótimo estado');
  });
});
