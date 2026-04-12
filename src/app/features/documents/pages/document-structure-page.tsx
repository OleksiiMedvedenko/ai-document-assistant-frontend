import type { DocumentFolderItem } from "@/app/api/document-folders.api";
import { getDocumentFoldersTree } from "@/app/api/document-folders.api";
import type {
  DocumentItem,
  DocumentPreviewMetaDto,
} from "@/app/api/documents.api";
import {
  getDocumentOriginalFileBlob,
  getDocumentPreviewFileBlob,
  getDocumentPreviewMeta,
  getDocuments,
} from "@/app/api/documents.api";
import {
  getDocumentDisplayName,
  getDocumentTypeLabel,
} from "@/app/lib/document";
import i18n from "@/i18n";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../../../styles/document-structure-page.css";

type TreeNode =
  | {
      type: "folder";
      id: string;
      label: string;
      children: TreeNode[];
      count: number;
    }
  | {
      type: "document";
      id: string;
      label: string;
      document: DocumentItem;
    };

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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error !== "object") return fallback;

  const anyError = error as {
    response?: { data?: unknown };
    data?: unknown;
    message?: string;
    error?: string;
  };

  const candidates: unknown[] = [
    anyError.response?.data,
    anyError.data,
    anyError.error,
    anyError.message,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (typeof candidate === "object") {
      const record = candidate as Record<string, unknown>;
      const nested =
        record.message ??
        record.Message ??
        record.error ??
        record.errorMessage ??
        record.title ??
        record.detail;

      if (typeof nested === "string" && nested.trim()) {
        return nested;
      }
    }
  }

  return fallback;
}

function getDocumentsArray(result: unknown): DocumentItem[] {
  if (Array.isArray(result)) return result as DocumentItem[];

  if (
    result &&
    typeof result === "object" &&
    "items" in result &&
    Array.isArray((result as { items?: unknown[] }).items)
  ) {
    return (result as { items: DocumentItem[] }).items;
  }

  return [];
}

function countDocumentsInFolderTree(
  folder: DocumentFolderItem,
  documents: DocumentItem[],
): number {
  const own = documents.filter((doc) => doc.folderId === folder.id).length;
  const nested = folder.children.reduce(
    (sum, child) => sum + countDocumentsInFolderTree(child, documents),
    0,
  );

  return own + nested;
}

function buildTree(
  folders: DocumentFolderItem[],
  documents: DocumentItem[],
  language: string,
  uncategorizedLabel: string,
): TreeNode[] {
  function mapFolder(folder: DocumentFolderItem): TreeNode {
    const childFolders = folder.children.map(mapFolder);

    const childDocuments: TreeNode[] = documents
      .filter((doc) => doc.folderId === folder.id)
      .map((doc) => ({
        type: "document",
        id: doc.id,
        label: getDocumentDisplayName(doc),
        document: doc,
      }));

    return {
      type: "folder",
      id: folder.id,
      label: getFolderDisplayName(folder, language),
      children: [...childFolders, ...childDocuments],
      count: countDocumentsInFolderTree(folder, documents),
    };
  }

  const rootFolders = folders.map(mapFolder);

  const uncategorizedDocs = documents
    .filter((doc) => !doc.folderId)
    .map(
      (doc) =>
        ({
          type: "document",
          id: doc.id,
          label: getDocumentDisplayName(doc),
          document: doc,
        }) satisfies TreeNode,
    );

  if (uncategorizedDocs.length > 0) {
    rootFolders.push({
      type: "folder",
      id: "uncategorized",
      label: uncategorizedLabel,
      children: uncategorizedDocs,
      count: uncategorizedDocs.length,
    });
  }

  return rootFolders;
}

function collectFolderIds(nodes: TreeNode[]): string[] {
  const result: string[] = [];

  function walk(node: TreeNode) {
    if (node.type === "folder") {
      result.push(node.id);
      node.children.forEach(walk);
    }
  }

  nodes.forEach(walk);
  return result;
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return nodes;

  function match(node: TreeNode): TreeNode | null {
    if (node.type === "document") {
      return node.label.toLowerCase().includes(lowered) ? node : null;
    }

    const matchedChildren = node.children
      .map(match)
      .filter(Boolean) as TreeNode[];

    const folderMatches = node.label.toLowerCase().includes(lowered);

    if (folderMatches || matchedChildren.length > 0) {
      return {
        ...node,
        children: matchedChildren,
      };
    }

    return null;
  }

  return nodes.map(match).filter(Boolean) as TreeNode[];
}

