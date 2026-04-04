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

export function AppShell() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();

  const navItems = [
    {
      to: "/documents",
      icon: FileText,
      label: t("nav.documents"),
      active: location.pathname.startsWith("/documents"),
    },
    {
      to: "/compare",
      icon: GitCompareArrows,
      label: t("nav.compare"),
      active: location.pathname.startsWith("/compare"),
    },
    {
      to: "/documents",
      icon: MessageSquareText,
      label: t("nav.chat"),
      active: location.pathname.includes("/chat"),
    },
  ];

  return (
    <div className="min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <div className="page-container grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="glass soft-shadow rounded-[28px] p-5 lg:p-6">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                <Sparkles size={14} />
                {t("brand.workspace")}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("brand.name")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {t("brand.subtitle")}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className={[
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 transition",
                    item.active
                      ? "bg-white text-zinc-950"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-6">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            {t("common.logout")}
          </button>
        </aside>

        <main className="glass soft-shadow rounded-[28px] p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
