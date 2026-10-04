import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  PieChart, 
  Tag, 
  Shield, 
  Clock, 
  Repeat,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { 
  formatCurrency, 
  formatPercentage, 
  calculateMonthlyComparison, 
  calculateFixedVsVariableExpenses, 
  calculateCostOfLiving, 
  getPreviousMonthYear, 
  getNextMonthYear,
  generateMonthlyClosingSnapshot 
} from '../calculations/financialCalculations';

export const MonthlyClosingPage: React.FC = () => {
  const { 
    transactions, 
    categories, 
    accounts, 
    investments, 
    recurringTransactions, 
    bills,
    selectedPeriod,
    setSelectedPeriod
  } = useFinance();

  const [activeMonthYear, setActiveMonthYear] = useState<string>(selectedPeriod);

  const [yearStr, monthStr] = activeMonthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => setActiveMonthYear(getPreviousMonthYear(activeMonthYear));
  const handleNextMonth = () => setActiveMonthYear(getNextMonthYear(activeMonthYear));

  // Generate closing data dynamically for the active month
  const closing = useMemo(() => {
    return generateMonthlyClosingSnapshot(
      activeMonthYear,
      transactions,
      categories,
      accounts,
      investments,
      recurringTransactions,
      bills
    );
  }, [activeMonthYear, transactions, categories, accounts, investments, recurringTransactions, bills]);

  const costOfLiving = useMemo(() => {
    return calculateCostOfLiving(transactions, recurringTransactions, bills);
  }, [transactions, recurringTransactions, bills]);

  const isPositiveResult = closing.netResult >= 0;

  return (
    <div className="space-y-5 animate-fade-in pb-24 px-1">
      {/* ── HEADER & MONTH SELECTOR ── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Fechamento Mensal</h1>
          <p className="label-xs text-[#8E95A3] mt-0.5">Resumo consolidado e histórico financeiro</p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 bg-[#14171D] border border-[#222733] rounded-2xl">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-[#1A1F29] text-[#8E95A3] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-white px-2">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-[#1A1F29] text-[#8E95A3] hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── HERO CLOSING CARD ── */}
      <div className="card p-5 sm:p-6 bg-gradient-to-br from-[#14171D] to-[#1A1F29] border-[#222733] relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="label-xs text-[#8E95A3]">Resultado de {monthNames[month - 1]}</span>
          <span className={`pill ${isPositiveResult ? 'pill-positive' : 'pill-negative'}`}>
            {isPositiveResult ? `+${closing.savingsRate.toFixed(1)}% economizado` : 'Déficit no mês'}
          </span>
        </div>

        <div className="flex items-baseline space-x-3 mb-4">
          <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isPositiveResult ? 'text-[#39D98A]' : 'text-[#FF5555]'}`}>
            {isPositiveResult ? '+' : ''}{formatCurrency(closing.netResult)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#222733]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#39D98A]/15 text-[#39D98A] flex items-center justify-center shrink-0">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <span className="label-xs text-[#8E95A3]">Receitas</span>
              <div className="text-sm font-bold text-white">+{formatCurrency(closing.totalIncome)}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF5555]/15 text-[#FF5555] flex items-center justify-center shrink-0">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <span className="label-xs text-[#8E95A3]">Despesas</span>
              <div className="text-sm font-bold text-white">-{formatCurrency(closing.totalExpenses)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INSIGHT SUMMARY BOX ── */}
      <div className="card p-4 flex items-start space-x-3.5 border-[#8B7CFF]/20 bg-[#8B7CFF]/5">
        <Sparkles size={20} className="text-[#8B7CFF] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-[#F5F5F5]">
          <strong className="text-white block font-semibold mb-0.5">Diagnóstico do Período:</strong>
          {closing.totalIncome === 0 && closing.totalExpenses === 0 ? (
            'Nenhuma movimentação financeira registrada para este mês.'
          ) : (
            `Você realizou ${closing.transactionCount} transação(ões). Suas despesas fixas somaram ${formatCurrency(closing.totalFixedExpenses)} e a maior concentração de gastos foi em ${closing.topCategoryName} (${formatCurrency(closing.topCategoryTotal)}).`
          )}
        </div>
      </div>

      {/* ── HIGHLIGHT METRICS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Maior Categoria */}
        <div className="card p-4">
          <div className="flex items-center space-x-2 text-[#8E95A3] mb-2">
            <PieChart size={15} />
            <span className="label-xs">Maior Categoria</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{closing.topCategoryName}</div>
          <span className="text-xs text-[#8E95A3] mt-0.5 block">{formatCurrency(closing.topCategoryTotal)}</span>
        </div>

        {/* Maior Despesa Individual */}
        <div className="card p-4">
          <div className="flex items-center space-x-2 text-[#8E95A3] mb-2">
            <Tag size={15} />
            <span className="label-xs">Maior Gasto Único</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{closing.biggestExpenseDescription}</div>
          <span className="text-xs text-[#8E95A3] mt-0.5 block">{formatCurrency(closing.biggestExpenseAmount)}</span>
        </div>

        {/* Custo Médio Estimado */}
        <div className="card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-2 text-[#8E95A3] mb-2">
            <Shield size={15} />
            <span className="label-xs">Custo Médio Mensal</span>
          </div>
          <div className="text-sm font-bold text-[#38BDF8]">{formatCurrency(costOfLiving.estimatedMonthlyCost)}</div>
          <span className="text-[10px] text-[#8E95A3] mt-0.5 block">Baseado em histórico & fixos</span>
        </div>
      </div>

      {/* ── FIXED VS VARIABLE BREAKDOWN ── */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Despesas Fixas vs. Variáveis</h3>
          <span className="label-xs text-[#8E95A3]">Composição do mês</span>
        </div>

        <div className="w-full h-3 rounded-full bg-[#1A1F29] overflow-hidden flex">
          <div 
            className="h-full bg-[#38BDF8] transition-all"
            style={{ width: `${closing.totalExpenses > 0 ? (closing.totalFixedExpenses / closing.totalExpenses) * 100 : 50}%` }}
          />
          <div 
            className="h-full bg-[#8B7CFF] transition-all"
            style={{ width: `${closing.totalExpenses > 0 ? (closing.totalVariableExpenses / closing.totalExpenses) * 100 : 50}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            <span className="text-[#8E95A3]">Fixas: <strong className="text-white">{formatCurrency(closing.totalFixedExpenses)}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B7CFF]" />
            <span className="text-[#8E95A3]">Variáveis: <strong className="text-white">{formatCurrency(closing.totalVariableExpenses)}</strong></span>
          </div>
        </div>
      </div>

      {/* ── COMPARISON VS PREVIOUS MONTH ── */}
      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">Comparação com Mês Anterior</h3>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#1A1F29] border border-[#262C3A]">
            <span className="label-xs text-[#8E95A3] block">Variação de Receitas</span>
            <div className="flex items-center space-x-1.5 mt-1">
              {closing.comparedToPreviousMonth.incomeVariationPercent >= 0 ? (
                <TrendingUp size={15} className="text-[#39D98A]" />
              ) : (
                <TrendingDown size={15} className="text-[#FF5555]" />
              )}
              <span className={`text-xs font-bold ${closing.comparedToPreviousMonth.incomeVariationPercent >= 0 ? 'text-[#39D98A]' : 'text-[#FF5555]'}`}>
                {formatPercentage(closing.comparedToPreviousMonth.incomeVariationPercent, true)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1A1F29] border border-[#262C3A]">
            <span className="label-xs text-[#8E95A3] block">Variação de Gastos</span>
            <div className="flex items-center space-x-1.5 mt-1">
              {closing.comparedToPreviousMonth.expenseVariationPercent <= 0 ? (
                <TrendingDown size={15} className="text-[#39D98A]" />
              ) : (
                <TrendingUp size={15} className="text-[#FF5555]" />
              )}
              <span className={`text-xs font-bold ${closing.comparedToPreviousMonth.expenseVariationPercent <= 0 ? 'text-[#39D98A]' : 'text-[#FF5555]'}`}>
                {formatPercentage(closing.comparedToPreviousMonth.expenseVariationPercent, true)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
