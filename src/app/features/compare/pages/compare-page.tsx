import { compareDocuments, getDocuments } from "@/app/api/documents.api";
import { getDocumentDisplayName } from "@/app/lib/document";
import { GitCompareArrows, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type DocumentItem = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
};

function mapLanguageToApi(language?: string) {
  if (!language) return "en";

  const normalized = language.toLowerCase();

  if (normalized.startsWith("pl")) return "pl";
  if (normalized.startsWith("ua") || normalized.startsWith("uk")) return "ua";

  return "en";
}

export function ComparePage() {
  const { t, i18n } = useTranslation();
  const apiLanguage = mapLanguageToApi(i18n.resolvedLanguage ?? i18n.language);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [firstDocumentId, setFirstDocumentId] = useState("");
  const [secondDocumentId, setSecondDocumentId] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  const defaultPrompt = t("compare.defaultPrompt");
  const previousDefaultPromptRef = useRef(defaultPrompt);
  const [prompt, setPrompt] = useState(defaultPrompt);

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

  useEffect(() => {
    const previousDefault = previousDefaultPromptRef.current;

    if (!prompt || prompt === previousDefault) {
      setPrompt(defaultPrompt);
    }

    previousDefaultPromptRef.current = defaultPrompt;
  }, [defaultPrompt, i18n.resolvedLanguage, prompt]);

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
        language: apiLanguage,
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
      <section className="surface-elevated rounded-[28px] p-6 lg:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
          <Sparkles size={14} />
          {t("compare.badge")}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
          {t("compare.title")}
        </h1>

        <p className="mt-3 max-w-2xl text-soft">{t("compare.subtitle")}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted">
              {t("compare.first")}
            </label>
            <select
              value={firstDocumentId}
              onChange={(e) => setFirstDocumentId(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {getDocumentDisplayName(doc)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              {t("compare.second")}
            </label>
            <select
              value={secondDocumentId}
              onChange={(e) => setSecondDocumentId(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {getDocumentDisplayName(doc)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm text-muted">
            {t("compare.prompt")}
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
          className="primary-button mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {comparing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <GitCompareArrows size={18} />
          )}
          {comparing ? t("compare.running") : t("compare.run")}
        </button>
      </section>

      <section className="surface-elevated rounded-[28px] p-6 lg:p-8">
        <h2 className="text-xl font-semibold">{t("compare.result")}</h2>

        {loading ? (
          <div className="mt-4 rounded-2xl bg-[var(--panel-soft)] p-6 text-soft">
            {t("common.loading")}
          </div>
        ) : result ? (
          <div className="mt-4 rounded-2xl bg-[var(--panel-soft)] p-6 whitespace-pre-wrap break-words text-soft">
            {result}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-[var(--panel-soft)] p-6 text-soft">
            {t("compare.empty")}
          </div>
        )}
      </section>
    </div>
  );
}
