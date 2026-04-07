import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import "../../styles/confirm-modal.css";

type ConfirmModalTone = "danger" | "warning" | "info";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  tone?: ConfirmModalTone;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

function resolveToneIcon(tone: ConfirmModalTone) {
  if (tone === "danger") return <AlertTriangle size={22} />;
  if (tone === "info") return <CheckCircle2 size={22} />;
  return <RotateCcw size={22} />;
}

function resolveConfirmIcon(tone: ConfirmModalTone, busy: boolean) {
  if (busy) return <Loader2 size={16} className="confirm-modal__spinner" />;
  if (tone === "danger") return <AlertTriangle size={16} />;
  if (tone === "info") return <CheckCircle2 size={16} />;
  return <RotateCcw size={16} />;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  tone = "warning",
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const resolvedIcon = icon ?? resolveToneIcon(tone);

  return (
    <div
      className="confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <button
        type="button"
        className="confirm-modal__backdrop"
        onClick={onCancel}
        aria-label={cancelLabel}
        disabled={busy}
      />

      <div
        className={`confirm-modal__card confirm-modal__card--${tone} surface-card`}
      >
        <div className="confirm-modal__top">
          <div className={`confirm-modal__icon confirm-modal__icon--${tone}`}>
            {resolvedIcon}
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="confirm-modal__close"
            aria-label={cancelLabel}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirm-modal__content">
          <h3 id="confirm-modal-title">{title}</h3>
          <p id="confirm-modal-description">{description}</p>
        </div>

        <div className="confirm-modal__actions">
          <button
            type="button"
            onClick={onCancel}
            className="confirm-modal__button confirm-modal__button--secondary"
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`confirm-modal__button confirm-modal__button--${tone}`}
            disabled={busy}
          >
            {resolveConfirmIcon(tone, busy)}
            <span>{busy ? "..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
