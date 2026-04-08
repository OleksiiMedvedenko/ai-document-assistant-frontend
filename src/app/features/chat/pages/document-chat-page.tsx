import {
  askDocumentQuestion,
  getChatMessages,
  getChatSessions,
} from "@/app/api/chats.api";
import { getDocument, getDocumentStatus } from "@/app/api/documents.api";
import {
  getDocumentDisplayName,
  isDocumentProcessing,
  isDocumentReady,
} from "@/app/lib/document";
import "@/app/styles/document-chat-page.css";
import i18n from "@/i18n";
import {
  AlertCircle,
  Bot,
  ChevronRight,
  Clock3,
  FileText,
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
  createdAt?: string;
};

type MessageItem = {
  id?: string;
  role?: unknown;
  content?: unknown;
  message?: unknown;
  text?: unknown;
  answer?: unknown;
  createdAt?: string;
};

type DocumentDto = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
};

const STATUS_POLL_INTERVAL_MS = 3000;

function normalizeLanguage(language?: string) {
  if (!language) return "en";
  if (language.startsWith("pl")) return "pl";
  if (language.startsWith("ua") || language.startsWith("uk")) return "ua";
  return "en";
}

function normalizeRole(role: unknown): "user" | "assistant" {
  if (typeof role === "string") {
    const value = role.toLowerCase();
    if (value === "user" || value === "human") return "user";
    if (value === "assistant" || value === "bot" || value === "system") {
      return "assistant";
    }
    return "assistant";
  }

  if (typeof role === "number") {
    if (role === 1) return "user";
    if (role === 2 || role === 3) return "assistant";
    return "assistant";
  }

  if (role && typeof role === "object" && "value" in role) {
    const nested = (role as { value?: unknown }).value;

    if (typeof nested === "string") {
      const value = nested.toLowerCase();
      if (value === "user" || value === "human") return "user";
      if (value === "assistant" || value === "bot" || value === "system") {
        return "assistant";
      }
    }

    if (typeof nested === "number") {
      if (nested === 1) return "user";
      if (nested === 2 || nested === 3) return "assistant";
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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;

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

function formatSessionDate(value?: string, locale = "en") {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

function formatMessageDate(value?: string, locale = "en") {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

export function DocumentChatPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [documentItem, setDocumentItem] = useState<DocumentDto | null>(null);
  const [documentStatus, setDocumentStatus] = useState<
    number | string | undefined
  >(undefined);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionError, setActionError] = useState("");

  const currentLanguage = normalizeLanguage(i18n.language);
  const endRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<number | null>(null);

  const chatReady = useMemo(
    () => isDocumentReady(documentStatus),
    [documentStatus],
  );

  const chatProcessing = useMemo(
    () => isDocumentProcessing(documentStatus),
    [documentStatus],
  );

  const canSend = useMemo(
    () => prompt.trim().length > 0 && !!id && chatReady,
    [prompt, id, chatReady],
  );

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function loadChat(showLoader = false) {
    if (!id) return;

    if (showLoader) {
      setLoading(true);
    }

    try {
      setActionError("");

      const [doc, docStatus, sessionPayload] = await Promise.all([
        getDocument(id),
        getDocumentStatus(id),
        getChatSessions(id).catch(() => []),
      ]);

      setDocumentItem(doc);
      setDocumentStatus(docStatus?.status ?? docStatus);

      const safeSessions = normalizeSessions(sessionPayload).filter(
        (session) => typeof session?.id === "string" && session.id.length > 0,
      );

      setSessions(safeSessions);

      if (!activeSessionId && safeSessions[0]?.id) {
        setActiveSessionId(safeSessions[0].id);

        const sessionMessages = await getChatMessages(
          id,
          safeSessions[0].id,
        ).catch(() => []);

        setMessages(normalizeMessages(sessionMessages));
      } else if (!safeSessions.length) {
        setMessages([]);
        setActiveSessionId("");
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!id) return;
    void loadChat(true);
  }, [id, t]);

  useEffect(() => {
    if (!chatProcessing) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (pollingRef.current || !id) return;

    pollingRef.current = window.setInterval(() => {
      void loadChat(false);
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [chatProcessing, id]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  async function handleSelectSession(sessionId: string) {
    if (!id) return;

    setActionError("");
    setActiveSessionId(sessionId);
    setLoadingMessages(true);

    try {
      const data = await getChatMessages(id, sessionId).catch(() => []);
      setMessages(normalizeMessages(data));
    } catch (error) {
      setActionError(getApiErrorMessage(error, t("common.unexpectedError")));
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!id || !prompt.trim() || !chatReady) return;

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
      const result = await askDocumentQuestion(id, {
        message: userMessage,
        chatSessionId: activeSessionId || undefined,
        language: currentLanguage,
      });

      const returnedSessionId =
        result?.chatSessionId ?? result?.sessionId ?? activeSessionId;

      if (
        typeof returnedSessionId === "string" &&
        returnedSessionId !== activeSessionId
      ) {
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

      const refreshedSessions = await getChatSessions(id).catch(() => []);
      setSessions(normalizeSessions(refreshedSessions));
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== tempMessageId));
      setActionError(getApiErrorMessage(error, t("limits.chatReached")));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="document-chat-page">
      <section className="document-chat-hero surface-card">
        <div className="document-chat-hero__content">
          <div className="document-chat-hero__badge">
            <Sparkles size={14} />
            <span>{t("chat.headerKicker")}</span>
          </div>

          <h1>{getDocumentDisplayName(documentItem)}</h1>
          <p>{t("chat.contextAware")}</p>

          <div className="document-chat-hero__chips">
            <div className="document-chat-hero-chip">
              <FileText size={14} />
              <span>{t("chat.title")}</span>
            </div>

            <div className="document-chat-hero-chip">
              <MessagesSquare size={14} />
              <span>{sessions.length}</span>
            </div>

            <div className="document-chat-hero-chip">
              <Bot size={14} />
              <span>{t("chat.assistant")}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="document-chat-layout">
        <aside className="chat-sidebar surface-card">
          <div className="chat-sidebar__top">
            <div>
              <p className="section-kicker">{t("chat.sessions")}</p>
              <h2>{t("chat.sessions")}</h2>
            </div>
          </div>

          <div className="chat-sessions">
            {loading ? (
              <div className="chat-empty-box">
                <Loader2 size={16} className="spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="chat-empty-box">
                <MessageSquareText size={16} />
                <span>{t("chat.noSessions")}</span>
              </div>
            ) : (
              sessions.map((session, index) => {
                const isActive = activeSessionId === session.id;
                const sessionDate = formatSessionDate(
                  session.createdAt,
                  currentLanguage,
                );

                return (
                  <button
                    key={session.id ?? `session-${index}`}
                    type="button"
                    onClick={() =>
                      session.id && void handleSelectSession(session.id)
                    }
                    className={`chat-session-card ${
                      isActive ? "chat-session-card--active" : ""
                    }`}
                  >
                    <div className="chat-session-card__icon">
                      <MessageSquareText size={15} />
                    </div>

                    <div className="chat-session-card__content">
                      <strong>
                        {session.title ??
                          session.name ??
                          `${t("chat.session")} ${index + 1}`}
                      </strong>

                      <div className="chat-session-card__meta">
                        {sessionDate ? (
                          <span>
                            <Clock3 size={12} />
                            {sessionDate}
                          </span>
                        ) : (
                          <span>
                            {t("chat.session")} #{index + 1}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      className="chat-session-card__arrow"
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="chat-panel surface-card">
          <div className="chat-panel__header">
            <div>
              <p className="section-kicker">{t("chat.title")}</p>
              <h2>
                {activeSession?.title ??
                  activeSession?.name ??
                  t("chat.contextAware")}
              </h2>
              <p>{t("chat.subtitle")}</p>
            </div>
          </div>

          {chatProcessing ? (
            <div className="form-alert">
              <Loader2 size={16} className="spin" />
              <span>{t("documents.processingNow")}</span>
            </div>
          ) : null}

          {actionError ? (
            <div className="form-alert form-alert--error">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          ) : null}

          <div className="chat-messages">
            {loading || loadingMessages ? (
              <div className="chat-empty-state">
                <Loader2 size={18} className="spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty-state">
                <Bot size={18} />
                <span>{t("chat.empty")}</span>
              </div>
            ) : (
              messages.map((item, index) => {
                const role = normalizeRole(item.role);
                const isUser = role === "user";
                const content = normalizeMessageContent(item);
                const messageTime = formatMessageDate(
                  item.createdAt,
                  currentLanguage,
                );

                return (
                  <div
                    key={item.id ?? `${role}-${index}`}
                    className={`chat-message-row ${
                      isUser ? "chat-message-row--user" : ""
                    }`}
                  >
                    <div
                      className={`chat-message ${
                        isUser
                          ? "chat-message--user"
                          : "chat-message--assistant"
                      }`}
                    >
                      <div className="chat-message__meta">
                        <div className="chat-message__meta-main">
                          <span className="chat-message__avatar">
                            {isUser ? <User2 size={14} /> : <Bot size={14} />}
                          </span>
                          <span>
                            {isUser ? t("chat.you") : t("chat.assistant")}
                          </span>
                        </div>

                        {messageTime ? (
                          <span className="chat-message__time">
                            {messageTime}
                          </span>
                        ) : null}
                      </div>

                      <div className="chat-message__content">{content}</div>
                    </div>
                  </div>
                );
              })
            )}

            {sending ? (
              <div className="chat-message-row">
                <div className="chat-message chat-message--assistant">
                  <div className="chat-message__meta">
                    <div className="chat-message__meta-main">
                      <span className="chat-message__avatar">
                        <Loader2 size={14} className="spin" />
                      </span>
                      <span>{t("chat.thinking")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <div className="chat-composer">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();

                  if (canSend && !sending) {
                    void handleSend();
                  }
                }
              }}
              rows={3}
              placeholder={t("chat.placeholder")}
              disabled={!chatReady || sending}
            />

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend || sending}
              className="chat-send-button"
            >
              {sending ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <SendHorizonal size={18} />
              )}
              <span>{t("chat.send")}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
