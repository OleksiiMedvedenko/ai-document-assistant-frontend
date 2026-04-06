import { compareDocuments, getDocuments } from "@/app/api/documents.api";
import { getDocumentDisplayName } from "@/app/lib/document";
import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  FileText,
  GitCompareArrows,
  Loader2,
  Search,
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

type PickerMode = "first" | "second" | null;

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

  const [pickerOpen, setPickerOpen] = useState<PickerMode>(null);
  const [pickerSearch, setPickerSearch] = useState("");

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
              <FileText size={18} />
              <span>
                {secondDoc
                  ? getDocumentDisplayName(secondDoc)
                  : t("compare.second")}
              </span>
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
                    <FileText size={18} />
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
                              <FileText size={16} />
                              <span>{getDocumentDisplayName(doc)}</span>
                            </div>

                            {active ? <Check size={16} /> : null}
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
                    <FileText size={18} />
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
                              <FileText size={16} />
                              <span>{getDocumentDisplayName(doc)}</span>
                            </div>

                            {active ? <Check size={16} /> : null}
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
