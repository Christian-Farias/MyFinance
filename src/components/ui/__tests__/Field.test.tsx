import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectField, TextField, CheckboxField, AmountField, ColorSwatch } from '../Field';

/**
 * The project had 46 inputs, 23 selects and 79 labels with zero htmlFor and
 * zero id, so no control had an accessible name. These assert that is fixed.
 */

describe('TextField', () => {
  it('associates the label and reports the typed value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField label="Nome da Conta" value="" onChange={onChange} />);
    const input = screen.getByLabelText('Nome da Conta');
    await user.type(input, 'Nubank');
    expect(onChange).toHaveBeenCalledTimes(6);
    expect(onChange).toHaveBeenLastCalledWith('k');
  });

  it('marks the control invalid and links the message when error is set', () => {
    render(<TextField label="Conta" value="" onChange={vi.fn()} error="Campo obrigatório" />);
    const input = screen.getByLabelText('Conta');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Campo obrigatório');
  });

  it('passes through placeholder and maxLength', () => {
    render(
      <TextField
        label="E-mail"
        value="a@b.com"
        onChange={vi.fn()}
        placeholder="voce@email.com"
        maxLength={120}
      />,
    );
    const input = screen.getByLabelText('E-mail') as HTMLInputElement;
    expect(input.placeholder).toBe('voce@email.com');
    expect(input.maxLength).toBe(120);
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});

describe('SelectField', () => {
  const options = [
    { value: '', label: 'Selecione' },
    { value: 'conta-1', label: 'Conta Corrente' },
    { value: 'conta-2', label: 'Poupança' },
  ];

  it('associates the label with the select', () => {
    render(<SelectField label="Conta" value="" onChange={vi.fn()} options={options} />);
    expect(screen.getByLabelText('Conta')).toBeInTheDocument();
  });

  it('exposes the current value as a selectable option', () => {
    render(<SelectField label="Conta" value="conta-2" onChange={vi.fn()} options={options} />);
    expect(screen.getByLabelText('Conta')).toHaveValue('conta-2');
  });

  it('reports the chosen value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField label="Conta" value="" onChange={onChange} options={options} />);

    await user.selectOptions(screen.getByLabelText('Conta'), 'conta-1');
    expect(onChange).toHaveBeenCalledWith('conta-1');
  });

  it('describes the control with its error', () => {
    render(
      <SelectField label="Conta" value="" onChange={vi.fn()} options={options} error="Obrigatório" />,
    );
    const select = screen.getByLabelText('Conta');

    expect(select).toHaveAccessibleDescription('Obrigatório');
    expect(select).toHaveAttribute('aria-invalid', 'true');
  });

  it('describes the control with its hint when there is no error', () => {
    render(
      <SelectField label="Conta" value="" onChange={vi.fn()} options={options} hint="Obrigatório" />,
    );
    expect(screen.getByLabelText('Conta')).toHaveAccessibleDescription('Obrigatório');
  });

  it('keeps the label available to assistive tech when hidden visually', () => {
    render(
      <SelectField label="Conta" value="" onChange={vi.fn()} options={options} hideLabel />,
    );
    expect(screen.getByLabelText('Conta')).toBeInTheDocument();
  });
});

describe('CheckboxField', () => {
  it('labels the checkbox and reflects its state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxField label="Notificações" checked={false} onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Notificações' });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is reachable by keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxField label="Notificações" checked={false} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Notificações' })).toHaveFocus();
  });
});

describe('AmountField', () => {
  it('labels the amount input', () => {
    render(<AmountField label="Valor" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Valor')).toBeInTheDocument();
  });

  it('requests a decimal keypad on mobile', () => {
    render(<AmountField label="Valor" value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Valor');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('marks the optional variant in the label', () => {
    render(<AmountField label="Valor" value="" onChange={vi.fn()} optional />);
    expect(screen.getByLabelText('Valor (opcional)')).toBeInTheDocument();
  });

  it('flags invalid state when an error is present', () => {
    render(<AmountField label="Valor" value="" onChange={vi.fn()} error="Informe um valor" />);
    expect(screen.getByLabelText('Valor')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('ColorSwatch', () => {
  it('names each colour instead of relying on the colour alone', () => {
    render(<ColorSwatch color="var(--color-accent)" selected={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Roxo' })).toBeInTheDocument();
  });

  it('falls back to the raw value for an unnamed colour', () => {
    render(<ColorSwatch color="#123456" selected={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: '#123456' })).toBeInTheDocument();
  });

  it('exposes the selected state', () => {
    render(<ColorSwatch color="var(--color-positive)" selected onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Verde' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('reports the chosen colour', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ColorSwatch color="var(--color-positive)" selected={false} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Verde' }));
    expect(onSelect).toHaveBeenCalledWith('var(--color-positive)');
  });
});