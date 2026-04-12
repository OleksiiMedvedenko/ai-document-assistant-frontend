import { Folder, FolderOpen, Loader2, PencilLine, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../../styles/folder-editor-modal.css";

type FolderEditorModalProps = {
  open: boolean;
  mode: "create" | "edit";
  busy?: boolean;
  initialValue?: {
    name?: string;
    namePl?: string;
    nameEn?: string;
    nameUa?: string;
  } | null;
  title: string;
  subtitle: string;
  labels: {
    name: string;
    namePl: string;
    nameEn: string;
    nameUa: string;
    save: string;
    cancel: string;
  };
  onSubmit: (payload: {
    name: string;
    namePl: string;
    nameEn: string;
    nameUa: string;
  }) => void;
  onCancel: () => void;
};

function normalizeName(value: string) {
  return value.trim();
}

export function FolderEditorModal({
  open,
  mode,
  busy = false,
  initialValue,
  title,
  subtitle,
  labels,
  onSubmit,
  onCancel,
}: FolderEditorModalProps) {
  const [name, setName] = useState("");
  const [namePl, setNamePl] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameUa, setNameUa] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialValue?.name ?? "");
    setNamePl(initialValue?.namePl ?? "");
    setNameEn(initialValue?.nameEn ?? "");
    setNameUa(initialValue?.nameUa ?? "");
  }, [initialValue, open]);

  const canSubmit = useMemo(() => {
    return (
      normalizeName(name).length > 0 &&
      normalizeName(namePl).length > 0 &&
      normalizeName(nameEn).length > 0 &&
      normalizeName(nameUa).length > 0
    );
  }, [name, namePl, nameEn, nameUa]);

  if (!open) {
    return null;
  }

  const modeIcon =
    mode === "edit" ? <PencilLine size={20} /> : <Plus size={20} />;

  return (
    <div className="folder-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="folder-modal__backdrop"
        onClick={onCancel}
        aria-label={labels.cancel}
        disabled={busy}
      />

      <div className="folder-modal__card surface-card">
        <div className="folder-modal__top">
          <div className="folder-modal__icon">
            {mode === "edit" ? <FolderOpen size={20} /> : <Folder size={20} />}
          </div>

          <button
            type="button"
            className="folder-modal__close"
            onClick={onCancel}
            aria-label={labels.cancel}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="folder-modal__content">
          <div className="folder-modal__heading">
            <div className="folder-modal__heading-icon">{modeIcon}</div>
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="folder-modal__grid">
            <label className="folder-modal__field">
              <span>{labels.name}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy}
              />
            </label>

            <label className="folder-modal__field">
              <span>{labels.namePl}</span>
              <input
                value={namePl}
                onChange={(event) => setNamePl(event.target.value)}
                disabled={busy}
              />
            </label>

            <label className="folder-modal__field">
              <span>{labels.nameEn}</span>
              <input
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                disabled={busy}
              />
            </label>

            <label className="folder-modal__field">
              <span>{labels.nameUa}</span>
              <input
                value={nameUa}
                onChange={(event) => setNameUa(event.target.value)}
                disabled={busy}
              />
            </label>
          </div>

          <div className="folder-modal__actions">
            <button
              type="button"
              className="folder-modal__button folder-modal__button--secondary"
              onClick={onCancel}
              disabled={busy}
            >
              {labels.cancel}
            </button>

            <button
              type="button"
              className="folder-modal__button folder-modal__button--primary"
              onClick={() =>
                onSubmit({
                  name: normalizeName(name),
                  namePl: normalizeName(namePl),
                  nameEn: normalizeName(nameEn),
                  nameUa: normalizeName(nameUa),
                })
              }
              disabled={busy || !canSubmit}
            >
              {busy ? (
                <Loader2 size={16} className="folder-modal__spinner" />
              ) : null}
              <span>{labels.save}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
