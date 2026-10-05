import React from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import type { AIResponse, AIActionPlan } from '../../financialAI/types';
import { AIResponseVisual } from './AIResponseVisual';
import { AIActionCard } from './AIActionCard';
import { AIInsightCard } from './AIInsightCard';

export interface ChatMessageData {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  responseObj?: AIResponse;
  timestamp: string;
  /** Set when the request itself failed; unlocks the retry affordance. */
  isError?: boolean;
  /** The question this message answers, so a retry can resend it verbatim. */
  retryQuestion?: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onSuggest: (question: string) => void;
  onConfirmPlan: (plan: AIActionPlan) => void;
  onCancelPlan: (plan: AIActionPlan) => void;
  onRetry: (question: string) => void;
}

/**
 * Minimal inline emphasis for `**bold**`.
 *
 * `LocalAIProvider` emits `**` delimiters rather than real Markdown, and
 * splitting on them is enough. Index parity decides which half is emphasised,
 * so an unpaired `**` degrades to plain text instead of swallowing the rest
 * of the message.
 */
const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('**').map((part, index) =>
      index % 2 === 1 ? (
        <strong key={index} className="font-bold">
          {part}
        </strong>
      ) : (
        part
      ),
    )}
  </>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSuggest,
  onConfirmPlan,
  onCancelPlan,
  onRetry,
}) => {
  const isUser = message.sender === 'user';
  const visual = message.responseObj?.visual;
  const plan = message.responseObj?.actionPlan;
  const suggestions = message.responseObj?.followUpSuggestions ?? [];
  const explanation = message.responseObj?.explanation;

  const showVisual = Boolean(
    visual &&
      (visual.items?.length || visual.progress || visual.breakdown?.length),
  );
  const showSuggestions = suggestions.length > 0;

  return (
    <article
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
      aria-label={isUser ? 'Você' : 'Neguin'}
    >
      {!isUser && (
        <img
          src="/logo.png"
          alt=""
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-contain shrink-0 mb-1"
        />
      )}

      <div className="max-w-[88%] min-w-0">
        <div
          className={`px-4 py-3 rounded-3xl text-sm leading-relaxed ${
            isUser
              ? 'bg-accent text-on-accent rounded-br-sm'
              : 'bg-panel border border-active text-ink rounded-bl-sm'
          }`}
        >
          <div className="whitespace-pre-line break-words">
            <RichText text={message.text} />
          </div>

          {message.isError && message.retryQuestion && (
            <button
              type="button"
              onClick={() => onRetry(message.retryQuestion!)}
              className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-field hover:bg-active text-ink text-xs font-semibold transition-colors border border-edge-strong"
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Tentar novamente</span>
            </button>
          )}

          {showVisual && (
            <div className="mt-3 pt-3 border-t border-active">
              <AIResponseVisual visual={visual!} />
            </div>
          )}

          {explanation && <AIInsightCard explanation={explanation} />}

          {plan && plan.status === 'pending' && (
            <AIActionCard
              plan={plan}
              onConfirm={onConfirmPlan}
              onCancel={onCancelPlan}
            />
          )}

          {showSuggestions && (
            <div className="mt-3 pt-2.5 border-t border-active flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() => onSuggest(suggestion)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-field hover:bg-active text-accent-text text-xs font-semibold transition-colors border border-edge-strong"
                >
                  <span>{suggestion}</span>
                  <ArrowRight size={10} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        <p
          className={`mt-1 px-1 text-[11px] text-ink-faint ${
            isUser ? 'text-right' : ''
          }`}
        >
          {message.timestamp}
        </p>
      </div>
    </article>
  );
};