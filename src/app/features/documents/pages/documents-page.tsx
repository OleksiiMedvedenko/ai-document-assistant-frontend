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
  Clock3,
  FileText,
  FileUp,
  MessageSquareText,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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

  if (value === "Pending") return "status-pending";
  if (value === "Processing") return "status-processing";
  if (value === "Completed") return "status-completed";
  if (value === "Ready") return "status-ready";
  return "status-unknown";
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

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="surface-elevated rounded-[28px] p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
            <Sparkles size={14} />
            {t("documents.heroBadge")}
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl">
            {t("documents.title")}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-soft">
            {t("documents.subtitle")}
          </p>

          <label className="mt-8 block cursor-pointer rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--panel-soft)] p-8 transition hover:bg-[var(--panel-strong)]">
            <input
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />

            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl surface-soft p-4">
                <FileUp size={28} />
              </div>

              <h3 className="text-xl font-semibold">
                {uploading
                  ? t("documents.uploading")
                  : t("documents.uploadTitle")}
              </h3>

              <p className="mt-2 text-sm text-soft">
                {t("documents.uploadSubtitle")}
              </p>
            </div>
          </label>
        </div>

        <div className="surface-elevated rounded-[28px] p-6 lg:p-8">
          <p className="text-sm text-soft">{t("documents.quickStats")}</p>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl surface-soft p-4">
              <p className="text-sm text-muted">
                {t("documents.totalDocuments")}
              </p>
              <p className="mt-2 text-3xl font-semibold">{documents.length}</p>
            </div>

            <div className="rounded-2xl surface-soft p-4">
              <p className="text-sm text-muted">{t("documents.aiReady")}</p>
              <p className="mt-2 text-3xl font-semibold">{aiReadyCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {t("documents.libraryTitle")}
            </h2>
            <p className="mt-1 text-sm text-soft">
              {t("documents.librarySubtitle")}
            </p>
          </div>

          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("documents.searchPlaceholder")}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] py-3 pl-11 pr-4 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] surface-soft p-10 text-center text-soft">
            {t("common.loading")}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-[28px] surface-soft p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl surface-soft">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-semibold">
              {t("documents.emptyTitle")}
            </h3>
            <p className="mt-2 text-soft">{t("documents.emptySubtitle")}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredDocuments.map((doc) => {
              const statusLabel = getDocumentStatusLabel(doc.status);

              return (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="group rounded-[24px] surface-elevated p-5 transition hover:-translate-y-1 hover:bg-[var(--panel-strong)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl surface-soft">
                      <FileText size={22} />
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(doc.status)}`}
                      >
                        {t(
                          `documents.status.${statusLabel.toLowerCase()}`,
                          statusLabel,
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeleteId(doc.id);
                        }}
                        className="rounded-xl surface-soft p-2 text-soft transition hover:bg-red-500/15 hover:text-red-300"
                        aria-label={t("documents.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="line-clamp-2 break-words text-lg font-semibold">
                      {getDocumentDisplayName(doc)}
                    </h3>

                    <div className="mt-3 inline-flex max-w-full rounded-full surface-soft px-3 py-1 text-xs text-soft">
                      <span className="truncate">
                        {getDocumentTypeLabel(doc)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-soft">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        {t("documents.readyForAi")}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <WandSparkles size={14} />
                        {t("documents.actions")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm text-soft">
                    <span>{t("documents.openDetails")}</span>

                    <div className="inline-flex items-center gap-2">
                      <MessageSquareText size={16} />
                      <span className="hidden sm:inline">{t("nav.chat")}</span>
                    </div>
                  </div>
                </Link>
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
