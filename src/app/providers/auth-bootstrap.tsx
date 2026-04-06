import { useAuthStore } from "@/app/store/auth.store";
import { useEffect } from "react";

export function AuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const setUser = useAuthStore((state) => state.setUser);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!accessToken) {
        if (!cancelled) {
          setUser(null);
          setBootstrapping(false);
        }
        return;
      }

      try {
        await refreshCurrentUser();
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [accessToken, logout, refreshCurrentUser, setBootstrapping, setUser]);

  return null;
}
