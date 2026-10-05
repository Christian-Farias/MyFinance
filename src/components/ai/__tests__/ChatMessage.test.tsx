import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessage } from '../ChatMessage';
import type { ChatMessageData } from '../ChatMessage';
import type { AIResponse, AIActionPlan } from '../../../financialAI/types';

/**
 * The transcript used to be one 250-line inline map() inside the page. These
 * cover the branches that were easy to break during extraction: which sender
 * renders, the four visual shapes, the confirmation gate, and the error retry.
 */

const plan: AIActionPlan = {
  id: 'plan_1',
  intent: 'CREATE_EXPENSE',
  riskLevel: 'MEDIUM',
  title: 'Registrar despesa',
  summary: 'Lança R$ 50,00 no supermercado como despesa.',
  details: { valor: 'R$ 50,00', categoria: 'Mercado' },
  payload: { type: 'CREATE_EXPENSE', data: {} },
  requiresConfirmation: true,
  status: 'pending',
  createdAt: new Date().toISOString(),
};

const base: ChatMessageData = {
  id: 'm1',
  sender: 'user',
  text: 'oi',
  timestamp: '10:00',
};

const noop = () => {};

const renderMessage = (
  message: ChatMessageData,
  handlers: Partial<React.ComponentProps<typeof ChatMessage>> = {},
) =>
  render(
    <ChatMessage
      message={message}
      onSuggest={noop}
      onConfirmPlan={noop}
      onCancelPlan={noop}
      onRetry={noop}
      {...handlers}
    />,
  );

