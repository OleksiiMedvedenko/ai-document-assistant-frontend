import {
  askDocumentQuestion,
  getChatMessages,
  getChatSessions,
} from "@/app/api/chats.api";
import { getDocument } from "@/app/api/documents.api";
import { getDocumentDisplayName } from "@/app/lib/document";
import i18n from "@/i18n";
import { Bot, Loader2, SendHorizonal, Sparkles, User2 } from "lucide-react";
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
    if (value === "user" || value === "human") {
      return "user";
    }
    if (value === "assistant" || value === "bot" || value === "system") {
      return "assistant";
    }
    return "assistant";
  }

  if (typeof role === "number") {
    if (role === 1) {
      return "user";
    }
    if (role === 2 || role === 3) {
      return "assistant";
    }
    return "assistant";
  }

  if (role && typeof role === "object" && "value" in role) {
    const nested = (role as { value?: unknown }).value;

    if (typeof nested === "string") {
      const value = nested.toLowerCase();
      if (value === "user" || value === "human") {
        return "user";
      }
      if (value === "assistant" || value === "bot" || value === "system") {
        return "assistant";
      }
    }

    if (typeof nested === "number") {
      if (nested === 1) {
        return "user";
      }
      if (nested === 2 || nested === 3) {
        return "assistant";
      }
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
    <div className="grid min-h-[720px] gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="surface-elevated rounded-[28px] p-5">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
          <Sparkles size={14} />
          {t("chat.sessions")}
        </div>

        <h1 className="break-words text-2xl font-semibold">
          {getDocumentDisplayName(documentItem)}
        </h1>

        <p className="mt-2 text-sm text-soft">{t("chat.subtitle")}</p>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-4 text-soft">
              {t("common.loading")}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-4 text-soft">
              {t("chat.noSessions")}
            </div>
          ) : (
            sessions.map((session, index) => (
              <button
                key={session.id ?? `session-${index}`}
                type="button"
                onClick={() =>
                  session.id && void handleSelectSession(session.id)
                }
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-left transition",
                  activeSessionId === session.id
                    ? "primary-button border-transparent"
                    : "border-[var(--border)] bg-[var(--panel-soft)] hover:bg-[var(--panel-strong)]",
                ].join(" ")}
              >
                <p className="font-medium">
                  {session.title ??
                    session.name ??
                    `${t("chat.session")} ${index + 1}`}
                </p>
                <p className="mt-1 break-all text-xs opacity-80">
                  {session.id}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="surface-elevated rounded-[28px] p-5 lg:p-6">
        <div className="flex h-full flex-col">
          <div className="mb-4 border-b border-[var(--border)] pb-4">
            <h2 className="text-xl font-semibold">{t("chat.title")}</h2>
            <p className="mt-1 text-sm text-soft">{t("chat.contextAware")}</p>
          </div>

          <div className="flex-1 space-y-4 overflow-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-[var(--panel-soft)] text-soft">
                {t("chat.empty")}
              </div>
            ) : (
              messages.map((item, index) => {
                const role = normalizeRole(item.role);
                const isUser = role === "user";
                const content = normalizeMessageContent(item);

                return (
                  <div
                    key={item.id ?? `${role}-${index}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={[
                        "max-w-[82%] rounded-3xl px-4 py-4",
                        isUser
                          ? "primary-button"
                          : "bg-[var(--panel-soft)] text-[var(--text)]",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                        {isUser ? <User2 size={14} /> : <Bot size={14} />}
                        {isUser ? t("chat.you") : t("chat.assistant")}
                      </div>

                      <div className="whitespace-pre-wrap break-words leading-7">
                        {content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-soft">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t("chat.thinking")}
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <div className="flex gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
                placeholder={t("chat.placeholder")}
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canSend || sending}
                className="primary-button inline-flex items-center gap-2 self-end rounded-2xl px-5 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizonal size={18} />
                {t("chat.send")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
