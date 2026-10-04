import { useId } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Form field wrapper.
 *
 * The project had 46 inputs, 23 selects and 79 <label> elements with zero
 * `htmlFor` and zero `id`, so no control had an accessible name. Visual
 * labelling worked; programmatic labelling did not.
 *
 * This component generates the id and wires label / control / error together.
 */

type ControlTone = 'default' | 'positive' | 'negative';

export interface FieldProps {
  label: string;
  /** Visual only — the real name comes from <label htmlFor>. */
  hint?: string;
  error?: string;
  /** Slot the control. Receives the ids it must spread onto the element. */
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  /** Renders the label for screen readers only. */
  hideLabel?: boolean;
  className?: string;
}

/**
 * A label + control + error triple that keeps the ids consistent.
 * `tone` recolours the prefix only — never used to carry meaning alone.
 */
export function Field({
  label,
  hint,
  error,
  children,
  hideLabel = false,
  className = '',
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'field-label'}>
        {label}
      </label>

      {children({ id, describedBy, invalid })}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="field-error">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
  name?: string;
  autoFocus?: boolean;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  step?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}

/** Single-line text input with an associated label. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  hint,
  hideLabel,
  className = '',
  disabled,
  name,
  autoFocus,
  maxLength,
  min,
  max,
  step,
  inputMode,
}: TextFieldProps) {
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      hideLabel={hideLabel}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className="field"
        />
      )}
    </Field>
  );
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
  name?: string;
}

/** Select with an associated label — the 23 selects had none. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  hideLabel = false,
  className = '',
  disabled = false,
  name,
}: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} hideLabel={hideLabel} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          name={name}
          className="field-select"
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * Checkbox. The bare inputs were 16px; the clickable area is now the whole
 * 44px label (WCAG 2.5.8 asks for 24px, the platform norm is 44px).
 */
export function CheckboxField({ label, checked, onChange, className = '' }: CheckboxFieldProps) {
  return (
    <label className={`checkbox-label ${className}`}>
      <input
        type="checkbox"
        className="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export interface CheckboxGroupFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * Checkbox whose description sits above the control.
 * Used where the original markup wrapped the input in a <div> with a <span>,
 * which left the control completely unnamed.
 */
export function CheckboxGroupField({
  label,
  checked,
  onChange,
  className = '',
}: CheckboxGroupFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <label htmlFor={id} className="checkbox-label -mt-1">
        <input
          id={id}
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>Sim</span>
      </label>
    </div>
  );
}

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: boolean;
  className?: string;
}

/**
 * "Observações" was an <input type="text"> in five modals, which cannot hold
 * a sentence. This is the textarea it should have been.
 */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  optional = false,
  className = '',
}: TextAreaFieldProps) {
  return (
    <Field
      label={optional ? `${label} (opcional)` : label}
      className={className}
    >
      {({ id, describedBy }) => (
        <textarea
          id={id}
          className="field py-2.5 resize-y min-h-[72px]"
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

export interface AmountFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  autoFocus?: boolean;
  step?: string;
  min?: string;
  id?: string;
}

/**
 * The prominent money input. Pairs a large tabular figure with an R$ prefix.
 */
export function AmountField({
  label,
  value,
  onChange,
  placeholder = '0,00',
  error,
  optional = false,
  className = '',
  autoFocus = false,
  step = '0.01',
  min = '0',
  id,
}: AmountFieldProps) {
  return (
    <Field label={optional ? `${label} (opcional)` : label} error={error} className={className}>
      {({ id: generatedId, describedBy, invalid }) => (
        <div className="field-amount-wrap">
          <span className="field-amount-prefix" aria-hidden="true">
            R$
          </span>
          <input
            id={id ?? generatedId}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            className="field-amount"
            value={value}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )}
    </Field>
  );
}

export interface ColorSwatchProps {
  color: string;
  selected: boolean;
  onSelect: (color: string) => void;
}

/** Readable name for each palette entry, so the choice is not colour-only. */
export const SWATCH_NAMES: Record<string, string> = {
  'var(--color-accent)': 'Roxo',
  'var(--color-positive)': 'Verde',
  'var(--color-info)': 'Azul',
  '#FFB74D': 'Amarelo',
  '#EC4899': 'Rosa',
  '#8A05BE': 'Ameixa',
  'var(--color-negative-strong)': 'Vermelho',
  '#1E293B': 'Grafite',
};

const SWATCH_BASE =
  'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110';

/**
 * One palette entry. The 20 swatches across three modals had no accessible
 * name and no exposed selected state.
 */
export function ColorSwatch({ color, selected, onSelect }: ColorSwatchProps) {
  const name = SWATCH_NAMES[color] ?? color;
  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      aria-label={name}
      aria-pressed={selected}
      title={name}
      className={`${SWATCH_BASE} ${selected ? 'scale-110 border-white' : 'border-transparent'}`}
      style={{ backgroundColor: color }}
    />
  );
}

export interface ColorSwatchRowProps {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

/** Labelled palette picker built on ColorSwatch. */
export function ColorSwatchRow({ label, colors, value, onChange }: ColorSwatchRowProps) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex items-center gap-2" role="group" aria-label={label}>
        {colors.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            selected={value === color}
            onSelect={onChange}
          />
        ))}
      </div>
    </div>
  );
}

export type { ControlTone };