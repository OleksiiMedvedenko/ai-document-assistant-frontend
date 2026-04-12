import {
  askFolderQuestion,
  getFolderChatMessages,
  getFolderChatSessions,
} from "@/app/api/chats.api";
import {
  getDocumentFoldersTree,
  type DocumentFolderItem,
} from "@/app/api/document-folders.api";
import { getDocuments } from "@/app/api/documents.api";
import { isDocumentProcessing, isDocumentReady } from "@/app/lib/document";
import "@/app/styles/document-chat-page.css";
import "@/app/styles/folder-chat-page.css";
import i18n from "@/i18n";
import {
  AlertCircle,
  Bot,
  ChevronRight,
  Clock3,
  FolderOpen,
  Info,
  Loader2,
  MessageSquareText,
  MessagesSquare,
  SendHorizonal,
  Sparkles,
  User2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

type SessionItem = {
  id?: string;
  title?: string;
  name?: string;
  createdAtUtc?: string;
  lastMessageAtUtc?: string | null;
  messageCount?: number;
};

type MessageItem = {
  id?: string;
  role?: unknown;
  content?: unknown;
  message?: unknown;
  text?: unknown;
  answer?: unknown;
  createdAt?: string;
  createdAtUtc?: string;
};

type FolderDocumentItem = {
  id: string;
  folderId?: string | null;
  status?: number | string;
};

function normalizeLanguage(language?: string) {
  if (!language) return "en";
  if (language.startsWith("pl")) return "pl";
  if (language.startsWith("ua") || language.startsWith("uk")) return "ua";
  return "en";
}

function normalizeSessions(payload: unknown): SessionItem[] {
  if (Array.isArray(payload)) return payload as SessionItem[];

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as SessionItem[];
    if (Array.isArray(record.sessions)) return record.sessions as SessionItem[];
    if (Array.isArray(record.data)) return record.data as SessionItem[];
  }

  return [];
}

function normalizeMessages(payload: unknown): MessageItem[] {
  if (Array.isArray(payload)) return payload as MessageItem[];

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as MessageItem[];
    if (Array.isArray(record.messages)) return record.messages as MessageItem[];
    if (Array.isArray(record.data)) return record.data as MessageItem[];
  }

  return [];
}

function normalizeRole(role: unknown): "user" | "assistant" {
  if (typeof role === "string") {
    const value = role.toLowerCase();
    if (value === "user" || value === "human") return "user";
    return "assistant";
  }

  if (typeof role === "number") {
    return role === 1 ? "user" : "assistant";
  }

  if (role && typeof role === "object" && "value" in role) {
    const nested = (role as { value?: unknown }).value;
    if (typeof nested === "string") {
      const value = nested.toLowerCase();
      if (value === "user" || value === "human") return "user";
      return "assistant";
    }

    if (typeof nested === "number") {
      return nested === 1 ? "user" : "assistant";
    }
  }

  return "assistant";
}

function normalizeMessageContent(item: MessageItem): string {
  const candidates = [item.content, item.message, item.text, item.answer];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (candidate != null && typeof candidate === "object") {
      try {
        return JSON.stringify(candidate, null, 2);
      } catch {
        return String(candidate);
      }
    }
  }

  return "";
}

function formatMessageDate(value?: string, language = "en") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "";
  }
}

function findFolderById(
  folders: DocumentFolderItem[],
  folderId: string,
): DocumentFolderItem | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    const nested = findFolderById(folder.children ?? [], folderId);
    if (nested) return nested;
  }

  return null;
}

