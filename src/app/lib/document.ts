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
};

export function getDocumentDisplayName(doc?: DocumentLike | null) {
  return (
    doc?.originalFileName || doc?.fileName || doc?.name || "Untitled document"
  );
}

export function getDocumentTypeLabel(doc?: DocumentLike | null) {
  if (!doc) return "Document";

  const raw = doc.contentType || doc.mimeType;
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

export function getDocumentStatusLabel(status: number | string | undefined) {
  if (status === 0 || status === "Pending") return "Pending";
  if (status === 1 || status === "Processing") return "Processing";
  if (status === 2 || status === "Completed") return "Completed";
  if (status === 3 || status === "Ready") return "Ready";
  return "Unknown";
}
