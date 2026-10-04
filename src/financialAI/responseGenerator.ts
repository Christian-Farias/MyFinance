import type { AIIntentType, AIResponse, VisualComponentData, AIActionPlan } from './types';
import { financialTools, FinancialState } from './tools/financialTools';
import { calculateAffordability, diagnoseFinancialHealth } from './calculators/financialAICalculators';
import { formatCurrency, formatPercentage } from '../calculations/financialCalculations';

export function generateResponse(
  intent: AIIntentType,
  query: string,
  state: FinancialState,
  actionPlan?: AIActionPlan,
  params?: any
): AIResponse {
  const currentYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // If there's an Action Plan generated (e.g. CREATE_EXPENSE, CREATE_TRANSFER, etc.)
  if (actionPlan) {
    return {
      text: `Entendi que você deseja: **${actionPlan.title}**.\n\n${actionPlan.summary}.\n\nConfirma o registro abaixo?`,
      intent,
      actionPlan,
      followUpSuggestions: ['Confirmar', 'Cancelar'],
    };
  }

  switch (intent) {
    case 'GET_BALANCE': {
      const balanceInfo = financialTools.getBalance(state);
      const accountsList = balanceInfo.accounts
        .map(a => `• **${a.name}**: ${a.formatted}`)
        .join('\n');

      return {
        text: `Seu saldo total disponível é **${balanceInfo.formattedBalance}**.\n\n${accountsList}`,
        intent,
        visual: {
          type: 'list',
          title: 'Saldos por Conta',
          items: balanceInfo.accounts.map(a => ({
            label: a.name,
            value: a.balance,
            formattedValue: a.formatted,
          })),
        },
        followUpSuggestions: ['Quanto gastei este mês?', 'Quanto tenho de fatura?', 'Posso gastar R$ 200?'],
      };
    }

    case 'GET_EXPENSES': {
      const targetMonthYear = params?.dateRange?.monthYear || currentYM;
      const expenses = financialTools.getExpenses(state, targetMonthYear);
      const topCategories = expenses.categoryBreakdown.slice(0, 3);
      
      const topList = topCategories
        .map(c => `• **${c.categoryName}**: ${formatCurrency(c.total)} (${c.percentage.toFixed(0)}%)`)
        .join('\n');

      return {
        text: `Você gastou **${expenses.formattedTotal}** no período de ${params?.dateRange?.label || 'Este Mês'}.\n\nPrincipais despesas:\n${topList}`,
        intent,
        visual: {
          type: 'category_ranking',
          title: 'Maiores Categorias de Gastos',
          items: expenses.categoryBreakdown.slice(0, 5).map(c => ({
            label: c.categoryName,
            value: c.total,
            formattedValue: formatCurrency(c.total),
            percentage: c.percentage,
            color: c.categoryColor,
          })),
        },
        followUpSuggestions: ['E no mês passado?', 'Quanto foi com alimentação?', 'Como estão meus orçamentos?'],
      };
    }

    case 'GET_CATEGORY_SPENDING': {
      const catQuery = params?.categoryQuery || 'Alimentação';
      const targetMonthYear = params?.dateRange?.monthYear || currentYM;
      const spending = financialTools.getCategorySpending(state, catQuery, targetMonthYear);

      return {
        text: `Você gastou **${spending.formattedTotal}** em **${spending.categoryName}** (${params?.dateRange?.label || 'este mês'}).`,
        intent,
        visual: {
          type: 'list',
          title: `Lançamentos em ${spending.categoryName}`,
          items: spending.transactions.slice(0, 5).map(t => ({
            label: t.description,
            value: t.amount,
            formattedValue: formatCurrency(t.amount),
          })),
        },
        followUpSuggestions: ['E no mês passado?', 'Quanto é meu orçamento?', 'Qual meu saldo atual?'],
      };
    }

    case 'GET_MONTHLY_COMPARISON': {
      const comp = financialTools.getMonthlyComparison(state, currentYM);
      const isExpenseLess = comp.expenseVariationPercent < 0;
      const diffAmount = Math.abs(comp.currentExpense - comp.previousExpense);

      const comparisonText = isExpenseLess
        ? `Você gastou **${formatCurrency(diffAmount)} a menos** que no mês passado (uma redução de ${Math.abs(comp.expenseVariationPercent).toFixed(1)}%).`
        : `Seus gastos subiram **${formatCurrency(diffAmount)}** em comparação ao mês passado (+${comp.expenseVariationPercent.toFixed(1)}%).`;

      return {
        text: `${comparisonText}\n\n• **Mês Atual (${comp.currentMonth.label})**: ${formatCurrency(comp.currentExpense)}\n• **Mês Anterior (${comp.previousMonth.label})**: ${formatCurrency(comp.previousExpense)}`,
        intent,
        visual: {
          type: 'comparison',
          title: 'Comparativo Mensal de Despesas',
          breakdown: [
            { label: `Mês Passado (${comp.previousMonth.label})`, amount: comp.previousExpense, formattedAmount: formatCurrency(comp.previousExpense) },
            { label: `Mês Atual (${comp.currentMonth.label})`, amount: comp.currentExpense, formattedAmount: formatCurrency(comp.currentExpense), isPositive: isExpenseLess },
          ]
        },
        followUpSuggestions: ['Qual categoria aumentou mais?', 'Quanto tenho de fatura?', 'Como estão minhas finanças?'],
      };
    }

    case 'GET_CARD_BILL': {
      const cardsInfo = financialTools.getCardBill(state);
      const cardsList = cardsInfo.cards
        .map(c => `• **${c.cardName}**: Fatura de ${c.formattedUsed} (Limite livre: ${c.formattedAvailable})`)
        .join('\n');

      return {
        text: `O total acumulado nas suas faturas de cartão é **${cardsInfo.formattedTotalInvoice}**.\n\n${cardsList}`,
        intent,
        visual: {
          type: 'list',
          title: 'Faturas de Cartão',
          items: cardsInfo.cards.map(c => ({
            label: c.cardName,
            value: c.usedLimit,
            formattedValue: c.formattedUsed,
          })),
        },
        followUpSuggestions: ['Quanto tenho de parcelas futuras?', 'Quais contas vencem essa semana?', 'Qual meu saldo?'],
      };
    }

    case 'GET_BILLS': {
      const bills = financialTools.getBills(state);
      if (bills.pending.length === 0) {
        return {
          text: 'Você não possui contas a pagar pendentes para os próximos dias.',
          intent,
        };
      }
      const list = bills.pending
        .slice(0, 5)
        .map(b => `• **${b.description}**: ${formatCurrency(b.amount)} (Vence ${b.dueDate})`)
        .join('\n');

      return {
        text: `Você possui **${bills.pending.length} conta(s)** pendente(s) somando **${bills.formattedTotalPending}**.\n\n${list}`,
        intent,
        visual: {
          type: 'list',
          title: 'Contas a Pagar',
          items: bills.pending.map(b => ({
            label: b.description,
            value: b.amount,
            formattedValue: formatCurrency(b.amount),
          })),
        },
        followUpSuggestions: ['Quanto vou ter no fim do mês?', 'Qual meu saldo?', 'Quais são minhas assinaturas?'],
      };
    }

    case 'GET_SUBSCRIPTIONS': {
      const subs = financialTools.getSubscriptions(state);
      return {
        text: `Você possui **${subs.activeCount} assinatura(s)** ativa(s).\n\n• **Gasto Mensal Estimado**: ${formatCurrency(subs.totalMonthlyEstimate)}\n• **Gasto Anual Projetado**: ${formatCurrency(subs.totalAnnualEstimate)}`,
        intent,
        visual: {
          type: 'math_breakdown',
          title: 'Resumo de Assinaturas',
          breakdown: [
            { label: 'Custo Mensal', amount: subs.totalMonthlyEstimate, formattedAmount: formatCurrency(subs.totalMonthlyEstimate) },
            { label: 'Projeção Anual (12 meses)', amount: subs.totalAnnualEstimate, formattedAmount: formatCurrency(subs.totalAnnualEstimate) },
          ]
        },
        followUpSuggestions: ['Quais contas vencem essa semana?', 'Quanto gastei este mês?'],
      };
    }

    case 'CAN_I_SPEND': {
      const checkAmount = params?.amount || 200;
      const result = calculateAffordability(checkAmount, state);
      return {
        text: `${result.advice}`,
        intent,
        explanation: `Cálculo realizado: Saldo Atual (${formatCurrency(result.currentBalance)}) - Compromissos Próximos (${formatCurrency(result.commitmentsNext7Days)}) - Valor Desejado (${formatCurrency(checkAmount)}).`,
        visual: {
          type: 'math_breakdown',
          title: `Análise para Gastar ${formatCurrency(checkAmount)}`,
          breakdown: [
            { label: 'Saldo Atual', amount: result.currentBalance, formattedAmount: formatCurrency(result.currentBalance) },
            { label: 'Compromissos 7 Dias', amount: -result.commitmentsNext7Days, formattedAmount: `-${formatCurrency(result.commitmentsNext7Days)}` },
            { label: 'Valor da Compra', amount: -checkAmount, formattedAmount: `-${formatCurrency(checkAmount)}` },
            { label: 'Saldo Livre Projetado', amount: result.projectedBalanceAfter, formattedAmount: formatCurrency(result.projectedBalanceAfter), isPositive: result.canAfford },
          ]
        },
        followUpSuggestions: ['Quanto vou ter no fim do mês?', 'Quais são meus orçamentos?'],
      };
    }

    case 'GET_FORECAST': {
      const forecast = financialTools.getForecast(state, 30);
      return {
        text: `Sua previsão de saldo ao fim de 30 dias é de **${formatCurrency(forecast.projectedEndBalance)}**.\n\n• **Saldo Inicial**: ${formatCurrency(forecast.initialBalance)}\n• **Entradas Previstas**: +${formatCurrency(forecast.totalInflows)}\n• **Saídas Previstas**: -${formatCurrency(forecast.totalOutflows)}`,
        intent,
        explanation: 'Estimativa baseada em saldos atuais, contas a pagar, recebíveis e recorrências ativas.',
        visual: {
          type: 'math_breakdown',
          title: 'Fluxo de Caixa Projetado (30 dias)',
          breakdown: [
            { label: 'Saldo Atual', amount: forecast.initialBalance, formattedAmount: formatCurrency(forecast.initialBalance) },
            { label: 'Entradas Previstas', amount: forecast.totalInflows, formattedAmount: `+${formatCurrency(forecast.totalInflows)}` },
            { label: 'Saídas Previstas', amount: -forecast.totalOutflows, formattedAmount: `-${formatCurrency(forecast.totalOutflows)}` },
            { label: 'Saldo Final Projetado', amount: forecast.projectedEndBalance, formattedAmount: formatCurrency(forecast.projectedEndBalance), isPositive: forecast.projectedEndBalance >= 0 },
          ]
        },
        followUpSuggestions: ['Quais contas vencem essa semana?', 'Posso gastar R$ 300?'],
      };
    }

    case 'GET_FINANCIAL_HEALTH': {
      const health = diagnoseFinancialHealth(state);
      const pointsText = health.pointsOfInterest.map(p => `• ${p}`).join('\n');
      return {
        text: `**Status: ${health.status.toUpperCase()}**\n\n${health.summary}\n\n${pointsText}`,
        intent,
        followUpSuggestions: ['Quanto gastei este mês?', 'Como estão meus orçamentos?', 'Quanto falta para minha meta?'],
      };
    }

    default: {
      return {
        text: 'Não consegui entender exatamente a sua dúvida. Você pode perguntar por exemplo:\n\n• "Quanto gastei este mês?"\n• "Qual é o meu saldo?"\n• "Quais contas vencem esta semana?"\n• "Posso gastar R$ 300 hoje?"\n• "Registre uma despesa de 50 reais no supermercado"',
        intent: 'UNKNOWN',
        needsClarification: true,
        followUpSuggestions: ['Quanto gastei este mês?', 'Qual meu saldo?', 'Quais contas vencem essa semana?', 'Posso gastar R$ 300?'],
      };
    }
  }
}
