import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "@/app/api/documents.api";
import { DeleteConfirmModal } from "@/app/components/feedback/delete-confirm-modal";
import {
  getDocumentDisplayName,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from "@/app/lib/document";
import {
  ArrowRight,
  Clock3,
  FileText,
  FileUp,
  GitCompareArrows,
  MessageSquareText,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../../../styles/documents-page.css";

type DocumentItem = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
  status?: number | string;
  createdAt?: string;
  contentType?: string;
  mimeType?: string;
};

function statusClass(status: number | string | undefined) {
  const value = getDocumentStatusLabel(status);

  if (value === "Pending") return "doc-status doc-status--pending";
  if (value === "Processing") return "doc-status doc-status--processing";
  if (value === "Completed") return "doc-status doc-status--completed";
  if (value === "Ready") return "doc-status doc-status--ready";
  return "doc-status doc-status--unknown";
}

export function DocumentsPage() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function loadDocuments() {
    try {
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);

    try {
      await uploadDocument(file);
      await loadDocuments();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    setDeleteBusy(true);

    try {
      await deleteDocument(deleteId);
      setDeleteId(null);
      await loadDocuments();
    } finally {
      setDeleteBusy(false);
    }
  }

  const filteredDocuments = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) return documents;

    return documents.filter((doc) =>
      getDocumentDisplayName(doc).toLowerCase().includes(normalized),
    );
  }, [documents, search]);

  const aiReadyCount = documents.filter((doc) => {
    const value = getDocumentStatusLabel(doc.status);
    return value === "Completed" || value === "Ready";
  }).length;

  const processingCount = documents.filter((doc) => {
    const value = getDocumentStatusLabel(doc.status);
    return value === "Pending" || value === "Processing";
  }).length;

  return (
    <div className="documents-page">
      <section className="documents-hero surface-card">
        <div className="documents-hero__content">
          <div className="documents-hero__badge">
            <Sparkles size={15} />
            <span>{t("documents.heroBadge")}</span>
          </div>

          <h1>{t("documents.title")}</h1>
          <p>{t("documents.subtitle")}</p>

          <label className="documents-upload">
            <input
              type="file"
              className="documents-upload__input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />

            <div className="documents-upload__icon">
              {uploading ? <FileUp size={24} /> : <UploadCloud size={24} />}
            </div>

            <div className="documents-upload__content">
              <strong>
                {uploading
                  ? t("documents.uploading")
                  : t("documents.uploadTitle")}
              </strong>
              <span>{t("documents.uploadSubtitle")}</span>
            </div>
          </label>
        </div>

        <div className="documents-hero__stats">
          <div className="documents-stat-card">
            <p>{t("documents.totalDocuments")}</p>
            <h3>{documents.length}</h3>
          </div>

          <div className="documents-stat-card">
            <p>{t("documents.aiReady")}</p>
            <h3>{aiReadyCount}</h3>
          </div>

          <div className="documents-stat-card">
            <p>{t("documents.processingNow")}</p>
            <h3>{processingCount}</h3>
          </div>
        </div>
      </section>

      <section className="documents-library surface-card">
        <div className="documents-library__header">
          <div>
            <p className="section-kicker">{t("documents.libraryKicker")}</p>
            <h2>{t("documents.libraryTitle")}</h2>
            <p className="documents-library__subtitle">
              {t("documents.librarySubtitle")}
            </p>
          </div>

          <div className="documents-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("documents.searchPlaceholder")}
            />
          </div>
        </div>

        {loading ? (
          <div className="documents-empty">
            <div className="documents-empty__icon">
              <FileText size={22} />
            </div>
            <h3>{t("common.loading")}</h3>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="documents-empty">
            <div className="documents-empty__icon">
              <FileText size={22} />
            </div>
            <h3>{t("documents.emptyTitle")}</h3>
            <p>{t("documents.emptySubtitle")}</p>
          </div>
        ) : (
          <div className="documents-grid">
            {filteredDocuments.map((doc) => {
              const statusLabel = getDocumentStatusLabel(doc.status);

              return (
                <article key={doc.id} className="document-card">
                  <div className="document-card__top">
                    <div className="document-card__file">
                      <div className="document-card__file-icon">
                        <FileText size={20} />
                      </div>

                      <div className="document-card__file-info">
                        <h3>{getDocumentDisplayName(doc)}</h3>
                        <p>{getDocumentTypeLabel(doc)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteId(doc.id)}
                      className="document-card__delete"
                      aria-label={t("documents.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="document-card__meta">
                    <span className={statusClass(doc.status)}>
                      {t(
                        `documents.status.${statusLabel.toLowerCase()}`,
                        statusLabel,
                      )}
                    </span>

                    <span className="document-card__meta-chip">
                      <Clock3 size={14} />
                      {t("documents.readyForAi")}
                    </span>
                  </div>

                  <div className="document-card__actions">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="document-card__action document-card__action--primary"
                    >
                      <ArrowRight size={16} />
                      <span>{t("documents.openDetails")}</span>
                    </Link>

                    <Link
                      to={`/documents/${doc.id}/chat`}
                      className="document-card__action"
                    >
                      <MessageSquareText size={16} />
                      <span>{t("nav.chat")}</span>
                    </Link>

                    <Link to="/compare" className="document-card__action">
                      <GitCompareArrows size={16} />
                      <span>{t("nav.compare")}</span>
                    </Link>
                  </div>

                  <div className="document-card__footer">
                    <span>
                      <WandSparkles size={14} />
                      {t("documents.actions")}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <DeleteConfirmModal
        open={deleteId !== null}
        title={t("deleteModal.title")}
        description={t("deleteModal.description")}
        confirmLabel={t("deleteModal.delete")}
        cancelLabel={t("deleteModal.cancel")}
        busy={deleteBusy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
