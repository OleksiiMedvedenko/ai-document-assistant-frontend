import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import "../../styles/delete-confirm-modal.css";

type DeleteConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <button
        type="button"
        className="delete-modal__backdrop"
        onClick={onCancel}
        aria-label={cancelLabel}
        disabled={busy}
      />

      <div className="delete-modal__card surface-card">
        <div className="delete-modal__top">
          <div className="delete-modal__icon">
            <AlertTriangle size={22} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="delete-modal__close"
            aria-label={cancelLabel}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="delete-modal__content">
          <h3 id="delete-modal-title">{title}</h3>
          <p id="delete-modal-description">{description}</p>
        </div>

        <div className="delete-modal__actions">
          <button
            type="button"
            onClick={onCancel}
            className="delete-modal__button delete-modal__button--secondary"
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="delete-modal__button delete-modal__button--danger"
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="delete-modal__spinner" />
                <span>...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
