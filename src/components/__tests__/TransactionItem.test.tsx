import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionItem } from '../TransactionItem';
import type { Transaction } from '../../types';

/**
 * TransactionItem is the app's primary list interaction and it rendered as a
 * `<div onClick>`. That made every transaction row unreachable by keyboard and
 * invisible to assistive technology — WCAG 2.1.1. These lock in the real
 * `<button>` so the div does not creep back in.
 */

const expense: Transaction = {
  id: 'tx-1',
  description: 'Supermercado Pão de Açúcar',
  amount: 147.3,
  type: 'expense',
  categoryId: 'cat-food',
  accountId: 'acc-1',
  date: '2026-03-12',
  createdAt: '2026-03-12T10:00:00.000Z',
} as Transaction;

describe('TransactionItem', () => {
  it('renders a real button when an onClick is provided', () => {
    render(<TransactionItem transaction={expense} onClick={vi.fn()} />);
    const row = screen.getByRole('button');
    expect(row.tagName).toBe('BUTTON');
    expect(row).toHaveAttribute('type', 'button');
  });

  it('is reachable and activatable from the keyboard', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<TransactionItem transaction={expense} onClick={onClick} />);

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('exposes the description as the accessible name', () => {
    render(<TransactionItem transaction={expense} onClick={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /Supermercado Pão de Açúcar/ }),
    ).toBeInTheDocument();
  });

  it('falls back to a div when there is no onClick, so it is not a focus trap', () => {
    render(<TransactionItem transaction={expense} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Supermercado Pão de Açúcar')).toBeInTheDocument();
  });

  it('shows the amount and keeps transfers off the income colour', () => {
    const transfer = { ...expense, type: 'transfer' } as Transaction;
    const { rerender } = render(
      <TransactionItem transaction={expense} onClick={vi.fn()} />,
    );
    expect(screen.getByText(/147,30/)).toBeInTheDocument();

    rerender(<TransactionItem transaction={transfer} onClick={vi.fn()} />);
    expect(screen.getByText(/147,30/).className).not.toMatch(/text-positive/);
  });
});