import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, RotateCcw, X, XCircle } from 'lucide-react';

/**
 * Toast notifications.
 *
 * `.toast-container` and a `toast → 70` z-index layer were both designed in
 * `index.css` and never used: no component existed. These are the missing
 * half of the destructive-action story too — undo is faster than confirming.
 */

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. `0` keeps it until dismissed. */
  duration?: number;
  /** Label + handler for an undo affordance. */
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends Required<Pick<ToastOptions, 'tone' | 'duration'>> {
  id: number;
  message: string;
  action?: ToastOptions['action'];
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Returns the toast API. Safe to call outside a provider — it no-ops. */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  const noop = useMemo<ToastApi>(
    () => ({ show: () => {}, success: () => {}, error: () => {} }),
    [],
  );
  return context ?? noop;
}

const TONE_ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

const TONE_CLASS = {
  success: 'text-positive',
  error: 'text-negative',
  info: 'text-accent',
  warning: 'text-warning',
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      const tone = options.tone ?? 'info';
      const duration = options.duration ?? (options.action ? 8000 : 4000);

      setToasts((current) => [
        ...current.slice(-2),
        { id, message, tone, duration, action: options.action },
      ]);

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, options) => show(message, { ...options, tone: 'success' }),
      error: (message, options) => show(message, { ...options, tone: 'error', duration: options?.duration ?? 6000 }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((toast) => {
            const Icon = TONE_ICON[toast.tone];
            return (
              <div
                key={toast.id}
                className="card pointer-events-auto flex items-start gap-3 w-full max-w-sm px-4 py-3 shadow-2xl animate-slide-up"
              >
                <Icon
                  size={17}
                  aria-hidden="true"
                  className={`shrink-0 mt-0.5 ${TONE_CLASS[toast.tone]}`}
                />
                <p className="flex-1 text-xs text-ink leading-relaxed">
                  {toast.message}
                </p>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismiss(toast.id);
                    }}
                    className="btn btn-sm btn-accent-ghost shrink-0 -my-1 -mr-1"
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dispensar notificação"
                  className="btn btn-icon btn-sm btn-ghost shrink-0 -my-1 -mr-1"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}