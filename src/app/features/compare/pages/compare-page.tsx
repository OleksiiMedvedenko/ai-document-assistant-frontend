import { compareDocuments, getDocuments } from "@/app/api/documents.api";
import { getDocumentDisplayName } from "@/app/lib/document";
import {
  ArrowRight,
  FileText,
  GitCompareArrows,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../../styles/compare-page.css";

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

  const firstDocName =
    documents.find((doc) => doc.id === firstDocumentId) &&
    getDocumentDisplayName(
      documents.find((doc) => doc.id === firstDocumentId)!,
    );

  const secondDocName =
    documents.find((doc) => doc.id === secondDocumentId) &&
    getDocumentDisplayName(
      documents.find((doc) => doc.id === secondDocumentId)!,
    );

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
    <div className="compare-page">
      <section className="compare-hero surface-card">
        <div className="compare-hero__intro">
          <div className="compare-hero__badge">
            <Sparkles size={15} />
            <span>{t("compare.badge")}</span>
          </div>

          <h1>{t("compare.title")}</h1>
          <p>{t("compare.subtitle")}</p>
        </div>

        <div className="compare-hero__preview">
          <div className="compare-preview-card">
            <div className="compare-preview-card__item">
              <FileText size={18} />
              <span>{firstDocName || t("compare.first")}</span>
            </div>

            <div className="compare-preview-card__middle">
              <GitCompareArrows size={18} />
            </div>

            <div className="compare-preview-card__item">
              <FileText size={18} />
              <span>{secondDocName || t("compare.second")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="compare-layout">
        <div className="compare-panel surface-card">
          <div className="compare-panel__header">
            <div>
              <p className="section-kicker">{t("compare.setupKicker")}</p>
              <h2>{t("compare.setupTitle")}</h2>
            </div>
          </div>

          <div className="compare-form-grid">
            <div className="compare-field">
              <label>{t("compare.first")}</label>
              <select
                value={firstDocumentId}
                onChange={(e) => setFirstDocumentId(e.target.value)}
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {getDocumentDisplayName(doc)}
                  </option>
                ))}
              </select>
            </div>

            <div className="compare-field">
              <label>{t("compare.second")}</label>
              <select
                value={secondDocumentId}
                onChange={(e) => setSecondDocumentId(e.target.value)}
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {getDocumentDisplayName(doc)}
                  </option>
                ))}
              </select>
            </div>

            <div className="compare-field compare-field--full">
              <label>{t("compare.prompt")}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleCompare()}
              disabled={compareDisabled}
              className="compare-run-button"
            >
              {comparing ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <WandSparkles size={18} />
              )}
              <span>{comparing ? t("compare.running") : t("compare.run")}</span>
            </button>
          </div>
        </div>

        <div className="compare-panel surface-card">
          <div className="compare-panel__header">
            <div>
              <p className="section-kicker">{t("compare.resultKicker")}</p>
              <h2>{t("compare.result")}</h2>
            </div>
          </div>

          {loading ? (
            <div className="compare-empty">
              <Loader2 size={18} className="spin" />
              <span>{t("common.loading")}</span>
            </div>
          ) : result ? (
            <div className="compare-result-box">{result}</div>
          ) : (
            <div className="compare-empty">
              <ArrowRight size={18} />
              <span>{t("compare.empty")}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