export function FolderChatPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { t } = useTranslation();

  const [folder, setFolder] = useState<DocumentFolderItem | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");

  const [folderDocumentCount, setFolderDocumentCount] = useState(0);
  const [readyDocumentCount, setReadyDocumentCount] = useState(0);
  const [processingDocumentCount, setProcessingDocumentCount] = useState(0);

  const endRef = useRef<HTMLDivElement | null>(null);
  const currentLanguage = normalizeLanguage(i18n.language);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const hasProcessingDocuments = processingDocumentCount > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function loadFolderChat(showLoader = false) {
    if (!folderId) return;

    if (showLoader) {
      setLoading(true);
    }

    try {
      setActionError("");

      const [foldersTree, sessionPayload, documentsPayload] = await Promise.all(
        [
          getDocumentFoldersTree(),
          getFolderChatSessions(folderId).catch(() => []),
          getDocuments().catch(() => []),
        ],
      );

      const selectedFolder = findFolderById(foldersTree, folderId);
      setFolder(selectedFolder);

      const allDocuments = Array.isArray(documentsPayload)
        ? (documentsPayload as FolderDocumentItem[])
        : [];

      const folderDocuments = allDocuments.filter(
        (doc) => doc.folderId === folderId,
      );
      const readyCount = folderDocuments.filter((doc) =>
        isDocumentReady(doc.status),
      ).length;
      const processingCount = folderDocuments.filter((doc) =>
        isDocumentProcessing(doc.status),
      ).length;

      setFolderDocumentCount(folderDocuments.length);
      setReadyDocumentCount(readyCount);
      setProcessingDocumentCount(processingCount);

      const safeSessions = normalizeSessions(sessionPayload).filter(
        (session) => typeof session?.id === "string" && session.id,
      );

      setSessions(safeSessions);

      const nextSessionId = safeSessions[0]?.id ?? "";
      setActiveSessionId((prev) => prev || nextSessionId);

      if (nextSessionId) {
        setLoadingMessages(true);
        const payload = await getFolderChatMessages(
          folderId,
          nextSessionId,
        ).catch(() => []);
        setMessages(normalizeMessages(payload));
        setLoadingMessages(false);
      } else {
        setMessages([]);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("folderChat.loadError"),
      );
    } finally {
      setLoading(false);
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    void loadFolderChat(true);
  }, [folderId]);

  async function handleSelectSession(sessionId: string) {
    if (!folderId || !sessionId) return;

    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    setActionError("");

    try {
      const payload = await getFolderChatMessages(folderId, sessionId);
      setMessages(normalizeMessages(payload));
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : t("folderChat.loadMessagesError"),
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!folderId || !prompt.trim()) return;

    const userMessage = prompt.trim();
    const tempMessageId = `temp-${Date.now()}`;

    setPrompt("");
    setSending(true);
    setActionError("");

    setMessages((prev) => [
      ...prev,
      { id: tempMessageId, role: "user", content: userMessage },
    ]);

    try {
      const result = await askFolderQuestion(folderId, {
        message: userMessage,
        chatSessionId: activeSessionId || undefined,
        language: currentLanguage,
      });

      const returnedSessionId =
        result?.chatSessionId ?? result?.sessionId ?? activeSessionId;

      if (typeof returnedSessionId === "string" && returnedSessionId) {
        setActiveSessionId(returnedSessionId);
      }

      setMessages((prev) => [
        ...prev.filter((item) => item.id !== tempMessageId),
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content:
            result?.answer ??
            result?.response ??
            result?.content ??
            result?.text ??
            JSON.stringify(result, null, 2),
        },
      ]);

      const refreshed = await getFolderChatSessions(folderId).catch(() => []);
      setSessions(normalizeSessions(refreshed));
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== tempMessageId));
      setActionError(
        error instanceof Error ? error.message : t("folderChat.sendError"),
      );
    } finally {
      setSending(false);
    }
  }

  function handlePromptKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;

    event.preventDefault();

    if (sending || !prompt.trim()) return;

    void handleSend();
  }

  return (
    <div className="folder-chat-layout">
      <aside className="folder-chat-sidebar surface-card">
        <div className="folder-chat-sidebar__top">
          <div className="folder-chat-page__badge">
            <Sparkles size={14} />
            <span>{t("folderChat.sessions")}</span>
          </div>

          <div className="folder-chat-sidebar__folder-card">
            <div className="folder-chat-sidebar__folder-icon">
              <FolderOpen size={20} />
            </div>

            <div className="folder-chat-sidebar__folder-content">
              <strong>{folder?.name ?? t("folderChat.title")}</strong>
              <span>{t("folderChat.contextAware")}</span>
            </div>
          </div>

          <div className="folder-chat-sidebar__stats">
            <div className="folder-chat-stat">
              <span>{t("folderChat.totalDocuments")}</span>
              <strong>{folderDocumentCount}</strong>
            </div>
            <div className="folder-chat-stat">
              <span>{t("folderChat.readyDocuments")}</span>
              <strong>{readyDocumentCount}</strong>
            </div>
          </div>
        </div>

        <div className="folder-chat-sessions">
          {loading ? (
            <div className="folder-chat-empty">
              <Loader2 size={18} className="spin" />
              <span>{t("common.loading")}</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="folder-chat-empty">
              <MessagesSquare size={18} />
              <span>{t("folderChat.noSessions")}</span>
            </div>
          ) : (
            sessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
              const sessionDate = formatMessageDate(
                session.lastMessageAtUtc ?? session.createdAtUtc,
                currentLanguage,
              );

              return (
                <button
                  key={session.id ?? `session-${index}`}
                  type="button"
                  className={`folder-chat-session ${
                    isActive ? "folder-chat-session--active" : ""
                  }`}
                  onClick={() =>
                    session.id && void handleSelectSession(session.id)
                  }
                >
                  <div className="folder-chat-session__icon">
                    <MessageSquareText size={15} />
                  </div>

                  <div className="folder-chat-session__content">
                    <strong>
                      {session.title ??
                        session.name ??
                        `${t("folderChat.session")} ${index + 1}`}
                    </strong>

                    <div className="folder-chat-session__meta">
                      {sessionDate ? (
                        <span>
                          <Clock3 size={12} />
                          {sessionDate}
                        </span>
                      ) : (
                        <span>
                          {t("folderChat.session")} #{index + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    size={14}
                    className="folder-chat-session__arrow"
                  />
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="folder-chat-panel surface-card">
        <div className="folder-chat-panel__header">
          <div>
            <p className="section-kicker">{t("folderChat.title")}</p>
            <h2>
              {activeSession?.title ??
                activeSession?.name ??
                t("folderChat.contextAware")}
            </h2>
            <p>{t("folderChat.subtitle")}</p>
          </div>
        </div>

        {hasProcessingDocuments ? (
          <div className="folder-chat-warning">
            <Info size={16} />
            <div>
              <strong>{t("folderChat.processingBannerTitle")}</strong>
              <span>
                {t("folderChat.processingBannerDescription", {
                  count: processingDocumentCount,
                })}
              </span>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="form-alert form-alert--error">
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        ) : null}

        <div className="folder-chat-messages">
          {loading || loadingMessages ? (
            <div className="folder-chat-empty">
              <Loader2 size={18} className="spin" />
              <span>{t("common.loading")}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="folder-chat-empty">
              <Bot size={18} />
              <span>{t("folderChat.empty")}</span>
            </div>
          ) : (
            messages.map((item, index) => {
              const role = normalizeRole(item.role);
              const isUser = role === "user";
              const content = normalizeMessageContent(item);
              const messageTime = formatMessageDate(
                item.createdAtUtc ?? item.createdAt,
                currentLanguage,
              );

              return (
                <div
                  key={item.id ?? `${role}-${index}`}
                  className={`folder-chat-message-row ${
                    isUser ? "folder-chat-message-row--user" : ""
                  }`}
                >
                  <div
                    className={`folder-chat-message ${
                      isUser
                        ? "folder-chat-message--user"
                        : "folder-chat-message--assistant"
                    }`}
                  >
                    <div className="folder-chat-message__meta">
                      <div className="folder-chat-message__meta-main">
                        <span className="folder-chat-message__avatar">
                          {isUser ? <User2 size={14} /> : <Bot size={14} />}
                        </span>
                        <span>
                          {isUser
                            ? t("folderChat.you")
                            : t("folderChat.assistant")}
                        </span>
                      </div>

                      {messageTime ? (
                        <span className="folder-chat-message__time">
                          {messageTime}
                        </span>
                      ) : null}
                    </div>

                    <div className="folder-chat-message__content">
                      {content}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {sending ? (
            <div className="folder-chat-message-row">
              <div className="folder-chat-message folder-chat-message--assistant">
                <div className="folder-chat-message__meta">
                  <div className="folder-chat-message__meta-main">
                    <span className="folder-chat-message__avatar">
                      <Loader2 size={14} className="spin" />
                    </span>
                    <span>{t("folderChat.thinking")}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <div className="folder-chat-composer">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handlePromptKeyDown}
            placeholder={t("folderChat.placeholder")}
          />

          <button
            type="button"
            className="folder-chat-send-button"
            onClick={() => void handleSend()}
            disabled={sending || !prompt.trim()}
          >
            <SendHorizonal size={16} />
            <span>{t("folderChat.send")}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
