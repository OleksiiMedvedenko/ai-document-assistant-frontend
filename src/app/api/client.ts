import { useAuthStore } from "@/app/store/auth.store";
import axios from "axios";
import { refresh } from "./auth.api";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error("Missing VITE_API_BASE_URL in environment variables.");
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      String(originalRequest?.url || "").includes("/api/auth/login") ||
      String(originalRequest?.url || "").includes("/api/auth/register") ||
      String(originalRequest?.url || "").includes("/api/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = (async () => {
        const { refreshToken, setAuth, logout } = useAuthStore.getState();

        if (!refreshToken) {
          logout();
          return null;
        }

        try {
          const result = await refresh(refreshToken);
          setAuth({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
          return result.accessToken;
        } catch {
          logout();
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    return apiClient(originalRequest);
  },
);
