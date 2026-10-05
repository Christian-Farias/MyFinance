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
    case 'HELP_GREETING': {
      return {
        text: 'E aí! Sou o **Neguin**, seu assistente financeiro local e pessoal.\n\nAnaliso suas finanças com cálculos 100% determinísticos no seu dispositivo. Veja o que posso fazer:\n\n• **Consultas**: "Qual meu saldo?", "Quanto gastei este mês?", "Quanto foi com comida?"\n• **Comparações**: "Gastei mais que mês passado?", "Compara alimentação com transporte"\n• **Simulações**: "Posso gastar R$ 300 hoje?", "Quanto preciso guardar para a meta?"\n• **Obrigações**: "Quais contas vencem essa semana?", "Fatura do cartão", "Minhas assinaturas"\n• **Lançamentos**: "Gastei 50 no mercado", "Transfira 100 da conta corrente para carteira"',
        intent,
        followUpSuggestions: ['Qual é o meu saldo?', 'Quanto gastei este mês?', 'Posso gastar R$ 300?', 'Como estão minhas finanças?'],
      };
    }


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

    case 'GET_ACCOUNTS': {
      const balanceInfo = financialTools.getBalance(state);
      const accountsList = balanceInfo.accounts
        .map(a => `• **${a.name}**: ${a.formatted}`)
        .join('\n');

      return {
        text: `Você possui **${balanceInfo.accounts.length} conta(s)** cadastradas somando **${balanceInfo.formattedBalance}**:\n\n${accountsList}`,
        intent,
        visual: {
          type: 'list',
          title: 'Contas Cadastradas',
          items: balanceInfo.accounts.map(a => ({
            label: a.name,
            value: a.balance,
            formattedValue: a.formatted,
          })),
        },
        followUpSuggestions: ['Qual meu saldo total?', 'Faturas de cartão', 'Quanto gastei este mês?'],
      };
    }

    case 'GET_EXPENSES': {
      const targetMonthYear = params?.dateRange?.monthYear || currentYM;
      const expenses = financialTools.getExpenses(state, targetMonthYear);
      const topCategories = expenses.categoryBreakdown.slice(0, 3);
      
      const topList = topCategories.length > 0
        ? topCategories.map(c => `• **${c.categoryName}**: ${formatCurrency(c.total)} (${c.percentage.toFixed(0)}%)`).join('\n')
        : '• Nenhuma despesa registrada no período.';

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

    case 'GET_INCOME': {
      const targetMonthYear = params?.dateRange?.monthYear || currentYM;
      const income = financialTools.getIncome(state, targetMonthYear);

      return {
        text: `Suas receitas totalizam **${income.formattedTotal}** no período de ${params?.dateRange?.label || 'Este Mês'}.`,
        intent,
        followUpSuggestions: ['Quanto gastei este mês?', 'Qual meu saldo atual?', 'Como estão minhas finanças?'],
      };
    }

    case 'GET_TRANSACTIONS': {
      const txs = financialTools.getTransactions(state, {
        monthYear: params?.dateRange?.monthYear,
        categoryId: params?.categoryId,
        limit: 5,
      });

      if (txs.items.length === 0) {
        return {
          text: `Nenhuma movimentação recente encontrada para o período ${params?.dateRange?.label || 'selecionado'}.`,
          intent,
          followUpSuggestions: ['Qual meu saldo?', 'Quanto gastei este mês?'],
        };
      }

      const list = txs.items
        .map(t => `• **${t.description}**: ${t.type === 'income' ? '+' : '-'}${t.formattedAmount} (${t.categoryName})`)
        .join('\n');

      return {
        text: `Aqui estão as **últimas ${txs.items.length} movimentações**:\n\n${list}`,
        intent,
        visual: {
          type: 'list',
          title: 'Últimas Transações',
          items: txs.items.map(t => ({
            label: t.description,
            value: t.amount,
            formattedValue: `${t.type === 'income' ? '+' : '-'}${t.formattedAmount}`,
            subtitle: `${t.categoryName} • ${t.date}`,
          })),
        },
        followUpSuggestions: ['Quanto gastei este mês?', 'Qual meu saldo?'],
      };
    }

    case 'GET_CATEGORY_SPENDING': {
      const catQuery = params?.categoryQuery || 'Alimentação';
      const targetMonthYear = params?.dateRange?.monthYear || currentYM;
      const spending = financialTools.getCategorySpending(state, catQuery, targetMonthYear);

      const txList = spending.transactions.length > 0
        ? `\n\nÚltimos lançamentos:\n` + spending.transactions.slice(0, 3).map(t => `• ${t.description}: ${formatCurrency(t.amount)}`).join('\n')
        : '';

      return {
        text: `Você gastou **${spending.formattedTotal}** em **${spending.categoryName}** (${params?.dateRange?.label || 'este mês'}).${txList}`,
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
        followUpSuggestions: ['E no mês passado?', 'E transporte?', 'Quanto é meu orçamento para esta categoria?'],
      };
    }

    case 'GET_CATEGORY_COMPARISON': {
      const catA = params?.categoryQuery || params?.secondCategoryQuery || 'Alimentação';
      const catB = params?.secondCategoryQuery || params?.categoryQuery || 'Transporte';
      const targetMonthYear = params?.dateRange?.monthYear || currentYM;
      const comp = financialTools.getCategoryComparison(state, catA, catB, targetMonthYear);

      let textDesc = '';
      if (comp.isEqual) {
        textDesc = `Seus gastos em **${comp.categoryA.categoryName}** e **${comp.categoryB.categoryName}** foram iguais: **${comp.categoryA.formattedTotal}**.`;
      } else {
        textDesc = `Você gastou **${comp.higherCategoryName}** (**${comp.categoryA.categoryName === comp.higherCategoryName ? comp.categoryA.formattedTotal : comp.categoryB.formattedTotal}**), superando **${comp.lowerCategoryName}** (**${comp.categoryA.categoryName === comp.lowerCategoryName ? comp.categoryA.formattedTotal : comp.categoryB.formattedTotal}**) por uma diferença de **${comp.formattedDifference}** (+${comp.percentageHigher.toFixed(1)}%).`;
      }

      return {
        text: `${textDesc}\n\n• **${comp.categoryA.categoryName}**: ${comp.categoryA.formattedTotal}\n• **${comp.categoryB.categoryName}**: ${comp.categoryB.formattedTotal}`,
        intent,
        visual: {
          type: 'comparison',
          title: `Comparativo: ${comp.categoryA.categoryName} vs ${comp.categoryB.categoryName}`,
          breakdown: [
            { label: comp.categoryA.categoryName, amount: comp.categoryA.total, formattedAmount: comp.categoryA.formattedTotal },
            { label: comp.categoryB.categoryName, amount: comp.categoryB.total, formattedAmount: comp.categoryB.formattedTotal },
          ]
        },
        followUpSuggestions: ['Quanto gastei no total este mês?', 'Como estão meus orçamentos?'],
      };
    }

    case 'GET_MONTHLY_COMPARISON': {
      const comp = financialTools.getMonthlyComparison(state, currentYM);
      const isExpenseLess = comp.expenseVariationPercent < 0;
      const diffAmount = Math.abs(comp.currentExpense - comp.previousExpense);

      const comparisonText = isExpenseLess
        ? `Você gastou **${formatCurrency(diffAmount)} a menos** que no mês passado (uma redução de ${Math.abs(comp.expenseVariationPercent).toFixed(1)}%). 💪`
        : `Seus gastos subiram **${formatCurrency(diffAmount)}** em comparação ao mês passado (+${comp.expenseVariationPercent.toFixed(1)}%). Katrovou`;


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
      if (cardsInfo.cards.length === 0) {
        return {
          text: 'Você não possui cartões de crédito cadastrados no momento.',
          intent,
          followUpSuggestions: ['Qual é o meu saldo?', 'Quanto gastei este mês?'],
        };
      }

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
            subtitle: `Limite: ${formatCurrency(c.limit)}`,
          })),
        },
        followUpSuggestions: ['Quais contas vencem essa semana?', 'Quanto tenho de parcelas futuras?', 'Qual meu saldo?'],
      };
    }

    case 'GET_INSTALLMENTS': {
      const commitments = financialTools.getCommitments(state, 6);
      const totalFuture = commitments.totalFutureCommitments;
      const monthEntries = Object.entries(commitments.monthlyTotals);

      return {
        text: `Você possui compras e compromissos parcelados projetados somando **${formatCurrency(totalFuture)}** nos próximos 6 meses.`,
        intent,
        visual: {
          type: 'list',
          title: 'Compromissos dos Próximos Meses',
          items: monthEntries.map(([ym, total]) => ({
            label: ym,
            value: total,
            formattedValue: formatCurrency(total),
          })),
        },
        followUpSuggestions: ['Fatura do cartão', 'Quais contas vencem essa semana?'],
      };
    }


    case 'GET_BILLS': {
      const bills = financialTools.getBills(state);
      if (bills.pending.length === 0) {
        return {
          text: 'Você não possui contas a pagar pendentes para os próximos dias.',
          intent,
          followUpSuggestions: ['Qual meu saldo?', 'Quanto gastei este mês?'],
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
            subtitle: `Vencimento: ${b.dueDate}`,
          })),
        },
        followUpSuggestions: ['Quanto vou ter no fim do mês?', 'Qual meu saldo?', 'Quais são minhas assinaturas?'],
      };
    }

    case 'GET_RECEIVABLES': {
      const rec = financialTools.getReceivables(state);
      if (rec.expected.length === 0) {
        return {
          text: 'Você não possui contas a receber registradas no momento.',
          intent,
          followUpSuggestions: ['Qual meu saldo?', 'Quais contas vencem essa semana?'],
        };
      }

      const list = rec.expected
        .slice(0, 5)
        .map(r => `• **${r.description}**: ${formatCurrency(r.amount)} (Previsto para ${r.expectedDate})`)
        .join('\n');

      return {
        text: `Você possui **${rec.expected.length} recebimento(s)** previsto(s) somando **${rec.formattedTotalExpected}**.\n\n${list}`,
        intent,
        visual: {
          type: 'list',
          title: 'Contas a Receber',
          items: rec.expected.map(r => ({
            label: r.description,
            value: r.amount,
            formattedValue: formatCurrency(r.amount),
            subtitle: `Previsão: ${r.expectedDate}`,
          })),
        },
        followUpSuggestions: ['Previsão de saldo no fim do mês', 'Qual meu saldo atual?'],
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

    case 'GET_RECURRING': {
      const rec = financialTools.getRecurring(state);
      return {
        text: `Você possui **${rec.activeCount} despesa(s) recorrente(s)** ativas totalizando **${rec.formattedTotalMonthly}/mês** fixos.`,
        intent,
        visual: {
          type: 'list',
          title: 'Despesas Recorrentes',
          items: rec.items.map(r => ({
            label: r.description,
            value: r.amount,
            formattedValue: r.formattedAmount,
          })),
        },
        followUpSuggestions: ['Quais contas vencem essa semana?', 'Minhas assinaturas', 'Qual meu saldo?'],
      };
    }

    case 'CAN_I_SPEND': {
      const checkAmount = params?.amount || 200;
      const result = calculateAffordability(checkAmount, state);
      const canSpendSuffix = result.canAfford ? '' : ' Katrovou';
      return {
        text: `${result.advice}${canSpendSuffix}`,
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
      const forecastBad = forecast.projectedEndBalance < 0;
      const forecastSuffix = forecastBad ? ' Katrovou' : '';
      return {
        text: `Sua previsão de saldo ao fim de 30 dias é de **${formatCurrency(forecast.projectedEndBalance)}**.${forecastSuffix}\n\n• **Saldo Inicial**: ${formatCurrency(forecast.initialBalance)}\n• **Entradas Previstas**: +${formatCurrency(forecast.totalInflows)}\n• **Saídas Previstas**: -${formatCurrency(forecast.totalOutflows)}`,
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

    case 'GET_BUDGET': {
      const budgets = financialTools.getBudgets(state, currentYM);
      if (budgets.length === 0) {
        return {
          text: 'Você ainda não definiu limites de orçamento para as suas categorias este mês.',
          intent,
          followUpSuggestions: ['Definir orçamento de 1000 para alimentação', 'Quanto gastei este mês?'],
        };
      }

      const hasExceeded = budgets.some(b => b.isExceeded);
      const budgetSuffix = hasExceeded ? '\n\nKatrovou' : '';


      const list = budgets
        .map(b => `• **${b.categoryName}**: ${formatCurrency(b.spent)} de ${formatCurrency(b.budget.limitAmount)} (${b.percentage.toFixed(0)}%)${b.isExceeded ? ' ⚠️ ESTOURADO' : ''}`)
        .join('\n');

      return {
        text: `Seus orçamentos deste mês:\n\n${list}${budgetSuffix}`,
        intent,
        visual: {
          type: 'category_ranking',
          title: 'Orçamentos por Categoria',
          items: budgets.map(b => ({
            label: b.categoryName,
            value: b.spent,
            formattedValue: `${formatCurrency(b.spent)} / ${formatCurrency(b.budget.limitAmount)}`,
            percentage: Math.min(100, b.percentage),
            color: b.isExceeded ? '#FF6B6B' : b.isWarning ? '#FFB800' : '#17B36F',
          })),
        },
        followUpSuggestions: ['Quanto gastei este mês?', 'Qual meu saldo?'],
      };
    }

    case 'GET_GOAL': {
      const goals = financialTools.getGoals(state);
      if (goals.length === 0) {
        return {
          text: 'Você não possui metas cadastradas. Que tal criar uma? Exemplo: "Quero juntar 5 mil para viagem".',
          intent,
          followUpSuggestions: ['Criar meta de 5000 para reserva', 'Qual meu saldo?'],
        };
      }

      const list = goals
        .map(g => `• **${g.goal.name}**: ${formatCurrency(g.goal.currentAmount)} de ${formatCurrency(g.goal.targetAmount)} (${g.progress.percentage.toFixed(0)}%) - Falta ${formatCurrency(g.progress.remaining)}`)
        .join('\n');


      const primary = goals[0];
      return {
        text: `Suas metas financeiras:\n\n${list}`,
        intent,
        visual: {
          type: 'progress_bar',
          title: primary.goal.name,
          progress: {
            current: primary.goal.currentAmount,
            target: primary.goal.targetAmount,
            percentage: primary.progress.percentage,
            formattedCurrent: formatCurrency(primary.goal.currentAmount),
            formattedTarget: formatCurrency(primary.goal.targetAmount),
            label: primary.goal.name,
          }
        },
        followUpSuggestions: ['Simule quanto preciso guardar por mês', 'Qual meu saldo?'],
      };
    }

    case 'SIMULATE_GOAL': {
      const sim = financialTools.simulateGoalSavings(state, params?.goalId || params?.description, 6);
      if (!sim.hasGoal) {
        return {
          text: 'Você ainda não possui metas criadas para simulação. Digite por exemplo: "Criar meta de viagem 5000 reais".',
          intent,
          followUpSuggestions: ['Criar meta de 5000 para viagem', 'Qual meu saldo?'],
        };
      }

      return {
        text: `Para atingir a meta **${sim.goalName}** (${sim.formattedTarget}) em **${sim.months} meses**, você precisa guardar:\n\n**${sim.formattedNeededMonthly} por mês**\n\n• Já acumulado: ${sim.formattedCurrent}\n• Restante: ${sim.formattedRemaining}`,
        intent,
        visual: {
          type: 'progress_bar',
          title: `Simulação: ${sim.goalName}`,
          progress: {
            current: sim.currentAmount || 0,
            target: sim.targetAmount || 1,
            percentage: ((sim.currentAmount || 0) / (sim.targetAmount || 1)) * 100,
            formattedCurrent: sim.formattedCurrent || 'R$ 0',
            formattedTarget: sim.formattedTarget || 'R$ 0',
            label: sim.goalName,
          }
        },
        followUpSuggestions: ['Posso gastar R$ 200?', 'Como estão minhas finanças?'],
      };
    }

    case 'GET_INVESTMENTS': {
      const inv = financialTools.getInvestments(state);
      if (inv.count === 0) {
        return {
          text: 'Você ainda não possui investimentos cadastrados no MyFinance.',
          intent,
          followUpSuggestions: ['Qual meu saldo?', 'Quanto gastei este mês?'],
        };
      }

      const rentabilitySuffix = inv.isPositive
        ? `Lucro de **+${inv.formattedProfitLoss}** (+${inv.profitLossPercent.toFixed(1)}%) 💪`
        : `Prejuízo de **${inv.formattedProfitLoss}** (${inv.profitLossPercent.toFixed(1)}%) Katrovou`;

      return {
        text: `Seu patrimônio em investimentos é de **${inv.formattedTotalInvested}**.\n\n• **Valor Aplicado**: ${inv.formattedTotalCost}\n• **Rentabilidade Acumulada**: ${rentabilitySuffix}`,
        intent,
        visual: {
          type: 'category_ranking',
          title: 'Investimentos por Tipo',
          items: inv.typeBreakdown.map(t => ({
            label: t.type.toUpperCase(),
            value: t.value,
            formattedValue: t.formattedValue,
            percentage: t.percentage,
          })),
        },
        followUpSuggestions: ['Qual meu saldo em contas?', 'Quanto gastei este mês?'],
      };
    }

    case 'GET_FINANCIAL_HEALTH': {
      const health = diagnoseFinancialHealth(state);
      const pointsText = health.pointsOfInterest.map(p => `• ${p}`).join('\n');
      const isHealthBad = health.status === 'crítico' || health.status === 'atenção';
      const healthSuffix = isHealthBad ? '\n\nKatrovou' : '';
      return {
        text: `**Status: ${health.status.toUpperCase()}**\n\n${health.summary}\n\n${pointsText}${healthSuffix}`,
        intent,
        followUpSuggestions: ['Quanto gastei este mês?', 'Como estão meus orçamentos?', 'Quanto falta para minha meta?'],
      };
    }


    default: {
      return {
        text: 'Não consegui entender com certeza o que você deseja. Experimente perguntar:\n\n• "Quanto gastei este mês?"\n• "Qual é o meu saldo?"\n• "Quais contas vencem esta semana?"\n• "Posso gastar R$ 300 hoje?"\n• "Registre uma despesa de 50 reais no supermercado"',
        intent: 'UNKNOWN',
        needsClarification: true,
        followUpSuggestions: ['Quanto gastei este mês?', 'Qual meu saldo?', 'Quais contas vencem essa semana?', 'Posso gastar R$ 300?'],
      };
    }
  }
}

