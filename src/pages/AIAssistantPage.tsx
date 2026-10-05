import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { aiService } from '../financialAI/aiService';
import { executeActionPlan } from '../financialAI/actionExecutor';
import type { AIActionPlan } from '../financialAI/types';
import { ErrorState, LoadingState } from '../components/ui';
import { AIEmptyState } from '../components/ai/AIEmptyState';
import { ChatMessage } from '../components/ai/ChatMessage';
import type { ChatMessageData } from '../components/ai/ChatMessage';
import { ChatComposer } from '../components/ai/ChatComposer';
import { TypingIndicator } from '../components/ai/TypingIndicator';

/**
 * Close enough to the bottom that auto-scroll may take over. 80px of slack
 * covers the last bubble's margin without yanking the viewport when the user
 * is genuinely reading earlier messages.
 */
const NEAR_BOTTOM_PX = 80;

const STARTERS = [
  'Como estão minhas finanças?',
  'Quanto gastei este mês?',
  'Quais contas vencem essa semana?',
  'Posso gastar R$ 500?',
];

const clockTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AIAssistantPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const {
    transactions,
    accounts,
    cards,
    budgets,
    goals,
    investments,
    categories,
    bills,
    receivables,
    recurringTransactions,
    subscriptions,
    refreshAll,
    setQuickActionOpen,
    settings,
  } = useFinance();

  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * The snapshot handed to `aiService`. Rebuilt only when the underlying
   * collections change — previously it was reconstructed inside `handleAsk`
   * on every keystroke-triggered submit, and re-rendering the transcript
   * re-referenced it.
   */
  const financialState = useMemo(
    () => ({
      accounts,
      transactions,
      categories,
      cards,
      goals,
      budgets,
      bills,
      receivables,
      recurring: recurringTransactions,
      subscriptions,
      investments,
    }),
    [
      accounts,
      transactions,
      categories,
      cards,
      goals,
      budgets,
      bills,
      receivables,
      recurringTransactions,
      subscriptions,
      investments,
    ],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  /* Track how close the user is to the bottom. The listener is passive because
     it never mutates state synchronously inside the scroll handler's scroll
     path, and it is removed on unmount. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distance =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsNearBottom(distance <= NEAR_BOTTOM_PX);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Follow new messages only when the user is already at the bottom.
   *
   * This used to be an unconditional `scrollIntoView` on every message and on
   * `isTyping`, which yanked the viewport away from anyone reading back
   * through earlier replies. When the user is scrolled up we leave them
   * there and surface the "new message" pill instead.
   */
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isTyping, isNearBottom, scrollToBottom]);

  const handleAsk = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `usr_${Date.now()}`,
          sender: 'user',
          text: q,
          timestamp: clockTime(),
        },
      ]);
      setInputQuestion('');
      setIsTyping(true);
      /* A new question always means the user wants the reply. */
      setIsNearBottom(true);

      try {
        const response = await aiService.processMessage(q, financialState);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'assistant',
            text: response.text,
            responseObj: response,
            timestamp: clockTime(),
          },
        ]);
      } catch {
        /* No stack trace and no raw error text reaches the user — the message
           carries the original question so retry resends it verbatim. */
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_err_${Date.now()}`,
            sender: 'assistant',
            text: 'Não consegui analisar seus dados agora.',
            timestamp: clockTime(),
            isError: true,
            retryQuestion: q,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [financialState],
  );

  const handleConfirmPlan = useCallback(
    async (plan: AIActionPlan) => {
      const result = await executeActionPlan(plan);
      if (result.success) {
        await refreshAll();
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_action_res_${Date.now()}`,
          sender: 'assistant',
          text: result.success
            ? `**Ação executada.**\n\n${result.message}`
            : `**Não foi possível executar:** ${result.message}`,
          timestamp: clockTime(),
        },
      ]);
    },
    [refreshAll],
  );

  /* The plan itself needs no handling here: `AIActionCard` owns its resolved
     state, so cancelling only has to record the outcome in the transcript. */
  const handleCancelPlan = useCallback((_plan: AIActionPlan) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `ai_cancel_${Date.now()}`,
        sender: 'assistant',
        text: 'Ação cancelada. Nenhum dado foi modificado.',
        timestamp: clockTime(),
      },
    ]);
  }, []);

  /* Sem esta guarda a página desenhava o estado vazio antes de o IndexedDB
     responder — e uma falha de leitura ficava idêntica a "não há dados". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={4} />;
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Identity strip ── */}
      <div className="flex items-center gap-3 py-3 shrink-0">
        <div className="relative shrink-0">
          <img
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-2xl object-contain bg-black border border-active"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-positive border-2 border-base" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-ink tracking-tight leading-tight">
            Neguin
          </h1>
          <span className="label-xs text-positive">
            Assistente financeiro · Análise local
          </span>
        </div>
      </div>

      {/* ── Transcript ── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain space-y-4 pb-3 pr-0.5"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversa com o Neguin"
          tabIndex={0}
        >
          {isEmpty ? (
            <AIEmptyState
              userName={settings.name}
              starters={STARTERS}
              onStarterClick={handleAsk}
            />
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSuggest={handleAsk}
                onConfirmPlan={handleConfirmPlan}
                onCancelPlan={handleCancelPlan}
                onRetry={handleAsk}
              />
            ))
          )}

          {isTyping && <TypingIndicator />}
        </div>

        {!isNearBottom && !isEmpty && (
          <button
            type="button"
            onClick={() => {
              setIsNearBottom(true);
              scrollToBottom();
            }}
            className="chat-new-message"
            aria-label="Ir para a mensagem mais recente"
          >
            <ChevronDown size={13} aria-hidden="true" />
            <span>Nova mensagem</span>
          </button>
        )}
      </div>

      {/* ── Composer ── */}
      <div className="shrink-0 pt-1 pb-[var(--bottom-nav-pad)]">
        <ChatComposer
          value={inputQuestion}
          onChange={setInputQuestion}
          onSubmit={() => handleAsk(inputQuestion)}
          onQuickAction={() => setQuickActionOpen(true)}
          isBusy={isTyping}
        />
      </div>
    </div>
  );
};