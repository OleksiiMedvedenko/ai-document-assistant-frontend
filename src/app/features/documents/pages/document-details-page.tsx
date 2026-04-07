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
import i18n from "@/i18n";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bot,
  FileText,
  GitCompareArrows,
  Loader2,
  Orbit,
  ShieldCheck,
  Sparkles,
  TextCursorInput,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../../../styles/document-details-page.css";

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

function normalizeLanguage(language?: string) {
  if (!language) return "en";
  if (language.startsWith("pl")) return "pl";
  if (language.startsWith("ua") || language.startsWith("uk")) return "ua";
  return "en";
}

function statusClass(status: number | string | undefined) {
  const value = getDocumentStatusLabel(status);

  if (value === "Pending") return "doc-status doc-status--pending";
  if (value === "Processing") return "doc-status doc-status--processing";
  if (value === "Completed") return "doc-status doc-status--completed";
  if (value === "Ready") return "doc-status doc-status--ready";
  return "doc-status doc-status--unknown";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error !== "object") {
    return fallback;
  }

  const anyError = error as {
    response?: {
      data?: unknown;
      status?: number;
      statusText?: string;
    };
    data?: unknown;
    message?: string;
    error?: string;
  };

  const responseData = anyError.response?.data;
  const directData = anyError.data;

  const candidates: unknown[] = [
    responseData,
    directData,
    anyError.error,
    anyError.message,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === "string" && candidate.trim()) {
      if (
        candidate === "Request failed with status code 429" &&
        anyError.response?.status === 429
      ) {
        return fallback;
      }

      return candidate;
    }

    if (typeof candidate === "object") {
      const record = candidate as Record<string, unknown>;

      const nestedMessage =
        record.message ??
        record.error ??
        record.title ??
        record.detail ??
        record.errors;

      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage;
      }

      if (Array.isArray(nestedMessage) && nestedMessage.length > 0) {
        const firstText = nestedMessage.find(
          (item) => typeof item === "string" && item.trim(),
        );

        if (typeof firstText === "string") {
          return firstText;
        }
      }
    }
  }

  if (anyError.response?.status === 429) {
    return fallback;
  }

  return fallback;
}

