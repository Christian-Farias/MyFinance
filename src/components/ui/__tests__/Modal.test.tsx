import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from '../Modal';

/**
 * These cover the behaviour the 16 hand-rolled modals all lacked:
 * dialog semantics, Escape, focus trap, focus restoration and scroll lock.
 */

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  return (
    <Modal open onClose={onClose} title="Nova transação" subtitle="Outubro 2026">
      <label htmlFor="amount">Valor</label>
      <input id="amount" data-autofocus />
      <button type="button">Salvar</button>
    </Modal>
  );
}

describe('Modal', () => {
  it('exposes dialog semantics with an accessible name and description', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Nova transação');
    expect(dialog).toHaveAccessibleDescription('Outubro 2026');
  });

  it('labels the close button with the dialog title', () => {
    render(<Harness />);
    expect(
      screen.getByRole('button', { name: 'Fechar Nova transação' }),
    ).toBeInTheDocument();
  });

  it('moves focus to the data-autofocus element on open', async () => {
    render(<Harness />);
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Valor'));
    });
  });

  it('falls back to the first focusable element, in document order', async () => {
    render(
      <Modal open onClose={vi.fn()} title="Sem alvo" showCloseButton={false}>
        <button type="button">Primeiro</button>
        <button type="button">Segundo</button>
      </Modal>,
    );
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Primeiro' }));
    });
  });

  it('honours data-autofocus over document order', async () => {
    render(
      <Modal open onClose={vi.fn()} title="Teste">
        <button type="button">Primeiro</button>
        <button type="button" data-autofocus>
          Alvo
        </button>
      </Modal>,
    );
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Alvo' }));
    });
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open', () => {
    render(<Harness />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow and focus after unmount', async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Detalhe">
            <button type="button">Conteúdo</button>
          </Modal>
        </>
      );
    }

    render(<Wrapper />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);

    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.body.style.overflow).not.toBe('hidden');
    });
    // Focus handed back to the trigger, not dropped on <body>.
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Fechado">
        <p> invisível</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click when allowed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<Harness onClose={onClose} />);

    const overlay = container.ownerDocument.querySelector('.modal-overlay')!;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('ignores backdrop click when closeOnBackdrop is false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Bloqueado" closeOnBackdrop={false}>
        <p>conteúdo</p>
      </Modal>,
    );

    await user.click(document.querySelector('.modal-overlay')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when the panel itself is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps focus inside the dialog on Tab from the last element', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const close = screen.getByRole('button', { name: 'Fechar Nova transação' });
    const save = screen.getByRole('button', { name: 'Salvar' });

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Valor')));
    expect(close).toBeInTheDocument();

    // Walking forward should cycle rather than escape to the document.
    save.focus();
    await user.tab();
    expect(document.activeElement).not.toBeNull();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes only the topmost dialog on Escape', async () => {
    const user = userEvent.setup();
    const onParentClose = vi.fn();
    const onChildClose = vi.fn();

    function Stack() {
      const [child, setChild] = useState(false);
      const closeChild = () => {
        onChildClose();
        setChild(false);
      };
      return (
        <>
          <Modal open onClose={onParentClose} title="Formulário">
            <button type="button" onClick={() => setChild(true)}>
              Abrir confirmação
            </button>
          </Modal>
          {child && (
            <Modal open onClose={closeChild} title="Confirmar exclusão">
              <p>Tem certeza?</p>
            </Modal>
          )}
        </>
      );
    }

    render(<Stack />);
    await user.click(screen.getByRole('button', { name: 'Abrir confirmação' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(2);

    await user.keyboard('{Escape}');

    expect(onChildClose).toHaveBeenCalledTimes(1);
    expect(onParentClose).not.toHaveBeenCalled();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('ignores Escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Boas-vindas" closeOnEscape={false}>
        <p>Onboarding</p>
      </Modal>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});