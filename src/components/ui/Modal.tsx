import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Base dialog for the whole product.
 *
 * Replaces the 16 hand-rolled overlays, which shared CSS classes but had
 * zero dialog semantics: no role="dialog", no aria-modal, no Escape handler,
 * no focus trap, no focus restoration and no scroll lock. Five of them closed
 * on backdrop click and eleven did not.
 *
 * Everything a modal needs to be operable by keyboard and legible to a screen
 * reader lives here. Call sites only describe content.
 */

/** Selector for everything that can hold focus inside the dialog. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Visibility without touching layout.
 *
 * `offsetParent` is the usual trick but it is unusable here: it is null for
 * every element under a `position: fixed` overlay in a real browser, and null
 * for *everything* in jsdom, which would leave the trap focusing the panel.
 */
function isFocusable(el: HTMLElement): boolean {
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return false;

  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.hasAttribute('hidden')) return false;
    if (window.getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isFocusable);
}

/**
 * Nested dialogs stack, so the scroll lock must be reference-counted —
 * closing an inner dialog must not restore scrolling while an outer one is open.
 */
let scrollLockCount = 0;
let savedOverflow = '';

function lockScroll() {
  if (scrollLockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = savedOverflow;
  }
}

export type ModalVariant = 'dialog' | 'sheet' | 'command';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Rendered under the title. Used for context such as "Atual: R$ 400 de R$ 1.000". */
  subtitle?: string;
  /** Hide the title visually but keep it for assistive tech. */
  hideTitle?: boolean;
  variant?: ModalVariant;
  /** Max width of the panel. Ignored by `sheet`. */
  size?: 'sm' | 'md' | 'lg';
  /** Clicking the backdrop closes the dialog. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Escape closes the dialog. Defaults to true. Set false for gated flows. */
  closeOnEscape?: boolean;
  /** Show the mobile drag affordance. Defaults to true for `sheet`. */
  withHandle?: boolean;
  /** Pin the close button in the header. Set false when the body has its own footer actions. */
  showCloseButton?: boolean;
  /** Marks the element that should receive focus on open. */
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const PANEL_SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

/**
 * Ids of the dialogs currently open, innermost last.
 *
 * Every Modal attached its own document-level keydown listener, so with a
 * dialog stacked on a dialog (a ConfirmDialog over a form modal) a single
 * Escape closed both. The parent must survive.
 */
const openDialogs: string[] = [];

const VARIANT_ANIMATION: Record<ModalVariant, string> = {
  dialog: 'animate-fade-in',
  sheet: 'animate-slide-up',
  command: 'animate-fade-in',
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  hideTitle = false,
  variant = 'dialog',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  withHandle,
  showCloseButton = true,
  children,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const titleId = useId();
  const subtitleId = useId();
  const showHandle = withHandle ?? variant === 'sheet';

  const focusFirst = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const preferred = panel.querySelector<HTMLElement>('[data-autofocus]');
    if (preferred) {
      preferred.focus();
      return;
    }
    const focusable = getFocusable(panel);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      panel.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    // Remember the trigger so focus can be handed back on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    lockScroll();
    focusFirst();
    openDialogs.push(dialogId);
    const isTopmost = () => openDialogs[openDialogs.length - 1] === dialogId;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!closeOnEscape || !isTopmost()) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !isTopmost()) return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Wrap at both ends so focus never escapes to the page behind.
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Only the topmost dialog reacts to Escape.
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const at = openDialogs.lastIndexOf(dialogId);
      if (at !== -1) openDialogs.splice(at, 1);
      unlockScroll();
      // Defer so the trigger is focusable again before we hand focus back.
      requestAnimationFrame(() => previouslyFocused?.focus?.());
    };
  }, [open, onClose, focusFirst]);

  if (!open) return null;

  const isCommand = variant === 'command';

  return createPortal(
    <div
      className={`modal-overlay ${VARIANT_ANIMATION[variant]}`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={
          isCommand
            ? // Command palette: anchored to the top, wider than a dialog.
              'w-full max-w-xl bg-panel border border-active rounded-3xl p-5 shadow-2xl flex flex-col outline-none'
            : `modal-panel w-full ${PANEL_SIZE[size]} px-5 sm:px-6 pt-5 sm:pt-6 outline-none`
        }
        style={isCommand ? { maxHeight: '80dvh' } : undefined}
      >
        {showHandle && <div className="bottom-sheet-handle md:hidden" aria-hidden="true" />}

        <div
          className={`flex items-start justify-between gap-3 border-b border-active ${
            hideTitle && !subtitle ? 'border-b-0' : 'pb-4'
          }`}
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              className={
                hideTitle
                  ? 'sr-only'
                  : 'text-base sm:text-lg font-bold text-ink tracking-tight'
              }
            >
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="mt-0.5 text-xs text-ink-muted">
                {subtitle}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label={`Fechar ${title}`}
              className="btn btn-icon btn-sm btn-ghost shrink-0 -mr-1 -mt-1"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="pt-4 flex-1 min-h-0">{children}</div>

        {footer && <div className="pt-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}