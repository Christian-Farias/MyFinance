import type { LucideIcon } from 'lucide-react';

/**
 * Page header.
 *
 * The 17 routed pages had six header layouts, two <h1> colour values
 * (`text-ink` vs `text-ink`) and inconsistent action-button styling.
 * This is the single definition.
 */

export interface PageHeaderProps {
  title: string;
  /** Small line above the title. */
  eyebrow?: string;
  /** Line under the title. */
  subtitle?: string;
  /** Primary action, rendered right-aligned. */
  action?: React.ReactNode;
  /** Period stepper or filter, rendered right-aligned next to the action. */
  aside?: React.ReactNode;
  /** Leading slot before the title block — logo, avatar, back button. */
  leading?: React.ReactNode;
}

export function PageHeader({ title, eyebrow, subtitle, action, aside, leading }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 pt-2">
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          {eyebrow && (
            <p className="label-xs text-ink-muted">{eyebrow}</p>
          )}
          <h1 className="text-xl font-bold text-ink tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-ink-muted leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {(action || aside) && (
        <div className="flex items-center gap-2 shrink-0">
          {aside}
          {action}
        </div>
      )}
    </header>
  );
}

export interface EmptyStateProps {
  icon: LucideIcon;
  /** Drives the accent colour; always paired with the icon, never alone. */
  tone?: 'accent' | 'positive' | 'warning' | 'neutral';
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Denser presentation for panels inside a page. */
  compact?: boolean;
}

const TONE_CLASS = {
  /* These bypassed the token scale, so all three still carried the
     pre-Inter palette (purple / mint / amber) and silently ignored
     every theme change. */
  accent: 'bg-accent-subtle text-accent',
  positive: 'bg-positive-subtle text-positive',
  warning: 'bg-warning-subtle text-warning',
  neutral: 'bg-surface-raised text-ink-muted',
} as const;

/**
 * Empty state.
 *
 * Three templates and seven inline variations existed across the pages;
 * none of the 17 imported a shared component.
 */
export function EmptyState({
  icon: Icon,
  tone = 'accent',
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`card text-center ${compact ? 'p-8' : 'p-10 md:p-12'}`}>
      <div
        className={`mx-auto mb-4 flex items-center justify-center rounded-2xl ${
          compact ? 'w-12 h-12' : 'w-14 h-14'
        } ${TONE_CLASS[tone]}`}
      >
        <Icon size={compact ? 22 : 28} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-muted leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/**
 * Error state.
 *
 * `FinanceContext` swallowed load failures into console.error, so a broken
 * read from IndexedDB was indistinguishable from "you have no data".
 */
export function ErrorState({
  title = 'Não foi possível carregar seus dados',
  description = 'Algo deu errado ao ler o armazenamento local. Seus dados não foram alterados.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="card p-8 text-center">
      <div className="mx-auto mb-4 flex w-14 h-14 items-center justify-center rounded-2xl bg-[rgb(255_92_92/0.10)] text-negative">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-ink-muted leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}

export interface LoadingStateProps {
  /** Number of placeholder rows. */
  rows?: number;
  label?: string;
}

/**
 * Loading placeholder.
 *
 * `FinanceContext.isLoading` was exported but read by nothing, so every page
 * painted its empty state before IndexedDB answered. The `.skeleton` class and
 * a Skeleton component both existed and were unused.
 */
export function LoadingState({ rows = 3, label = 'Carregando' }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="card p-4 flex items-center gap-3">
          <div className="skeleton w-11 h-11 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/5" />
            <div className="skeleton h-2.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}