function findFolderById(
  folders: DocumentFolderItem[],
  folderId: string | null,
): DocumentFolderItem | null {
  if (!folderId) return null;

  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }

    const nested = findFolderById(folder.children, folderId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function TreeItem({
  node,
  expandedIds,
  selectedDocumentId,
  selectedFolderId,
  onToggle,
  onSelectDocument,
  onSelectFolder,
}: {
  node: TreeNode;
  expandedIds: Set<string>;
  selectedDocumentId: string | null;
  selectedFolderId: string | null;
  onToggle: (id: string) => void;
  onSelectDocument: (documentId: string) => void;
  onSelectFolder: (folderId: string) => void;
}) {
  if (node.type === "document") {
    const isActive = selectedDocumentId === node.id;

    return (
      <button
        type="button"
        className={`structure-tree__item structure-tree__item--document ${
          isActive ? "structure-tree__item--active" : ""
        }`}
        onClick={() => onSelectDocument(node.id)}
      >
        <span className="structure-tree__icon">
          <FileText size={15} />
        </span>

        <span className="structure-tree__label" title={node.label}>
          {node.label}
        </span>
      </button>
    );
  }

  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div className="structure-tree__node">
      <button
        type="button"
        className={`structure-tree__item structure-tree__item--folder ${
          isSelected ? "structure-tree__item--active" : ""
        }`}
        onClick={() => {
          onSelectFolder(node.id);
          if (hasChildren) {
            onToggle(node.id);
          }
        }}
      >
        <span className="structure-tree__toggle">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )
          ) : (
            <span className="structure-tree__toggle-placeholder" />
          )}
        </span>

        <span className="structure-tree__icon">
          {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
        </span>

        <span className="structure-tree__label" title={node.label}>
          {node.label}
        </span>

        <span className="structure-tree__count">{node.count}</span>
      </button>

      {hasChildren && isExpanded ? (
        <div className="structure-tree__children">
          {node.children.map((child) => (
            <TreeItem
              key={`${child.type}-${child.id}`}
              node={child}
              expandedIds={expandedIds}
              selectedDocumentId={selectedDocumentId}
              selectedFolderId={selectedFolderId}
              onToggle={onToggle}
              onSelectDocument={onSelectDocument}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PreviewPane({
  selectedDocument,
  selectedFolder,
  previewMeta,
  previewLoading,
  previewError,
  previewObjectUrl,
  originalObjectUrl,
  t,
  language,
}: {
  selectedDocument: DocumentItem | null;
  selectedFolder: DocumentFolderItem | null;
  previewMeta: DocumentPreviewMetaDto | null;
  previewLoading: boolean;
  previewError: string;
  previewObjectUrl: string;
  originalObjectUrl: string;
  t: (key: string) => string;
  language: string;
}) {
  if (!selectedDocument && !selectedFolder) {
    return (
      <section className="document-structure__viewer surface-card">
        <div className="document-structure__empty">
          <FolderTree size={24} />
          <h3>{t("documentStructurePage.emptyPreviewTitle")}</h3>
          <p>{t("documentStructurePage.emptyPreviewSubtitle")}</p>
        </div>
      </section>
    );
  }

  if (selectedFolder && !selectedDocument) {
    const folderTitle = getFolderDisplayName(selectedFolder, language);

    return (
      <section className="document-structure__viewer surface-card">
        <div className="document-structure__viewer-topbar">
          <div className="document-structure__viewer-title-wrap">
            <p className="section-kicker">
              {t("documentStructurePage.previewKicker")}
            </p>
            <h2>{folderTitle}</h2>
            <div className="document-structure__viewer-meta">
              <span className="document-structure__viewer-chip">
                <Folder size={14} />
                {t("documents.treeTitle")}
              </span>
            </div>
          </div>

          <div className="document-structure__viewer-actions">
            <Link
              to={`/folders/${selectedFolder.id}/chat`}
              className="document-structure__action document-structure__action--secondary"
            >
              <Sparkles size={16} />
              <span>{t("documentStructurePage.openFolderChat")}</span>
            </Link>
          </div>
        </div>

        <div className="document-structure__viewer-body">
          <div className="document-structure__empty">
            <FolderTree size={24} />
            <h3>{t("documentStructurePage.folderSelectedTitle")}</h3>
            <p>{t("documentStructurePage.folderSelectedSubtitle")}</p>
          </div>
        </div>
      </section>
    );
  }

  const title =
    selectedDocument?.originalFileName ||
    selectedDocument?.fileName ||
    selectedDocument?.name ||
    "document";

  return (
    <section className="document-structure__viewer surface-card">
      <div className="document-structure__viewer-topbar">
        <div className="document-structure__viewer-title-wrap">
          <p className="section-kicker">
            {t("documentStructurePage.previewKicker")}
          </p>
          <h2>{title}</h2>
          <div className="document-structure__viewer-meta">
            <span className="document-structure__viewer-chip">
              <FileText size={14} />
              {selectedDocument ? getDocumentTypeLabel(selectedDocument) : ""}
            </span>
          </div>
        </div>

        <div className="document-structure__viewer-actions">
          {selectedDocument ? (
            <Link
              to={`/documents/${selectedDocument.id}/chat`}
              className="document-structure__action document-structure__action--secondary"
            >
              <Sparkles size={16} />
              <span>{t("documentStructurePage.openChat")}</span>
            </Link>
          ) : null}

          {originalObjectUrl ? (
            <a
              href={originalObjectUrl}
              target="_blank"
              rel="noreferrer"
              className="document-structure__action"
            >
              <ExternalLink size={16} />
              <span>{t("documentStructurePage.openOriginal")}</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="document-structure__viewer-body">
        {previewLoading ? (
          <div className="document-structure__empty">
            <Loader2 size={20} className="spin" />
            <p>{t("documentStructurePage.loadingPreview")}</p>
          </div>
        ) : previewError ? (
          <div className="document-structure__error">
            <AlertCircle size={18} />
            <span>{previewError}</span>
          </div>
        ) : previewMeta?.canInlinePreview && previewObjectUrl ? (
          <iframe
            title={title}
            src={previewObjectUrl}
            className="document-structure__viewer-frame"
          />
        ) : (
          <div className="document-structure__empty">
            <FileText size={24} />
            <h3>{t("documentStructurePage.previewUnavailableTitle")}</h3>
            <p>
              {previewMeta?.message ||
                t("documentStructurePage.previewUnavailableSubtitle")}
            </p>

            {originalObjectUrl ? (
              <a
                href={originalObjectUrl}
                target="_blank"
                rel="noreferrer"
                className="document-structure__action"
              >
                <ExternalLink size={16} />
                <span>{t("documentStructurePage.openOriginal")}</span>
              </a>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function DocumentStructurePage() {
  const { t } = useTranslation();
  const language = i18n.language;

  const [folders, setFolders] = useState<DocumentFolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [previewMeta, setPreviewMeta] = useState<DocumentPreviewMetaDto | null>(
    null,
  );
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");
  const [originalObjectUrl, setOriginalObjectUrl] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const [foldersResult, documentsResult] = await Promise.all([
          getDocumentFoldersTree(),
          getDocuments(),
        ]);

        const normalizedFolders = Array.isArray(foldersResult)
          ? foldersResult
          : [];
        const normalizedDocuments = getDocumentsArray(documentsResult);

        setFolders(normalizedFolders);
        setDocuments(normalizedDocuments);

        const tree = buildTree(
          normalizedFolders,
          normalizedDocuments,
          language,
          t("documentStructurePage.uncategorized"),
        );

        setExpandedIds(new Set(collectFolderIds(tree)));

        if (normalizedDocuments.length > 0) {
          setSelectedDocumentId(normalizedDocuments[0].id);
          setSelectedFolderId(null);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, t("common.unexpectedError")));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [language, t]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const selectedFolder = useMemo(
    () => findFolderById(folders, selectedFolderId),
    [folders, selectedFolderId],
  );

  useEffect(() => {
    async function loadPreviewMeta() {
      if (!selectedDocumentId) {
        setPreviewMeta(null);
        return;
      }

      setPreviewLoading(true);
      setPreviewError("");

      try {
        const result = await getDocumentPreviewMeta(selectedDocumentId);
        setPreviewMeta(result);
      } catch (err) {
        setPreviewMeta(null);
        setPreviewError(getApiErrorMessage(err, t("common.unexpectedError")));
      } finally {
        setPreviewLoading(false);
      }
    }

    void loadPreviewMeta();
  }, [selectedDocumentId, t]);

  useEffect(() => {
    let previewUrlToRevoke = "";
    let originalUrlToRevoke = "";

    async function loadProtectedFiles() {
      if (!selectedDocumentId) {
        setPreviewObjectUrl("");
        setOriginalObjectUrl("");
        return;
      }

      try {
        const [previewBlob, originalBlob] = await Promise.all([
          getDocumentPreviewFileBlob(selectedDocumentId),
          getDocumentOriginalFileBlob(selectedDocumentId),
        ]);

        previewUrlToRevoke = URL.createObjectURL(previewBlob);
        originalUrlToRevoke = URL.createObjectURL(originalBlob);

        setPreviewObjectUrl(previewUrlToRevoke);
        setOriginalObjectUrl(originalUrlToRevoke);
      } catch {
        setPreviewObjectUrl("");
        setOriginalObjectUrl("");
      }
    }

    void loadProtectedFiles();

    return () => {
      if (previewUrlToRevoke) {
        URL.revokeObjectURL(previewUrlToRevoke);
      }

      if (originalUrlToRevoke) {
        URL.revokeObjectURL(originalUrlToRevoke);
      }
    };
  }, [selectedDocumentId]);

  const tree = useMemo(() => {
    const built = buildTree(
      folders,
      documents,
      language,
      t("documentStructurePage.uncategorized"),
    );

    return filterTree(built, query);
  }, [folders, documents, language, query, t]);

  const totalFolders = useMemo(() => {
    function count(items: DocumentFolderItem[]): number {
      return items.reduce(
        (sum, folder) => sum + 1 + count(folder.children ?? []),
        0,
      );
    }

    return count(folders);
  }, [folders]);

  function handleToggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  if (loading) {
    return (
      <div className="document-structure-page">
        <div className="page-loading">
          <Loader2 className="spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="document-structure-page">
      <section className="document-structure__hero surface-card">
        <div className="document-structure__hero-copy">
          <div className="document-structure__hero-badge">
            <Sparkles size={14} />
            <span>{t("documentStructurePage.kicker")}</span>
          </div>

          <h1>{t("documentStructurePage.title")}</h1>
          <p>{t("documentStructurePage.subtitle")}</p>
        </div>

        <div className="document-structure__hero-stats">
          <div className="document-structure__stat">
            <span>{t("documents.totalDocuments")}</span>
            <strong>{documents.length}</strong>
          </div>
          <div className="document-structure__stat">
            <span>{t("documents.folders")}</span>
            <strong>{totalFolders}</strong>
          </div>
        </div>
      </section>

      {error ? (
        <div className="document-structure__error surface-card">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="document-structure__layout">
        <aside className="document-structure__sidebar surface-card">
          <div className="document-structure__sidebar-header">
            <div>
              <p className="section-kicker">
                {t("documentStructurePage.treeKicker")}
              </p>
              <h2>{t("documentStructurePage.treeTitle")}</h2>
            </div>

            <label className="document-structure__search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("documentStructurePage.searchPlaceholder")}
              />
            </label>
          </div>

          <div className="document-structure__tree">
            {tree.length === 0 ? (
              <div className="document-structure__empty document-structure__empty--small">
                <FileText size={20} />
                <h3>{t("documentStructurePage.emptyTreeTitle")}</h3>
                <p>{t("documentStructurePage.emptyTreeSubtitle")}</p>
              </div>
            ) : (
              tree.map((node) => (
                <TreeItem
                  key={`${node.type}-${node.id}`}
                  node={node}
                  expandedIds={expandedIds}
                  selectedDocumentId={selectedDocumentId}
                  selectedFolderId={selectedFolderId}
                  onToggle={handleToggle}
                  onSelectDocument={(documentId) => {
                    setSelectedDocumentId(documentId);
                    setSelectedFolderId(null);
                  }}
                  onSelectFolder={(folderId) => {
                    setSelectedFolderId(folderId);
                    setSelectedDocumentId(null);
                    setPreviewMeta(null);
                    setPreviewObjectUrl("");
                    setOriginalObjectUrl("");
                    setPreviewError("");
                  }}
                />
              ))
            )}
          </div>
        </aside>

        <PreviewPane
          selectedDocument={selectedDocument}
          selectedFolder={selectedFolder}
          previewMeta={previewMeta}
          previewLoading={previewLoading}
          previewError={previewError}
          previewObjectUrl={previewObjectUrl}
          originalObjectUrl={originalObjectUrl}
          t={t}
          language={language}
        />
      </div>
    </div>
  );
}

export default DocumentStructurePage;
