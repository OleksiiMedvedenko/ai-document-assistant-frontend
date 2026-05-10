import { apiClient } from "./client";

export type DocumentFolderItem = {
  id: string;
  parentFolderId?: string | null;
  key: string;
  name: string;
  namePl: string;
  nameEn: string;
  nameUa: string;
  isSystemGenerated: boolean;
  documentCount: number;
  children: DocumentFolderItem[];
};

export type CreateDocumentFolderPayload = {
  parentFolderId?: string | null;
  name: string;
  namePl: string;
  nameEn: string;
  nameUa: string;
};

export type UpdateDocumentFolderPayload = {
  name: string;
  namePl: string;
  nameEn: string;
  nameUa: string;
};

export async function getDocumentFoldersTree() {
  const { data } = await apiClient.get<DocumentFolderItem[]>(
    "/api/document-folders/tree",
  );
  return data;
}

export async function createDocumentFolder(
  payload: CreateDocumentFolderPayload,
) {
  const { data } = await apiClient.post("/api/document-folders", payload);
  return data;
}

export async function updateDocumentFolder(
  folderId: string,
  payload: UpdateDocumentFolderPayload,
) {
  const { data } = await apiClient.put(
    `/api/document-folders/${folderId}`,
    payload,
  );
  return data;
}

export async function deleteDocumentFolder(folderId: string) {
  await apiClient.delete(`/api/document-folders/${folderId}`);
}

export type FolderDuplicateSuggestion = {
  firstFolderId: string;
  firstFolderName: string;
  secondFolderId: string;
  secondFolderName: string;
  similarity: number;
  reason: string;
};

export type MergeDocumentFoldersPayload = {
  targetFolderId: string;
  deleteSourceFolder?: boolean;
};

export type MergeDocumentFoldersResult = {
  sourceFolderId: string;
  targetFolderId: string;
  movedDocuments: number;
  movedSuggestions: number;
  movedUserRules: number;
  sourceFolderDeleted: boolean;
};

export async function getDuplicateFolderSuggestions() {
  const { data } = await apiClient.get<FolderDuplicateSuggestion[]>(
    "/api/document-folders/duplicate-suggestions",
  );
  return data;
}

export async function mergeDocumentFolders(
  sourceFolderId: string,
  payload: MergeDocumentFoldersPayload,
) {
  const { data } = await apiClient.post<MergeDocumentFoldersResult>(
    `/api/document-folders/${sourceFolderId}/merge`,
    {
      targetFolderId: payload.targetFolderId,
      deleteSourceFolder: payload.deleteSourceFolder ?? true,
    },
  );

  return data;
}
