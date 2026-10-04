import { financialTools, FinancialState } from '../tools/financialTools';
import { formatCurrency } from '../../calculations/financialCalculations';

export function calculateAffordability(
  amount: number,
  state: FinancialState
): {
  canAfford: boolean;
  currentBalance: number;
  commitmentsNext7Days: number;
  projectedBalanceAfter: number;
  advice: string;
} {
  const balanceInfo = financialTools.getBalance(state);
  const currentBalance = balanceInfo.totalBalance;
  
  // Sum pending bills due in next 7 days
  const now = new Date();
  const next7DaysStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const billsNext7 = state.bills
    .filter(b => (b.status === 'pending' || b.status === 'overdue') && b.dueDate <= next7DaysStr)
    .reduce((sum, b) => sum + b.amount, 0);

  const availableFree = currentBalance - billsNext7;
  const projectedBalanceAfter = currentBalance - amount;
  const canAfford = availableFree >= amount;

  let advice = '';
  if (canAfford) {
    advice = `Você possui ${formatCurrency(currentBalance)} em conta e ${formatCurrency(billsNext7)} em compromissos nos próximos 7 dias. Gastar ${formatCurrency(amount)} mantém um saldo seguro de ${formatCurrency(availableFree - amount)}.`;
  } else if (currentBalance >= amount) {
    advice = `Você possui ${formatCurrency(currentBalance)} disponíveis, mas tem ${formatCurrency(billsNext7)} em compromissos nos próximos 7 dias. Gastar ${formatCurrency(amount)} deixaria uma margem muito apertada (${formatCurrency(availableFree - amount)}).`;
  } else {
    advice = `Seu saldo atual de ${formatCurrency(currentBalance)} é menor do que ${formatCurrency(amount)}. Gastar esse valor deixaria sua conta negativa em ${formatCurrency(Math.abs(currentBalance - amount))}.`;
  }

  return {
    canAfford,
    currentBalance,
    commitmentsNext7Days: billsNext7,
    projectedBalanceAfter,
    advice,
  };
}

export function diagnoseFinancialHealth(state: FinancialState): {
  status: 'excelente' | 'estável' | 'atenção' | 'crítico';
  summary: string;
  pointsOfInterest: string[];
  suggestedAction?: string;
} {
  const balance = financialTools.getBalance(state).totalBalance;
  const currentYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const expenses = financialTools.getExpenses(state, currentYM);
  const income = financialTools.getIncome(state, currentYM);
  const forecast = financialTools.getForecast(state, 30);
  const budgets = financialTools.getBudgets(state, currentYM);

  const points: string[] = [];

  const incomeVal = income.total;
  const expenseVal = expenses.total;
  const result = incomeVal - expenseVal;

  if (incomeVal > 0 && expenseVal > 0) {
    const expenseRatio = (expenseVal / incomeVal) * 100;
    points.push(`Você comprometeu ${expenseRatio.toFixed(0)}% da sua renda este mês (${formatCurrency(expenseVal)} de ${formatCurrency(incomeVal)}).`);
  }

  const exceededBudgets = budgets.filter(b => b.isExceeded || b.isCritical);
  if (exceededBudgets.length > 0) {
    points.push(`${exceededBudgets.length} categoria(s) em atenção/limite do orçamento (${exceededBudgets.map(b => b.categoryName).join(', ')}).`);
  }

  if (forecast.hasLowBalanceRisk) {
    points.push(`Risco de saldo baixo projetado nos próximos 30 dias (${formatCurrency(forecast.lowestProjectedBalance)}).`);
  }

  let status: 'excelente' | 'estável' | 'atenção' | 'crítico' = 'estável';
  let summary = 'Suas finanças estão relativamente estáveis.';

  if (forecast.hasLowBalanceRisk || (incomeVal > 0 && expenseVal > incomeVal)) {
    status = 'atenção';
    summary = 'Suas finanças requerem atenção neste mês.';
  } else if (result > 0 && exceededBudgets.length === 0) {
    status = 'excelente';
    summary = 'Suas finanças estão em ótimo estado, com resultado positivo e orçamentos sob controle.';
  }

  return {
    status,
    summary,
    pointsOfInterest: points,
    suggestedAction: exceededBudgets.length > 0 ? 'Verificar orçamentos das categorias em alta' : 'Continuar acompanhando o fluxo de caixa',
  };
}
