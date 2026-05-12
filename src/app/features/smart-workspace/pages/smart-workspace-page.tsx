import {
  createAiActionTemplate,
  deleteAiActionTemplate,
  getAiActionTemplates,
  type AiActionTemplate,
} from "@/app/api/ai-action-templates.api";
import {
  getDocumentFoldersTree,
  getDuplicateFolderSuggestions,
  mergeDocumentFolders,
  type DocumentFolderItem,
  type FolderDuplicateSuggestion,
} from "@/app/api/document-folders.api";
import {
  acceptDocumentFolderSuggestion,
  confirmDocumentFolderAssignment,
  getDocumentDashboard,
  getDocumentInbox,
  getDocuments,
  moveDocumentToFolder,
  rejectDocumentFolderSuggestion,
  type DocumentDashboard,
  type DocumentFolderSuggestion,
  type DocumentItem,
} from "@/app/api/documents.api";
import {
  getDocumentDisplayName,
  getDocumentStatusLabel,
} from "@/app/lib/document";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Files,
  Folder,
  FolderGit2,
  FolderOpen,
  Inbox,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../../../styles/smart-workspace-page.css";

type Translate = (key: string, options?: Record<string, unknown>) => string;

type TemplateForm = {
  name: string;
  documentType: string;
  prompt: string;
  outputFormat: string;
};

type SuggestionGroup = {
  documentId: string;
  document?: DocumentItem;
  suggestions: DocumentFolderSuggestion[];
};

type FolderCorrectionState = {
  document: DocumentItem;
  expandedIds: Set<string>;
} | null;

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;

  const candidate = error as {
    response?: {
      data?: { message?: string; Message?: string; title?: string };
    };
    message?: string;
  };

  return (
    candidate.response?.data?.message ??
    candidate.response?.data?.Message ??
    candidate.response?.data?.title ??
    candidate.message ??
    fallback
  );
}

function percent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatDate(value?: string | null, language = "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}


function getLocalizedFolderName(
  folder: Pick<DocumentFolderItem, "name" | "namePl" | "nameEn" | "nameUa">,
  language: string,
) {
  const normalized = language.toLowerCase();
  if (normalized.startsWith("pl")) return folder.namePl || folder.name;
  if (normalized.startsWith("ua") || normalized.startsWith("uk")) return folder.nameUa || folder.name;
  if (normalized.startsWith("en")) return folder.nameEn || folder.name;
  return folder.name;
}

function flattenFolders(folders: DocumentFolderItem[]): DocumentFolderItem[] {
  return folders.flatMap((folder) => [folder, ...flattenFolders(folder.children)]);
}

function buildFolderPath(
  folders: DocumentFolderItem[],
  folderId?: string | null,
  language = "en",
) {
  if (!folderId) return "";
  const all = flattenFolders(folders);
  const byId = new Map(all.map((folder) => [folder.id, folder]));
  const names: string[] = [];
  let current = byId.get(folderId);
  let guard = 0;

  while (current && guard++ < 10) {
    names.unshift(getLocalizedFolderName(current, language));
    current = current.parentFolderId ? byId.get(current.parentFolderId) : undefined;
  }

  return names.join(" / ");
}

function isDecisionRequired(documentItem?: DocumentItem) {
  const status = String(documentItem?.folderClassificationStatus ?? "").toLowerCase();
  return status === "suggested" || status === "needs-review" || status === "pending-review";
}

function isConfirmableAssignment(documentItem?: DocumentItem) {
  if (!documentItem?.folderId) return false;
  const status = String(documentItem.folderClassificationStatus ?? "").toLowerCase();
  return status === "auto-assigned" ||
    status === "auto-created-and-assigned" ||
    status === "auto-created-path-and-assigned" ||
    status === "auto-assigned-from-structure";
}

function localizeReasonCode(code: string | null | undefined, t: Translate) {
  if (!code) return "";
  return t(`smartWorkspace.reasonCodes.${code.replaceAll(".", "_")}`, { defaultValue: "" });
}

function getInitialTemplateForm(t: Translate): TemplateForm {
  return {
    name: t("smartWorkspace.templates.defaultName"),
    documentType: "invoice",
    prompt: t("smartWorkspace.templates.defaultPrompt"),
    outputFormat: "json",
  };
}

function getSuggestionTargetName(
  suggestion: DocumentFolderSuggestion,
  t: Translate,
) {
  return (
    suggestion.existingFolderName ||
    suggestion.proposedName ||
    suggestion.proposedNameEn ||
    suggestion.proposedNamePl ||
    suggestion.proposedKey ||
    t("smartWorkspace.suggestedFolder")
  );
}

function getScoreLevel(value?: number | null) {
  const score = value ?? 0;
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  return "low";
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function localizeSuggestionReason(reason: string | undefined, t: Translate, reasonCode?: string | null) {
  const translatedCode = localizeReasonCode(reasonCode, t);
  if (translatedCode) return translatedCode;

  if (!reason?.trim()) return t("smartWorkspace.suggestions.noReason");

  const normalized = reason.trim();
  const semanticMatch = normalized.match(
    /semantic folder profile match:\s*(\d+)%/i,
  );
  const semanticSimilarity = normalized.match(
    /semantic similarity to folder profile:\s*(\d+)%/i,
  );

  if (/matches document topic/i.test(normalized) && semanticMatch) {
    return t("smartWorkspace.reasons.topicAndSemantic", {
      score: `${semanticMatch[1]}%`,
    });
  }

  if (/matches document type/i.test(normalized) && semanticMatch) {
    return t("smartWorkspace.reasons.typeAndSemantic", {
      score: `${semanticMatch[1]}%`,
    });
  }

  if (semanticSimilarity) {
    return t("smartWorkspace.reasons.semanticOnly", {
      score: `${semanticSimilarity[1]}%`,
    });
  }

  return normalized.replace(/^leaf\s+/i, "");
}

function SmartMetricCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  hint?: string;
}) {
  return (
    <article className={`smart-metric-card smart-metric-card--${tone}`}>
      <div className="smart-metric-card__icon">{icon}</div>
      <div className="smart-metric-card__content">
        <p>{label}</p>
        <strong>{value}</strong>
        {hint ? <span>{hint}</span> : null}
      </div>
    </article>
  );
}

