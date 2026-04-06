import {
  askDocumentQuestion,
  getChatMessages,
  getChatSessions,
} from "@/app/api/chats.api";
import { getDocument } from "@/app/api/documents.api";
import { getDocumentDisplayName } from "@/app/lib/document";
import "@/app/styles/document-chat-page.css";
import i18n from "@/i18n";
import {
  Bot,
  Loader2,
  MessageSquareText,
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

export function DocumentChatPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [documentItem, setDocumentItem] = useState<DocumentDto | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentLanguage = normalizeLanguage(i18n.language);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => prompt.trim().length > 0 && !!id, [prompt, id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [doc, sessionPayload] = await Promise.all([
          getDocument(id ?? ""),
          getChatSessions(id ?? "").catch(() => []),
        ]);

        setDocumentItem(doc);

        const safeSessions = normalizeSessions(sessionPayload).filter(
          (session) => typeof session?.id === "string" && session.id.length > 0,
        );

        setSessions(safeSessions);

        if (safeSessions[0]?.id) {
          setActiveSessionId(safeSessions[0].id);

          const sessionMessages = await getChatMessages(
            id ?? "",
            safeSessions[0].id,
          ).catch(() => []);

          setMessages(normalizeMessages(sessionMessages));
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  async function handleSelectSession(sessionId: string) {
    if (!id) return;

    setActiveSessionId(sessionId);
    const data = await getChatMessages(id, sessionId).catch(() => []);
    setMessages(normalizeMessages(data));
  }

  async function handleSend() {
    if (!id || !prompt.trim()) return;

    const userMessage = prompt.trim();
    setPrompt("");
    setSending(true);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

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
        ...prev,
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
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="document-chat-page">
      <aside className="chat-sidebar surface-card">
        <div className="chat-sidebar__badge">
          <Sparkles size={14} />
          <span>{t("chat.sessions")}</span>
        </div>

        <h1>{getDocumentDisplayName(documentItem)}</h1>
        <p>{t("chat.subtitle")}</p>

        <div className="chat-sessions">
          {loading ? (
            <div className="chat-empty-box">{t("common.loading")}</div>
          ) : sessions.length === 0 ? (
            <div className="chat-empty-box">{t("chat.noSessions")}</div>
          ) : (
            sessions.map((session, index) => (
              <button
                key={session.id ?? `session-${index}`}
                type="button"
                onClick={() =>
                  session.id && void handleSelectSession(session.id)
                }
                className={`chat-session-card ${
                  activeSessionId === session.id
                    ? "chat-session-card--active"
                    : ""
                }`}
              >
                <div className="chat-session-card__icon">
                  <MessageSquareText size={16} />
                </div>

                <div className="chat-session-card__content">
                  <strong>
                    {session.title ??
                      session.name ??
                      `${t("chat.session")} ${index + 1}`}
                  </strong>
                  <span>{session.id}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="chat-panel surface-card">
        <div className="chat-panel__header">
          <div>
            <p className="section-kicker">{t("chat.headerKicker")}</p>
            <h2>{t("chat.title")}</h2>
            <p>{t("chat.contextAware")}</p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">{t("chat.empty")}</div>
          ) : (
            messages.map((item, index) => {
              const role = normalizeRole(item.role);
              const isUser = role === "user";
              const content = normalizeMessageContent(item);

              return (
                <div
                  key={item.id ?? `${role}-${index}`}
                  className={`chat-message-row ${
                    isUser ? "chat-message-row--user" : ""
                  }`}
                >
                  <div
                    className={`chat-message ${
                      isUser ? "chat-message--user" : "chat-message--assistant"
                    }`}
                  >
                    <div className="chat-message__meta">
                      {isUser ? <User2 size={14} /> : <Bot size={14} />}
                      <span>
                        {isUser ? t("chat.you") : t("chat.assistant")}
                      </span>
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
                  <Loader2 size={14} className="spin" />
                  <span>{t("chat.thinking")}</span>
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
          />

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend || sending}
            className="chat-send-button"
          >
            <SendHorizonal size={18} />
            <span>{t("chat.send")}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
