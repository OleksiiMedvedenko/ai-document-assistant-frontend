import { useAuthStore } from "@/app/store/auth.store";
import {
  FileText,
  GitCompareArrows,
  LogOut,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export function AppShell() {
  const location = useLocation();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    {
      to: "/documents",
      label: t("nav.documents"),
      icon: FileText,
      active:
        location.pathname.startsWith("/documents") &&
        !location.pathname.includes("/chat"),
    },
    {
      to: "/compare",
      label: t("nav.compare"),
      icon: GitCompareArrows,
      active: location.pathname.startsWith("/compare"),
    },
    {
      to: "/documents",
      label: t("nav.chat"),
      icon: MessageSquareText,
      active: location.pathname.includes("/chat"),
    },
  ];

  return (
    <div className="min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <div className="page-container grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="app-shell-card rounded-[32px] p-6">
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full surface-soft px-3 py-1.5 text-xs text-soft">
              <Sparkles size={14} />
              {t("brand.workspace")}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              {t("brand.name")}
            </h1>

            <p className="mt-3 text-sm leading-6 text-soft">
              {t("brand.subtitle")}
            </p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 transition",
                    item.active
                      ? "bg-[var(--primary)] text-[var(--primary-contrast)]"
                      : "surface-soft text-[var(--text)] hover:bg-[var(--panel-strong)]",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-4 border-t border-[var(--border)] pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl surface-soft px-4 py-3 font-medium transition hover:bg-[var(--panel-strong)]"
            >
              <LogOut size={18} />
              {t("common.logout")}
            </button>
          </div>
        </aside>

        <div className="app-shell-card rounded-[32px] overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 lg:px-8">
            <div>
              <p className="text-sm text-muted">{t("common.workspace")}</p>
              <h2 className="text-xl font-semibold">{t("common.dashboard")}</h2>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full surface-soft px-3 py-2 text-sm text-soft">
              <Sparkles size={14} />
              {t("common.aiPowered")}
            </div>
          </header>

          <main className="p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
