import React from 'react';
import { Lightbulb } from 'lucide-react';

interface AIInsightCardProps {
  explanation: string;
}

/**
 * The "why" behind an answer.
 *
 * `LocalAIProvider` fills `explanation` with how it reached a number. It used
 * to render as an italic line with an accent border, which read as a caption
 * rather than as reasoning — a user deciding whether to trust a number wants
 * the method surfaced, not whispered.
 */
export const AIInsightCard: React.FC<AIInsightCardProps> = ({ explanation }) => (
  <div className="mt-3 flex gap-2 rounded-2xl bg-surface-raised border border-edge-subtle p-3">
    <Lightbulb
      size={14}
      aria-hidden="true"
      className="text-accent shrink-0 mt-0.5"
    />
    <p className="text-[11px] text-ink-muted leading-relaxed">{explanation}</p>
  </div>
);