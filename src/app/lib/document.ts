export type DocumentLike = {
  id?: string;
  originalFileName?: string;
  fileName?: string;
  name?: string;
  contentType?: string;
  mimeType?: string;
  sizeInBytes?: number;
  fileSizeInBytes?: number;
  status?: number | string;
  createdAt?: string;
  uploadedAtUtc?: string;
  processedAtUtc?: string;
  errorMessage?: string | null;
};

export type NormalizedDocumentStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "unknown";

export function getDocumentDisplayName(doc?: DocumentLike | null) {
  return (
    doc?.originalFileName || doc?.fileName || doc?.name || "Untitled document"
  );
}

export function getDocumentTypeLabel(doc?: DocumentLike | null) {
  if (!doc) return "Document";

  const raw = (doc.contentType || doc.mimeType || "").toLowerCase();

  if (!raw) return "Document";
  if (raw.includes("wordprocessingml")) return "DOCX";
  if (raw.includes("spreadsheetml")) return "XLSX";
  if (raw.includes("presentationml")) return "PPTX";
  if (raw.includes("pdf")) return "PDF";
  if (raw.includes("msword")) return "DOC";
  if (raw.includes("text/plain")) return "TXT";

  return raw;
}

export function getDocumentMimeValue(doc?: DocumentLike | null) {
  return doc?.contentType || doc?.mimeType || "Unknown";
}

export function getDocumentSizeLabel(doc?: DocumentLike | null) {
  const bytes = doc?.sizeInBytes ?? doc?.fileSizeInBytes;
  if (!bytes) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

export function normalizeDocumentStatus(
  status: number | string | undefined,
): NormalizedDocumentStatus {
  if (typeof status === "number") {
    switch (status) {
      case 0:
        return "uploaded";
      case 1:
        return "queued";
      case 2:
        return "processing";
      case 3:
        return "ready";
      case 4:
        return "failed";
      default:
        return "unknown";
    }
  }

  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  if (value === "uploaded") return "uploaded";
  if (value === "queued" || value === "pending") return "queued";
  if (value === "processing") return "processing";
  if (value === "ready" || value === "completed") return "ready";
  if (value === "failed" || value === "error") return "failed";

  return "unknown";
}

export function getDocumentStatusLabel(status: number | string | undefined) {
  const normalized = normalizeDocumentStatus(status);

  switch (normalized) {
    case "uploaded":
      return "Uploaded";
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

export function isDocumentReady(status: number | string | undefined) {
  return normalizeDocumentStatus(status) === "ready";
}

export function isDocumentProcessing(status: number | string | undefined) {
  const normalized = normalizeDocumentStatus(status);
  return (
    normalized === "uploaded" ||
    normalized === "queued" ||
    normalized === "processing"
  );
}

export function isDocumentFailed(status: number | string | undefined) {
  return normalizeDocumentStatus(status) === "failed";
}

export function canUseDocumentAi(status: number | string | undefined) {
  return isDocumentReady(status);
}
