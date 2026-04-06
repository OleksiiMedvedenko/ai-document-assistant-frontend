import { getMe, type CurrentUserResponse } from "@/app/api/auth.api";
import { create } from "zustand";

export type AuthUser = CurrentUserResponse;

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isBootstrapping: boolean;
  setAuth: (payload: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser | null) => void;
  setBootstrapping: (value: boolean) => void;
  refreshCurrentUser: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: null,
  isBootstrapping: true,

  setAuth: ({ accessToken, refreshToken }) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  setBootstrapping: (value) => set({ isBootstrapping: value }),

  refreshCurrentUser: async () => {
    const accessToken = get().accessToken;

    if (!accessToken) {
      set({ user: null });
      return;
    }

    const me = await getMe();
    set({ user: me });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isBootstrapping: false,
    });
  },
}));
