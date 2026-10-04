import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import {
  formatCurrency,
  calculateTotalExpenses,
  calculateCategoryBreakdown,
  calculateMonthlyComparison,
} from '../calculations/financialCalculations';
import { ErrorState, LoadingState } from '../components/ui';

type CategoryWithBreakdown = ReturnType<typeof calculateCategoryBreakdown>[number];

/* ─── Category Detail Drawer ─── */
const CategoryDetailDrawer: React.FC<{
  cat: CategoryWithBreakdown | null;
  allTransactions: ReturnType<typeof useFinance>['transactions'];
  selectedPeriod: string;
  onClose: () => void;
}> = ({ cat, allTransactions, selectedPeriod, onClose }) => {
  if (!cat) return null;

  const catTxs = allTransactions.filter(
    tx => tx.categoryId === cat.categoryId && tx.type === 'expense' && tx.date?.startsWith(selectedPeriod),
  );

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet-panel p-5 safe-bottom">
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full bg-edge mx-auto mb-5" />

        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: `color-mix(in oklab, ${cat.categoryColor} 12%, transparent)`,
            }}
          >
            <span className="text-lg">{cat.categoryIcon || '📦'}</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">{cat.categoryName}</h3>
            <p className="label-xs">{cat.percentage.toFixed(0)}% do total gasto</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-ink">{formatCurrency(cat.total)}</p>
          </div>
        </div>

        <div className="progress-track-thick mb-5">
          <div
            className="progress-fill"
            style={{ width: `${cat.percentage}%`, backgroundColor: cat.categoryColor }}
          />
        </div>

        <p className="label-section mb-3">Transações do mês</p>
        {catTxs.length === 0 ? (
          <p className="text-xs text-ink-faint py-4 text-center">Nenhuma transação encontrada.</p>
        ) : (
          <div className="space-y-0 max-h-72 overflow-y-auto">
            {catTxs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-edge last:border-b-0">
                <div>
                  <p className="text-xs font-semibold text-ink">{tx.description}</p>
                  <p className="label-xs mt-0.5">{tx.date?.substring(0, 10)}</p>
                </div>
                <span className="text-xs font-bold text-negative">−{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export const ExpensesPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const navigate = useNavigate();
  const { transactions, categories, selectedPeriod, setSelectedPeriod } = useFinance();
  const [selectedCat, setSelectedCat] = useState<CategoryWithBreakdown | null>(null);

  const totalExpense = calculateTotalExpenses(transactions, selectedPeriod);

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, selectedPeriod),
    [transactions, categories, selectedPeriod],
  );

  const comparison = useMemo(
    () => calculateMonthlyComparison(transactions, categories, selectedPeriod),
    [transactions, categories, selectedPeriod],
  );

  const handlePrevMonth = () => {
    let year = new Date().getFullYear(), month = new Date().getMonth() + 1;
    if (selectedPeriod?.includes('-')) {
      [year, month] = selectedPeriod.split('-').map(Number);
    }
    const d = new Date(year, month - 2, 1);
    setSelectedPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let year = new Date().getFullYear(), month = new Date().getMonth() + 1;
    if (selectedPeriod?.includes('-')) {
      [year, month] = selectedPeriod.split('-').map(Number);
    }
    const d = new Date(year, month, 1);
    setSelectedPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const variationPct = comparison.expenseVariationPercent;
  const isDown = variationPct <= 0;

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
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-ink tracking-tight">Seus gastos</h1>
        <div className="flex items-center space-x-1 bg-surface border border-edge rounded-2xl px-3 py-2">
          <button onClick={handlePrevMonth} className="p-0.5 text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-ink px-1">
            {comparison.currentMonth.label}
          </span>
          <button onClick={handleNextMonth} className="p-0.5 text-ink-muted hover:text-ink transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── TOTAL + VARIATION ── */}
      <div className="card p-5">
        <p className="label-xs mb-2">Total gasto no mês</p>
        <div className="flex items-end justify-between">
          <p className="num-xl">{formatCurrency(totalExpense)}</p>
          {comparison.previousMonth.expenses > 0 && (
            <div className={`pill mb-1 ${isDown ? 'pill-positive' : 'pill-negative'}`}>
              {isDown ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
              {isDown ? `${Math.abs(variationPct).toFixed(1)}% menos` : `+${variationPct.toFixed(1)}% mais`}
            </div>
          )}
        </div>
        {comparison.previousMonth.expenses > 0 && (
          <p className="label-xs mt-2">
            {isDown ? 'Você economizou em relação a' : 'Você gastou mais do que em'}{' '}
            {comparison.previousMonth.label} ({formatCurrency(comparison.previousMonth.expenses)})
          </p>
        )}
      </div>

      {/* ── PARA ONDE SEU DINHEIRO VAI ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label-section">Para onde vai seu dinheiro</p>
          <button
            onClick={() => navigate('/comparacao')}
            className="flex items-center space-x-1 text-xs text-accent hover:underline"
          >
            <span>Ver comparativo</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-faint">Nenhuma despesa registrada neste período.</p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {categoryBreakdown.map(cat => (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCat(cat)}
                className="animate-fade-in w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm">{cat.categoryIcon || '📦'}</span>
                    <span className="text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-ink-faint">{cat.percentage.toFixed(0)}%</span>
                    <span className="text-xs font-bold text-ink">{formatCurrency(cat.total)}</span>
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.categoryColor }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── COMPARAÇÃO RÁPIDA ── */}
      {comparison.previousMonth.expenses > 0 && (
        <div
          className="card p-5 card-hover cursor-pointer"
          onClick={() => navigate('/comparacao')}
        >
          <p className="label-section mb-4">Comparação com mês anterior</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="label-xs mb-1">{comparison.previousMonth.label}</p>
              <p className="text-sm font-bold text-ink">{formatCurrency(comparison.previousMonth.expenses)}</p>
            </div>
            <div className={`pill ${isDown ? 'pill-positive' : 'pill-negative'}`}>
              {isDown ? '↓' : '↑'} {Math.abs(variationPct).toFixed(1)}%
            </div>
            <div className="text-center">
              <p className="label-xs mb-1">{comparison.currentMonth.label}</p>
              <p className="text-sm font-bold text-ink">{formatCurrency(comparison.currentMonth.expenses)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY DETAIL DRAWER ── */}
      <CategoryDetailDrawer
        cat={selectedCat}
        allTransactions={transactions}
        selectedPeriod={selectedPeriod}
        onClose={() => setSelectedCat(null)}
      />
    </div>
  );
};
