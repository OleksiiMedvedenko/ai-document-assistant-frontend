import { apiClient } from "./client";

export type AskChatPayload = {
  message: string;
  chatSessionId?: string;
  language?: string;
};

export async function askDocumentQuestion(
  documentId: string,
  payload: AskChatPayload,
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

export async function askFolderQuestion(
  folderId: string,
  payload: AskChatPayload,
) {
  const { data } = await apiClient.post(
    `/api/document-folders/${folderId}/chat`,
    payload,
  );

  return data;
}

export async function getFolderChatSessions(folderId: string) {
  const { data } = await apiClient.get(
    `/api/document-folders/${folderId}/chat/sessions`,
  );

  return data;
}

export async function getFolderChatMessages(
  folderId: string,
  chatSessionId: string,
) {
  const { data } = await apiClient.get(
    `/api/document-folders/${folderId}/chat/sessions/${chatSessionId}/messages`,
  );

  return data;
}
