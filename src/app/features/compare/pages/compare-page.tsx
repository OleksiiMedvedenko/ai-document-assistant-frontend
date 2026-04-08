import { compareDocuments, getDocuments } from "@/app/api/documents.api";
import { getDocumentDisplayName, isDocumentReady } from "@/app/lib/document";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronsUpDown,
  FileText,
  GitCompareArrows,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
  TextCursorInput,
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
  status?: number | string;
};

type PickerMode = "first" | "second" | null;

function mapLanguageToApi(language?: string) {
  if (!language) return "en";

  const normalized = language.toLowerCase();

  if (normalized.startsWith("pl")) return "pl";
  if (normalized.startsWith("ua") || normalized.startsWith("uk")) return "ua";

  return "en";
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
        record.Message ??
        record.error ??
        record.errorMessage ??
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

function CompareInsightCard({
  icon,
  label,
  value,
  hint,
  tone = "gold",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "gold" | "purple" | "green";
}) {
  return (
    <div className={`compare-insight-card compare-insight-card--${tone}`}>
      <div className="compare-insight-card__icon">{icon}</div>
      <div className="compare-insight-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
      </div>
    </div>
  );
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
  const [actionError, setActionError] = useState("");

  const [pickerOpen, setPickerOpen] = useState<PickerMode>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  const defaultPrompt = t("compare.defaultPrompt");
  const previousDefaultPromptRef = useRef(defaultPrompt);
  const [prompt, setPrompt] = useState(defaultPrompt);

  async function loadDocuments(showLoader = true) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      setActionError("");

      const data = await getDocuments();
      const list = Array.isArray(data)
        ? data.filter((item) => isDocumentReady(item.status))
        : [];

      setDocuments(list);

      setFirstDocumentId((current) =>
        current && list.some((doc) => doc.id === current)
          ? current
          : (list[0]?.id ?? ""),
      );

      setSecondDocumentId((current) => {
        if (current && list.some((doc) => doc.id === current)) {
          return current;
        }

        const fallback = list.find((doc) => doc.id !== (list[0]?.id ?? ""));
        return fallback?.id ?? "";
      });
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadDocuments(true);
  }, [t]);

  useEffect(() => {
    const previousDefault = previousDefaultPromptRef.current;

    if (!prompt || prompt === previousDefault) {
      setPrompt(defaultPrompt);
    }

    previousDefaultPromptRef.current = defaultPrompt;
  }, [defaultPrompt, i18n.resolvedLanguage, prompt]);

  useEffect(() => {
    if (!pickerOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target?.closest(".doc-picker")) {
        setPickerOpen(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPickerOpen(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [pickerOpen]);

  const compareDisabled = useMemo(() => {
    return (
      !firstDocumentId ||
      !secondDocumentId ||
      firstDocumentId === secondDocumentId ||
      comparing
    );
  }, [firstDocumentId, secondDocumentId, comparing]);

  const firstDoc = useMemo(
    () => documents.find((doc) => doc.id === firstDocumentId) ?? null,
    [documents, firstDocumentId],
  );

  const secondDoc = useMemo(
    () => documents.find((doc) => doc.id === secondDocumentId) ?? null,
    [documents, secondDocumentId],
  );

  const filteredDocuments = useMemo(() => {
    const normalized = pickerSearch.trim().toLowerCase();

    if (!normalized) return documents;

    return documents.filter((doc) =>
      getDocumentDisplayName(doc).toLowerCase().includes(normalized),
    );
  }, [documents, pickerSearch]);

  const suggestionPrompts = [
    t("compare.suggestionGeneral"),
    t("compare.suggestionDifferences"),
    t("compare.suggestionRisks"),
    t("compare.suggestionSummary"),
  ];

  function handlePickDocument(
    mode: Exclude<PickerMode, null>,
    documentId: string,
  ) {
    if (mode === "first") {
      setFirstDocumentId(documentId);
    } else {
      setSecondDocumentId(documentId);
    }

    setPickerOpen(null);
    setPickerSearch("");
  }

  function handleSwapDocuments() {
    setFirstDocumentId(secondDocumentId);
    setSecondDocumentId(firstDocumentId);
  }

  async function handleCompare() {
    if (!firstDocumentId || !secondDocumentId) return;

    setComparing(true);
    setActionError("");

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
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("limits.compareReached")));
    } finally {
      setComparing(false);
    }
  }

  async function handleReloadDocuments() {
    await loadDocuments(true);
  }

  return (
    <div className="compare-page">
      <section className="compare-hero surface-card">
        <div className="compare-hero__intro">
          <div className="compare-hero__badge">
            <Sparkles size={14} />
            <span>{t("compare.badge")}</span>
          </div>

          <h1>{t("compare.title")}</h1>
          <p>{t("compare.subtitle")}</p>

          <div className="compare-hero__chips">
            <div className="compare-hero-chip">
              <FileText size={14} />
              <span>{documents.length}</span>
            </div>

            <div className="compare-hero-chip">
              <GitCompareArrows size={14} />
              <span>{t("compare.setupTitle")}</span>
            </div>

            <div className="compare-hero-chip">
              <WandSparkles size={14} />
              <span>{t("compare.result")}</span>
            </div>
          </div>
        </div>

        <div className="compare-hero__preview">
          <div className="compare-preview-card">
            <div className="compare-preview-card__item">
              <FileText size={17} />
              <span>
                {firstDoc
                  ? getDocumentDisplayName(firstDoc)
                  : t("compare.first")}
              </span>
            </div>

            <div className="compare-preview-card__middle">
              <GitCompareArrows size={18} />
            </div>

            <div className="compare-preview-card__item">
              <FileText size={17} />
              <span>
                {secondDoc
                  ? getDocumentDisplayName(secondDoc)
                  : t("compare.second")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="compare-insights">
        <CompareInsightCard
          icon={<FileText size={16} />}
          label={t("compare.setupTitle")}
          value={documents.length}
          hint={t("compare.searchDocuments")}
          tone="gold"
        />
        <CompareInsightCard
          icon={<BadgeCheck size={16} />}
          label={t("compare.first")}
          value={
            firstDoc ? getDocumentDisplayName(firstDoc) : t("compare.first")
          }
          hint={t("compare.swap")}
          tone="purple"
        />
        <CompareInsightCard
          icon={<TextCursorInput size={16} />}
          label={t("compare.prompt")}
          value={prompt.trim() ? prompt.trim().slice(0, 40) : "—"}
          hint={t("compare.resultKicker")}
          tone="green"
        />
      </section>

      <section className="compare-layout">
        <div className="compare-panel surface-card">
          <div className="compare-panel__header">
            <div>
              <p className="section-kicker">{t("compare.setupKicker")}</p>
              <h2>{t("compare.setupTitle")}</h2>
            </div>

            <button
              type="button"
              className="compare-refresh-button"
              onClick={() => void handleReloadDocuments()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <RefreshCcw size={15} />
              )}
              <span>{t("common.refresh")}</span>
            </button>
          </div>

          {actionError ? (
            <div className="form-alert form-alert--error">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          ) : null}

          <div className="compare-form-grid">
            <div className="compare-pickers">
              <div className="doc-picker">
                <label className="compare-field__label">
                  {t("compare.first")}
                </label>

                <button
                  type="button"
                  className="doc-picker__trigger"
                  onClick={() =>
                    setPickerOpen((current) =>
                      current === "first" ? null : "first",
                    )
                  }
                >
                  <div className="doc-picker__trigger-content">
                    <FileText size={17} />
                    <span>
                      {firstDoc
                        ? getDocumentDisplayName(firstDoc)
                        : t("compare.first")}
                    </span>
                  </div>
                  <ChevronsUpDown size={16} />
                </button>

                {pickerOpen === "first" ? (
                  <div className="doc-picker__dropdown">
                    <div className="doc-picker__search">
                      <Search size={16} />
                      <input
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder={t("compare.searchDocuments")}
                      />
                    </div>

                    <div className="doc-picker__list">
                      {filteredDocuments.map((doc) => {
                        const active = doc.id === firstDocumentId;

                        return (
                          <button
                            key={doc.id}
                            type="button"
                            className={`doc-picker__option ${
                              active ? "doc-picker__option--active" : ""
                            }`}
                            onClick={() => handlePickDocument("first", doc.id)}
                          >
                            <div className="doc-picker__option-main">
                              <FileText size={15} />
                              <span>{getDocumentDisplayName(doc)}</span>
                            </div>

                            {active ? <Check size={15} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="compare-swap-button"
                onClick={handleSwapDocuments}
                disabled={!firstDocumentId || !secondDocumentId}
                aria-label={t("compare.swap")}
              >
                <GitCompareArrows size={18} />
              </button>

              <div className="doc-picker">
                <label className="compare-field__label">
                  {t("compare.second")}
                </label>

                <button
                  type="button"
                  className="doc-picker__trigger"
                  onClick={() =>
                    setPickerOpen((current) =>
                      current === "second" ? null : "second",
                    )
                  }
                >
                  <div className="doc-picker__trigger-content">
                    <FileText size={17} />
                    <span>
                      {secondDoc
                        ? getDocumentDisplayName(secondDoc)
                        : t("compare.second")}
                    </span>
                  </div>
                  <ChevronsUpDown size={16} />
                </button>

                {pickerOpen === "second" ? (
                  <div className="doc-picker__dropdown">
                    <div className="doc-picker__search">
                      <Search size={16} />
                      <input
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder={t("compare.searchDocuments")}
                      />
                    </div>

                    <div className="doc-picker__list">
                      {filteredDocuments.map((doc) => {
                        const active = doc.id === secondDocumentId;

                        return (
                          <button
                            key={doc.id}
                            type="button"
                            className={`doc-picker__option ${
                              active ? "doc-picker__option--active" : ""
                            }`}
                            onClick={() => handlePickDocument("second", doc.id)}
                          >
                            <div className="doc-picker__option-main">
                              <FileText size={15} />
                              <span>{getDocumentDisplayName(doc)}</span>
                            </div>

                            {active ? <Check size={15} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="compare-suggestions">
              {suggestionPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="compare-suggestion-chip"
                  onClick={() => setPrompt(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="compare-field compare-field--full">
              <label className="compare-field__label">
                {t("compare.prompt")}
              </label>
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
