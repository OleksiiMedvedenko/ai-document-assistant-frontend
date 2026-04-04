import { getDocuments, uploadDocument } from "@/app/api/documents.api";
import {
  Clock3,
  FileText,
  FileUp,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type DocumentItem = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
  status?: number | string;
  createdAt?: string;
};

function mapStatus(
  status: number | string | undefined,
  t: (key: string) => string,
) {
  if (status === 0 || status === "Pending") {
    return {
      label: t("documents.status.pending"),
      cls: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
    };
  }

  if (status === 1 || status === "Processing") {
    return {
      label: t("documents.status.processing"),
      cls: "bg-sky-500/15 text-sky-300 border border-sky-400/20",
    };
  }

  if (status === 2 || status === "Completed") {
    return {
      label: t("documents.status.completed"),
      cls: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
    };
  }

  if (status === 3 || status === "Ready") {
    return {
      label: t("documents.status.ready"),
      cls: "bg-violet-500/15 text-violet-300 border border-violet-400/20",
    };
  }

  return {
    label: t("documents.status.unknown"),
    cls: "bg-zinc-500/15 text-zinc-300 border border-zinc-400/20",
  };
}

export function DocumentsPage() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    try {
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await uploadDocument(file);
      await loadDocuments();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <Sparkles size={14} />
            {t("documents.heroBadge")}
          </div>

          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl">
            {t("documents.title")}
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            {t("documents.subtitle")}
          </p>

          <label className="mt-8 block cursor-pointer rounded-[24px] border border-dashed border-white/15 bg-zinc-950/40 p-8 transition hover:border-white/25 hover:bg-white/5">
            <input
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />

            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-white/10 p-4">
                <FileUp size={28} />
              </div>

              <h3 className="text-xl font-semibold">
                {uploading
                  ? t("documents.uploading")
                  : t("documents.uploadTitle")}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {t("documents.uploadSubtitle")}
              </p>
            </div>
          </label>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 lg:p-8">
          <p className="text-sm text-zinc-400">{t("documents.quickStats")}</p>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">
                {t("documents.totalDocuments")}
              </p>
              <p className="mt-2 text-3xl font-semibold">{documents.length}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">{t("documents.aiReady")}</p>
              <p className="mt-2 text-3xl font-semibold">
                {
                  documents.filter(
                    (d) =>
                      d.status === 2 ||
                      d.status === 3 ||
                      d.status === "Completed" ||
                      d.status === "Ready",
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold">
              {t("documents.libraryTitle")}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {t("documents.librarySubtitle")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
            {t("common.loading")}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <FileText size={24} />
            </div>
            <h4 className="text-xl font-semibold">
              {t("documents.emptyTitle")}
            </h4>
            <p className="mt-2 text-zinc-400">{t("documents.emptySubtitle")}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {documents.map((doc) => {
              const status = mapStatus(doc.status, t);

              return (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <FileText size={22} />
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${status.cls}`}
                    >
                      {status.label}
                    </div>
                  </div>

                  <div className="mt-5">
                    <h4 className="line-clamp-2 text-lg font-semibold text-white">
                      {doc.fileName ??
                        doc.originalFileName ??
                        t("documents.untitled")}
                    </h4>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        {t("documents.readyForAi")}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <WandSparkles size={14} />
                        {t("documents.actions")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-zinc-300">
                    <span>{t("documents.openDetails")}</span>
                    <Trash2
                      size={16}
                      className="opacity-0 transition group-hover:opacity-100"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
