import React from 'react';
import type { VisualComponentData } from '../../financialAI/types';

interface AIResponseVisualProps {
  visual: VisualComponentData;
}

/**
 * Renders whatever shape `AIResponse.visual` carries.
 *
 * The layout is chosen by which fields are populated rather than by
 * `visual.type`, because `LocalAIProvider` sets `type` inconsistently —
 * the same `category_ranking` payload arrives with only `items`, while
 * `progress_bar` arrives with only `progress`. Keying off presence keeps
 * every combination rendering instead of silently dropping data.
 */
export const AIResponseVisual: React.FC<AIResponseVisualProps> = ({ visual }) => {
  const hasItems = Boolean(visual.items?.length);
  const hasProgress = Boolean(visual.progress);
  const hasBreakdown = Boolean(visual.breakdown?.length);

  if (!hasItems && !hasProgress && !hasBreakdown) return null;

  return (
    <>
      {visual.title && (
        <p className="label-xs text-ink-muted mt-3 mb-2">{visual.title}</p>
      )}

      {/* Item list — category rankings, comparisons, plain lists */}
      {hasItems && (
        <ul className="space-y-2.5">
          {visual.items!.map((item, index) => (
            <li key={`${item.label}-${index}`} className="space-y-1">
              <div className="flex justify-between gap-2 text-[11px] font-medium text-ink">
                <span className="min-w-0">
                  {item.label}
                  {item.subtitle && (
                    <span className="block text-[10px] text-ink-faint font-normal">
                      {item.subtitle}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {item.formattedValue}
                </span>
              </div>

              {item.percentage !== undefined && (
                /* 6px rather than the 4px it used to be: at 4px the fill
                   reads as a hairline and the proportion is illegible. */
                <div
                  className="w-full h-1.5 bg-field rounded-full overflow-hidden"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                      backgroundColor: item.color || 'var(--color-accent)',
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Progress toward a target — goals, budgets, bill payments */}
      {hasProgress && visual.progress && (() => {
        /* Clamp once: the fill width, the announced value and the caption all
           have to agree, and a bar reporting aria-valuenow="140" against a
           max of 100 is invalid. */
        const clamped = Math.min(100, Math.max(0, visual.progress.percentage));
        return (
        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-[11px] font-medium">
            <span className="text-ink tabular-nums">
              {visual.progress.formattedCurrent}
            </span>
            <span className="text-ink-muted shrink-0">
              Alvo: {visual.progress.formattedTarget}
            </span>
          </div>
          <div
            className="w-full h-2 bg-field rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(clamped)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={visual.progress.label || visual.title || 'Progresso'}
          >
            <div
              className="h-full rounded-full transition-all bg-accent"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <p className="text-[10px] text-right text-ink-faint font-semibold tabular-nums">
            {visual.progress.percentage.toFixed(0)}% concluído
          </p>
        </div>
        );
      })()}

      {/* Signed rows — how a total was derived */}
      {hasBreakdown && (
        <dl className="space-y-1">
          {visual.breakdown!.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="flex justify-between gap-2 text-[11px] py-1 border-b border-edge-subtle last:border-b-0"
            >
              <dt className="text-ink-muted min-w-0">{row.label}</dt>
              <dd
                className={`font-bold shrink-0 tabular-nums ${
                  row.isPositive === false
                    ? 'text-negative'
                    : row.isPositive === true
                      ? 'text-positive'
                      : 'text-ink'
                }`}
              >
                {row.formattedAmount}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
};