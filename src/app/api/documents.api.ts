import { apiClient } from "./client";

export type DocumentItem = {
  id: string;
  fileName?: string;
  originalFileName?: string;
  name?: string;
  status?: number | string;
  createdAt?: string;
  uploadedAtUtc?: string;
  processedAtUtc?: string;
  contentType?: string;
  mimeType?: string;
  sizeInBytes?: number;
  errorMessage?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  folderNamePl?: string | null;
  folderNameEn?: string | null;
  folderNameUa?: string | null;
  folderClassificationStatus?: string | null;
  folderClassificationConfidence?: number | null;
  wasFolderAutoAssigned?: boolean;
  isNew?: boolean;
  processingProfile?: number | string;
};

export type UploadDocumentPayload = {
  file: File;
  folderId?: string | null;
  smartOrganize?: boolean;
  allowSystemFolderCreation?: boolean;
};

export type UploadDocumentsPayload = {
  files: File[];
  folderId?: string | null;
  smartOrganize?: boolean;
  allowSystemFolderCreation?: boolean;
};

export type UploadDocumentsResult = {
  documents: DocumentItem[];
};

export type DocumentPreviewMetaDto = {
  documentId: string;
  fileName: string;
  contentType: string;
  previewKind: "pdf" | "text" | "html" | "download" | "browser";
  canInlinePreview: boolean;
  message?: string | null;
};

export async function getDocuments(folderId?: string | null) {
  const { data } = await apiClient.get("/api/documents", {
    params: folderId ? { folderId } : undefined,
  });

  return data as DocumentItem[];
}

export async function getDocument(id: string) {
  const { data } = await apiClient.get(`/api/documents/${id}`);
  return data;
}

export async function getDocumentStatus(id: string) {
  const { data } = await apiClient.get(`/api/documents/${id}/status`);
  return data;
}

export async function getExtractions(id: string) {
  const { data } = await apiClient.get(`/api/documents/${id}/extractions`);
  return data;
}

export async function getExtractionById(id: string, extractionId: string) {
  const { data } = await apiClient.get(
    `/api/documents/${id}/extractions/${extractionId}`,
  );

  return data;
}

export async function uploadDocument(payload: UploadDocumentPayload) {
  const formData = new FormData();
  formData.append("file", payload.file);

  if (payload.folderId) {
    formData.append("folderId", payload.folderId);
  }

  formData.append("smartOrganize", String(payload.smartOrganize ?? true));
  formData.append(
    "allowSystemFolderCreation",
    String(payload.allowSystemFolderCreation ?? true),
  );

  const { data } = await apiClient.post("/api/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data as DocumentItem;
}

export async function uploadDocuments(payload: UploadDocumentsPayload) {
  const formData = new FormData();

  for (const file of payload.files) {
    formData.append("files", file);
  }

  if (payload.folderId) {
    formData.append("folderId", payload.folderId);
  }

  formData.append("smartOrganize", String(payload.smartOrganize ?? true));
  formData.append(
    "allowSystemFolderCreation",
    String(payload.allowSystemFolderCreation ?? true),
  );

  const { data } = await apiClient.post(
    "/api/documents/batch-upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data as UploadDocumentsResult;
}

export async function moveDocumentToFolder(
  id: string,
  folderId?: string | null,
) {
  const { data } = await apiClient.patch(`/api/documents/${id}/folder`, {
    folderId: folderId ?? null,
  });

  return data as DocumentItem;
}

export async function summarizeDocument(id: string, language?: string) {
  const { data } = await apiClient.post(`/api/documents/${id}/summarize`, {
    language,
  });

  return data;
}

export async function extractDocument(
  id: string,
  payload: { extractionType: string; fields: string[]; language?: string },
) {
  const { data } = await apiClient.post(
    `/api/documents/${id}/extract`,
    payload,
  );

  return data;
}

export async function compareDocuments(
  id: string,
  payload: { secondDocumentId: string; prompt: string; language?: string },
) {
  const { data } = await apiClient.post(
    `/api/documents/${id}/compare`,
    payload,
  );

  return data;
}

export async function deleteDocument(id: string) {
  await apiClient.delete(`/api/documents/${id}`);
}

export async function getDocumentPreviewMeta(documentId: string) {
  const { data } = await apiClient.get(
    `/api/documents/${documentId}/preview-meta`,
  );
  return data as DocumentPreviewMetaDto;
}

export async function getDocumentPreviewFileBlob(documentId: string) {
  const { data } = await apiClient.get(
    `/api/documents/${documentId}/preview-file`,
    {
      responseType: "blob",
    },
  );

  return data as Blob;
}

export async function getDocumentOriginalFileBlob(documentId: string) {
  const { data } = await apiClient.get(`/api/documents/${documentId}/content`, {
    responseType: "blob",
  });

  return data as Blob;
}
