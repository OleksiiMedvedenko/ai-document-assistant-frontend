import { apiClient } from "./client";

export type AdminUsageMetric = {
  used: number;
  remaining: number | null;
};

export type AdminUserItem = {
  id: string;
  email: string;
  displayName?: string | null;
  role: "Admin" | "User" | string;
  isActive: boolean;
  authProvider: "Local" | "Google" | string;
  hasUnlimitedAiUsage: boolean;
  monthlyChatMessageLimit: number;
  monthlyDocumentUploadLimit: number;
  monthlySummarizationLimit: number;
  monthlyExtractionLimit: number;
  monthlyComparisonLimit: number;
  usage: {
    chatMessages: AdminUsageMetric;
    documentUploads: AdminUsageMetric;
    summarizations: AdminUsageMetric;
    extractions: AdminUsageMetric;
    comparisons: AdminUsageMetric;
  };
  hasActiveOverride: boolean;
  overrideReason?: string | null;
  createdAtUtc: string;
};

export type UpdateUserRoleRequest = {
  role: "Admin" | "User";
};

export type UpdateUserActiveStatusRequest = {
  isActive: boolean;
};

export type UpdateUserLimitsRequest = {
  monthlyChatMessageLimit?: number | null;
  monthlyDocumentUploadLimit?: number | null;
  monthlySummarizationLimit?: number | null;
  monthlyExtractionLimit?: number | null;
  monthlyComparisonLimit?: number | null;
  hasUnlimitedAiUsage?: boolean | null;
  reason?: string | null;
  validToUtc?: string | null;
};

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const { data } = await apiClient.get("/api/admin/users");
  return data;
}

export async function updateAdminUserRole(
  userId: string,
  payload: UpdateUserRoleRequest,
) {
  const { data } = await apiClient.patch(
    `/api/admin/users/${userId}/role`,
    payload,
  );
  return data;
}

export async function updateAdminUserActiveStatus(
  userId: string,
  payload: UpdateUserActiveStatusRequest,
) {
  const { data } = await apiClient.patch(
    `/api/admin/users/${userId}/active-status`,
    payload,
  );
  return data;
}

export async function updateAdminUserLimits(
  userId: string,
  payload: UpdateUserLimitsRequest,
) {
  const { data } = await apiClient.patch(
    `/api/admin/users/${userId}/limits`,
    payload,
  );
  return data;
}

export async function removeAdminUserLimits(userId: string) {
  const { data } = await apiClient.delete(`/api/admin/users/${userId}/limits`);
  return data;
}
