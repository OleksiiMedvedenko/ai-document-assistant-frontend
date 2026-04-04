import { apiClient } from "./client";

export async function askDocumentQuestion(
  documentId: string,
  payload: { message: string; chatSessionId?: string },
) {
  const { data } = await apiClient.post(
    `/api/documents/${documentId}/chat`,
    payload,
  );
  return data;
}

export async function getChatSessions(documentId: string) {
  const { data } = await apiClient.get(
    `/api/documents/${documentId}/chat/sessions`,
  );
  return data;
}

export async function getChatMessages(
  documentId: string,
  chatSessionId: string,
) {
  const { data } = await apiClient.get(
    `/api/documents/${documentId}/chat/messages`,
    {
      params: { chatSessionId },
    },
  );
  return data;
}
