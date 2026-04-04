import { apiClient } from "./client";

export async function getDocuments() {
  const { data } = await apiClient.get("/api/documents");
  return data;
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

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post("/api/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function summarizeDocument(id: string) {
  const { data } = await apiClient.post(`/api/documents/${id}/summarize`);
  return data;
}

export async function extractDocument(
  id: string,
  payload: { extractionType: string; fields: string[] },
) {
  const { data } = await apiClient.post(
    `/api/documents/${id}/extract`,
    payload,
  );
  return data;
}

export async function compareDocuments(
  id: string,
  payload: { secondDocumentId: string; prompt: string },
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