describe('ChatMessage', () => {
  it('labels the two senders so they are distinguishable to a screen reader', () => {
    const { unmount } = renderMessage(base);
    expect(screen.getByLabelText('Você')).toBeInTheDocument();
    unmount();

    renderMessage({ ...base, sender: 'assistant', text: 'Olá' });
    expect(screen.getByLabelText('Neguin')).toBeInTheDocument();
  });

  it('renders **bold** as emphasis and leaves the rest as text', () => {
    renderMessage({
      ...base,
      sender: 'assistant',
      text: 'Você gastou **R$ 120** em mercado.',
    });

    expect(screen.getByText('R$ 120').tagName).toBe('STRONG');
    expect(screen.getByText(/Você gastou/)).toBeInTheDocument();
  });

  it('does not swallow the message when a ** delimiter is unpaired', () => {
    renderMessage({
      ...base,
      sender: 'assistant',
      text: 'total ** sem fechamento',
    });
    expect(screen.getByText(/sem fechamento/)).toBeInTheDocument();
  });

  it('renders visual items with their percentage as a labelled bar', () => {
    const responseObj: AIResponse = {
      text: 'resumo',
      intent: 'GET_EXPENSES',
      visual: {
        type: 'category_ranking',
        title: 'Gastos por categoria',
        items: [
          { label: 'Mercado', value: 300, formattedValue: 'R$ 300', percentage: 42, color: '#f00' },
          { label: 'Transporte', value: 100, formattedValue: 'R$ 100' },
        ],
      },
    };

    renderMessage({ ...base, sender: 'assistant', text: 'resumo', responseObj });

    expect(screen.getByText('Gastos por categoria')).toBeInTheDocument();
    expect(screen.getByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('R$ 300')).toBeInTheDocument();
    /* The bar carries the proportion inline as its width. */
    const bars = document.querySelectorAll('[style*="width"]');
    expect(
      Array.from(bars).some((el) => (el as HTMLElement).style.width === '42%'),
    ).toBe(true);
  });

  it('exposes the progress bar to assistive tech with a clamped value', () => {
    const responseObj: AIResponse = {
      text: 'meta',
      intent: 'GET_GOAL',
      visual: {
        type: 'progress_bar',
        progress: {
          current: 1200,
          target: 3000,
          percentage: 140,
          formattedCurrent: 'R$ 1.200',
          formattedTarget: 'R$ 3.000',
          label: 'Progresso da meta',
        },
      },
    };

    renderMessage({ ...base, sender: 'assistant', text: 'meta', responseObj });

    const bar = screen.getByRole('progressbar', { name: 'Progresso da meta' });
    /* 140% must be reported as 100 — the bar cannot exceed its track. */
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('140% concluído')).toBeInTheDocument();
  });

  it('renders a signed breakdown with positive and negative values distinguished', () => {
    const responseObj: AIResponse = {
      text: 'cálculo',
      intent: 'GET_FINANCIAL_HEALTH',
      visual: {
        type: 'math_breakdown',
        breakdown: [
          { label: 'Entradas', amount: 5000, formattedAmount: 'R$ 5.000', isPositive: true },
          { label: 'Saídas', amount: 3000, formattedAmount: 'R$ 3.000', isPositive: false },
        ],
      },
    };

    renderMessage({ ...base, sender: 'assistant', text: 'cálculo', responseObj });

    /* The amount is the <dd>; the label is the <dt> sibling. */
    expect(screen.getByText('R$ 5.000').tagName).toBe('DD');
    expect(screen.getByText('R$ 5.000')).toHaveClass('text-positive');
    expect(screen.getByText('R$ 3.000')).toHaveClass('text-negative');
  });

  it('surfaces the explanation as reasoning rather than a caption', () => {
    const responseObj: AIResponse = {
      text: 'resposta',
      intent: 'GET_BALANCE',
      explanation: 'Somei as contas correntes de todos os bancos.',
    };

    renderMessage({ ...base, sender: 'assistant', text: 'resposta', responseObj });
    expect(
      screen.getByText('Somei as contas correntes de todos os bancos.'),
    ).toBeInTheDocument();
  });

  it('offers follow-up suggestions and forwards the clicked one', async () => {
    const onSuggest = vi.fn();
    const user = userEvent.setup();
    const responseObj: AIResponse = {
      text: 'resposta',
      intent: 'GET_BALANCE',
      followUpSuggestions: ['E os cartões?', 'E as metas?'],
    };

    renderMessage(
      { ...base, sender: 'assistant', text: 'resposta', responseObj },
      { onSuggest },
    );

    await user.click(screen.getByRole('button', { name: /E os cartões\?/ }));
    expect(onSuggest).toHaveBeenCalledWith('E os cartões?');
  });

  it('shows the confirmation gate for a pending plan and does not execute on mount', () => {
    const onConfirmPlan = vi.fn();
    renderMessage(
      { ...base, sender: 'assistant', text: 'Posso lançar?', responseObj: { text: '', intent: 'CREATE_EXPENSE', actionPlan: plan } },
      { onConfirmPlan },
    );

    expect(screen.getByText('Confirmação exigida')).toBeInTheDocument();
    expect(screen.getByText('Risco médio')).toBeInTheDocument();
    /* The whole point of the gate: nothing runs until the button is pressed. */
    expect(onConfirmPlan).not.toHaveBeenCalled();
  });

  it('marks the plan confirmed and hands over a copy, never the original', async () => {
    const onConfirmPlan = vi.fn();
    const user = userEvent.setup();
    renderMessage(
      { ...base, sender: 'assistant', text: 'Posso lançar?', responseObj: { text: '', intent: 'CREATE_EXPENSE', actionPlan: plan } },
      { onConfirmPlan },
    );

    await user.click(screen.getByRole('button', { name: /Confirmar/ }));

    expect(onConfirmPlan).toHaveBeenCalledTimes(1);
    const handedOver = onConfirmPlan.mock.calls[0][0] as AIActionPlan;
    expect(handedOver.status).toBe('confirmed');
    /* The plan lives inside message state; writing to it updated state React
       was not tracking. It must arrive untouched. */
    expect(plan.status).toBe('pending');
    expect(handedOver).not.toBe(plan);
  });

  it('collapses the gate to an outcome once resolved, so it cannot re-fire', async () => {
    const onCancelPlan = vi.fn();
    const user = userEvent.setup();
    const { container } = renderMessage(
      { ...base, sender: 'assistant', text: 'Posso lançar?', responseObj: { text: '', intent: 'CREATE_EXPENSE', actionPlan: plan } },
      { onCancelPlan },
    );

    await user.click(screen.getByRole('button', { name: /Cancelar/ }));

    expect(onCancelPlan).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
    expect(container.textContent).toContain('Nenhum dado foi modificado');
  });

  it('re-renders without resurrecting a resolved plan', async () => {
    const user = userEvent.setup();
    const message: ChatMessageData = {
      ...base,
      sender: 'assistant',
      text: 'Posso lançar?',
      responseObj: { text: '', intent: 'CREATE_EXPENSE', actionPlan: plan },
    };
    const { rerender } = renderMessage(message);

    await user.click(screen.getByRole('button', { name: /Cancelar/ }));

    /* Any parent re-render previously wrote status onto the plan object and
       the gate came back because the message prop never changed identity. */
    rerender(
      <ChatMessage
        message={message}
        onSuggest={noop}
        onConfirmPlan={noop}
        onCancelPlan={noop}
        onRetry={noop}
      />,
    );

    expect(screen.queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
  });

  it('retries the original question after a failure, without leaking internals', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderMessage(
      {
        ...base,
        sender: 'assistant',
        text: 'Não consegui analisar seus dados agora.',
        isError: true,
        retryQuestion: 'Quanto gastei este mês?',
      },
      { onRetry },
    );

    expect(screen.getByRole('button', { name: /Tentar novamente/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }));
    expect(onRetry).toHaveBeenCalledWith('Quanto gastei este mês?');
  });

  it('shows the timestamp under the bubble', () => {
    renderMessage(base);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('gives every interactive element inside the bubble a real button role', () => {
    const responseObj: AIResponse = {
      text: 'resposta',
      intent: 'GET_BALANCE',
      followUpSuggestions: ['sugestão'],
    };
    renderMessage(
      { ...base, sender: 'assistant', text: 'resposta', responseObj },
    );

    /* An <article> full of divs with onClick is unusable by keyboard; the
       extraction had to keep them as real <button>s. */
    const buttons = within(screen.getByLabelText('Neguin')).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => expect(button).toHaveAttribute('type', 'button'));
  });
});