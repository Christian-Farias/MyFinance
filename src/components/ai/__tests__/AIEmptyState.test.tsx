import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIEmptyState } from '../AIEmptyState';

/**
 * Replaces the two greeting messages that used to be seeded into `messages`
 * on mount. Beyond being clutter, they made a real empty state impossible:
 * the starters were gated on `messages.length <= 2`.
 */
describe('AIEmptyState', () => {
  it('personalises the greeting with the first name only', () => {
    render(
      <AIEmptyState userName="Maria Clara Souza" starters={[]} onStarterClick={vi.fn()} />,
    );
    const heading = screen.getByRole('heading', { level: 2 }).textContent ?? '';

    /* First name only — "Maria Clara Souza" would overflow the hero. */
    expect(heading).toMatch(/, Maria$/);
    /* The greeting itself depends on the clock, so assert the shape. */
    expect(heading).toMatch(/^(Bom dia|Boa tarde|Boa noite)/);
  });

  it('omits the name when the profile has none', () => {
    render(<AIEmptyState userName="" starters={[]} onStarterClick={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 }).textContent ?? '';
    expect(heading.endsWith(',')).toBe(false);
  });

  it('states that analysis stays on the device', () => {
    render(<AIEmptyState starters={[]} onStarterClick={vi.fn()} />);
    expect(screen.getByText(/não saem do dispositivo/)).toBeInTheDocument();
  });

  it('forwards the clicked starter instead of navigating away', async () => {
    const onStarterClick = vi.fn();
    const user = userEvent.setup();

    render(
      <AIEmptyState
        starters={['Como estão minhas finanças?', 'Posso gastar R$ 500?']}
        onStarterClick={onStarterClick}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /Como estão minhas finanças\?/ }),
    );

    expect(onStarterClick).toHaveBeenCalledTimes(1);
    expect(onStarterClick).toHaveBeenCalledWith('Como estão minhas finanças?');
  });

  it('renders every starter as a list item so the count is announced', () => {
    render(
      <AIEmptyState
        starters={['a', 'b', 'c', 'd']}
        onStarterClick={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});