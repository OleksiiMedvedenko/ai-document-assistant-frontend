import { apiClient } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
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

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post("/api/auth/login", payload);
  return data;
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post("/api/auth/register", payload);
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post("/api/auth/refresh", {
    refreshToken,
  });
  return data;
}

export async function getMe(): Promise<CurrentUserResponse> {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
}
