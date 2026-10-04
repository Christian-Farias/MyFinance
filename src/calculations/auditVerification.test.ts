import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { cardService } from '../services/cardService';
import { budgetService } from '../services/budgetService';
import { goalService } from '../services/goalService';
import { importService } from '../services/importService';
import { clearEntireDatabase } from '../database/db';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateMonthlyResult,
  calculateBudgetUsage,
  calculateMonthlyComparison,
  calculateGoalProgress
} from './financialCalculations';
import type { Category } from '../types';

describe('V1 AUDIT COMPREHENSIVE INTEGRATION TESTS', () => {
  beforeEach(async () => {
    await clearEntireDatabase();
  });

  const categories: Category[] = [
    { id: 'alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
    { id: 'salario', name: 'Salário', icon: 'Wallet', color: '#35D07F', type: 'income' },
    { id: 'outros', name: 'Outros', icon: 'Tag', color: '#8A8F98', type: 'both' }
  ];

  it('3. TESTE DAS TRANSAÇÕES: Criação, Edição, Exclusão e Recálculo', async () => {
    // 1. Criar conta com saldo inicial 0
    const acc = await accountService.create({
      name: 'Nubank Teste',
      institution: 'Nubank',
      type: 'checking',
      initialBalance: 0,
      color: '#8A05BE'
    });

    // 2. Criar uma receita de R$ 3.000
    await transactionService.create({
      type: 'income',
      amount: 3000,
      description: 'Salário',
      date: '2026-10-01',
      categoryId: 'salario',
      accountId: acc.id,
      paymentMethod: 'account'
    });

    // 3. Criar uma despesa de R$ 500
    const [exp1] = await transactionService.create({
      type: 'expense',
      amount: 500,
      description: 'Supermercado 1',
      date: '2026-10-02',
      categoryId: 'alimentacao',
      accountId: acc.id,
      paymentMethod: 'account'
    });

    // 4. Criar outra despesa de R$ 200
    const [exp2] = await transactionService.create({
      type: 'expense',
      amount: 200,
      description: 'Supermercado 2',
      date: '2026-10-03',
      categoryId: 'alimentacao',
      accountId: acc.id,
      paymentMethod: 'account'
    });

    // Verificar totais:
    let txs = await transactionService.getAll();
    let income = calculateTotalIncome(txs, '2026-10');
    let expenses = calculateTotalExpenses(txs, '2026-10');
    let result = calculateMonthlyResult(income, expenses);

    expect(income).toBe(3000);
    expect(expenses).toBe(700);
    expect(result).toBe(2300);

    // Verificar saldo da conta no banco:
    let updatedAcc = await accountService.getById(acc.id);
    expect(updatedAcc?.currentBalance).toBe(2300);

    // 5. Editar a despesa: alterar R$ 500 para R$ 400
    await transactionService.update({
      ...exp1,
      amount: 400
    });

    txs = await transactionService.getAll();
    income = calculateTotalIncome(txs, '2026-10');
    expenses = calculateTotalExpenses(txs, '2026-10');
    result = calculateMonthlyResult(income, expenses);

    expect(income).toBe(3000);
    expect(expenses).toBe(600); // 400 + 200
    expect(result).toBe(2400); // 3000 - 600

    updatedAcc = await accountService.getById(acc.id);
    expect(updatedAcc?.currentBalance).toBe(2400);

    // 6. Excluir a despesa de R$ 400
    await transactionService.delete(exp1.id);

    txs = await transactionService.getAll();
    income = calculateTotalIncome(txs, '2026-10');
    expenses = calculateTotalExpenses(txs, '2026-10');
    result = calculateMonthlyResult(income, expenses);

    expect(income).toBe(3000);
    expect(expenses).toBe(200); // Somente exp2
    expect(result).toBe(2800);

    updatedAcc = await accountService.getById(acc.id);
    expect(updatedAcc?.currentBalance).toBe(2800);
  });

  it('4. TESTE DO CARTÃO: Limite, Compra à Vista, Parcelamento e Faturas', async () => {
    // 1. Criar cartão com limite de R$ 3.000
    const card = await cardService.create({
      name: 'Nubank Ultravioleta',
      institution: 'Nubank',
      brand: 'mastercard',
      limit: 3000,
      closingDay: 5,
      dueDay: 12,
      lastDigits: '4821',
      color: '#6D28D9',
      isActive: true
    });

    // 2. Compra de R$ 500 no cartão
    await transactionService.create({
      type: 'expense',
      amount: 500,
      description: 'Compra Simples',
      date: '2026-10-02',
      categoryId: 'alimentacao',
      cardId: card.id,
      paymentMethod: 'credit_card'
    });

    let limits = await cardService.recalculateCardLimits(card.id);
    expect(limits.usedLimit).toBe(500);
    expect(limits.availableLimit).toBe(2500);

    // 3. Compra parcelada: R$ 1.200 em 6x
    const installments = await transactionService.create({
      type: 'expense',
      amount: 1200,
      description: 'Notebook',
      date: '2026-10-03',
      categoryId: 'outros',
      cardId: card.id,
      paymentMethod: 'credit_card'
    }, 6);

    expect(installments.length).toBe(6);
    expect(installments[0].amount).toBe(200);

    // Limite total utilizado = 500 + 1200 = 1700
    // Disponível = 3000 - 1700 = 1300
    limits = await cardService.recalculateCardLimits(card.id);
    expect(limits.usedLimit).toBe(1700);
    expect(limits.availableLimit).toBe(1300);

    // Fatura atual de Outubro (2026-10): deve conter os 500 + 1ª parcela de 200 = 700
    expect(limits.currentInvoice).toBe(700);

    // Verificar que as próximas faturas pertencem a 2026-11, 2026-12, etc.
    const allCardTxs = await transactionService.getByCard(card.id);
    const novTxs = allCardTxs.filter(t => t.invoiceMonthYear === '2026-11');
    const decTxs = allCardTxs.filter(t => t.invoiceMonthYear === '2026-12');
    expect(novTxs.length).toBe(1);
    expect(novTxs[0].amount).toBe(200);
    expect(decTxs.length).toBe(1);
    expect(decTxs[0].amount).toBe(200);
  });

  it('5. TESTE DE ORÇAMENTOS: Limites e Mudança de Estados (Normal, Atenção, Crítico, Excedido)', async () => {
    // 1. Criar orçamento de Alimentação com Limite R$ 1.000
    const bg = await budgetService.create({
      categoryId: 'alimentacao',
      monthYear: '2026-10',
      limitAmount: 1000
    });

    // 2. Despesas de R$ 300 + R$ 400 = R$ 700 (70% - Atenção)
    await transactionService.create({
      type: 'expense',
      amount: 300,
      description: 'Compra 1',
      date: '2026-10-02',
      categoryId: 'alimentacao'
    });
    await transactionService.create({
      type: 'expense',
      amount: 400,
      description: 'Compra 2',
      date: '2026-10-03',
      categoryId: 'alimentacao'
    });

    let txs = await transactionService.getAll();
    let reports = calculateBudgetUsage([bg], txs, categories, '2026-10');
    expect(reports[0].spent).toBe(700);
    expect(reports[0].percentage).toBe(70);
    expect(reports[0].status).toBe('warning'); // Atenção

    // 3. Adicionar mais R$ 200 = R$ 900 (90% - Crítico)
    await transactionService.create({
      type: 'expense',
      amount: 200,
      description: 'Compra 3',
      date: '2026-10-04',
      categoryId: 'alimentacao'
    });

    txs = await transactionService.getAll();
    reports = calculateBudgetUsage([bg], txs, categories, '2026-10');
    expect(reports[0].spent).toBe(900);
    expect(reports[0].percentage).toBe(90);
    expect(reports[0].status).toBe('critical'); // Crítico

    // 4. Adicionar mais R$ 150 = R$ 1.050 (105% - Excedido)
    await transactionService.create({
      type: 'expense',
      amount: 150,
      description: 'Compra 4',
      date: '2026-10-05',
      categoryId: 'alimentacao'
    });

    txs = await transactionService.getAll();
    reports = calculateBudgetUsage([bg], txs, categories, '2026-10');
    expect(reports[0].spent).toBe(1050);
    expect(reports[0].percentage).toBe(105);
    expect(reports[0].status).toBe('exceeded'); // Excedido
  });

  it('6. TESTE DE METAS: Criação, Depósito, Resgate, Edição e Exclusão', async () => {
    // Criar meta de R$ 5.000
    const goal = await goalService.create({
      name: 'Comprar PC',
      targetAmount: 5000,
      color: '#6366F1'
    });

    expect(goal.currentAmount).toBe(0);

    // Aporte de R$ 1.000
    await goalService.addDeposit(goal.id, 1000);
    let updated = await goalService.getById(goal.id);
    expect(updated?.currentAmount).toBe(1000);

    // Aporte de mais R$ 2.000 -> Total R$ 3.000 (60%)
    await goalService.addDeposit(goal.id, 2000);
    updated = await goalService.getById(goal.id);
    expect(updated?.currentAmount).toBe(3000);

    const progress = calculateGoalProgress(updated!);
    expect(progress.percentage).toBe(60);
    expect(progress.remaining).toBe(2000);

    // Resgate de R$ 500 -> Total R$ 2.500 (50%)
    await goalService.withdraw(goal.id, 500);
    updated = await goalService.getById(goal.id);
    expect(updated?.currentAmount).toBe(2500);

    // Edição da meta para R$ 6.000
    await goalService.update({
      ...updated!,
      targetAmount: 6000
    });
    updated = await goalService.getById(goal.id);
    expect(updated?.targetAmount).toBe(6000);

    // Exclusão da meta
    await goalService.delete(goal.id);
    const deleted = await goalService.getById(goal.id);
    expect(deleted).toBeUndefined();
  });

  it('8. TESTE DE COMPARAÇÃO MENSAL COM DIVISÃO POR ZERO TRATADA', () => {
    // Mês atual tem 500 de despesa, mês anterior tem 0 de despesa
    const txs = [
      {
        id: 'tx_cur',
        type: 'expense' as const,
        amount: 500,
        description: 'Mercado',
        date: '2026-10-01',
        categoryId: 'alimentacao',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01'
      }
    ];

    const comp = calculateMonthlyComparison(txs, categories, '2026-10');
    expect(comp.currentMonth.expenses).toBe(500);
    expect(comp.previousMonth.expenses).toBe(0);
    // Deve retornar 100% de aumento em vez de NaN ou crashar por divisão por zero
    expect(isNaN(comp.expenseVariationPercent)).toBe(false);
    expect(comp.expenseVariationPercent).toBe(100);
  });

  it('9. TESTE DE IMPORTAÇÃO CSV E DETECÇÃO DE DUPLICIDADE', async () => {
    const csvContent = `Data,Descrição,Valor,Tipo
2026-10-01,Supermercado Central,150.00,despesa
2026-10-02,Pagamento Salário,3500.00,receita
2026-10-03,Posto Combustível,80.50,despesa`;

    const { headers, rows } = await importService.parseCSV(csvContent);
    expect(headers).toContain('Data');
    expect(rows.length).toBe(3);

    const mapping = importService.guessMapping(headers);
    const previews = await importService.buildPreview(rows, mapping);
    expect(previews.length).toBe(3);

    // Primeira importação
    const imported = await importService.commitImport(previews);
    expect(imported).toBe(3);

    // Tentar importar o mesmo arquivo novamente
    const secondPreviews = await importService.buildPreview(rows, mapping);
    // Todas as 3 transações devem ser marcadas como possíveis duplicidades!
    const duplicates = secondPreviews.filter(p => p.isDuplicate);
    expect(duplicates.length).toBe(3);
  });
});
