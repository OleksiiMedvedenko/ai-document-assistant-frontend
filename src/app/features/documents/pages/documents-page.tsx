import type { DocumentFolderItem } from "@/app/api/document-folders.api";
import {
  createDocumentFolder,
  deleteDocumentFolder,
  getDocumentFoldersTree,
  updateDocumentFolder,
} from "@/app/api/document-folders.api";
import type { DocumentItem } from "@/app/api/documents.api";
import {
  deleteDocument,
  getDocuments,
  moveDocumentToFolder,
  uploadDocument,
} from "@/app/api/documents.api";
import { FolderEditorModal } from "@/app/components/documents/folder-editor-modal";
import { DeleteConfirmModal } from "@/app/components/feedback/delete-confirm-modal";
import {
  getDocumentDisplayName,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  isDocumentFailed,
  isDocumentProcessing,
  isDocumentReady,
  normalizeDocumentStatus,
} from "@/app/lib/document";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  FileUp,
  Folder,
  FolderOpen,
  FolderPlus,
  GitCompareArrows,
  GripVertical,
  Loader2,
  MessageSquareText,
  PencilLine,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../../../styles/documents-page.css";

type FolderTarget = "all" | "uncategorized" | string;

type FolderEditorState = {
  open: boolean;
  mode: "create" | "edit";
  parentFolderId?: string | null;
  folder?: DocumentFolderItem | null;
};

const STATUS_POLL_INTERVAL_MS = 3000;

function getStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

function statusClass(status: number | string | undefined) {
  const value = normalizeDocumentStatus(status);

  if (value === "uploaded" || value === "queued") {
    return "doc-status doc-status--pending";
  }

  if (value === "processing") {
    return "doc-status doc-status--processing";
  }

  if (value === "ready") {
    return "doc-status doc-status--ready";
  }

  if (value === "failed") {
    return "doc-status doc-status--failed";
  }

  return "doc-status doc-status--unknown";
}

