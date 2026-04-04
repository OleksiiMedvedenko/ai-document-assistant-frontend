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

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/login",
    payload,
  );
  return data;
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post("/api/auth/register", payload);
  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/refresh", {
    refreshToken,
  });
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
}