function SuggestionRow({
  suggestion,
  busy,
  onAccept,
  onReject,
  t,
}: {
  suggestion: DocumentFolderSuggestion;
  busy: boolean;
  onAccept: (suggestion: DocumentFolderSuggestion) => void;
  onReject: (suggestion: DocumentFolderSuggestion) => void;
  t: Translate;
}) {
  const score = suggestion.finalScore ?? suggestion.score;
  const scoreLevel = getScoreLevel(score);

  return (
    <article
      className={`smart-suggestion-row smart-suggestion-row--${scoreLevel}`}
    >
      <div className="smart-suggestion-row__main">
        <div className="smart-suggestion-row__target">
          <span className="smart-suggestion-row__rank">
            {t("smartWorkspace.suggestions.option", {
              rank: suggestion.rank,
            })}
          </span>
          <strong>{getSuggestionTargetName(suggestion, t)}</strong>
        </div>

        <p>{localizeSuggestionReason(suggestion.reason, t, suggestion.reasonCode)}</p>

        <div className="smart-score-grid">
          <span>
            {t("smartWorkspace.suggestions.rules", {
              score: percent(suggestion.ruleScore),
            })}
          </span>
          <span>
            {t("smartWorkspace.suggestions.semantic", {
              score: percent(suggestion.semanticScore),
            })}
          </span>
          <span>
            {t("smartWorkspace.suggestions.history", {
              score: percent(suggestion.userHistoryScore),
            })}
          </span>
        </div>
      </div>

      <div className="smart-suggestion-row__side">
        <span className={`smart-score smart-score--${scoreLevel}`}>
          {percent(score)}
        </span>

        <div className="smart-suggestion-row__actions">
          <button
            type="button"
            onClick={() => onAccept(suggestion)}
            disabled={busy || suggestion.status !== "pending"}
            className="smart-button smart-button--success"
          >
            <CheckCircle2 size={15} />
            {t("smartWorkspace.actions.accept")}
          </button>

          <button
            type="button"
            onClick={() => onReject(suggestion)}
            disabled={busy || suggestion.status !== "pending"}
            className="smart-button smart-button--danger"
          >
            <XCircle size={15} />
            {t("smartWorkspace.actions.reject")}
          </button>
        </div>
      </div>
    </article>
  );
}


