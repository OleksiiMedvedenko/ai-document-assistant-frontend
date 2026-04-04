import {
  askDocumentQuestion,
  getChatMessages,
  getChatSessions,
} from "@/app/api/chats.api";
import { getDocument } from "@/app/api/documents.api";
import { Bot, Loader2, SendHorizonal, Sparkles, User2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
};

type DocumentDto = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
};

function getDocumentDisplayName(documentItem: DocumentDto | null) {
  if (!documentItem) return "Document chat";

  return (
    documentItem.originalFileName ||
    documentItem.fileName ||
    documentItem.name ||
    "Untitled document"
  );
}

function normalizeRole(role: unknown): "user" | "assistant" {
  if (typeof role === "string") {
    const normalized = role.toLowerCase();

    if (normalized === "user" || normalized === "human") {
      return "user";
    }

    return "assistant";
  }

  if (typeof role === "number") {
    return role === 0 ? "user" : "assistant";
  }

  if (role && typeof role === "object") {
    const maybeValue =
      "value" in role ? (role as { value?: unknown }).value : undefined;

    if (typeof maybeValue === "string") {
      const normalized = maybeValue.toLowerCase();
      return normalized === "user" || normalized === "human"
        ? "user"
        : "assistant";
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

function normalizeMessages(payload: unknown): MessageItem[] {
  if (Array.isArray(payload)) {
    return payload as MessageItem[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.items)) {
      return record.items as MessageItem[];
    }

    if (Array.isArray(record.messages)) {
      return record.messages as MessageItem[];
    }

    if (Array.isArray(record.data)) {
      return record.data as MessageItem[];
    }
  }

  return [];
}

function normalizeSessions(payload: unknown): SessionItem[] {
  if (Array.isArray(payload)) {
    return payload as SessionItem[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.items)) {
      return record.items as SessionItem[];
    }

    if (Array.isArray(record.sessions)) {
      return record.sessions as SessionItem[];
    }

    if (Array.isArray(record.data)) {
      return record.data as SessionItem[];
    }
  }

  return [];
}

export function DocumentChatPage() {
  const { id } = useParams<{ id: string }>();

  const [documentItem, setDocumentItem] = useState<DocumentDto | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const canSend = useMemo(() => prompt.trim().length > 0 && !!id, [prompt, id]);

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
      <aside className="rounded-[28px] surface-soft p-5">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1 text-xs text-soft">
          <Sparkles size={14} />
          Chat sessions
        </div>

        <h1 className="text-2xl font-semibold">
          {getDocumentDisplayName(documentItem)}
        </h1>
        <p className="mt-2 text-sm text-soft">
          Ask questions about the uploaded content and restore previous
          sessions.
        </p>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-4 text-soft">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl bg-[var(--panel-soft)] p-4 text-soft">
              No saved sessions yet. Send your first question.
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
                    ? "border-transparent bg-[var(--primary)] text-[var(--primary-contrast)]"
                    : "border-[var(--border)] bg-[var(--panel-soft)] hover:bg-[var(--panel-strong)]",
                ].join(" ")}
              >
                <p className="font-medium">
                  {session.title ?? session.name ?? `Session ${index + 1}`}
                </p>
                <p className="mt-1 text-xs opacity-80 break-all">
                  {session.id}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-[28px] surface-soft p-5 lg:p-6">
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-xl font-semibold">AI conversation</h2>
              <p className="mt-1 text-sm text-soft">
                Context-aware chat for this document.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-[var(--panel-soft)] text-soft">
                Start by asking a question about the document.
              </div>
            ) : (
              messages.map((item, index) => {
                const normalizedRole = normalizeRole(item.role);
                const isUser = normalizedRole === "user";
                const content = normalizeMessageContent(item);

                return (
                  <div
                    key={item.id ?? `${normalizedRole}-${index}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={[
                        "max-w-[80%] rounded-3xl px-4 py-4",
                        isUser
                          ? "bg-[var(--primary)] text-[var(--primary-contrast)]"
                          : "bg-[var(--panel-soft)] text-[var(--text)]",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                        {isUser ? <User2 size={14} /> : <Bot size={14} />}
                        {isUser ? "You" : "Assistant"}
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
                    Thinking...
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <div className="flex gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 outline-none"
                placeholder="Ask about the document, request a summary, find facts, risks or differences..."
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canSend || sending}
                className="inline-flex items-center gap-2 self-end rounded-2xl bg-[var(--primary)] px-5 py-3 font-medium text-[var(--primary-contrast)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizonal size={18} />
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
