import React, { useState } from 'react';
import { Plus, Target, Laptop, Plane, PlusCircle, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { GoalModal } from '../components/modals/GoalModal';
import { GoalDepositModal } from '../components/modals/GoalDepositModal';
import { formatCurrency, calculateGoalProgress } from '../calculations/financialCalculations';
import type { Goal } from '../types';
import { ErrorState, LoadingState } from '../components/ui';

const getGoalIcon = (name: string) => {
  const l = name.toLowerCase();
  if (l.includes('notebook') || l.includes('computador') || l.includes('laptop') || l.includes('pc')) return Laptop;
  if (l.includes('viagem') || l.includes('voo') || l.includes('feri') || l.includes('praia')) return Plane;
  if (l.includes('invest') || l.includes('ação') || l.includes('reserva')) return TrendingUp;
  return Target;
};

export const GoalsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { goals, deleteGoal } = useFinance();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit]       = useState<Goal | undefined>(undefined);
  const [goalForDeposit, setGoalForDeposit] = useState<Goal | null>(null);

  const totalGoalAmount   = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalGoalProgress = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct = totalGoalAmount > 0 ? Math.min(100, (totalGoalProgress / totalGoalAmount) * 100) : 0;

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
        <h1 className="text-xl font-bold text-ink tracking-tight">Metas</h1>
        <button
          onClick={() => { setGoalToEdit(undefined); setIsGoalModalOpen(true); }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Nova meta</span>
        </button>
      </div>

      {/* ── SUMMARY ── */}
      {goals.length > 0 && (
        <div className="card p-5">
          <p className="label-xs mb-2">Progresso geral</p>
          <div className="flex items-end justify-between mb-3">
            <p className="num-lg">{formatCurrency(totalGoalProgress)}</p>
            <p className="label-xs mb-1">de {formatCurrency(totalGoalAmount)}</p>
          </div>
          <div className="progress-track-thick">
            <div
              className="progress-fill"
              style={{ width: `${overallPct}%`, backgroundColor: 'var(--color-accent)' }}
            />
          </div>
          <p className="label-xs mt-2">{overallPct.toFixed(0)}% do total das metas</p>
        </div>
      )}

      {/* ── GOALS LIST ── */}
      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-2">Nenhuma meta criada</h3>
          <p className="label-xs leading-relaxed mb-5">Defina metas para organizar seus sonhos e reservas financeiras.</p>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:bg-accent transition-colors"
          >
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {goals.map(goal => {
            const { percentage, remaining, monthlySavingsNeeded } = calculateGoalProgress(goal);
            const safeMonthly = monthlySavingsNeeded ?? 0;
            const Icon = getGoalIcon(goal.name);
            const color = goal.color || 'var(--color-accent)';
            const isComplete = percentage >= 100;

            return (
              <div key={goal.id} className="animate-fade-in card p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
                      }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{goal.name}</h4>
                      <p className="label-xs mt-0.5">
                        {formatCurrency(goal.currentAmount)}
                        <span className="text-ink-faint"> / {formatCurrency(goal.targetAmount)}</span>
                      </p>
                    </div>
                  </div>
                  <div className={`pill ${isComplete ? 'pill-positive' : 'pill-accent'}`}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-track-thick mb-3">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%`, backgroundColor: isComplete ? 'var(--color-positive)' : color }}
                  />
                </div>

                {/* Sub-info */}
                {!isComplete && (
                  <div className="flex items-center justify-between text-xs text-ink-muted mb-4">
                    <span>Faltam {formatCurrency(remaining)}</span>
                    {goal.deadline && (
                      <span>Prazo: {goal.deadline.substring(0, 7)}</span>
                    )}
                  </div>
                )}

                {isComplete && (
                  <p className="text-xs text-positive font-semibold mb-4">🎉 Meta atingida!</p>
                )}

                {safeMonthly > 0 && !isComplete && (
                  <div className="bg-surface-raised rounded-xl p-3 mb-4 accent-left">
                    <p className="text-xs text-ink-muted">
                      Poupar <span className="text-ink font-semibold">{formatCurrency(safeMonthly)}/mês</span> para atingir no prazo.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-3 border-t border-edge">
                  <button
                    onClick={() => setGoalForDeposit(goal)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
                  >
                    <PlusCircle size={13} />
                    <span>Guardar dinheiro</span>
                  </button>
                  <button
                    onClick={() => { setGoalToEdit(goal); setIsGoalModalOpen(true); }}
                    className="p-2 rounded-xl bg-surface-raised text-ink-muted hover:text-ink transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 rounded-xl bg-surface-raised text-negative/50 hover:text-negative transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} goalToEdit={goalToEdit} />
      <GoalDepositModal goal={goalForDeposit} onClose={() => setGoalForDeposit(null)} />
    </div>
  );
};