function classificationClass(value?: string | null) {
  switch (String(value ?? "").toLowerCase()) {
    case "manual":
      return "document-card__classification document-card__classification--manual";
    case "pending":
      return "document-card__classification document-card__classification--pending";
    case "auto-assigned":
      return "document-card__classification document-card__classification--auto";
    case "auto-created-and-assigned":
      return "document-card__classification document-card__classification--auto";
    case "suggested":
      return "document-card__classification document-card__classification--suggested";
    case "uncategorized":
      return "document-card__classification document-card__classification--uncategorized";
    default:
      return "document-card__classification";
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error !== "object") return fallback;

  const anyError = error as {
    response?: {
      data?: unknown;
      status?: number;
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

function formatDate(value?: string, locale = "en") {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function getFolderDisplayName(
  folder: Pick<DocumentFolderItem, "name" | "namePl" | "nameEn" | "nameUa">,
  language: string,
) {
  const normalized = language.toLowerCase();

  if (normalized.startsWith("pl")) return folder.namePl || folder.name;
  if (normalized.startsWith("ua") || normalized.startsWith("uk")) {
    return folder.nameUa || folder.name;
  }

  if (normalized.startsWith("en")) return folder.nameEn || folder.name;
  return folder.name;
}

function getClassificationLabel(
  t: (key: string) => string,
  value?: string | null,
) {
  switch (String(value ?? "").toLowerCase()) {
    case "manual":
      return t("documents.folderClassification.manual");
    case "pending":
      return t("documents.folderClassification.pending");
    case "auto-assigned":
      return t("documents.folderClassification.autoAssigned");
    case "auto-created-and-assigned":
      return t("documents.folderClassification.autoCreated");
    case "suggested":
      return t("documents.folderClassification.suggested");
    case "uncategorized":
      return t("documents.folderClassification.uncategorized");
    default:
      return t("documents.folderClassification.none");
  }
}

function flattenFolderIds(folder: DocumentFolderItem): string[] {
  return [folder.id, ...folder.children.flatMap(flattenFolderIds)];
}

function countAllFolders(folders: DocumentFolderItem[]): number {
  return folders.reduce<number>(
    (acc, folder) => acc + 1 + countAllFolders(folder.children),
    0,
  );
}

function DocumentsInsightCard({
  icon,
  label,
  value,
  hint,
  tone = "gold",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "gold" | "purple" | "green" | "blue";
}) {
  return (
    <div className={`documents-insight-card documents-insight-card--${tone}`}>
      <div className="documents-insight-card__icon">{icon}</div>
      <div className="documents-insight-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
      </div>
    </div>
  );
}

type FolderTreeNodeProps = {
  folder: DocumentFolderItem;
  language: string;
  selectedTarget: FolderTarget;
  getDescendantCount: (folder: DocumentFolderItem) => number;
  expandedIds: Set<string>;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string) => void;
  onCreateChild: (folderId: string) => void;
  onEdit: (folder: DocumentFolderItem) => void;
  onDelete: (folder: DocumentFolderItem) => void;
  onDropDocument: (folderId: string) => void;
};

function FolderTreeNode({
  folder,
  language,
  selectedTarget,
  getDescendantCount,
  expandedIds,
  onToggle,
  onSelect,
  onCreateChild,
  onEdit,
  onDelete,
  onDropDocument,
}: FolderTreeNodeProps) {
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedTarget === folder.id;
  const hasChildren = folder.children.length > 0;
  const label = getFolderDisplayName(folder, language);

  return (
    <li className="folder-tree__node">
      <div
        className={`folder-tree__item ${isSelected ? "folder-tree__item--active" : ""}`}
        onClick={() => onSelect(folder.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onDropDocument(folder.id);
        }}
      >
        <button
          type="button"
          className="folder-tree__toggle"
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) {
              onToggle(folder.id);
            }
          }}
          aria-label={hasChildren ? label : ""}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="folder-tree__toggle-placeholder" />
          )}
        </button>

        <div className="folder-tree__item-main">
          {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
          <span>{label}</span>
        </div>

        <div className="folder-tree__item-meta">
          {folder.isSystemGenerated ? (
            <span className="folder-tree__system-badge">AI</span>
          ) : null}
          <span className="folder-tree__count">
            {getDescendantCount(folder)}
          </span>
        </div>

        <div className="folder-tree__actions">
          <button
            type="button"
            className="folder-tree__action"
            onClick={(event) => {
              event.stopPropagation();
              onCreateChild(folder.id);
            }}
            aria-label="Create child folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            className="folder-tree__action"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(folder);
            }}
            aria-label="Edit folder"
          >
            <PencilLine size={14} />
          </button>
          <button
            type="button"
            className="folder-tree__action folder-tree__action--danger"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(folder);
            }}
            aria-label="Delete folder"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <ul className="folder-tree__children">
          {folder.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              language={language}
              selectedTarget={selectedTarget}
              getDescendantCount={getDescendantCount}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onDropDocument={onDropDocument}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function DocumentsPage() {
  const { t, i18n } = useTranslation();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<DocumentFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folderBusy, setFolderBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<FolderTarget>("all");
  const [dragDocumentId, setDragDocumentId] = useState<string | null>(null);
  const [smartOrganize, setSmartOrganize] = useState(() =>
    getStoredBoolean("documents.smartOrganize", true),
  );
  const [allowAutoCreateFolders, setAllowAutoCreateFolders] = useState(() =>
    getStoredBoolean("documents.allowAutoCreateFolders", true),
  );
  const [folderEditor, setFolderEditor] = useState<FolderEditorState>({
    open: false,
    mode: "create",
  });
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] =
    useState<DocumentFolderItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const pollingRef = useRef<number | null>(null);

  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const folderMap = useMemo(() => {
    const map = new Map<string, DocumentFolderItem>();

    const visit = (items: DocumentFolderItem[]) => {
      items.forEach((item) => {
        map.set(item.id, item);
        visit(item.children);
      });
    };

    visit(folders);
    return map;
  }, [folders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "documents.smartOrganize",
        String(smartOrganize),
      );
    }
  }, [smartOrganize]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "documents.allowAutoCreateFolders",
        String(allowAutoCreateFolders),
      );
    }
  }, [allowAutoCreateFolders]);

  const folderDescendantsMap = useMemo(() => {
    const map = new Map<string, string[]>();

    const visit = (items: DocumentFolderItem[]) => {
      items.forEach((item) => {
        map.set(item.id, flattenFolderIds(item));
        visit(item.children);
      });
    };

    visit(folders);
    return map;
  }, [folders]);

  const documentsByFolder = useMemo(() => {
    const map = new Map<string, number>();

    for (const document of documents) {
      if (!document.folderId) continue;
      map.set(document.folderId, (map.get(document.folderId) ?? 0) + 1);
    }

    return map;
  }, [documents]);

  function countDocumentsForTree(folder: DocumentFolderItem): number {
    const ownCount = documentsByFolder.get(folder.id) ?? 0;
    return (
      ownCount +
      folder.children.reduce(
        (acc, child) => acc + countDocumentsForTree(child),
        0,
      )
    );
  }

  async function loadDocumentsAndFolders(showLoader = false) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      setActionError("");
      const [documentsData, folderData] = await Promise.all([
        getDocuments(),
        getDocumentFoldersTree(),
      ]);

      const safeDocuments = Array.isArray(documentsData) ? documentsData : [];
      const safeFolders = Array.isArray(folderData) ? folderData : [];

      setDocuments(safeDocuments);
      setFolders(safeFolders);

      setExpandedIds((current) => {
        if (current.size > 0) {
          return current;
        }

        const next = new Set<string>();
        const seed = (items: DocumentFolderItem[]) => {
          items.forEach((item) => {
            next.add(item.id);
            seed(item.children);
          });
        };
        seed(safeFolders);
        return next;
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
    void loadDocumentsAndFolders(true);
  }, []);

  const hasProcessingDocuments = useMemo(() => {
    return documents.some((doc) => isDocumentProcessing(doc.status));
  }, [documents]);

  useEffect(() => {
    if (!hasProcessingDocuments) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (pollingRef.current) return;

    pollingRef.current = window.setInterval(() => {
      void loadDocumentsAndFolders(false);
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasProcessingDocuments]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setActionError("");

    try {
      const folderId =
        selectedTarget !== "all" && selectedTarget !== "uncategorized"
          ? selectedTarget
          : null;

      await uploadDocument({
        file,
        folderId,
        smartOrganize,
        allowSystemFolderCreation: allowAutoCreateFolders,
      });

      await loadDocumentsAndFolders(false);

      if (!pollingRef.current) {
        pollingRef.current = window.setInterval(() => {
          void loadDocumentsAndFolders(false);
        }, STATUS_POLL_INTERVAL_MS);
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("limits.uploadReached")));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument() {
    if (!deleteDocumentId) return;

    setDeleteBusy(true);
    setActionError("");

    try {
      await deleteDocument(deleteDocumentId);
      setDeleteDocumentId(null);
      await loadDocumentsAndFolders(false);
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleDeleteFolder() {
    if (!folderToDelete) return;

    setDeleteBusy(true);
    setActionError("");

    try {
      await deleteDocumentFolder(folderToDelete.id);
      setFolderToDelete(null);

      if (selectedTarget === folderToDelete.id) {
        setSelectedTarget("all");
      }

      await loadDocumentsAndFolders(false);
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleMoveDocument(
    documentId: string,
    folderId?: string | null,
  ) {
    setActionError("");

    try {
      await moveDocumentToFolder(documentId, folderId ?? null);
      setDragDocumentId(null);
      await loadDocumentsAndFolders(false);
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    }
  }

  async function handleSubmitFolderEditor(payload: {
    name: string;
    namePl: string;
    nameEn: string;
    nameUa: string;
  }) {
    setFolderBusy(true);
    setActionError("");

    try {
      if (folderEditor.mode === "edit" && folderEditor.folder) {
        await updateDocumentFolder(folderEditor.folder.id, payload);
      } else {
        await createDocumentFolder({
          parentFolderId: folderEditor.parentFolderId ?? null,
          ...payload,
        });
      }

      setFolderEditor({ open: false, mode: "create" });
      await loadDocumentsAndFolders(false);
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      setFolderBusy(false);
    }
  }

  const filteredDocuments = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const folderIds =
      selectedTarget === "all"
        ? null
        : selectedTarget === "uncategorized"
          ? []
          : (folderDescendantsMap.get(selectedTarget) ?? [selectedTarget]);

    return documents.filter((doc) => {
      const matchesFolder =
        folderIds === null
          ? true
          : folderIds.length === 0
            ? !doc.folderId
            : !!doc.folderId && folderIds.includes(doc.folderId);

      if (!matchesFolder) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const folderLabel = doc.folderId
        ? getFolderDisplayName(
            folderMap.get(doc.folderId) ?? {
              name: doc.folderName ?? "",
              namePl: doc.folderNamePl ?? "",
              nameEn: doc.folderNameEn ?? "",
              nameUa: doc.folderNameUa ?? "",
            },
            locale,
          )
        : "";

      return (
        getDocumentDisplayName(doc).toLowerCase().includes(normalized) ||
        folderLabel.toLowerCase().includes(normalized) ||
        getDocumentTypeLabel(doc).toLowerCase().includes(normalized)
      );
    });
  }, [
    documents,
    folderDescendantsMap,
    folderMap,
    locale,
    search,
    selectedTarget,
  ]);

  const aiReadyCount = documents.filter((doc) =>
    isDocumentReady(doc.status),
  ).length;
  const processingCount = documents.filter((doc) =>
    isDocumentProcessing(doc.status),
  ).length;
  const failedCount = documents.filter((doc) =>
    isDocumentFailed(doc.status),
  ).length;
  const uncategorizedCount = documents.filter((doc) => !doc.folderId).length;
  const folderCount = countAllFolders(folders);

  const currentFolderLabel = useMemo(() => {
    if (selectedTarget === "all") return t("documents.tree.allDocuments");
    if (selectedTarget === "uncategorized") {
      return t("documents.tree.uncategorized");
    }

    const folder = folderMap.get(selectedTarget);
    if (!folder) {
      return t("documents.tree.allDocuments");
    }

    return getFolderDisplayName(folder, locale);
  }, [folderMap, locale, selectedTarget, t]);

  const deleteModalOpen = deleteDocumentId !== null || folderToDelete !== null;

  return (
    <div className="documents-page">
      <section className="documents-hero surface-card">
        <div className="documents-hero__content">
          <div className="documents-hero__badge">
            <Sparkles size={14} />
            <span>{t("documents.heroBadge")}</span>
          </div>

          <h1>{t("documents.title")}</h1>
          <p>{t("documents.subtitle")}</p>

          {actionError ? (
            <div className="form-alert form-alert--error">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          ) : null}

          <div className="documents-hero__actions">
            <label className="documents-upload">
              <input
                type="file"
                className="documents-upload__input"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUpload(file);
                    event.currentTarget.value = "";
                  }
                }}
              />

              <div className="documents-upload__icon">
                {uploading ? <FileUp size={22} /> : <UploadCloud size={22} />}
              </div>

              <div className="documents-upload__content">
                <strong>
                  {uploading
                    ? t("documents.uploading")
                    : t("documents.uploadTitle")}
                </strong>
                <span>{t("documents.uploadSubtitle")}</span>
                <small>
                  {t("documents.uploadTarget")}{" "}
                  <strong>{currentFolderLabel}</strong>
                </small>
              </div>
            </label>

            <button
              type="button"
              className="documents-refresh-button"
              onClick={() => void loadDocumentsAndFolders(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
              <span>{t("common.refresh")}</span>
            </button>
          </div>

          <div className="documents-settings">
            <button
              type="button"
              className="documents-settings__folder-button"
              onClick={() =>
                setFolderEditor({
                  open: true,
                  mode: "create",
                  parentFolderId:
                    selectedTarget !== "all" &&
                    selectedTarget !== "uncategorized"
                      ? selectedTarget
                      : null,
                })
              }
            >
              <FolderPlus size={16} />
              <span>{t("documents.createFolder")}</span>
            </button>

            <label className="documents-switch">
              <input
                type="checkbox"
                checked={smartOrganize}
                onChange={(event) => setSmartOrganize(event.target.checked)}
              />
              <span className="documents-switch__track" />
              <span className="documents-switch__label">
                <strong>{t("documents.smartOrganize")}</strong>
                <small>{t("documents.smartOrganizeHint")}</small>
              </span>
            </label>

            <label className="documents-switch">
              <input
                type="checkbox"
                checked={allowAutoCreateFolders}
                onChange={(event) =>
                  setAllowAutoCreateFolders(event.target.checked)
                }
              />
              <span className="documents-switch__track" />
              <span className="documents-switch__label">
                <strong>{t("documents.autoCreateFolders")}</strong>
                <small>{t("documents.autoCreateFoldersHint")}</small>
              </span>
            </label>
          </div>
        </div>

        <div className="documents-hero__stats">
          <div className="documents-stat-card">
            <p>{t("documents.totalDocuments")}</p>
            <h3>{documents.length}</h3>
          </div>

          <div className="documents-stat-card">
            <p>{t("documents.aiReady")}</p>
            <h3>{aiReadyCount}</h3>
          </div>

          <div className="documents-stat-card">
            <p>{t("documents.processingNow")}</p>
            <h3>{processingCount}</h3>
          </div>
        </div>
      </section>

      <section className="documents-insights">
        <DocumentsInsightCard
          icon={<FileText size={16} />}
          label={t("documents.totalDocuments")}
          value={documents.length}
          hint={t("documents.librarySubtitle")}
          tone="gold"
        />
        <DocumentsInsightCard
          icon={<BadgeCheck size={16} />}
          label={t("documents.aiReady")}
          value={aiReadyCount}
          hint={t("documents.readyForAi")}
          tone="green"
        />
        <DocumentsInsightCard
          icon={<Folder size={16} />}
          label={t("documents.folders")}
          value={folderCount}
          hint={t("documents.treeTitle")}
          tone="blue"
        />
        <DocumentsInsightCard
          icon={<Clock3 size={16} />}
          label={t("documents.processingNow")}
          value={processingCount}
          hint={t("documents.actions")}
          tone="purple"
        />
      </section>

      <section className="documents-workspace">
        <aside className="documents-sidebar surface-card">
          <div className="documents-sidebar__header">
            <div>
              <p className="section-kicker">{t("documents.treeKicker")}</p>
              <h2>{t("documents.treeTitle")}</h2>
              <p className="documents-sidebar__subtitle">
                {t("documents.treeSubtitle")}
              </p>
            </div>

            <button
              type="button"
              className="documents-sidebar__create"
              onClick={() =>
                setFolderEditor({
                  open: true,
                  mode: "create",
                  parentFolderId: null,
                })
              }
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="folder-tree">
            <button
              type="button"
              className={`folder-tree__root ${selectedTarget === "all" ? "folder-tree__root--active" : ""}`}
              onClick={() => setSelectedTarget("all")}
            >
              <div className="folder-tree__root-main">
                <FolderOpen size={16} />
                <span>{t("documents.tree.allDocuments")}</span>
              </div>
              <span className="folder-tree__count">{documents.length}</span>
            </button>

            <button
              type="button"
              className={`folder-tree__root ${selectedTarget === "uncategorized" ? "folder-tree__root--active" : ""}`}
              onClick={() => setSelectedTarget("uncategorized")}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragDocumentId) {
                  void handleMoveDocument(dragDocumentId, null);
                }
              }}
            >
              <div className="folder-tree__root-main">
                <FileText size={16} />
                <span>{t("documents.tree.uncategorized")}</span>
              </div>
              <span className="folder-tree__count">{uncategorizedCount}</span>
            </button>

            <ul className="folder-tree__list">
              {folders.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  language={locale}
                  selectedTarget={selectedTarget}
                  getDescendantCount={countDocumentsForTree}
                  expandedIds={expandedIds}
                  onToggle={(folderId) =>
                    setExpandedIds((current) => {
                      const next = new Set(current);
                      if (next.has(folderId)) next.delete(folderId);
                      else next.add(folderId);
                      return next;
                    })
                  }
                  onSelect={(folderId) => setSelectedTarget(folderId)}
                  onCreateChild={(folderId) =>
                    setFolderEditor({
                      open: true,
                      mode: "create",
                      parentFolderId: folderId,
                    })
                  }
                  onEdit={(folder) =>
                    setFolderEditor({
                      open: true,
                      mode: "edit",
                      folder,
                    })
                  }
                  onDelete={(folder) => setFolderToDelete(folder)}
                  onDropDocument={(folderId) => {
                    if (dragDocumentId) {
                      void handleMoveDocument(dragDocumentId, folderId);
                    }
                  }}
                />
              ))}
            </ul>
          </div>
        </aside>

        <section className="documents-library surface-card">
          <div className="documents-library__header">
            <div>
              <p className="section-kicker">{t("documents.libraryKicker")}</p>
              <h2>{t("documents.libraryTitle")}</h2>
              <p className="documents-library__subtitle">
                {t("documents.currentView")}:{" "}
                <strong>{currentFolderLabel}</strong>
              </p>
            </div>

            <div className="documents-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("documents.searchPlaceholder")}
              />
            </div>
          </div>

          {loading ? (
            <div className="documents-empty">
              <div className="documents-empty__icon">
                <Loader2 size={22} className="spin" />
              </div>
              <h3>{t("common.loading")}</h3>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="documents-empty">
              <div className="documents-empty__icon">
                <FileText size={22} />
              </div>
              <h3>{t("documents.emptyTitle")}</h3>
              <p>{t("documents.emptySubtitle")}</p>
            </div>
          ) : (
            <div className="documents-grid">
              {filteredDocuments.map((doc) => {
                const statusLabel = getDocumentStatusLabel(doc.status);
                const processing = isDocumentProcessing(doc.status);
                const ready = isDocumentReady(doc.status);
                const failed = isDocumentFailed(doc.status);
                const folderLabel = doc.folderId
                  ? getFolderDisplayName(
                      folderMap.get(doc.folderId) ?? {
                        name: doc.folderName ?? "",
                        namePl: doc.folderNamePl ?? "",
                        nameEn: doc.folderNameEn ?? "",
                        nameUa: doc.folderNameUa ?? "",
                      },
                      locale,
                    )
                  : t("documents.tree.uncategorized");

                return (
                  <article
                    key={doc.id}
                    className={`document-card ${dragDocumentId === doc.id ? "document-card--dragging" : ""}`}
                    draggable
                    onDragStart={() => setDragDocumentId(doc.id)}
                    onDragEnd={() => setDragDocumentId(null)}
                  >
                    <div className="document-card__top">
                      <div className="document-card__file">
                        <div className="document-card__drag">
                          <GripVertical size={14} />
                        </div>

                        <div className="document-card__file-icon">
                          <FileText size={18} />
                        </div>

                        <div className="document-card__file-info">
                          <h3>{getDocumentDisplayName(doc)}</h3>
                          <p>{getDocumentTypeLabel(doc)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteDocumentId(doc.id)}
                        className="document-card__delete"
                        aria-label={t("documents.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="document-card__meta">
                      <span className={statusClass(doc.status)}>
                        {t(
                          `documents.status.${statusLabel.toLowerCase()}`,
                          statusLabel,
                        )}
                      </span>

                      <span className="document-card__meta-chip">
                        <Clock3 size={13} />
                        {doc.uploadedAtUtc || doc.createdAt
                          ? formatDate(
                              doc.uploadedAtUtc ?? doc.createdAt,
                              locale,
                            )
                          : "—"}
                      </span>

                      <span className="document-card__meta-chip">
                        <Folder size={13} />
                        {folderLabel}
                      </span>
                    </div>

                    <div className="document-card__summary">
                      <div className="document-card__summary-item">
                        <span>{t("details.fileType")}</span>
                        <strong>{getDocumentTypeLabel(doc)}</strong>
                      </div>

                      <div className="document-card__summary-item">
                        <span>{t("documents.actions")}</span>
                        <strong>
                          {processing
                            ? t("documents.processingNow")
                            : ready
                              ? t("documents.aiReady")
                              : failed
                                ? t("documents.status.failed")
                                : statusLabel}
                        </strong>
                      </div>
                    </div>

                    <div className="document-card__classification-row">
                      <span
                        className={classificationClass(
                          doc.folderClassificationStatus,
                        )}
                      >
                        {getClassificationLabel(
                          t,
                          doc.folderClassificationStatus,
                        )}
                      </span>

                      {typeof doc.folderClassificationConfidence ===
                      "number" ? (
                        <span className="document-card__confidence">
                          {t("documents.confidence")}{" "}
                          <strong>
                            {Math.round(
                              doc.folderClassificationConfidence * 100,
                            )}
                            %
                          </strong>
                        </span>
                      ) : null}
                    </div>

                    {doc.errorMessage ? (
                      <div className="document-card__error">
                        <AlertCircle size={14} />
                        <span>{doc.errorMessage}</span>
                      </div>
                    ) : null}

                    <div className="document-card__actions">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="document-card__action document-card__action--primary"
                      >
                        <ArrowRight size={16} />
                        <span>{t("documents.openDetails")}</span>
                      </Link>

                      <Link
                        to={`/documents/${doc.id}/chat`}
                        className="document-card__action"
                      >
                        <MessageSquareText size={16} />
                        <span>{t("nav.chat")}</span>
                      </Link>

                      <Link to="/compare" className="document-card__action">
                        <GitCompareArrows size={16} />
                        <span>{t("nav.compare")}</span>
                      </Link>
                    </div>

                    <div className="document-card__footer">
                      <span>
                        <WandSparkles size={14} />
                        {ready
                          ? t("documents.readyForAi")
                          : processing
                            ? t("documents.processingNow")
                            : t("documents.dragToFolder")}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <FolderEditorModal
        open={folderEditor.open}
        mode={folderEditor.mode}
        busy={folderBusy}
        initialValue={folderEditor.folder}
        title={
          folderEditor.mode === "edit"
            ? t("documents.folderModal.editTitle")
            : folderEditor.parentFolderId
              ? t("documents.folderModal.createChildTitle")
              : t("documents.folderModal.createTitle")
        }
        subtitle={
          folderEditor.mode === "edit"
            ? t("documents.folderModal.editSubtitle")
            : folderEditor.parentFolderId
              ? t("documents.folderModal.createChildSubtitle")
              : t("documents.folderModal.createSubtitle")
        }
        labels={{
          name: t("documents.folderModal.name"),
          namePl: t("documents.folderModal.namePl"),
          nameEn: t("documents.folderModal.nameEn"),
          nameUa: t("documents.folderModal.nameUa"),
          save:
            folderEditor.mode === "edit"
              ? t("documents.folderModal.saveEdit")
              : t("documents.folderModal.saveCreate"),
          cancel: t("common.cancel"),
        }}
        onSubmit={(payload) => void handleSubmitFolderEditor(payload)}
        onCancel={() => setFolderEditor({ open: false, mode: "create" })}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        title={
          folderToDelete
            ? t("documents.deleteFolderTitle")
            : t("deleteModal.title")
        }
        description={
          folderToDelete
            ? t("documents.deleteFolderDescription")
            : t("deleteModal.description")
        }
        confirmLabel={
          folderToDelete ? t("documents.deleteFolder") : t("deleteModal.delete")
        }
        cancelLabel={t("deleteModal.cancel")}
        busy={deleteBusy}
        onConfirm={() =>
          void (folderToDelete ? handleDeleteFolder() : handleDeleteDocument())
        }
        onCancel={() => {
          setDeleteDocumentId(null);
          setFolderToDelete(null);
        }}
      />
    </div>
  );
}
