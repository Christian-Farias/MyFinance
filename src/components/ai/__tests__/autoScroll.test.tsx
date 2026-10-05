import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAssistantPage } from '../../../pages/AIAssistantPage';

/**
 * The page used to call `scrollIntoView` unconditionally on `[messages,
 * isTyping]`, so every reply yanked the viewport away from anyone reading
 * back through history. These lock in the conditional behaviour: follow the
 * conversation only when the reader is already at the bottom.
 */

const processMessage = vi.fn();

vi.mock('../../../context/FinanceContext', () => ({
  useFinance: () => ({
    transactions: [],
    accounts: [],
    cards: [],
    budgets: [],
    goals: [],
    investments: [],
    categories: [],
    bills: [],
    receivables: [],
    recurringTransactions: [],
    subscriptions: [],
    refreshAll: vi.fn(),
    setQuickActionOpen: vi.fn(),
    settings: { name: 'Maria', email: 'm@e.com', currency: 'BRL' },
  }),
}));

vi.mock('../../../hooks/usePageData', () => ({
  usePageData: () => ({ isLoading: false, loadFailed: false, retry: vi.fn() }),
}));

vi.mock('../../../financialAI/aiService', () => ({
  aiService: {
    processMessage: (...args: unknown[]) => processMessage(...args),
  },
}));

vi.mock('../../../financialAI/actionExecutor', () => ({
  executeActionPlan: vi.fn(),
}));

/* jsdom implements none of the scroll geometry, so fake a list that is 1000px
   tall inside a 400px viewport and track where it is scrolled to. */
const SCROLL_HEIGHT = 1000;
const CLIENT_HEIGHT = 400;
/* scrollTop where the bottom edge of the content is flush with the viewport. */
const AT_BOTTOM = SCROLL_HEIGHT - CLIENT_HEIGHT;
/* Near the top: 550px of content below the fold, well past the 80px slack. */
const SCROLLED_UP = 50;

let scrollTop = 0;
let scrollToCalls: number[] = [];

/** Moves the list and fires the event the page listens for. */
const scrollListTo = (value: number) => {
  scrollTop = value;
  fireEvent.scroll(screen.getByRole('log'));
};

/** Parks `aiService` in flight so `isTyping` stays true on demand. */
function deferReply() {
  let resolve!: (value: unknown) => void;
  processMessage.mockImplementationOnce(
    () =>
      new Promise((res) => {
        resolve = res as (value: unknown) => void;
      }),
  );
  return () => resolve({ text: 'Resposta atrasada', intent: 'GET_BALANCE' });
}

beforeEach(() => {
  scrollTop = AT_BOTTOM;
  scrollToCalls = [];
  processMessage.mockReset();
  processMessage.mockResolvedValue({
    text: 'Tudo certo por aqui.',
    intent: 'GET_FINANCIAL_HEALTH',
  });

  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
    SCROLL_HEIGHT,
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
    CLIENT_HEIGHT,
  );
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
  HTMLElement.prototype.scrollTo = vi.fn(function (
    this: HTMLElement,
    options: ScrollToOptions,
  ) {
    scrollToCalls.push(options.top ?? 0);
    scrollTop = options.top ?? 0;
  }) as unknown as HTMLElement['scrollTo'];
});

/** Opens a conversation so the empty state is out of the way. */
async function startConversation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: /Como estão minhas finanças/ }),
  );
  await screen.findByText(/Tudo certo por aqui/);
  scrollListTo(AT_BOTTOM);
}

const pill = () => screen.queryByRole('button', { name: /Ir para a mensagem/ });

describe('AIAssistantPage conditional auto-scroll', () => {
  it('follows the transcript while the reader is at the bottom', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPage />);
    await startConversation(user);

    scrollToCalls.length = 0;
    processMessage.mockResolvedValueOnce({
      text: 'Mais uma resposta.',
      intent: 'GET_BALANCE',
    });
    await user.type(
      screen.getByLabelText('Mensagem para o Neguin'),
      'e agora{Enter}',
    );
    await screen.findByText('Mais uma resposta.');

    expect(scrollToCalls).toContain(SCROLL_HEIGHT);
  });

  it('does not yank a reader who scrolls up while the reply is generating', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPage />);
    await startConversation(user);

    /* Installed after the opening exchange so it parks the *next* call. */
    const release = deferReply();
    await user.type(
      screen.getByLabelText('Mensagem para o Neguin'),
      'me ajuda{Enter}',
    );
    await screen.findByText(/digitando/);

    /* Reader scrolls back into history before the answer lands. */
    scrollListTo(SCROLLED_UP);
    scrollToCalls.length = 0;

    release();
    await screen.findByText('Resposta atrasada');

    /* The viewport must have been left alone. */
    expect(scrollToCalls).toHaveLength(0);
    expect(pill()).toBeInTheDocument();
  });

  it('shows the affordance when scrolled up and hides it back at the bottom', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPage />);
    await startConversation(user);

    expect(pill()).toBeNull();

    scrollListTo(SCROLLED_UP);
    expect(pill()).toBeInTheDocument();

    scrollListTo(AT_BOTTOM);
    expect(pill()).toBeNull();
  });

  it('returns to the latest message when the affordance is pressed', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPage />);
    await startConversation(user);

    scrollListTo(SCROLLED_UP);
    scrollToCalls.length = 0;

    await user.click(pill()!);

    expect(scrollToCalls).toContain(SCROLL_HEIGHT);
    expect(pill()).toBeNull();
  });

  it('resumes following when the reader asks a new question', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPage />);
    await startConversation(user);

    scrollListTo(SCROLLED_UP);
    scrollToCalls.length = 0;

    processMessage.mockResolvedValueOnce({
      text: 'Segunda resposta.',
      intent: 'GET_BALANCE',
    });
    await user.type(
      screen.getByLabelText('Mensagem para o Neguin'),
      'me ajuda{Enter}',
    );
    await screen.findByText('Segunda resposta.');

    /* Asking a question is an implicit request to see the answer, so this is
       the one case that should pull the viewport back. */
    expect(scrollToCalls).toContain(SCROLL_HEIGHT);
  });

  it('stops listening for scroll once the page unmounts', async () => {
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const { unmount } = render(<AIAssistantPage />);
    await startConversation(user);

    unmount();

    /* A listener left attached would keep updating state on a dead node. */
    const removed = removeSpy.mock.calls.map((call) => call[0]);
    expect(removed).toContain('scroll');
  });

  it('announces the transcript politely rather than interrupting', async () => {
    const user = userEvent.setup();
    render(<AIAssistantPage />);
    await startConversation(user);

    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveAttribute('aria-relevant', 'additions');
  });

  it('retries the failed question verbatim without leaking internals', async () => {
    const user = userEvent.setup();
    processMessage.mockRejectedValueOnce(new Error('boom'));
    render(<AIAssistantPage />);

    await user.click(
      screen.getByRole('button', { name: /Como estão minhas finanças/ }),
    );

    const retry = await screen.findByRole('button', { name: /Tentar novamente/ });
    expect(screen.getByText(/Não consegui analisar/)).toBeInTheDocument();
    /* The raw error must never reach the transcript. */
    expect(screen.queryByText(/boom/)).toBeNull();

    processMessage.mockResolvedValueOnce({
      text: 'Agora deu certo.',
      intent: 'GET_FINANCIAL_HEALTH',
    });
    await user.click(retry);

    await screen.findByText('Agora deu certo.');
    expect(processMessage).toHaveBeenLastCalledWith(
      'Como estão minhas finanças?',
      expect.anything(),
    );
  });
});