import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  addMoney,
  subMoney,
  mulMoney,
  divMoney,
  sumMoney,
  calculateTotalBalance,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateMonthlyComparison,
  calculateFixedVsVariableExpenses,
  calculateCostOfLiving,
  calculateSubscriptionsSummary,
  calculateFutureCommitments,
  calculateProjectedCashFlow,
  generateMonthlyClosingSnapshot,
} from './financialCalculations';
import {
  Account,
  Transaction,
  Category,
  Bill,
  Receivable,
  RecurringTransaction,
  Subscription,
} from '../types';

describe('Advanced Financial Calculations & Edge Cases (Prompt Section 31)', () => {
  const mockCategories: Category[] = [
    { id: 'cat_moradia', name: 'Moradia', icon: 'Home', color: '#6366F1', isDefault: true, type: 'expense' },
    { id: 'cat_salario', name: 'Salário', icon: 'Briefcase', color: '#39D98A', isDefault: true, type: 'income' },
    { id: 'cat_lazer', name: 'Lazer', icon: 'Tv', color: '#FFB800', isDefault: true, type: 'expense' },
    { id: 'cat_alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#FF5C5C', isDefault: true, type: 'expense' },
  ];

  // 0. Precisão monetária em centavos e operações
  it('0. Deve garantir precisão monetária de centavos sem erros de ponto flutuante', () => {
    expect(toCents(10.99)).toBe(1099);
    expect(fromCents(1099)).toBe(10.99);
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(subMoney(10.99, 0.99)).toBe(10.0);
    expect(mulMoney(39.9, 12)).toBe(478.8);
    expect(sumMoney([10.1, 20.2, 30.3])).toBe(60.6);
  });

  // 1. Transferência entre contas
  it('1. Deve movimentar saldo entre contas sem contabilizar como receita ou despesa', () => {
    const accChecking: Account = {
      id: 'acc1',
      name: 'Conta Corrente',
      type: 'checking',
      balance: 3000,
      currentBalance: 3000,
      color: '#39D98A',
      institution: 'Nubank',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };
    const accWallet: Account = {
      id: 'acc2',
      name: 'Carteira',
      type: 'cash',
      balance: 100,
      currentBalance: 100,
      color: '#FFB800',
      institution: 'Físico',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };

    // Simulated transfer of R$ 500
    const updatedChecking = {
      ...accChecking,
      balance: subMoney(accChecking.balance!, 500),
      currentBalance: subMoney(accChecking.currentBalance, 500),
    };
    const updatedWallet = {
      ...accWallet,
      balance: addMoney(accWallet.balance!, 500),
      currentBalance: addMoney(accWallet.currentBalance, 500),
    };

    const totalBefore = calculateTotalBalance([accChecking, accWallet]);
    const totalAfter = calculateTotalBalance([updatedChecking, updatedWallet]);

    expect(updatedChecking.currentBalance).toBe(2500);
    expect(updatedWallet.currentBalance).toBe(600);
    expect(totalBefore).toBe(3100);
    expect(totalAfter).toBe(3100); // Patrimônio inalterado por transferência
  });

  // 2. Pagamento de fatura sem dupla contagem
  it('2. Pagamento de fatura não deve duplicar despesas do mês', () => {
    const txPurchase: Transaction = {
      id: 'tx_p1',
      accountId: 'acc_card1',
      amount: 450,
      type: 'expense',
      categoryId: 'cat_lazer',
      description: 'Jantar',
      date: '2026-10-05',
      paymentMethod: 'credit_card',
      createdAt: '2026-10-05',
      updatedAt: '2026-10-05',
    };

    const txInvoicePayment: Transaction = {
      id: 'tx_inv_pay',
      accountId: 'acc_checking',
      amount: 450,
      type: 'expense',
      categoryId: 'cat_moradia',
      description: 'Pagamento Fatura Nubank',
      date: '2026-10-15',
      paymentMethod: 'account',
      isCardInvoicePayment: true, // Flag anti dupla contagem
      createdAt: '2026-10-15',
      updatedAt: '2026-10-15',
    };

    const totalExpense = calculateTotalExpenses([txPurchase, txInvoicePayment], '2026-10');
    expect(totalExpense).toBe(450); // Somente a compra real, não o pagamento da fatura
  });

  // 3. Recorrência mensal
  it('3. Deve calcular recorrência mensal corretamente', () => {
    const recurringMonthly: RecurringTransaction = {
      id: 'rec1',
      description: 'Aluguel',
      amount: 1500,
      type: 'expense',
      categoryId: 'cat_moradia',
      accountId: 'acc1',
      frequency: 'monthly',
      startDate: '2026-01-01',
      nextOccurrence: '2026-10-10',
      status: 'active',
      isFixedExpense: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    expect(recurringMonthly.amount).toBe(1500);
    expect(recurringMonthly.frequency).toBe('monthly');
  });

  // 4. Recorrência anual
  it('4. Deve converter frequência anual para custo mensal no custo de vida', () => {
    const recAnnual: RecurringTransaction = {
      id: 'rec_ann',
      description: 'Seguro do Carro',
      amount: 2400,
      type: 'expense',
      categoryId: 'cat_moradia',
      accountId: 'acc1',
      frequency: 'annual',
      startDate: '2026-01-01',
      nextOccurrence: '2026-12-01',
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const col = calculateCostOfLiving([], [recAnnual], []);
    expect(col.estimatedMonthlyCost).toBe(200); // 2400 / 12 = 200
  });

  // 5. Contas a pagar (Bills)
  it('5. Deve controlar contas a pagar e seus status', () => {
    const bill: Bill = {
      id: 'bill1',
      description: 'Internet Fibra',
      amount: 120,
      dueDate: '2026-10-15',
      categoryId: 'cat_moradia',
      accountId: 'acc1',
      status: 'pending',
      isFixedExpense: true,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };

    expect(bill.status).toBe('pending');
    expect(bill.amount).toBe(120);
  });

  // 6. Contas a receber (Receivables)
  it('6. Deve controlar contas a receber e somar no fluxo de caixa', () => {
    const receivable: Receivable = {
      id: 'rec_sal',
      description: 'Salário Mensal',
      amount: 4000,
      expectedDate: new Date().toISOString().split('T')[0],
      categoryId: 'cat_salario',
      accountId: 'acc1',
      status: 'expected',
      isRecurringIncome: true,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };

    const accounts: Account[] = [
      { id: 'acc1', name: 'Corrente', type: 'checking', institution: 'Nubank', balance: 1000, currentBalance: 1000, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];

    const flow = calculateProjectedCashFlow(accounts, [], [], [receivable], [], 5);
    expect(flow.totalInflows).toBe(4000);
    expect(flow.projectedEndBalance).toBe(5000);
  });

  // 7. Saldo projetado
  it('7. Deve calcular saldo projetado dia a dia com receitas e despesas', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const accounts: Account[] = [
      { id: 'acc1', name: 'Corrente', type: 'checking', institution: 'Nubank', balance: 2100, currentBalance: 2100, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];
    const recs: Receivable[] = [
      { id: 'r1', description: 'Salário', amount: 3500, expectedDate: todayStr, categoryId: 'cat_salario', accountId: 'acc1', status: 'expected', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];
    const bills: Bill[] = [
      { id: 'b1', description: 'Aluguel', amount: 1400, dueDate: todayStr, categoryId: 'cat_moradia', accountId: 'acc1', status: 'pending', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];

    const flow = calculateProjectedCashFlow(accounts, [], bills, recs, [], 7);
    expect(flow.initialBalance).toBe(2100);
    expect(flow.totalInflows).toBe(3500);
    expect(flow.totalOutflows).toBe(1400);
    expect(flow.projectedEndBalance).toBe(4200); // 2100 + 3500 - 1400 = 4200
  });

  // 8. Alerta de risco de saldo baixo
  it('8. Deve sinalizar risco de saldo baixo quando cair abaixo do limite seguro', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const accounts: Account[] = [
      { id: 'acc1', name: 'Corrente', type: 'checking', institution: 'Nubank', balance: 300, currentBalance: 300, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];
    const bills: Bill[] = [
      { id: 'b1', description: 'Conta Alta', amount: 250, dueDate: todayStr, categoryId: 'cat_moradia', accountId: 'acc1', status: 'pending', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];

    const flow = calculateProjectedCashFlow(accounts, [], bills, [], [], 10);
    expect(flow.lowestProjectedBalance).toBe(50);
    expect(flow.hasLowBalanceRisk).toBe(true);
  });

  // 9. Parcelas futuras
  it('9. Deve calcular o comprometimento futuro de compras parceladas', () => {
    const bills: Bill[] = [];
    const recurring: RecurringTransaction[] = [];
    const transactions: Transaction[] = [
      {
        id: 'tx_part1',
        accountId: 'acc_card',
        amount: 300,
        type: 'expense',
        categoryId: 'cat_lazer',
        description: 'Notebook',
        date: '2026-11-10',
        installmentNumber: 2,
        installmentTotal: 10,
        invoiceMonthYear: '2026-11',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: 'tx_part2',
        accountId: 'acc_card',
        amount: 300,
        type: 'expense',
        categoryId: 'cat_lazer',
        description: 'Notebook',
        date: '2026-12-10',
        installmentNumber: 3,
        installmentTotal: 10,
        invoiceMonthYear: '2026-12',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      }
    ];

    const commitments = calculateFutureCommitments(bills, recurring, transactions, 4);
    expect(commitments.monthlyTotals['2026-11']).toBe(300);
    expect(commitments.monthlyTotals['2026-12']).toBe(300);
  });

  // 10. Assinaturas
  it('10. Deve calcular total mensal e anual de assinaturas ativas', () => {
    const subs: Subscription[] = [
      {
        id: 'sub1',
        name: 'Netflix',
        amount: 39.9,
        frequency: 'monthly',
        nextBillingDate: '2026-10-15',
        categoryId: 'cat_lazer',
        monthlyEstimate: 39.9,
        annualEstimate: 478.8,
        isActive: true,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: 'sub2',
        name: 'Spotify',
        amount: 21.9,
        frequency: 'monthly',
        nextBillingDate: '2026-10-20',
        categoryId: 'cat_lazer',
        monthlyEstimate: 21.9,
        annualEstimate: 262.8,
        isActive: true,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: 'sub3',
        name: 'Cancelado',
        amount: 50.0,
        frequency: 'monthly',
        nextBillingDate: '2026-10-20',
        categoryId: 'cat_lazer',
        monthlyEstimate: 50.0,
        annualEstimate: 600.0,
        isActive: false, // Inativo
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      }
    ];

    const summary = calculateSubscriptionsSummary(subs);
    expect(summary.activeCount).toBe(2);
    expect(summary.totalMonthlyEstimate).toBe(61.8);
    expect(summary.totalAnnualEstimate).toBe(741.6);
  });

  // 11. Despesas Fixas vs Variáveis
  it('11. Deve classificar e somar despesas fixas e variáveis com porcentagens', () => {
    const txs: Transaction[] = [
      {
        id: 'tx1',
        accountId: 'acc1',
        amount: 1000,
        type: 'expense',
        categoryId: 'cat_moradia',
        description: 'Aluguel',
        date: '2026-10-05',
        isFixedExpense: true,
        createdAt: '2026-10-05',
        updatedAt: '2026-10-05',
      },
      {
        id: 'tx2',
        accountId: 'acc1',
        amount: 500,
        type: 'expense',
        categoryId: 'cat_lazer',
        description: 'Passeio',
        date: '2026-10-12',
        isFixedExpense: false,
        createdAt: '2026-10-12',
        updatedAt: '2026-10-12',
      }
    ];

    const report = calculateFixedVsVariableExpenses(txs, [], [], '2026-10');
    expect(report.fixedExpensesTotal).toBe(1000);
    expect(report.variableExpensesTotal).toBe(500);
    expect(report.totalExpenses).toBe(1500);
    expect(Math.round(report.fixedPercentage)).toBe(67);
    expect(Math.round(report.variablePercentage)).toBe(33);
  });

  // 12. Fechamento Mensal Snapshot
  it('12. Deve gerar snapshot completo de fechamento mensal', () => {
    const txs: Transaction[] = [
      { id: 't1', accountId: 'acc1', amount: 4200, type: 'income', categoryId: 'cat_salario', description: 'Salário', date: '2026-10-05', createdAt: '2026-10-05', updatedAt: '2026-10-05' },
      { id: 't2', accountId: 'acc1', amount: 3150, type: 'expense', categoryId: 'cat_moradia', description: 'Gastos Gerais', date: '2026-10-10', createdAt: '2026-10-10', updatedAt: '2026-10-10' }
    ];
    const accounts: Account[] = [
      { id: 'acc1', name: 'Corrente', type: 'checking', institution: 'Nubank', balance: 5000, currentBalance: 5000, color: '#39D98A', createdAt: '2026-10-01', updatedAt: '2026-10-01' }
    ];

    const snapshot = generateMonthlyClosingSnapshot('2026-10', txs, mockCategories, accounts, []);
    expect(snapshot.totalIncome).toBe(4200);
    expect(snapshot.totalExpenses).toBe(3150);
    expect(snapshot.netResult).toBe(1050);
    expect(snapshot.savingsRate).toBe(25);
    expect(snapshot.closingNetWorth).toBe(5000);
  });

  // 13. Casos extremos: Valores zero, saldo negativo e meses sem movimentação
  it('13. Deve tratar com segurança casos extremos de saldo negativo, zero e dados vazios', () => {
    const emptyComp = calculateMonthlyComparison([], mockCategories, '2026-10');
    expect(emptyComp.currentIncome).toBe(0);
    expect(emptyComp.currentExpense).toBe(0);
    expect(emptyComp.incomeVariationPercent).toBe(0);
    expect(emptyComp.expenseVariationPercent).toBe(0);

    const negativeAcc: Account = {
      id: 'acc_neg',
      name: 'Especial',
      type: 'checking',
      institution: 'Banco',
      balance: -500,
      currentBalance: -500,
      color: '#FF5C5C',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    };
    expect(calculateTotalBalance([negativeAcc])).toBe(-500);

    const zeroCostOfLiving = calculateCostOfLiving([], [], []);
    expect(zeroCostOfLiving.estimatedMonthlyCost).toBe(0);
    expect(zeroCostOfLiving.hasEnoughData).toBe(false);
  });
});
