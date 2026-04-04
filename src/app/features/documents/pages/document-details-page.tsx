import {
  deleteDocument,
  extractDocument,
  getDocument,
  getDocumentStatus,
  getExtractions,
  summarizeDocument,
} from "@/app/api/documents.api";
import { DeleteConfirmModal } from "@/app/components/feedback/delete-confirm-modal";
import {
  getDocumentDisplayName,
  getDocumentMimeValue,
  getDocumentSizeLabel,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from "@/app/lib/document";
import {
  ArrowRight,
  Bot,
  FileText,
  GitCompareArrows,
  Loader2,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

type DocumentDto = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
  status?: number | string;
  createdAt?: string;
  contentType?: string;
  mimeType?: string;
  sizeInBytes?: number;
  fileSizeInBytes?: number;
};

type ExtractionItem = {
  id: string;
  extractionType?: string;
  createdAt?: string;
  resultJson?: string;
};

function statusClass(status: number | string | undefined) {
  const value = getDocumentStatusLabel(status);

  if (value === "Pending") return "status-pending";
  if (value === "Processing") return "status-processing";
  if (value === "Completed") return "status-completed";
  if (value === "Ready") return "status-ready";
  return "status-unknown";
}

export function DocumentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [documentItem, setDocumentItem] = useState<DocumentDto | null>(null);
  const [status, setStatus] = useState<number | string | undefined>(undefined);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [extractions, setExtractions] = useState<ExtractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractFields, setExtractFields] = useState("name,email,skills");
  const [extractType, setExtractType] = useState("structured");

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [doc, docStatus, docExtractions] = await Promise.all([
          getDocument(id ?? ""),
          getDocumentStatus(id ?? ""),
          getExtractions(id ?? "").catch(() => []),
        ]);

        setDocumentItem(doc);
        setStatus(docStatus?.status ?? docStatus);
        setExtractions(Array.isArray(docExtractions) ? docExtractions : []);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  async function handleSummarize() {
    if (!id) return;
    setSummaryLoading(true);

    try {
      const result = await summarizeDocument(id);
      setSummary(
        result?.summary ??
          result?.content ??
          result?.text ??
          JSON.stringify(result, null, 2),
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleExtract() {
    if (!id) return;
    setExtractLoading(true);

    try {
      await extractDocument(id, {
        extractionType: extractType,
        fields: extractFields
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      const refreshed = await getExtractions(id).catch(() => []);
      setExtractions(Array.isArray(refreshed) ? refreshed : []);
    } finally {
      setExtractLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;

    setDeleteBusy(true);

    try {
      await deleteDocument(id);
      navigate("/documents");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] surface-soft">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!documentItem) {
    return (
      <div className="rounded-[28px] surface-soft p-8">
        {t("details.notFound")}
      </div>
    );
  }

  const statusLabel = getDocumentStatusLabel(status);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-elevated rounded-[28px] p-6 lg:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
            <Sparkles size={14} />
            {t("details.overview")}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="break-words text-3xl font-semibold tracking-tight lg:text-4xl">
                {getDocumentDisplayName(documentItem)}
              </h1>

              <p className="mt-3 max-w-2xl text-soft">
                {t("details.subtitle")}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${statusClass(status)}`}
            >
              {t(`documents.status.${statusLabel.toLowerCase()}`, statusLabel)}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 rounded-2xl surface-soft p-4">
              <p className="text-sm text-muted">{t("details.fileType")}</p>
              <p className="mt-2 break-words text-sm font-medium">
                {getDocumentTypeLabel(documentItem)}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl surface-soft p-4">
              <p className="text-sm text-muted">{t("details.mimeType")}</p>
              <p className="mt-2 break-all text-sm font-medium">
                {getDocumentMimeValue(documentItem)}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl surface-soft p-4">
              <p className="text-sm text-muted">{t("details.size")}</p>
              <p className="mt-2 text-sm font-medium">
                {getDocumentSizeLabel(documentItem)}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl surface-soft p-4">
              <p className="text-sm text-muted">{t("details.documentId")}</p>
              <p className="mt-2 break-all text-sm font-medium">
                {documentItem.id}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSummarize()}
              className="primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-medium transition"
            >
              <WandSparkles size={18} />
              {summaryLoading
                ? t("details.generating")
                : t("details.generateSummary")}
            </button>

            <Link
              to={`/documents/${documentItem.id}/chat`}
              className="inline-flex items-center gap-2 rounded-2xl surface-soft px-4 py-3 font-medium transition hover:bg-[var(--panel-strong)]"
            >
              <Bot size={18} />
              {t("details.openChat")}
            </Link>

            <Link
              to="/compare"
              className="inline-flex items-center gap-2 rounded-2xl surface-soft px-4 py-3 font-medium transition hover:bg-[var(--panel-strong)]"
            >
              <GitCompareArrows size={18} />
              {t("details.compare")}
            </Link>

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="danger-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-medium transition"
            >
              <Trash2 size={18} />
              {t("documents.delete")}
            </button>
          </div>
        </div>

        <div className="surface-elevated rounded-[28px] p-6 lg:p-8">
          <h2 className="text-xl font-semibold">{t("details.extraction")}</h2>
          <p className="mt-2 text-sm text-soft">
            {t("details.extractionSubtitle")}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted">
                {t("details.extractionType")}
              </label>
              <input
                value={extractType}
                onChange={(e) => setExtractType(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
                placeholder="structured"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted">
                {t("details.fields")}
              </label>
              <textarea
                value={extractFields}
                onChange={(e) => setExtractFields(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
                placeholder="name,email,skills"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleExtract()}
              className="w-full rounded-2xl surface-soft px-4 py-3 font-medium transition hover:bg-[var(--panel-strong)]"
            >
              {extractLoading
                ? t("details.extracting")
                : t("details.runExtraction")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="surface-elevated rounded-[28px] p-6 lg:p-8">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} />
            <h2 className="text-xl font-semibold">{t("details.summary")}</h2>
          </div>

          {summary ? (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-5 whitespace-pre-wrap break-words text-soft">
              {summary}
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-5 text-soft">
              {t("details.noSummary")}
            </div>
          )}
        </div>

        <div className="surface-elevated rounded-[28px] p-6 lg:p-8">
          <div className="mb-4 flex items-center gap-2">
            <ArrowRight size={18} />
            <h2 className="text-xl font-semibold">
              {t("details.extractionHistory")}
            </h2>
          </div>

          <div className="space-y-3">
            {extractions.length === 0 ? (
              <div className="rounded-2xl bg-[var(--panel-soft)] p-5 text-soft">
                {t("details.noExtractions")}
              </div>
            ) : (
              extractions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[var(--panel-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {item.extractionType ?? t("details.extractionItem")}
                    </p>
                    <span className="break-all text-xs text-muted">
                      {item.id}
                    </span>
                  </div>

                  {item.resultJson ? (
                    <pre className="mt-3 overflow-auto rounded-xl bg-black/20 p-3 text-xs whitespace-pre-wrap break-words text-soft">
                      {item.resultJson}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <DeleteConfirmModal
        open={deleteOpen}
        title={t("deleteModal.title")}
        description={t("deleteModal.description")}
        confirmLabel={t("deleteModal.delete")}
        cancelLabel={t("deleteModal.cancel")}
        busy={deleteBusy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
