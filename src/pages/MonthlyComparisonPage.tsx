import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { calculateMonthlyComparison, formatCurrency } from '../calculations/financialCalculations';
import { ErrorState, LoadingState } from '../components/ui';

export const MonthlyComparisonPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { transactions, categories, selectedPeriod } = useFinance();
  const [activeTab, setActiveTab] = useState<'expenses' | 'income' | 'balance'>('expenses');

  const comparison = calculateMonthlyComparison(transactions, categories, selectedPeriod);

  const chartData = [
    {
      month: comparison.previousMonth.label,
      valor:
        activeTab === 'expenses'
          ? comparison.previousMonth.expenses
          : activeTab === 'income'
            ? comparison.previousMonth.income
            : comparison.previousMonth.result,
    },
    {
      month: comparison.currentMonth.label,
      valor:
        activeTab === 'expenses'
          ? comparison.currentMonth.expenses
          : activeTab === 'income'
            ? comparison.currentMonth.income
            : comparison.currentMonth.result,
    },
  ];

  const variation =
    activeTab === 'expenses'
      ? comparison.expenseVariationPercent
      : comparison.incomeVariationPercent;

  const barColor = activeTab === 'expenses' ? 'var(--color-negative)' : activeTab === 'income' ? 'var(--color-positive)' : 'var(--color-accent)';

  /* Sem esta guarda a página desenhava o estado vazio antes de o IndexedDB
     responder — e uma falha de leitura ficava idêntica a "não há dados". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-ink tracking-tight">Comparação mensal</h1>
        <p className="label-xs mt-0.5">Acompanhe as diferenças de fluxo mês a mês.</p>
      </div>

      {/* ── TABS ── */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-surface border border-edge rounded-2xl">
        {[
          { key: 'expenses' as const, label: 'Despesas' },
          { key: 'income' as const, label: 'Receitas' },
          { key: 'balance' as const, label: 'Resultado' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === key
                ? 'bg-surface-raised text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── CHART ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label-section">Comparativo direto</p>
          <div
            className={`pill ${
              variation > 0
                ? activeTab === 'expenses'
                  ? 'pill-negative'
                  : 'pill-positive'
                : 'pill-positive'
            }`}
          >
            {variation > 0 ? '+' : ''}
            {variation.toFixed(1)}%
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="var(--color-ink-faint)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-ink-faint)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-on-accent)',
                  borderColor: 'var(--color-edge)',
                  borderRadius: '12px',
                  color: 'var(--color-ink)',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
              />
              <Bar dataKey="valor" fill={barColor} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CATEGORY VARIATIONS ── */}
      <div className="card p-5">
        <p className="label-section mb-4">Principais variações de categorias</p>

        {comparison.categoryComparisons.length === 0 ? (
          <p className="text-xs text-ink-faint py-4 text-center">Nenhuma variação registrada entre os períodos.</p>
        ) : (
          <div className="space-y-2 stagger">
            {comparison.categoryComparisons.slice(0, 6).map(cv => {
              const isIncrease = cv.difference > 0;
              return (
                <div
                  key={cv.categoryId}
                  className="animate-fade-in flex items-center justify-between text-xs p-3 rounded-xl hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${isIncrease ? 'bg-negative' : 'bg-positive'}`} />
                    <span className="font-semibold text-ink">{cv.categoryName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-ink-muted">{isIncrease ? '+' : ''}{formatCurrency(cv.difference)}</span>
                    <span
                      className={`pill ${isIncrease ? 'pill-negative' : 'pill-positive'} text-[10px]`}
                    >
                      {isIncrease ? '+' : ''}{cv.variationPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
