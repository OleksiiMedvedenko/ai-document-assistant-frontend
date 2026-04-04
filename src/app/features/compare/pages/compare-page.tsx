import { compareDocuments, getDocuments } from "@/app/api/documents.api";
import { GitCompareArrows, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DocumentItem = {
  id: string;
  fileName?: string;
  name?: string;
};

export function ComparePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [firstDocumentId, setFirstDocumentId] = useState("");
  const [secondDocumentId, setSecondDocumentId] = useState("");
  const [prompt, setPrompt] = useState(
    "Compare these documents and highlight the key differences, similarities and risks.",
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDocuments();
        const list = Array.isArray(data) ? data : [];
        setDocuments(list);

        if (list[0]?.id) setFirstDocumentId(list[0].id);
        if (list[1]?.id) setSecondDocumentId(list[1].id);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const compareDisabled = useMemo(() => {
    return (
      !firstDocumentId ||
      !secondDocumentId ||
      firstDocumentId === secondDocumentId ||
      comparing
    );
  }, [firstDocumentId, secondDocumentId, comparing]);

  async function handleCompare() {
    if (!firstDocumentId || !secondDocumentId) return;

    setComparing(true);

    try {
      const response = await compareDocuments(firstDocumentId, {
        secondDocumentId,
        prompt,
      });

      setResult(
        response?.comparison ??
          response?.result ??
          response?.content ??
          response?.text ??
          JSON.stringify(response, null, 2),
      );
    } finally {
      setComparing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] surface-soft p-6 lg:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
          <Sparkles size={14} />
          AI comparison workspace
        </div>

        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
          Compare two documents with AI
        </h1>
        <p className="mt-3 max-w-2xl text-soft">
          Select a base document, choose a second file and generate a structured
          comparison.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted">
              First document
            </label>
            <select
              value={firstDocumentId}
              onChange={(e) => setFirstDocumentId(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName ?? doc.name ?? doc.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              Second document
            </label>
            <select
              value={secondDocumentId}
              onChange={(e) => setSecondDocumentId(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName ?? doc.name ?? doc.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm text-muted">
            Comparison prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleCompare()}
          disabled={compareDisabled}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-medium text-[var(--primary-contrast)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {comparing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <GitCompareArrows size={18} />
          )}
          {comparing ? "Comparing..." : "Run compare"}
        </button>
      </section>

      <section className="rounded-[28px] surface-soft p-6 lg:p-8">
        <h2 className="text-xl font-semibold">Comparison result</h2>

        {loading ? (
          <div className="mt-4 rounded-2xl bg-[var(--panel-soft)] p-6 text-soft">
            Loading documents...
          </div>
        ) : result ? (
          <div className="mt-4 rounded-2xl bg-[var(--panel-soft)] p-6 text-soft whitespace-pre-wrap">
            {result}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-[var(--panel-soft)] p-6 text-soft">
            Choose two documents and run the comparison.
          </div>
        )}
      </section>
    </div>
  );
}
