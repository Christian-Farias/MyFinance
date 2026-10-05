import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatComposer } from '../ChatComposer';

/**
 * The composer used to be an `<input type="text">`, so there was no way to
 * write a multi-line question and Shift+Enter submitted. These lock in the
 * textarea behaviour: Enter sends, Shift+Enter does not.
 */
describe('ChatComposer', () => {
  const setup = (overrides: Partial<React.ComponentProps<typeof ChatComposer>> = {}) => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    const onQuickAction = vi.fn();
    render(
      <ChatComposer
        value="Como vão minhas finanças?"
        onChange={onChange}
        onSubmit={onSubmit}
        onQuickAction={onQuickAction}
        isBusy={false}
        {...overrides}
      />,
    );
    return { onSubmit, onChange, onQuickAction, user: userEvent.setup() };
  };

  it('exposes an accessible name for the textarea', () => {
    setup();
    expect(screen.getByLabelText('Mensagem para o Neguin')).toBeInTheDocument();
  });

  it('renders as a textarea so multi-line input is possible', () => {
    setup();
    const field = screen.getByLabelText('Mensagem para o Neguin');
    expect(field.tagName).toBe('TEXTAREA');
    /* Tells iOS to label the key as "send" rather than "return". */
    expect(field).toHaveAttribute('enterKeyHint', 'send');
  });

  it('submits on Enter', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Mensagem para o Neguin'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Shift+Enter so a newline can be typed', async () => {
    const { onSubmit, onChange, user } = setup();
    const field = screen.getByLabelText('Mensagem para o Neguin');

    await user.type(field, 'linha 1{Shift>}{Enter}{/Shift}linha 2');

    expect(onSubmit).not.toHaveBeenCalled();
    /* The control is uncontrolled in this harness, so we assert that some
       change payload carried the newline rather than a submission. */
    const values = onChange.mock.calls.map((call) => call[0] as string);
    expect(values.some((value) => value.includes('\n'))).toBe(true);
  });

  it('grows the textarea with its content up to the clamp', () => {
    /* jsdom reports scrollHeight as 0, so stub it to the scrollable height a
       real browser reports for long content. */
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);

    setup({ value: 'pergunta longa' });

    const field = screen.getByLabelText('Mensagem para o Neguin');
    /* 400px of content must clamp to the 120px maximum, not run away. */
    expect(field.style.height).toBe('120px');
    expect(field.style.overflowY).toBe('auto');
    scrollHeight.mockRestore();
  });

  it('grows to fit short content without scrolling internally', () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(48);

    setup({ value: 'oi' });

    const field = screen.getByLabelText('Mensagem para o Neguin');
    expect(field.style.height).toBe('48px');
    expect(field.style.overflowY).toBe('hidden');
    scrollHeight.mockRestore();
  });

  it('keeps the send button disabled while the input is blank', () => {
    setup({ value: '   ' });
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
  });

  it('disables submission while a response is pending', async () => {
    const { onSubmit, user } = setup({ isBusy: true });

    expect(screen.getByRole('button', { name: 'Aguarde a resposta' })).toBeDisabled();

    /* Even a direct Enter must not fire while busy. */
    await user.type(screen.getByLabelText('Mensagem para o Neguin'), '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('routes the quick-action button separately from the send button', async () => {
    const { onQuickAction, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Nova operação rápida' }));
    expect(onQuickAction).toHaveBeenCalledTimes(1);
  });
});