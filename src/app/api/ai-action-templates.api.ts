import { apiClient } from "./client";

export type AiActionTemplate = {
  id: string;
  name: string;
  documentType?: string | null;
  prompt: string;
  outputFormat: string;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type SaveAiActionTemplatePayload = {
  name: string;
  documentType?: string | null;
  prompt: string;
  outputFormat: string;
};

export async function getAiActionTemplates(documentType?: string | null) {
  const { data } = await apiClient.get<AiActionTemplate[]>(
    "/api/ai-action-templates",
    {
      params: documentType ? { documentType } : undefined,
    },
  );

  return data;
}

export async function createAiActionTemplate(
  payload: SaveAiActionTemplatePayload,
) {
  const { data } = await apiClient.post<AiActionTemplate>(
    "/api/ai-action-templates",
    payload,
  );

  return data;
}

export async function updateAiActionTemplate(
  templateId: string,
  payload: SaveAiActionTemplatePayload,
) {
  const { data } = await apiClient.put<AiActionTemplate>(
    `/api/ai-action-templates/${templateId}`,
    payload,
  );

  return data;
}

export async function deleteAiActionTemplate(templateId: string) {
  await apiClient.delete(`/api/ai-action-templates/${templateId}`);
}
