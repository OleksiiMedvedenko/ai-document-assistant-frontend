import {
  extractDocument,
  getDocument,
  getDocumentStatus,
  getExtractions,
  summarizeDocument,
} from "@/app/api/documents.api";
import {
  ArrowRight,
  Bot,
  FileText,
  GitCompareArrows,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function statusLabel(status: number | string | undefined) {
  if (status === 0 || status === "Pending") return "Pending";
  if (status === 1 || status === "Processing") return "Processing";
  if (status === 2 || status === "Completed") return "Completed";
  if (status === 3 || status === "Ready") return "Ready";
  return "Unknown";
}

function getDocumentDisplayName(documentItem: DocumentDto | null) {
  if (!documentItem) return "Untitled document";

  return (
    documentItem.originalFileName ||
    documentItem.fileName ||
    documentItem.name ||
    "Untitled document"
  );
}

function getDocumentType(documentItem: DocumentDto | null) {
  if (!documentItem) return "Document";

  return documentItem.contentType || documentItem.mimeType || "Document";
}

function getDocumentSize(documentItem: DocumentDto | null) {
  if (!documentItem) return "—";

  return formatBytes(documentItem.sizeInBytes ?? documentItem.fileSizeInBytes);
}

export function DocumentDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [documentItem, setDocumentItem] = useState<DocumentDto | null>(null);
  const [status, setStatus] = useState<number | string | undefined>(undefined);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
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

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] surface-soft">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!documentItem) {
    return (
      <div className="rounded-[28px] surface-soft p-8">Document not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] surface-soft p-6 lg:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
            <Sparkles size={14} />
            Document overview
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-3xl font-semibold tracking-tight lg:text-4xl">
                {getDocumentDisplayName(documentItem)}
              </h1>
              <p className="mt-3 max-w-2xl text-soft">
                View status, generate summary, extract structured data and jump
                into AI chat.
              </p>
            </div>

            <div className="status-ready shrink-0 rounded-full px-3 py-1 text-sm font-medium">
              {statusLabel(status)}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl surface-soft p-4 min-w-0">
              <p className="text-sm text-muted">File type</p>
              <p className="mt-2 break-all text-sm font-medium">
                {getDocumentType(documentItem)}
              </p>
            </div>

            <div className="rounded-2xl surface-soft p-4 min-w-0">
              <p className="text-sm text-muted">Size</p>
              <p className="mt-2 font-medium">
                {getDocumentSize(documentItem)}
              </p>
            </div>

            <div className="rounded-2xl surface-soft p-4 min-w-0">
              <p className="text-sm text-muted">Document ID</p>
              <p className="mt-2 break-all text-sm font-medium">
                {documentItem.id}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSummarize()}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-contrast)] transition hover:opacity-95"
            >
              <WandSparkles size={18} />
              {summaryLoading ? "Generating..." : "Generate summary"}
            </button>

            <Link
              to={`/documents/${documentItem.id}/chat`}
              className="inline-flex items-center gap-2 rounded-2xl surface-soft px-4 py-3 font-medium transition hover:bg-[var(--panel-strong)]"
            >
              <Bot size={18} />
              Open AI chat
            </Link>

            <Link
              to="/compare"
              className="inline-flex items-center gap-2 rounded-2xl surface-soft px-4 py-3 font-medium transition hover:bg-[var(--panel-strong)]"
            >
              <GitCompareArrows size={18} />
              Compare documents
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] surface-soft p-6 lg:p-8">
          <h2 className="text-xl font-semibold">Structured extraction</h2>
          <p className="mt-2 text-sm text-soft">
            Extract reusable fields from the document.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted">
                Extraction type
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
                Fields (comma separated)
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
              {extractLoading ? "Extracting..." : "Run extraction"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] surface-soft p-6 lg:p-8">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} />
            <h2 className="text-xl font-semibold">Summary</h2>
          </div>

          {summary ? (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-5 whitespace-pre-wrap text-soft break-words">
              {summary}
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-5 text-soft">
              No summary yet. Generate one from the action above.
            </div>
          )}
        </div>

        <div className="rounded-[28px] surface-soft p-6 lg:p-8">
          <div className="mb-4 flex items-center gap-2">
            <ArrowRight size={18} />
            <h2 className="text-xl font-semibold">Extraction history</h2>
          </div>

          <div className="space-y-3">
            {extractions.length === 0 ? (
              <div className="rounded-2xl bg-[var(--panel-soft)] p-5 text-soft">
                No extractions yet.
              </div>
            ) : (
              extractions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[var(--panel-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {item.extractionType ?? "Extraction"}
                    </p>
                    <span className="break-all text-xs text-muted">
                      {item.id}
                    </span>
                  </div>

                  {item.resultJson ? (
                    <pre className="mt-3 overflow-auto rounded-xl bg-black/20 p-3 text-xs text-soft whitespace-pre-wrap break-words">
                      {item.resultJson}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
