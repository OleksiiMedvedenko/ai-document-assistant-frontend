import { apiClient } from "./client";

export type SupportedLanguage = "en" | "pl" | "ua";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  confirmationUrl: string;
  language: SupportedLanguage;
};

export type ResendConfirmationEmailRequest = {
  email: string;
  confirmationUrl: string;
  language: SupportedLanguage;
};

export type ConfirmEmailRequest = {
  email: string;
  token: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type UsageMetric = {
  limit: number;
  used: number;
  remaining: number;
};

export type CurrentUserUsage = {
  hasUnlimitedAiUsage: boolean;
  chatMessages: UsageMetric;
  documentUploads: UsageMetric;
  summarizations: UsageMetric;
  extractions: UsageMetric;
  comparisons: UsageMetric;
};

export type CurrentUserResponse = {
  id: string;
  email: string;
  displayName?: string | null;
  role: "Admin" | "User" | string;
  isActive: boolean;
  authProvider: "Local" | "Google" | string;
  createdAtUtc: string;
  usage: CurrentUserUsage;
};

export type ApiActionResponse = {
  success: boolean;
};

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/login",
    payload,
  );
  return data;
}

export async function register(
  payload: RegisterRequest,
): Promise<ApiActionResponse> {
  const { data } = await apiClient.post<ApiActionResponse>(
    "/api/auth/register",
    payload,
  );
  return data;
}

export async function resendConfirmationEmail(
  payload: ResendConfirmationEmailRequest,
): Promise<ApiActionResponse> {
  const { data } = await apiClient.post<ApiActionResponse>(
    "/api/auth/resend-confirmation-email",
    payload,
  );

  return data;
}

export async function confirmEmail(
  payload: ConfirmEmailRequest,
): Promise<ApiActionResponse> {
  const { data } = await apiClient.get<ApiActionResponse>(
    "/api/auth/confirm-email",
    {
      params: payload,
    },
  );

  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/refresh", {
    refreshToken,
  });

  return data;
}

export async function getMe(): Promise<CurrentUserResponse> {
  const { data } = await apiClient.get<CurrentUserResponse>("/api/auth/me");
  return data;
}
