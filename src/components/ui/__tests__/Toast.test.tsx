import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ToastProvider, useToast } from '../Toast';
import { ConfirmDialog } from '../ConfirmDialog';

describe('Toast', () => {
  function Trigger({ message = 'Salvo', options }: { message?: string; options?: Parameters<ReturnType<typeof useToast>['show']>[1] }) {
    const toast = useToast();
    return (
      <button type="button" onClick={() => toast.show(message, options)}>
        Disparar
      </button>
    );
  }

  it('shows a message with a polite live region', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Disparar' }));

    expect(await screen.findByText('Salvo')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not throw when used outside a provider', () => {
    // Pages render before the provider in some trees; the hook must degrade.
    expect(() => render(<Trigger />)).not.toThrow();
  });

  it('dismisses on request', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Disparar' }));
    await screen.findByText('Salvo');

    await user.click(screen.getByRole('button', { name: 'Dispensar notificação' }));
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the duration', () => {
    vi.useFakeTimers();
    // fireEvent rather than userEvent: userEvent awaits timers internally,
    // which never fire while the clock is faked.
    render(
      <ToastProvider>
        <Trigger options={{ duration: 1000 }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Disparar' }));
    expect(screen.getByText('Salvo')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.queryByText('Salvo')).not.toBeInTheDocument();
  });

  it('defaults an undo toast to 8s, past the 4s used otherwise', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger
          message="Excluído"
          options={{ action: { label: 'Desfazer', onClick: vi.fn() } }}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Disparar' }));
    // 4s would have removed a plain toast by now.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Excluído')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByText('Excluído')).not.toBeInTheDocument();
  });

  it('offers undo for a destructive action and invokes the handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ToastProvider>
        <Trigger
          message="Lançamento excluído"
          options={{ action: { label: 'Desfazer', onClick } }}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Disparar' }));
    await user.click(await screen.findByRole('button', { name: /Desfazer/ }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Lançamento excluído')).not.toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  const noop = vi.fn();

  it('is a labelled modal dialog', () => {
    render(
      <ConfirmDialog
        open
        onClose={noop}
        onConfirm={noop}
        title="Excluir conta"
        description="Esta ação não pode ser desfeita."
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Excluir conta');
  });

  it('confirms only when the destructive action is chosen', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Excluir conta"
        confirmLabel="Excluir"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Excluir conta" />,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('uses a neutral confirm label when the action is not destructive', () => {
    render(
      <ConfirmDialog
        open
        onClose={noop}
        onConfirm={noop}
        title="Confirmar"
        confirmLabel="Salvar"
        tone="accent"
      />,
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('closes itself after confirming', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Excluir conta"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('nested dialogs', () => {
  it('restores scrolling only after the last dialog closes', async () => {
    function Nested() {
      const [outer, setOuter] = useState(true);
      const [inner, setInner] = useState(true);
      return (
        <>
          <ConfirmDialog
            open={outer}
            onClose={() => setOuter(false)}
            onConfirm={() => setOuter(false)}
            title="Externo"
          />
          <ConfirmDialog
            open={inner}
            onClose={() => setInner(false)}
            onConfirm={() => setInner(false)}
            title="Interno"
          />
        </>
      );
    }

    const { rerender } = render(<Nested />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Externo"
      />,
    );

    // Outer still open → still locked.
    expect(document.body.style.overflow).toBe('hidden');
  });
});