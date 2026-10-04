import React, { useState } from 'react';
import { Plus, Sliders, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { CategoryIcon } from '../components/CategoryIcon';
import { BudgetModal } from '../components/modals/BudgetModal';
import { calculateBudgetUsage, formatCurrency } from '../calculations/financialCalculations';
import type { Budget, BudgetStatus } from '../types';
import { ErrorState, LoadingState } from '../components/ui';

const STATUS_CONFIG: Record<BudgetStatus, { label: string; color: string; pill: string; msg: string }> = {
  exceeded: { label: 'Excedido',  color: 'var(--color-negative)', pill: 'pill-negative', msg: 'Limite ultrapassado' },
  critical: { label: 'Crítico',   color: 'var(--color-warning)', pill: 'pill-warning',  msg: 'Acima de 90%' },
  warning:  { label: 'Atenção',   color: 'var(--color-warning)', pill: 'pill-warning',  msg: 'Acima de 70%' },
  normal:   { label: 'No limite', color: 'var(--color-positive)', pill: 'pill-positive', msg: 'Dentro do planejado' },
};

export const BudgetsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { budgets, transactions, categories, selectedPeriod, deleteBudget } = useFinance();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | undefined>(undefined);

  const budgetReports = calculateBudgetUsage(budgets, transactions, categories, selectedPeriod);
  const criticalBudgets = budgetReports.filter(r => r.percentage >= 70);

  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent  = budgetReports.reduce((s, r) => s + r.spent, 0);
  const overallPct  = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const overallColor = overallPct >= 90 ? 'var(--color-negative)' : overallPct >= 70 ? 'var(--color-warning)' : 'var(--color-positive)';

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
        <h1 className="text-xl font-bold text-ink tracking-tight">Orçamentos</h1>
        <button
          onClick={() => { setBudgetToEdit(undefined); setIsBudgetModalOpen(true); }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Criar orçamento</span>
        </button>
      </div>

      {/* ── GLOBAL SUMMARY ── */}
      {budgetReports.length > 0 && (
        <div className="card p-5">
          <p className="label-xs mb-2">Gasto total vs. orçamento</p>
          <div className="flex items-end justify-between mb-3">
            <p className="num-lg">{formatCurrency(totalSpent)}</p>
            <p className="label-xs mb-1">de {formatCurrency(totalBudget)}</p>
          </div>
          <div className="progress-track-thick">
            <div className="progress-fill" style={{ width: `${overallPct}%`, backgroundColor: overallColor }} />
          </div>
          <p className="label-xs mt-2">{overallPct.toFixed(0)}% do orçamento total utilizado</p>
        </div>
      )}

      {/* ── WARNING ALERT ── */}
      {criticalBudgets.length > 0 && (
        <div className="rounded-2xl p-4 bg-warning/8 border border-warning/20 flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-xs font-semibold text-warning mb-0.5">
              {criticalBudgets.length === 1
                ? `${criticalBudgets[0].category?.name} está próximo do limite`
                : `${criticalBudgets.length} orçamentos próximos do limite`}
            </p>
            <p className="label-xs leading-relaxed">
              {criticalBudgets.length === 1
                ? `${criticalBudgets[0].percentage.toFixed(0)}% do orçamento utilizado.`
                : 'Revise seus gastos para não ultrapassar os limites.'}
            </p>
          </div>
        </div>
      )}

      {/* ── BUDGETS LIST ── */}
      {budgetReports.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Sliders size={28} className="text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-2">Nenhum orçamento definido</h3>
          <p className="label-xs leading-relaxed mb-5">
            Defina limites mensais para suas categorias e controle seus gastos com mais precisão.
          </p>
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:bg-accent transition-colors"
          >
            Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {budgetReports.map(({ budget, category, spent, remaining, percentage, status }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={budget.id} className="animate-fade-in card p-5">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <CategoryIcon iconName={category?.icon} color={category?.color || 'var(--color-accent)'} size={18} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-ink">{category?.name || 'Categoria'}</h4>
                        <span className={`pill ${cfg.pill} text-[10px]`}>{cfg.label}</span>
                      </div>
                      <p className="label-xs mt-0.5">Restante: {formatCurrency(remaining)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-ink">{formatCurrency(spent)}</p>
                    <p className="label-xs">de {formatCurrency(budget.limitAmount)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="progress-track-thick mb-3">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: cfg.color }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-edge">
                  <span className="text-[11px]" style={{ color: cfg.color }}>{cfg.msg} · {percentage.toFixed(0)}%</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => { setBudgetToEdit(budget); setIsBudgetModalOpen(true); }}
                      className="flex items-center space-x-1 text-[11px] text-ink-muted hover:text-ink transition-colors"
                    >
                      <Edit2 size={11} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="flex items-center space-x-1 text-[11px] text-negative/50 hover:text-negative transition-colors"
                    >
                      <Trash2 size={11} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgetToEdit={budgetToEdit}
      />
    </div>
  );
};
