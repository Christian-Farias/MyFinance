import { describe, it, expect, beforeEach } from 'vitest';
import { parseNaturalLanguageDate } from './parsers/dateParser';
import { parseNaturalLanguageAmount } from './parsers/amountParser';
import { parseUserIntent } from './parsers/intentParser';
import { resolveConversationContext, updateConversationContext } from './contextResolver';
import { createActionPlan } from './actionPlanner';
import { executeActionPlan } from './actionExecutor';
import { calculateAffordability, diagnoseFinancialHealth } from './calculators/financialAICalculators';
import { financialTools } from './tools/financialTools';
import { generateResponse } from './responseGenerator';
import { aiService } from './aiService';
import type { Category, Account, Transaction, Bill, Goal, CreditCard, Budget } from '../types';
import type { FinancialState } from './tools/financialTools';
import type { AIConversationContext } from './types';

describe('Financial AI Engine - Phase 4 Comprehensive Tests', () => {
  const mockCategories: Category[] = [
    { id: 'cat_alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#FF5C5C', type: 'expense' },
    { id: 'cat_transporte', name: 'Transporte', icon: 'Car', color: '#3B82F6', type: 'expense' },
    { id: 'cat_moradia', name: 'Moradia', icon: 'Home', color: '#6366F1', type: 'expense' },
    { id: 'cat_salario', name: 'Salário', icon: 'Briefcase', color: '#39D98A', type: 'income' },
  ];

  const mockAccounts: Account[] = [
    { id: 'acc_checking', name: 'Conta Corrente', institution: 'Nubank', type: 'checking', balance: 3000, currentBalance: 3000, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
    { id: 'acc_wallet', name: 'Carteira', institution: 'Físico', type: 'cash', balance: 200, currentBalance: 200, color: '#FFB800', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
  ];

  const mockCards: CreditCard[] = [
    {
      id: 'card_nu',
      name: 'Nubank Ultravioleta',
      institution: 'Nubank',
      brand: 'mastercard',
      limit: 5000,
      availableLimit: 4000,
      closingDay: 25,
      dueDay: 5,
      lastDigits: '1234',
      color: '#8A05BE',
      isActive: true,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    }
  ];

  const mockGoals: Goal[] = [
    { id: 'goal_viagem', name: 'Viagem', targetAmount: 6000, currentAmount: 2000, deadline: '2026-12-31', color: '#FF5C5C', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
  ];

  const mockState: FinancialState = {
    accounts: mockAccounts,
    transactions: [
      { id: 't1', type: 'expense', amount: 800, description: 'Supermercado', date: '2026-10-02', categoryId: 'cat_alimentacao', accountId: 'acc_checking', createdAt: '2026-10-02', updatedAt: '2026-10-02' },
      { id: 't2', type: 'expense', amount: 300, description: 'Combustível', date: '2026-10-03', categoryId: 'cat_transporte', accountId: 'acc_checking', createdAt: '2026-10-03', updatedAt: '2026-10-03' },
      { id: 't3', type: 'income', amount: 4000, description: 'Salário', date: '2026-10-01', categoryId: 'cat_salario', accountId: 'acc_checking', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
      // Previous month transactions (2026-09)
      { id: 't_prev1', type: 'expense', amount: 600, description: 'Mercado Setembro', date: '2026-09-15', categoryId: 'cat_alimentacao', accountId: 'acc_checking', createdAt: '2026-09-15', updatedAt: '2026-09-15' },
      { id: 't_prev2', type: 'expense', amount: 200, description: 'Uber Setembro', date: '2026-09-18', categoryId: 'cat_transporte', accountId: 'acc_checking', createdAt: '2026-09-18', updatedAt: '2026-09-18' },
    ],
    categories: mockCategories,
    cards: mockCards,
    goals: mockGoals,
    budgets: [
      { id: 'b1', categoryId: 'cat_alimentacao', monthYear: '2026-10', limitAmount: 700, createdAt: '2026-10-01', updatedAt: '2026-10-01' } // spent 800, limit 700 -> exceeded!
    ],
    bills: [
      { id: 'b_bill1', description: 'Aluguel', amount: 1500, dueDate: '2026-10-10', categoryId: 'cat_moradia', accountId: 'acc_checking', status: 'pending', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ],
    receivables: [],
    recurring: [
      { id: 'rec_1', description: 'Internet Fibra', amount: 120, type: 'expense', frequency: 'monthly', status: 'active', categoryId: 'cat_moradia', accountId: 'acc_checking', startDate: '2026-01-01', nextOccurrence: '2026-11-01', createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    ],
    subscriptions: [],
    investments: [
      { id: 'inv_1', assetName: 'Tesouro Selic', type: 'fixed_income', quantity: 1, averagePrice: 5000, currentPrice: 5200, yieldPercentage: 4, institution: 'Tesouro', date: '2026-01-01', totalInvested: 5000, currentValue: 5200, createdAt: '2026-01-01', updatedAt: '2026-10-01' }
    ],
  };


  // ─── 1. INTERPRETAÇÃO TEMPORAL ───
  describe('1. Interpretação Temporal e Expressões Naturais', () => {
    const fixedRef = new Date(2026, 9, 15); // 15 de Outubro de 2026

    it('identifica dias relativos: hoje, ontem, anteontem, amanhã', () => {
      expect(parseNaturalLanguageDate('gastei hoje', fixedRef).label).toBe('Hoje');
      expect(parseNaturalLanguageDate('comprei ontem', fixedRef).label).toBe('Ontem');
      expect(parseNaturalLanguageDate('foi anteontem', fixedRef).label).toBe('Anteontem');
      expect(parseNaturalLanguageDate('vence amanhã', fixedRef).label).toBe('Amanhã');
    });

    it('identifica meses nominais com e sem ano (ex: outubro, de setembro de 2026)', () => {
      const out = parseNaturalLanguageDate('despesas de outubro', fixedRef);
      expect(out.monthYear).toBe('2026-10');
      expect(out.startDate).toBe('2026-10-01');
      expect(out.endDate).toBe('2026-10-31');

      const set = parseNaturalLanguageDate('gastos em setembro de 2026', fixedRef);
      expect(set.monthYear).toBe('2026-09');
      expect(set.startDate).toBe('2026-09-01');
      expect(set.endDate).toBe('2026-09-30');
    });

    it('identifica janelas móveis diferenciando de meses de calendário', () => {
      const r30 = parseNaturalLanguageDate('últimos 30 dias', fixedRef);
      expect(r30.isRollingWindow).toBe(true);
      expect(r30.label).toBe('Últimos 30 dias');

      const calMonth = parseNaturalLanguageDate('mês passado', fixedRef);
      expect(calMonth.isRollingWindow).toBeFalsy();
      expect(calMonth.monthYear).toBe('2026-09');
    });

    it('identifica intervalos de dias: entre os dias 5 e 20', () => {
      const interval = parseNaturalLanguageDate('entre os dias 5 e 20', fixedRef);
      expect(interval.startDate).toBe('2026-10-05');
      expect(interval.endDate).toBe('2026-10-20');
    });

    it('identifica trimestres (Q1, primeiro trimestre, etc.)', () => {
      const q1 = parseNaturalLanguageDate('gastos do primeiro trimestre', fixedRef);
      expect(q1.startDate).toBe('2026-01-01');
      expect(q1.endDate).toBe('2026-03-31');
    });
  });

  // ─── 2. EXTRAÇÃO DE VALORES E ENTIDADES ───
  describe('2. Valores e Normalização de Entidades', () => {
    it('interpreta moedas padrão e coloquiais (pila, conto, reais)', () => {
      expect(parseNaturalLanguageAmount('R$ 1.500,50')).toBe(1500.5);
      expect(parseNaturalLanguageAmount('50 pila')).toBe(50);
      expect(parseNaturalLanguageAmount('100 conto')).toBe(100);
      expect(parseNaturalLanguageAmount('cento e cinquenta reais')).toBe(150);
      expect(parseNaturalLanguageAmount('dois mil')).toBe(2000);
      expect(parseNaturalLanguageAmount('dez mil')).toBe(10000);
    });
  });

  // ─── 3. RECONHECIMENTO DE INTENÇÕES (FORMULAÇÕES VARIADAS) ───
  describe('3. Reconhecimento de Intenções Semânticas', () => {
    it('reconhece diferentes formulações para consulta de despesas gerais', () => {
      const q1 = parseUserIntent('Quanto gastei esse mês?', mockCategories, mockAccounts);
      expect(q1.intent).toBe('GET_EXPENSES');

      const q2 = parseUserIntent('Qual foi meu gasto total no mês atual?', mockCategories, mockAccounts);
      expect(q2.intent).toBe('GET_EXPENSES');

      const q3 = parseUserIntent('Me mostra minhas despesas de outubro', mockCategories, mockAccounts);
      expect(q3.intent).toBe('GET_EXPENSES');
      expect(q3.parameters.dateRange?.monthYear).toBe('2026-10');

      const q4 = parseUserIntent('Quanto saiu da minha conta neste mês?', mockCategories, mockAccounts);
      expect(q4.intent).toBe('GET_EXPENSES');
    });

    it('reconhece categorias por sinônimos informais (ex: comida, uber, luz)', () => {
      const qComida = parseUserIntent('Quanto gastei com comida?', mockCategories, mockAccounts);
      expect(qComida.intent).toBe('GET_CATEGORY_SPENDING');
      expect(qComida.parameters.categoryId).toBe('cat_alimentacao');

      const qUber = parseUserIntent('Quanto foi de uber este mês?', mockCategories, mockAccounts);
      expect(qUber.intent).toBe('GET_CATEGORY_SPENDING');
      expect(qUber.parameters.categoryId).toBe('cat_transporte');
    });

    it('reconhece novas intenções especializadas', () => {
      const qAcc = parseUserIntent('Quais contas eu tenho?', mockCategories, mockAccounts);
      expect(qAcc.intent).toBe('GET_ACCOUNTS');

      const qTx = parseUserIntent('Me mostre meu extrato recente', mockCategories, mockAccounts);
      expect(qTx.intent).toBe('GET_TRANSACTIONS');

      const qInv = parseUserIntent('Como estão meus investimentos?', mockCategories, mockAccounts);
      expect(qInv.intent).toBe('GET_INVESTMENTS');

      const qRec = parseUserIntent('Quais são minhas despesas fixas?', mockCategories, mockAccounts);
      expect(qRec.intent).toBe('GET_RECURRING');

      const qHelp = parseUserIntent('O que você sabe fazer?', mockCategories, mockAccounts);
      expect(qHelp.intent).toBe('HELP_GREETING');
    });
  });

  // ─── 4. CONTEXTO CONVERSACIONAL EM MÚLTIPLOS TURNOS ───
  describe('4. Contexto Conversacional e Elipses', () => {
    let context: AIConversationContext;

    beforeEach(() => {
      context = {
        messagesHistory: [],
      };
    });

    it('resolve cadeia completa: "alimentação" -> "e mês passado?" -> "e transporte?" -> "agora compara os dois"', () => {
      // Turno 1: "Quanto gastei com alimentação este mês?"
      let p1 = parseUserIntent('Quanto gastei com alimentação este mês?', mockCategories, mockAccounts);
      p1 = resolveConversationContext(p1, 'Quanto gastei com alimentação este mês?', context);
      updateConversationContext(p1, context);

      expect(p1.intent).toBe('GET_CATEGORY_SPENDING');
      expect(context.lastCategoryQuery).toBe('Alimentação');
      expect(context.lastDateRange?.label).toBe('Este Mês');

      // Turno 2: "E no mês passado?"
      let p2 = parseUserIntent('E no mês passado?', mockCategories, mockAccounts);
      p2 = resolveConversationContext(p2, 'E no mês passado?', context);
      updateConversationContext(p2, context);

      expect(p2.intent).toBe('GET_CATEGORY_SPENDING');
      expect(p2.parameters.categoryQuery).toBe('Alimentação');
      expect(p2.parameters.dateRange?.monthYear).toBe('2026-09');

      // Turno 3: "E transporte?"
      let p3 = parseUserIntent('E transporte?', mockCategories, mockAccounts);
      p3 = resolveConversationContext(p3, 'E transporte?', context);
      updateConversationContext(p3, context);

      expect(p3.intent).toBe('GET_CATEGORY_SPENDING');
      expect(p3.parameters.categoryQuery).toBe('Transporte');
      expect(p3.parameters.dateRange?.monthYear).toBe('2026-09'); // herdou o período do mês passado!
      expect(context.lastCategoryQuery).toBe('Transporte');
      expect(context.secondLastCategoryQuery).toBe('Alimentação'); // memorizou as duas categorias!

      // Turno 4: "Agora compara os dois."
      let p4 = parseUserIntent('Agora compara os dois.', mockCategories, mockAccounts);
      p4 = resolveConversationContext(p4, 'Agora compara os dois.', context);

      expect(p4.intent).toBe('GET_CATEGORY_COMPARISON');
      expect(p4.parameters.categoryQuery).toBe('Alimentação');
      expect(p4.parameters.secondCategoryQuery).toBe('Transporte');
      expect(p4.parameters.dateRange?.monthYear).toBe('2026-09');
    });
  });

  // ─── 5. RACIOCÍNIO FINANCEIRO DETERMINÍSTICO E "KATROVOU 🐒" ───
  describe('5. Raciocínio Financeiro Local e Alertas Determinísticos', () => {
    it('compara duas categorias deterministamente', () => {
      const comp = financialTools.getCategoryComparison(mockState, 'Alimentação', 'Transporte', '2026-10');
      expect(comp.higherCategoryName).toBe('Alimentação');
      expect(comp.categoryA.total).toBe(800);
      expect(comp.categoryB.total).toBe(300);
      expect(comp.difference).toBe(500);
    });

    it('adiciona "Katrovou 🐒" quando orçamento é estourado', () => {
      const resp = generateResponse('GET_BUDGET', 'orçamentos', mockState);
      expect(resp.text).toContain('Katrovou 🐒');
    });

    it('adiciona "Katrovou 🐒" quando o usuário não pode arcar com uma compra', () => {
      const resp = generateResponse('CAN_I_SPEND', 'posso gastar 5000?', mockState, undefined, { amount: 5000 });
      expect(resp.text).toContain('Katrovou 🐒');
    });

    it('simula valores necessários para atingir meta', () => {
      const sim = financialTools.simulateGoalSavings(mockState, 'Viagem', 6);
      expect(sim.hasGoal).toBe(true);
      expect(sim.remainingAmount).toBe(4000); // 6000 - 2000
      expect(sim.neededMonthly).toBeCloseTo(4000 / 6, 2);
    });
  });

  // ─── 6. SEGURANÇA E PLANOS DE AÇÃO ───
  describe('6. Segurança e Confirmação de Ações', () => {
    it('cria plano de orçamento e exige confirmação', () => {
      const p = parseUserIntent('Definir orcamento de 1000 para alimentacao', mockCategories, mockAccounts);
      const plan = createActionPlan(p.intent, p.parameters, mockCategories, mockAccounts);
      expect(plan?.intent).toBe('CREATE_BUDGET');
      expect(plan?.requiresConfirmation).toBe(true);
      expect(plan?.status).toBe('pending');
    });

    it('não permite executar plano não confirmado', async () => {
      const p = parseUserIntent('Definir orcamento de 1000 para alimentacao', mockCategories, mockAccounts);
      const plan = createActionPlan(p.intent, p.parameters, mockCategories, mockAccounts);
      const res = await executeActionPlan(plan!);
      expect(res.success).toBe(false);
      expect(res.message).toContain('não foi confirmada');
    });
  });
});

