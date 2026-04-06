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
  ArrowRight,
  Bot,
  GitCompareArrows,
  Loader2,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
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

  const currentLanguage = normalizeLanguage(i18n.language);

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
      const result = await summarizeDocument(id, currentLanguage);
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
        language: currentLanguage,
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
      <div className="document-details-loading surface-card">
        <Loader2 className="document-details-loading__spinner" />
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

  const statusLabel = getDocumentStatusLabel(status);

  return (
    <div className="document-details-page">
      <section className="document-details-hero surface-card">
        <div className="document-details-hero__head">
          <div>
            <div className="document-details-hero__badge">
              <Sparkles size={15} />
              <span>{t("details.overview")}</span>
            </div>

            <h1>{getDocumentDisplayName(documentItem)}</h1>
            <p>{t("details.subtitle")}</p>
          </div>

          <div className={statusClass(status)}>
            {t(`documents.status.${statusLabel.toLowerCase()}`, statusLabel)}
          </div>
        </div>

        <div className="document-details-metrics">
          <div className="document-metric-card">
            <p>{t("details.fileType")}</p>
            <h3>{getDocumentTypeLabel(documentItem)}</h3>
          </div>

          <div className="document-metric-card">
            <p>{t("details.mimeType")}</p>
            <h3 className="document-metric-card__break">
              {getDocumentMimeValue(documentItem)}
            </h3>
          </div>

          <div className="document-metric-card">
            <p>{t("details.size")}</p>
            <h3>{getDocumentSizeLabel(documentItem)}</h3>
          </div>

          <div className="document-metric-card">
            <p>{t("details.documentId")}</p>
            <h3 className="document-metric-card__break">{documentItem.id}</h3>
          </div>
        </div>

        <div className="document-details-actions">
          <button
            type="button"
            onClick={() => void handleSummarize()}
            className="detail-action detail-action--primary"
          >
            <WandSparkles size={18} />
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
              className="detail-action detail-action--full"
            >
              <ArrowRight size={18} />
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
                  <div>
                    <h3>
                      {item.extractionType ?? t("details.extractionItem")}
                    </h3>
                    <p>{item.createdAt ?? t("details.extractionItem")}</p>
                  </div>

                  <span>{item.id}</span>
                </div>

                {item.resultJson ? (
                  <pre className="history-card__result">{item.resultJson}</pre>
                ) : null}
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
