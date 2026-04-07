import { Trash2 } from "lucide-react";
import { ConfirmModal } from "./confirm-modal";

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
  return (
    <ConfirmModal
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      busy={busy}
      tone="danger"
      icon={<Trash2 size={22} />}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
