import { getDocuments, uploadDocument } from "@/app/api/documents.api";
import { FileUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
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
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">
          Dashboard
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Sparkles className="text-zinc-300" />
          <h1 className="text-4xl font-bold">Your documents</h1>
        </div>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Upload, analyze, summarize, extract structured data and chat with your
          files.
        </p>
      </div>

      <label className="block cursor-pointer rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl transition hover:bg-white/10">
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <FileUp />
          </div>
          <h2 className="text-xl font-semibold">
            {uploading ? "Uploading..." : "Drop file or click to upload"}
          </h2>
          <p className="text-sm text-zinc-400">
            PDF, DOCX and supported document formats
          </p>
        </div>
      </label>

      {loading ? (
        <p className="text-zinc-400">Loading documents...</p>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-zinc-400">
          No documents yet. Upload your first file.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="group rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {doc.fileName ?? doc.name ?? "Document"}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Status: {doc.status ?? "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 px-3 py-1 text-xs text-zinc-300">
                  AI
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