function formatDateTime(value?: string, locale = "en") {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="document-metric-card">
      <div className="document-metric-card__label">
        <span className="document-metric-card__icon">{icon}</span>
        <span>{label}</span>
      </div>
      <h3>{value}</h3>
    </div>
  );
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
  const [actionError, setActionError] = useState("");

  const currentLanguage = normalizeLanguage(i18n.language);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);

      try {
        setActionError("");

        const [doc, docStatus, docExtractions] = await Promise.all([
          getDocument(id ?? ""),
          getDocumentStatus(id ?? ""),
          getExtractions(id ?? "").catch(() => []),
        ]);

        setDocumentItem(doc);
        setStatus(docStatus?.status ?? docStatus);
        setExtractions(Array.isArray(docExtractions) ? docExtractions : []);
      } catch (error) {
        setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, t]);

  async function handleSummarize() {
    if (!id) return;
    setSummaryLoading(true);
    setActionError("");

    try {
      const result = await summarizeDocument(id, currentLanguage);
      setSummary(
        result?.summary ??
          result?.content ??
          result?.text ??
          JSON.stringify(result, null, 2),
      );
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("limits.summaryReached")));
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleExtract() {
    if (!id) return;
    setExtractLoading(true);
    setActionError("");

    try {
      await extractDocument(id, {
        extractionType: extractType,
        fields: extractFields
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        language: currentLanguage,
      });

      const refreshed = await getExtractions(id).catch(() => []);
      setExtractions(Array.isArray(refreshed) ? refreshed : []);
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("limits.extractReached")));
    } finally {
      setExtractLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;

    setDeleteBusy(true);
    setActionError("");

    try {
      await deleteDocument(id);
      navigate("/documents");
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      setDeleteBusy(false);
    }
  }

  const statusLabel = useMemo(() => getDocumentStatusLabel(status), [status]);

  if (loading) {
    return (
      <div className="document-details-loading surface-card">
        <Loader2 className="document-details-loading__spinner" />
        <span>{t("common.loading")}</span>
      </div>
    );
  }

  if (!documentItem) {
    return (
      <div className="document-details-empty surface-card">
        {t("details.notFound")}
      </div>
    );
  }

  return (
    <div className="document-details-page">
      <section className="document-details-hero surface-card">
        <div className="document-details-hero__head">
          <div className="document-details-hero__content">
            <div className="document-details-hero__badge">
              <Sparkles size={14} />
              <span>{t("details.overview")}</span>
            </div>

            <h1>{getDocumentDisplayName(documentItem)}</h1>
            <p>{t("details.subtitle")}</p>

            <div className="document-details-hero__chips">
              <div className="document-details-chip">
                <FileText size={14} />
                <span>{getDocumentTypeLabel(documentItem)}</span>
              </div>

              <div className="document-details-chip">
                <ShieldCheck size={14} />
                <span>
                  {t(
                    `documents.status.${statusLabel.toLowerCase()}`,
                    statusLabel,
                  )}
                </span>
              </div>

              <div className="document-details-chip">
                <BadgeCheck size={14} />
                <span>{getDocumentSizeLabel(documentItem)}</span>
              </div>
            </div>
          </div>

          <div className={statusClass(status)}>
            {t(`documents.status.${statusLabel.toLowerCase()}`, statusLabel)}
          </div>
        </div>

        {actionError ? (
          <div className="form-alert form-alert--error">
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        ) : null}

        <div className="document-details-metrics">
          <MetricCard
            icon={<FileText size={13} />}
            label={t("details.fileType")}
            value={getDocumentTypeLabel(documentItem)}
          />

          <MetricCard
            icon={<Orbit size={13} />}
            label={t("details.mimeType")}
            value={getDocumentMimeValue(documentItem)}
          />

          <MetricCard
            icon={<BadgeCheck size={13} />}
            label={t("details.size")}
            value={getDocumentSizeLabel(documentItem)}
          />

          <MetricCard
            icon={<TextCursorInput size={13} />}
            label={t("details.documentId")}
            value={documentItem.id}
          />
        </div>

        <div className="document-details-actions">
          <button
            type="button"
            onClick={() => void handleSummarize()}
            className="detail-action detail-action--primary"
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <WandSparkles size={18} />
            )}
            <span>
              {summaryLoading
                ? t("details.generating")
                : t("details.generateSummary")}
            </span>
          </button>

          <Link
            to={`/documents/${documentItem.id}/chat`}
            className="detail-action"
          >
            <Bot size={18} />
            <span>{t("details.openChat")}</span>
          </Link>

          <Link to="/compare" className="detail-action">
            <GitCompareArrows size={18} />
            <span>{t("details.compare")}</span>
          </Link>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="detail-action detail-action--danger"
            disabled={deleteBusy}
          >
            <Trash2 size={18} />
            <span>{t("documents.delete")}</span>
          </button>
        </div>
      </section>

      <section className="document-details-grid">
        <div className="document-panel surface-card">
          <div className="document-panel__header">
            <div>
              <p className="section-kicker">{t("details.summaryKicker")}</p>
              <h2>{t("details.summary")}</h2>
            </div>
          </div>

          {summary ? (
            <div className="document-summary-box">{summary}</div>
          ) : (
            <div className="document-empty-box">{t("details.noSummary")}</div>
          )}
        </div>

        <div className="document-panel surface-card">
          <div className="document-panel__header">
            <div>
              <p className="section-kicker">{t("details.extractionKicker")}</p>
              <h2>{t("details.extraction")}</h2>
              <p className="document-panel__sub">
                {t("details.extractionSubtitle")}
              </p>
            </div>
          </div>

          <div className="document-form-grid">
            <div className="document-field">
              <label>{t("details.extractionType")}</label>
              <input
                value={extractType}
                onChange={(e) => setExtractType(e.target.value)}
                placeholder="structured"
              />
            </div>

            <div className="document-field">
              <label>{t("details.fields")}</label>
              <textarea
                value={extractFields}
                onChange={(e) => setExtractFields(e.target.value)}
                rows={5}
                placeholder="name,email,skills"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleExtract()}
              className="detail-action detail-action--primary detail-action--full"
              disabled={extractLoading}
            >
              {extractLoading ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <ArrowRight size={18} />
              )}
              <span>
                {extractLoading
                  ? t("details.extracting")
                  : t("details.runExtraction")}
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="document-history surface-card">
        <div className="document-panel__header">
          <div>
            <p className="section-kicker">{t("details.historyKicker")}</p>
            <h2>{t("details.extractionHistory")}</h2>
          </div>
        </div>

        <div className="document-history__list">
          {extractions.length === 0 ? (
            <div className="document-empty-box">
              {t("details.noExtractions")}
            </div>
          ) : (
            extractions.map((item) => (
              <article key={item.id} className="history-card">
                <div className="history-card__top">
                  <div className="history-card__title-wrap">
                    <h3>
                      {item.extractionType ?? t("details.extractionItem")}
                    </h3>
                    <p>{formatDateTime(item.createdAt, currentLanguage)}</p>
                  </div>

                  <span className="history-card__id">{item.id}</span>
                </div>

                {item.resultJson ? (
                  <pre className="history-card__result">{item.resultJson}</pre>
                ) : (
                  <div className="history-card__empty">
                    {t("details.extractionItem")}
                  </div>
                )}
              </article>
            ))
          )}
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
