import { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Segmented control.
 *
 * Used instead of radio pills where the choice is exclusive and short. Sets
 * `aria-pressed` and exposes a radiogroup semantics with roving tabindex, so
 * only one stop in the tab order.
 */

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const baseId = useId();
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const move = (delta: number) => {
    const next = options[(activeIndex + delta + options.length) % options.length];
    if (next) onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`segmented ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            id={`${baseId}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            // Roving tabindex: one stop for the whole group.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`segmented-item ${selected ? 'segmented-item-active' : ''}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface MonthStepperProps {
  /** Human-readable month, e.g. "Março 2026". */
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  /** Disables forward navigation at the current month. */
  canGoNext?: boolean;
  className?: string;
}

/**
 * Month stepper used by the statement pages.
 *
 * `btn btn-icon` applied to a flex `<div>` in at least three pages — not
 * focusable, no accessible name, no keyboard activation.
 */
export function MonthStepper({
  label,
  onPrevious,
  onNext,
  canGoNext = true,
  className = '',
}: MonthStepperProps) {
  return (
    <nav aria-label="Período" className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Mês anterior"
        className="btn btn-icon btn-sm btn-ghost"
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className="min-w-[104px] text-center text-xs font-semibold text-ink"
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Próximo mês"
        disabled={!canGoNext}
        className="btn btn-icon btn-sm btn-ghost"
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  );
}