import { useState } from 'react';
import { Modal } from './Modal';

/**
 * Confirmation dialog.
 *
 * CommitmentsPage deletes receivables and recurring items immediately on tap,
 * with no confirmation and no undo. Toast's undo is the faster path for
 * deletes; this dialog is for the irreversible cases.
 */

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  /** Explicit label. Defaults to "Excluir", which is wrong for neutral confirms. */
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'accent';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  tone = 'danger',
}: ConfirmDialogProps) {
  const [working, setWorking] = useState(false);

  const handleConfirm = () => {
    setWorking(true);
    try {
      onConfirm();
    } finally {
      setWorking(false);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      footer={
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={working}
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {working ? 'Processando…' : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
    </Modal>
  );
}