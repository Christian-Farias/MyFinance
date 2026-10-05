import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface AIEmptyStateProps {
  /** First name from settings; the hero personalises only when present. */
  userName?: string;
  starters: string[];
  onStarterClick: (question: string) => void;
}

/** Portuguese greeting keyed to the user's clock. */
function greetingFor(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Resolved once at module load rather than during render — `Date` is impure
 * and reading it mid-render makes the greeting change between renders. A chat
 * left open across noon keeps its greeting until reload, which is not worth a
 * timer to fix.
 */
const LOAD_HOUR = new Date().getHours();

/**
 * First-run state for the chat.
 *
 * Replaces two hardcoded greeting messages that used to be seeded into
 * `messages` on mount. They had a second cost beyond clutter: the suggestion
 * grid was gated on `messages.length <= 2`, so the conversation could never
 * reach a genuine empty state — the starters and the transcript competed for
 * the same screen.
 */
export const AIEmptyState: React.FC<AIEmptyStateProps> = ({
  userName,
  starters,
  onStarterClick,
}) => {
  const firstName = userName?.trim().split(/\s+/)[0];
  const greeting = greetingFor(LOAD_HOUR);

  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-1">
      <div className="relative mb-5">
        <div
          className="absolute inset-0 bg-accent/25 rounded-3xl blur-xl"
          aria-hidden="true"
        />
        <img
          src="/logo.png"
          alt=""
          width={64}
          height={64}
          className="relative w-16 h-16 rounded-3xl object-contain bg-black border border-active shadow-lg shadow-accent/10"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-positive border-2 border-base" />
      </div>

      <h2 className="text-lg font-bold text-ink tracking-tight">
        {greeting}
        {firstName ? `, ${firstName}` : ''}
      </h2>

      <p className="mt-1.5 text-xs text-ink-muted max-w-[38ch] leading-relaxed">
        Pergunte sobre seus gastos, contas, metas ou cartões. Posso registrar
        transações e montar um plano de ação para você confirmar.
      </p>

      <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-ink-faint font-medium">
        <ShieldCheck size={12} aria-hidden="true" className="text-positive" />
        <span>Análise local — seus dados não saem do dispositivo</span>
      </p>

      <div className="mt-6 w-full max-w-lg">
        <p className="label-xs mb-2 text-center">Comece por aqui</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {starters.map((starter) => (
            <li key={starter}>
              <button
                type="button"
                onClick={() => onStarterClick(starter)}
                className="card card-hover w-full p-3 text-left flex items-center gap-2.5 group"
              >
                <Sparkles
                  size={14}
                  aria-hidden="true"
                  className="text-accent shrink-0"
                />
                <span className="text-xs font-medium text-ink leading-snug">
                  {starter}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};