function FolderPickerModal({
  open,
  documentItem,
  folders,
  expandedIds,
  busy,
  language,
  onToggle,
  onPick,
  onUnfile,
  onClose,
  t,
}: {
  open: boolean;
  documentItem?: DocumentItem;
  folders: DocumentFolderItem[];
  expandedIds: Set<string>;
  busy: boolean;
  language: string;
  onToggle: (folderId: string) => void;
  onPick: (folderId: string) => void;
  onUnfile: () => void;
  onClose: () => void;
  t: Translate;
}) {
  if (!open || !documentItem) return null;

  const renderNode = (folder: DocumentFolderItem, depth = 0): ReactNode => {
    const hasChildren = folder.children.length > 0;
    const isExpanded = expandedIds.has(folder.id);
    const name = getLocalizedFolderName(folder, language);

    return (
      <li key={folder.id} className="smart-folder-picker__node">
        <div className="smart-folder-picker__row" style={{ paddingLeft: `${depth * 16 + 10}px` }}>
          <button
            type="button"
            className="smart-folder-picker__toggle"
            onClick={() => hasChildren && onToggle(folder.id)}
            disabled={!hasChildren}
            aria-label={name}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}
          </button>

          <div className="smart-folder-picker__icon">
            {hasChildren && isExpanded ? <FolderOpen size={15} /> : <Folder size={15} />}
          </div>

          <button
            type="button"
            className="smart-folder-picker__pick"
            onClick={() => onPick(folder.id)}
            disabled={busy}
          >
            <span>{name}</span>
            <small>{folder.documentCount}</small>
          </button>
        </div>

        {hasChildren && isExpanded ? (
          <ul>{folder.children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    );
  };

  return (
    <div className="smart-folder-picker" role="dialog" aria-modal="true">
      <button
        type="button"
        className="smart-folder-picker__backdrop"
        onClick={onClose}
        aria-label={t("common.close")}
      />

      <section className="smart-folder-picker__panel surface-card">
        <div className="smart-folder-picker__header">
          <div>
            <p className="section-kicker">{t("smartWorkspace.correction.kicker")}</p>
            <h2>{t("smartWorkspace.correction.title")}</h2>
            <span>{getDocumentDisplayName(documentItem)}</span>
          </div>
          <button type="button" className="smart-button smart-button--ghost" onClick={onClose}>
            <XCircle size={15} />
            {t("common.close")}
          </button>
        </div>

        <p className="smart-panel-description">{t("smartWorkspace.correction.description")}</p>

        <div className="smart-folder-picker__actions">
          <button type="button" className="smart-button smart-button--danger" onClick={onUnfile} disabled={busy}>
            <XCircle size={15} />
            {t("smartWorkspace.actions.unfile")}
          </button>
        </div>

        <ul className="smart-folder-picker__tree">
          {folders.length === 0 ? <li className="smart-empty">{t("smartWorkspace.correction.noFolders")}</li> : folders.map((folder) => renderNode(folder))}
        </ul>
      </section>

    </div>
  );
}


function SuggestionGroupCard({
  group,
  folderPath,
  busyKey,
  onConfirm,
  onCorrect,
  onUnfile,
  onAccept,
  onReject,
  t,
}: {
  group: SuggestionGroup;
  folderPath: string;
  busyKey: string | null;
  onConfirm: (documentItem: DocumentItem) => void;
  onCorrect: (documentItem: DocumentItem) => void;
  onUnfile: (documentItem: DocumentItem) => void;
  onAccept: (suggestion: DocumentFolderSuggestion) => void;
  onReject: (suggestion: DocumentFolderSuggestion) => void;
  t: Translate;
}) {
  const documentName = group.document
    ? getDocumentDisplayName(group.document)
    : t("smartWorkspace.suggestions.unknownDocument", {
        id: shortId(group.documentId),
      });

  const status = group.document
    ? getDocumentStatusLabel(group.document.status)
    : t("smartWorkspace.suggestions.unknownStatus");

  const folder = folderPath || group.document?.folderName || t("smartWorkspace.unfiled");
  const decisionRequired = isDecisionRequired(group.document);
  const confirmable = isConfirmableAssignment(group.document);
  const reasonText = localizeReasonCode(group.document?.folderClassificationReasonCode, t) || group.document?.folderClassificationReason || "";

  return (
    <article className="smart-document-decision-card">
      <div className="smart-document-decision-card__header">
        <div className="smart-document-title">
          <div className="smart-document-title__icon">
            <FileText size={18} />
          </div>

          <div>
            <p>{t("smartWorkspace.suggestions.decidingFor")}</p>
            <h3>{documentName}</h3>

            <div className="smart-document-title__meta">
              <span>{status}</span>
              <span>•</span>
              <span>{folder}</span>
              {group.document?.uploadedAtUtc ? (
                <>
                  <span>•</span>
                  <span>{formatDate(group.document.uploadedAtUtc)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="smart-document-decision-card__header-actions">
          <span className="smart-suggestion-count">
            {t("smartWorkspace.suggestions.count", {
              count: group.suggestions.length,
            })}
          </span>

          <Link
            to={`/documents/${group.documentId}`}
            className="smart-button smart-button--ghost"
          >
            {t("smartWorkspace.actions.openDocument")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {group.document ? (
        <div className={`smart-decision-summary ${decisionRequired ? "smart-decision-summary--review" : ""}`}>
          <div>
            <span>{decisionRequired ? t("smartWorkspace.decision.needsReview") : t("smartWorkspace.decision.currentAssignment")}</span>
            <strong>{folder}</strong>
            {reasonText ? <p>{reasonText}</p> : null}
          </div>
          <div className="smart-decision-summary__actions">
            {confirmable ? (
              <button type="button" className="smart-button smart-button--success" disabled={busyKey === `confirm:${group.document.id}`} onClick={() => onConfirm(group.document!)}>
                {busyKey === `confirm:${group.document.id}` ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                {t("smartWorkspace.actions.confirmAssignment")}
              </button>
            ) : null}
            <button type="button" className="smart-button smart-button--warning" disabled={busyKey === `correct:${group.document.id}`} onClick={() => onCorrect(group.document!)}>
              <FolderGit2 size={15} />
              {t("smartWorkspace.actions.changeFolder")}
            </button>
            <button type="button" className="smart-button smart-button--ghost" disabled={busyKey === `unfile:${group.document.id}`} onClick={() => onUnfile(group.document!)}>
              <XCircle size={15} />
              {t("smartWorkspace.actions.unfile")}
            </button>
          </div>
        </div>
      ) : null}

      {group.suggestions.length > 0 ? (
        <div className="smart-suggestion-rows smart-suggestion-rows--secondary">
        {group.suggestions.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            suggestion={suggestion}
            busy={busyKey === suggestion.id}
            onAccept={onAccept}
            onReject={onReject}
            t={t}
          />
        ))}
        </div>
      ) : null}
    </article>
  );
}

function InfoPanel({
  title,
  kicker,
  children,
  count,
  accent = "default",
}: {
  title: string;
  kicker: string;
  children: ReactNode;
  count?: number;
  accent?: "default" | "purple" | "gold" | "blue";
}) {
  return (
    <section className={`smart-panel surface-card smart-panel--${accent}`}>
      <div className="smart-panel__header">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>

        {typeof count === "number" ? (
          <span className="smart-panel__header-count">{count}</span>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function FileLabel({
  documentItem,
  unfiledLabel,
}: {
  documentItem: DocumentItem;
  unfiledLabel: string;
}) {
  return (
    <div className="smart-document-row__text">
      <strong>{getDocumentDisplayName(documentItem)}</strong>
      <span>
        {getDocumentStatusLabel(documentItem.status)} •{" "}
        {documentItem.folderName || unfiledLabel}
      </span>
    </div>
  );
}

export function SmartWorkspacePage() {
  const { t, i18n } = useTranslation();
  const translate = t as Translate;

  const [dashboard, setDashboard] = useState<DocumentDashboard | null>(null);
  const [inbox, setInbox] = useState<DocumentItem[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<DocumentFolderItem[]>([]);
  const [folderCorrection, setFolderCorrection] = useState<FolderCorrectionState>(null);
  const [duplicates, setDuplicates] = useState<FolderDuplicateSuggestion[]>([]);
  const [templates, setTemplates] = useState<AiActionTemplate[]>([]);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(() =>
    getInitialTemplateForm(translate),
  );
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadWorkspace(showLoader = false) {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const [
        dashboardResult,
        inboxResult,
        documentsResult,
        folderResult,
        duplicateResult,
        templateResult,
      ] = await Promise.all([
        getDocumentDashboard(),
        getDocumentInbox().catch(() => []),
        getDocuments().catch(() => []),
        getDocumentFoldersTree().catch(() => []),
        getDuplicateFolderSuggestions().catch(() => []),
        getAiActionTemplates().catch(() => []),
      ]);

      setDashboard(dashboardResult);
      setInbox(Array.isArray(inboxResult) ? inboxResult : []);
      setAllDocuments(Array.isArray(documentsResult) ? documentsResult : []);
      setFolders(Array.isArray(folderResult) ? folderResult : []);
      setDuplicates(Array.isArray(duplicateResult) ? duplicateResult : []);
      setTemplates(Array.isArray(templateResult) ? templateResult : []);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, t("smartWorkspace.errors.load")));
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace(true);
  }, []);

  useEffect(() => {
    if (
      selectedTemplateId &&
      !templates.some((x) => x.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(null);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    setTemplateForm((current) => {
      const previousDefault = getInitialTemplateForm(translate);

      if (
        current.name &&
        current.name !== previousDefault.name &&
        current.prompt &&
        current.prompt !== previousDefault.prompt
      ) {
        return current;
      }

      return getInitialTemplateForm(translate);
    });
  }, [i18n.language]);

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentItem>();

    for (const doc of [
      ...allDocuments,
      ...inbox,
      ...(dashboard?.recentDocuments ?? []),
    ]) {
      if (doc?.id) map.set(doc.id, doc);
    }

    return map;
  }, [allDocuments, dashboard?.recentDocuments, inbox]);

  const suggestionGroups = useMemo<SuggestionGroup[]>(() => {
    const grouped = new Map<string, DocumentFolderSuggestion[]>();

    for (const suggestion of dashboard?.pendingSuggestions ?? []) {
      const current = grouped.get(suggestion.documentId) ?? [];
      current.push(suggestion);
      grouped.set(suggestion.documentId, current);
    }

    const reviewDocs = [...documentMap.values()].filter((doc) =>
      isDecisionRequired(doc) || isConfirmableAssignment(doc),
    );

    for (const doc of reviewDocs) {
      if (!grouped.has(doc.id)) {
        grouped.set(doc.id, []);
      }
    }

    return Array.from(grouped.entries()).map(([documentId, suggestions]) => ({
      documentId,
      document: documentMap.get(documentId),
      suggestions: suggestions.sort((a, b) => {
        const rankDiff = a.rank - b.rank;
        if (rankDiff !== 0) return rankDiff;
        return (b.finalScore ?? b.score) - (a.finalScore ?? a.score);
      }),
    }));
  }, [dashboard?.pendingSuggestions, documentMap]);

  function handlePickTemplate(template: AiActionTemplate) {
    setSelectedTemplateId(template.id);
    setTemplateForm({
      name: template.name ?? "",
      documentType: template.documentType ?? "",
      prompt: template.prompt ?? "",
      outputFormat: template.outputFormat ?? "json",
    });
    setNotice(t("smartWorkspace.notices.templateLoaded"));
    setError("");
  }

  function handleResetTemplateForm() {
    setSelectedTemplateId(null);
    setTemplateForm(getInitialTemplateForm(translate));
  }

  async function handleAcceptSuggestion(suggestion: DocumentFolderSuggestion) {
    setBusyKey(suggestion.id);
    setError("");
    setNotice("");

    try {
      await acceptDocumentFolderSuggestion(
        suggestion.documentId,
        suggestion.id,
      );
      setNotice(t("smartWorkspace.notices.accepted"));
      await loadWorkspace(false);
    } catch (acceptError) {
      setError(
        getApiErrorMessage(acceptError, t("smartWorkspace.errors.accept")),
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRejectSuggestion(suggestion: DocumentFolderSuggestion) {
    setBusyKey(suggestion.id);
    setError("");
    setNotice("");

    try {
      await rejectDocumentFolderSuggestion(
        suggestion.documentId,
        suggestion.id,
      );
      setNotice(t("smartWorkspace.notices.rejected"));
      await loadWorkspace(false);
    } catch (rejectError) {
      setError(
        getApiErrorMessage(rejectError, t("smartWorkspace.errors.reject")),
      );
    } finally {
      setBusyKey(null);
    }
  }


  async function handleConfirmAssignment(documentItem: DocumentItem) {
    setBusyKey(`confirm:${documentItem.id}`);
    setError("");
    setNotice("");

    try {
      await confirmDocumentFolderAssignment(documentItem.id);
      setNotice(t("smartWorkspace.notices.assignmentConfirmed"));
      await loadWorkspace(false);
    } catch (confirmError) {
      setError(getApiErrorMessage(confirmError, t("smartWorkspace.errors.confirmAssignment")));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUnfileDocument(documentItem: DocumentItem) {
    setBusyKey(`unfile:${documentItem.id}`);
    setError("");
    setNotice("");

    try {
      await moveDocumentToFolder(documentItem.id, null);
      setNotice(t("smartWorkspace.notices.unfiled"));
      setFolderCorrection(null);
      await loadWorkspace(false);
    } catch (moveError) {
      setError(getApiErrorMessage(moveError, t("smartWorkspace.errors.changeFolder")));
    } finally {
      setBusyKey(null);
    }
  }

  async function handlePickCorrectionFolder(folderId: string) {
    if (!folderCorrection?.document) return;
    const documentItem = folderCorrection.document;
    setBusyKey(`correct:${documentItem.id}`);
    setError("");
    setNotice("");

    try {
      await moveDocumentToFolder(documentItem.id, folderId);
      setNotice(t("smartWorkspace.notices.folderChanged"));
      setFolderCorrection(null);
      await loadWorkspace(false);
    } catch (moveError) {
      setError(getApiErrorMessage(moveError, t("smartWorkspace.errors.changeFolder")));
    } finally {
      setBusyKey(null);
    }
  }

  function openCorrectionPicker(documentItem: DocumentItem) {
    const expandedIds = new Set(flattenFolders(folders).map((folder) => folder.id));
    setFolderCorrection({ document: documentItem, expandedIds });
  }

  function toggleCorrectionFolder(folderId: string) {
    setFolderCorrection((current) => {
      if (!current) return current;
      const next = new Set(current.expandedIds);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return { ...current, expandedIds: next };
    });
  }

  async function handleMergeDuplicate(duplicate: FolderDuplicateSuggestion) {
    const key = `${duplicate.firstFolderId}-${duplicate.secondFolderId}`;
    setBusyKey(key);
    setError("");
    setNotice("");

    try {
      await mergeDocumentFolders(duplicate.secondFolderId, {
        targetFolderId: duplicate.firstFolderId,
        deleteSourceFolder: true,
      });
      setNotice(t("smartWorkspace.notices.merged"));
      await loadWorkspace(false);
    } catch (mergeError) {
      setError(
        getApiErrorMessage(mergeError, t("smartWorkspace.errors.merge")),
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateTemplate() {
    setBusyKey("template-create");
    setError("");
    setNotice("");

    try {
      await createAiActionTemplate({
        name: templateForm.name,
        documentType: templateForm.documentType || null,
        prompt: templateForm.prompt,
        outputFormat: templateForm.outputFormat,
      });

      setNotice(t("smartWorkspace.notices.templateSaved"));
      setSelectedTemplateId(null);
      setTemplateForm(getInitialTemplateForm(translate));
      await loadWorkspace(false);
    } catch (templateError) {
      setError(
        getApiErrorMessage(
          templateError,
          t("smartWorkspace.errors.templateSave"),
        ),
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    setBusyKey(templateId);
    setError("");
    setNotice("");

    try {
      await deleteAiActionTemplate(templateId);
      setNotice(t("smartWorkspace.notices.templateDeleted"));

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
        setTemplateForm(getInitialTemplateForm(translate));
      }

      await loadWorkspace(false);
    } catch (deleteError) {
      setError(
        getApiErrorMessage(
          deleteError,
          t("smartWorkspace.errors.templateDelete"),
        ),
      );
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) {
    return (
      <div className="smart-loading surface-card">
        <Loader2 className="spin" size={18} />
        <span>{t("smartWorkspace.loading")}</span>
      </div>
    );
  }

  return (
    <div className="smart-workspace-page">
      <section className="smart-hero surface-card">
        <div className="smart-hero__content">
          <div className="smart-hero__badge">
            <Sparkles size={15} />
            {t("smartWorkspace.heroBadge")}
          </div>

          <h1>{t("smartWorkspace.title")}</h1>
          <p>{t("smartWorkspace.subtitle")}</p>

          <div className="smart-hero__chips">
            <span className="smart-hero__chip">
              <Files size={14} />
              {dashboard?.totalDocuments ?? 0}{" "}
              {t("smartWorkspace.metrics.documents").toLowerCase()}
            </span>
            <span className="smart-hero__chip">
              <Bot size={14} />
              {templates.length}{" "}
              {t("smartWorkspace.templates.title").toLowerCase()}
            </span>
            <span className="smart-hero__chip smart-hero__chip--accent">
              <WandSparkles size={14} />
              {suggestionGroups.length}{" "}
              {t("smartWorkspace.decision.title").toLowerCase()}
            </span>
          </div>
        </div>

        <div className="smart-hero__actions">
          <button
            type="button"
            className="smart-button smart-button--primary"
            onClick={() => void loadWorkspace(true)}
          >
            <RefreshCcw size={16} />
            {t("common.refresh")}
          </button>
        </div>
      </section>

      {error ? (
        <div className="form-alert form-alert--error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div className="form-alert">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      <section className="smart-metrics-grid">
        <SmartMetricCard
          label={t("smartWorkspace.metrics.documents")}
          value={dashboard?.totalDocuments ?? 0}
          icon={<Files size={18} />}
          hint={t("smartWorkspace.subtitle")}
        />

        <SmartMetricCard
          label={t("smartWorkspace.metrics.ready")}
          value={dashboard?.readyDocuments ?? 0}
          icon={<CheckCircle2 size={18} />}
          tone="success"
          hint={t("smartWorkspace.actions.accept")}
        />

        <SmartMetricCard
          label={t("smartWorkspace.metrics.inboxReview")}
          value={dashboard?.pendingReviewDocuments ?? 0}
          icon={<Inbox size={18} />}
          tone="warning"
          hint={t("smartWorkspace.inbox.title")}
        />

        <SmartMetricCard
          label={t("smartWorkspace.metrics.unfiled")}
          value={dashboard?.unfiledDocuments ?? 0}
          icon={<FolderGit2 size={18} />}
          tone={(dashboard?.unfiledDocuments ?? 0) > 0 ? "danger" : "default"}
          hint={t("smartWorkspace.unfiled")}
        />
      </section>

      <section className="smart-main-layout">
        <div className="smart-main-column">
          <InfoPanel
            kicker={t("smartWorkspace.suggestions.kicker")}
            title={t("smartWorkspace.decision.title")}
            count={suggestionGroups.length}
            accent="purple"
          >
            <p className="smart-panel-description">
              {t("smartWorkspace.decision.description")}
            </p>

            <div className="smart-document-decision-list">
              {suggestionGroups.length === 0 ? (
                <div className="smart-empty">
                  {t("smartWorkspace.suggestions.empty")}
                </div>
              ) : (
                suggestionGroups.map((group) => (
                  <SuggestionGroupCard
                    key={group.documentId}
                    group={group}
                    folderPath={buildFolderPath(folders, group.document?.folderId, i18n.language)}
                    busyKey={busyKey}
                    onConfirm={(doc) => void handleConfirmAssignment(doc)}
                    onCorrect={openCorrectionPicker}
                    onUnfile={(doc) => void handleUnfileDocument(doc)}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    t={translate}
                  />
                ))
              )}
            </div>
          </InfoPanel>

          <InfoPanel
            kicker={t("smartWorkspace.inbox.kicker")}
            title={t("smartWorkspace.inbox.title")}
            count={inbox.length}
            accent="blue"
          >
            <div className="smart-list smart-list--compact">
              {inbox.length === 0 ? (
                <div className="smart-empty">
                  {t("smartWorkspace.inbox.empty")}
                </div>
              ) : (
                inbox.slice(0, 8).map((doc) => (
                  <Link
                    key={doc.id}
                    className="smart-document-row"
                    to={`/documents/${doc.id}`}
                  >
                    <FileLabel
                      documentItem={doc}
                      unfiledLabel={t("smartWorkspace.unfiled")}
                    />
                    <ArrowRight size={16} />
                  </Link>
                ))
              )}
            </div>
          </InfoPanel>
        </div>

        <aside className="smart-tools-column">
          <InfoPanel
            kicker={t("smartWorkspace.tools.kicker")}
            title={t("smartWorkspace.tools.title")}
            accent="gold"
          >
            <p className="smart-panel-description">
              {t("smartWorkspace.tools.description")}
            </p>

            <div className="smart-tool-highlight">
              <div className="smart-tool-highlight__icon">
                <WandSparkles size={18} />
              </div>
              <div>
                <strong>{t("smartWorkspace.templates.title")}</strong>
                <p>{t("smartWorkspace.templates.description")}</p>
              </div>
            </div>
          </InfoPanel>

          <InfoPanel
            kicker={t("smartWorkspace.duplicates.kicker")}
            title={t("smartWorkspace.duplicates.title")}
            count={duplicates.length}
            accent="default"
          >
            <div className="smart-list">
              {duplicates.length === 0 ? (
                <div className="smart-empty">
                  {t("smartWorkspace.duplicates.empty")}
                </div>
              ) : (
                duplicates.map((duplicate) => {
                  const key = `${duplicate.firstFolderId}-${duplicate.secondFolderId}`;

                  return (
                    <article key={key} className="smart-duplicate-card">
                      <div>
                        <h3>
                          {duplicate.firstFolderName} ↔{" "}
                          {duplicate.secondFolderName}
                        </h3>
                        <p>{duplicate.reason}</p>
                        <span>
                          {t("smartWorkspace.duplicates.similar", {
                            score: percent(duplicate.similarity),
                          })}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="smart-button smart-button--warning"
                        disabled={busyKey === key}
                        onClick={() => void handleMergeDuplicate(duplicate)}
                      >
                        {busyKey === key ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <FolderGit2 size={16} />
                        )}
                        {t("smartWorkspace.actions.merge")}
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </InfoPanel>

          <section className="smart-panel surface-card smart-panel--templates">
            <button
              type="button"
              className="smart-collapse-header"
              onClick={() => setShowTemplates((value) => !value)}
            >
              <div>
                <p className="section-kicker">
                  {t("smartWorkspace.templates.kicker")}
                </p>
                <h2>{t("smartWorkspace.templates.title")}</h2>
                <span>{t("smartWorkspace.templates.description")}</span>
              </div>

              <div className="smart-collapse-header__right">
                <span className="smart-panel__header-count">
                  {templates.length}
                </span>

                <ChevronDown
                  className={showTemplates ? "smart-rotate" : ""}
                  size={18}
                />
              </div>
            </button>

            {showTemplates ? (
              <div className="smart-templates-layout">
                <div className="smart-template-editor">
                  <div className="smart-template-editor__header">
                    <div>
                      <p className="section-kicker">
                        {selectedTemplateId
                          ? t("smartWorkspace.templates.editing")
                          : t("smartWorkspace.templates.formTitle")}
                      </p>
                      <h3>{t("smartWorkspace.templates.formTitle")}</h3>
                    </div>

                    <button
                      type="button"
                      className="smart-button smart-button--ghost smart-button--small"
                      onClick={handleResetTemplateForm}
                    >
                      {t("smartWorkspace.templates.clearSelection")}
                    </button>
                  </div>

                  {selectedTemplateId ? (
                    <div className="smart-template-selected-banner">
                      <Check size={15} />
                      <span>{t("smartWorkspace.templates.selectedHint")}</span>
                    </div>
                  ) : null}

                  <div className="smart-template-form-grid">
                    <label className="smart-field">
                      <span>{t("smartWorkspace.templates.nameLabel")}</span>
                      <input
                        value={templateForm.name}
                        onChange={(event) =>
                          setTemplateForm((value) => ({
                            ...value,
                            name: event.target.value,
                          }))
                        }
                        placeholder={t(
                          "smartWorkspace.templates.namePlaceholder",
                        )}
                      />
                    </label>

                    <label className="smart-field">
                      <span>
                        {t("smartWorkspace.templates.documentTypeLabel")}
                      </span>
                      <input
                        value={templateForm.documentType}
                        onChange={(event) =>
                          setTemplateForm((value) => ({
                            ...value,
                            documentType: event.target.value,
                          }))
                        }
                        placeholder={t(
                          "smartWorkspace.templates.documentTypePlaceholder",
                        )}
                      />
                    </label>

                    <label className="smart-field smart-field--full">
                      <span>{t("smartWorkspace.templates.promptLabel")}</span>
                      <textarea
                        rows={5}
                        value={templateForm.prompt}
                        onChange={(event) =>
                          setTemplateForm((value) => ({
                            ...value,
                            prompt: event.target.value,
                          }))
                        }
                        placeholder={t(
                          "smartWorkspace.templates.promptPlaceholder",
                        )}
                      />
                    </label>

                    <label className="smart-field">
                      <span>
                        {t("smartWorkspace.templates.outputFormatLabel")}
                      </span>
                      <input
                        value={templateForm.outputFormat}
                        onChange={(event) =>
                          setTemplateForm((value) => ({
                            ...value,
                            outputFormat: event.target.value,
                          }))
                        }
                        placeholder={t(
                          "smartWorkspace.templates.outputFormatPlaceholder",
                        )}
                      />
                    </label>
                  </div>

                  <div className="smart-template-editor__actions">
                    <button
                      type="button"
                      className="smart-button smart-button--primary"
                      disabled={
                        busyKey === "template-create" ||
                        !templateForm.name.trim() ||
                        !templateForm.prompt.trim()
                      }
                      onClick={() => void handleCreateTemplate()}
                    >
                      {busyKey === "template-create" ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Bot size={16} />
                      )}
                      {t("smartWorkspace.actions.saveTemplate")}
                    </button>
                  </div>
                </div>

                <div className="smart-template-library">
                  <div className="smart-template-library__header">
                    <div>
                      <p className="section-kicker">
                        {t("smartWorkspace.templates.savedTitle")}
                      </p>
                      <h3>{t("smartWorkspace.templates.savedTitle")}</h3>
                    </div>
                  </div>

                  {templates.length === 0 ? (
                    <div className="smart-empty">
                      {t("smartWorkspace.templates.empty")}
                    </div>
                  ) : (
                    <div className="smart-template-list">
                      {templates.map((template) => {
                        const isActive = selectedTemplateId === template.id;

                        return (
                          <article
                            key={template.id}
                            className={`smart-template-card ${
                              isActive ? "smart-template-card--active" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="smart-template-card__main"
                              onClick={() => handlePickTemplate(template)}
                            >
                              <div className="smart-template-card__top">
                                <div className="smart-template-card__icon">
                                  <WandSparkles size={16} />
                                </div>

                                <div className="smart-template-card__title-wrap">
                                  <div className="smart-template-card__title-line">
                                    <strong>{template.name}</strong>

                                    {isActive ? (
                                      <span className="smart-template-card__selected-inline">
                                        <CheckCircle2 size={13} />
                                        {t("smartWorkspace.templates.selected")}
                                      </span>
                                    ) : null}
                                  </div>

                                  <span>
                                    {template.documentType ||
                                      t("smartWorkspace.templates.anyDocument")}
                                  </span>
                                </div>
                              </div>

                              <div className="smart-template-card__meta">
                                <span>
                                  {formatDate(
                                    template.createdAtUtc,
                                    i18n.language,
                                  )}
                                </span>
                                <span>•</span>
                                <span>{template.outputFormat}</span>
                              </div>
                            </button>

                            <div className="smart-template-card__actions">
                              <button
                                type="button"
                                className="smart-icon-button"
                                onClick={() => handlePickTemplate(template)}
                                aria-label={t(
                                  "smartWorkspace.templates.loadTemplate",
                                )}
                              >
                                <Copy size={15} />
                              </button>

                              <button
                                type="button"
                                className="smart-icon-button smart-icon-button--danger"
                                disabled={busyKey === template.id}
                                onClick={() =>
                                  void handleDeleteTemplate(template.id)
                                }
                                aria-label={t(
                                  "smartWorkspace.actions.deleteTemplate",
                                )}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </section>

      <FolderPickerModal
        open={folderCorrection !== null}
        documentItem={folderCorrection?.document}
        folders={folders}
        expandedIds={folderCorrection?.expandedIds ?? new Set<string>()}
        busy={busyKey?.startsWith("correct:") || busyKey?.startsWith("unfile:") || false}
        language={i18n.language}
        onToggle={toggleCorrectionFolder}
        onPick={(folderId) => void handlePickCorrectionFolder(folderId)}
        onUnfile={() => {
          if (folderCorrection?.document) void handleUnfileDocument(folderCorrection.document);
        }}
        onClose={() => setFolderCorrection(null)}
        t={translate}
      />
    </div>
  );
}
