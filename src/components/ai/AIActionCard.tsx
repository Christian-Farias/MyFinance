import React, { useState } from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import type { AIActionPlan } from '../../financialAI/types';

interface AIActionCardProps {
  plan: AIActionPlan;
  onConfirm: (plan: AIActionPlan) => void;
  onCancel: (plan: AIActionPlan) => void;
}

const RISK_LABEL: Record<AIActionPlan['riskLevel'], string> = {
  LOW: 'Risco baixo',
  MEDIUM: 'Risco médio',
  HIGH: 'Risco alto',
  CRITICAL: 'Risco crítico',
};

/**
 * Confirmation gate for a plan the assistant proposed.
 *
 * Nothing executes until Confirmar is pressed — that is the whole point of
 * the card, so it renders only while the plan is unresolved.
 *
 * Resolution is held in local state keyed by the plan id rather than by
 * mutating `plan.status`. The plan object lives inside the message's
 * `responseObj`, and writing to it updated state that was never tracked,
 * which meant a re-render could resurrect a resolved plan as pending.
 */
export const AIActionCard: React.FC<AIActionCardProps> = ({
  plan,
  onConfirm,
  onCancel,
}) => {
  const [resolved, setResolved] = useState<'confirmed' | 'cancelled' | null>(null);

  if (resolved) {
    return (
      <p className="text-xs font-semibold text-ink-muted">
        {resolved === 'confirmed'
          ? 'Ação confirmada e enviada para execução.'
          : 'Ação cancelada. Nenhum dado foi modificado.'}
      </p>
    );
  }

  const handleConfirm = () => {
    // Local copy so the executor receives `status: 'confirmed'` without the
    // object that is already sitting in message state being touched.
    setResolved('confirmed');
    onConfirm({ ...plan, status: 'confirmed' });
  };

  const handleCancel = () => {
    setResolved('cancelled');
    onCancel({ ...plan, status: 'cancelled' });
  };

  return (
    <div className="mt-3 pt-3 border-t border-active space-y-2">
      <div className="flex items-center gap-1.5 text-warning text-xs font-bold">
        <ShieldAlert size={14} aria-hidden="true" />
        <span>Confirmação exigida</span>
        <span className="pill pill-warning text-[10px]">
          {RISK_LABEL[plan.riskLevel]}
        </span>
      </div>

      <p className="text-xs font-semibold text-ink">{plan.title}</p>
      <p className="text-sm text-ink-muted leading-relaxed">{plan.summary}</p>

      {Object.keys(plan.details).length > 0 && (
        <dl className="bg-surface-raised p-3 rounded-2xl border border-active space-y-1 text-xs">
          {Object.entries(plan.details).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <dt className="text-ink-muted">{key}</dt>
              <dd className="font-semibold text-ink text-right">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleConfirm}
          className="btn btn-positive btn-sm flex-1 justify-center gap-1"
        >
          <Check size={14} aria-hidden="true" />
          <span>Confirmar</span>
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-secondary btn-sm justify-center gap-1"
        >
          <X size={14} aria-hidden="true" />
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );
};