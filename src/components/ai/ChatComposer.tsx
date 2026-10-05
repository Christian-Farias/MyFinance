import React, { useEffect, useRef } from 'react';
import { Send, Plus, Square } from 'lucide-react';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAction: () => void;
  isBusy: boolean;
  disabled?: boolean;
}

/** Beyond this the textarea stops growing and starts scrolling internally. */
const MAX_TEXTAREA_H = 120;

/**
 * Message composer.
 *
 * A textarea rather than an `<input>`: Enter submits and Shift+Enter inserts a
 * newline, which is the convention every other chat surface uses and the only
 * way to compose a multi-line question. It grows with its content up to
 * `MAX_TEXTAREA_H` so a long question never pushes the send button off screen.
 */
export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  onChange,
  onSubmit,
  onQuickAction,
  isBusy,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Grow to fit content. scrollHeight is only meaningful once the height is
     released back to `auto`, otherwise it reports the clamped height and the
     box can never expand again. */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_H);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_H ? 'auto' : 'hidden';
  }, [value]);

  const canSend = value.trim().length > 0 && !isBusy && !disabled;

  const handleSubmit = () => {
    if (!canSend) return;
    onSubmit();
    /* Return focus so the keyboard stays open for the next question. */
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;

    /* Shift+Enter is the newline. Modifier must be released explicitly —
       otherwise the newline lands after the character submission. */
    if (event.shiftKey) return;

    event.preventDefault();
    handleSubmit();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      className="chat-composer"
    >
      <button
        type="button"
        onClick={onQuickAction}
        className="chat-composer-side-btn"
        aria-label="Nova operação rápida"
        title="Ação rápida"
      >
        <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>

      <label htmlFor="chat-composer-input" className="sr-only">
        Mensagem para o Neguin
      </label>
      <textarea
        id="chat-composer-input"
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte algo ou peça uma ação..."
        rows={1}
        enterKeyHint="send"
        /* 16px is not a style choice: anything smaller makes iOS Safari
           zoom the viewport on focus. */
        style={{ fontSize: '16px' }}
        disabled={disabled}
        className="chat-composer-input"
      />

      <button
        type="submit"
        disabled={!canSend}
        className="chat-composer-send"
        aria-label={isBusy ? 'Aguarde a resposta' : 'Enviar mensagem'}
      >
        {isBusy ? (
          <Square size={14} fill="currentColor" aria-hidden="true" />
        ) : (
          <Send size={16} aria-hidden="true" />
        )}
      </button>
    </form>
  );
};