import { LanguageSwitcher } from "@/app/components/layout/language-switcher";
import { useAuthStore } from "@/app/store/auth.store";
import {
  FileText,
  GitCompareArrows,
  Home,
  LogOut,
  MessageSquareText,
  PanelLeft,
  Shield,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";
import "../../styles/app-shell.css";

export function AppShell() {
  const location = useLocation();
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = useMemo(() => {
    const items = [
      {
        to: "/home",
        label: t("nav.home"),
        icon: Home,
        active: location.pathname === "/home",
      },
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
      {
        to: "/account",
        label: t("nav.account"),
        icon: UserCircle2,
        active: location.pathname.startsWith("/account"),
      },
    ];

    if (user?.role === "Admin") {
      items.push({
        to: "/admin/users",
        label: t("nav.adminUsers"),
        icon: Shield,
        active: location.pathname.startsWith("/admin/users"),
      });
    }

    return items;
  }, [location.pathname, t, user?.role]);

  const pageTitle = useMemo(() => {
    if (location.pathname === "/home") return t("nav.home");
    if (location.pathname.startsWith("/compare")) return t("nav.compare");
    if (location.pathname.includes("/chat")) return t("nav.chat");
    if (location.pathname.startsWith("/account")) return t("nav.account");
    if (location.pathname.startsWith("/admin/users"))
      return t("nav.adminUsers");
    return t("nav.documents");
  }, [location.pathname, t]);

  return (
    <div className="app-shell">
      <aside
        className={`app-sidebar ${sidebarOpen ? "app-sidebar--open" : ""}`}
      >
        <div className="app-sidebar__top">
          <Link
            to="/home"
            className="app-brand"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="app-brand__icon">
              <Sparkles size={18} />
            </div>

            <div className="app-brand__text">
              <span>{t("brand.workspace")}</span>
              <strong>{t("brand.name")}</strong>
            </div>
          </Link>

          <button
            type="button"
            className="app-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="app-sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                className={`app-nav-link ${item.active ? "app-nav-link--active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar__bottom">
          <div className="app-sidebar__user-card">
            <div className="app-sidebar__user-avatar">
              <UserCircle2 size={18} />
            </div>

            <div className="app-sidebar__user-info">
              <strong>{user?.displayName || user?.email || "-"}</strong>
              <span>
                {user?.role || "-"}
                {user?.authProvider ? ` • ${user.authProvider}` : ""}
              </span>
            </div>
          </div>

          <div className="app-sidebar__lang">
            <p>{t("common.language")}</p>
            <LanguageSwitcher />
          </div>

          <button type="button" className="app-logout" onClick={logout}>
            <LogOut size={18} />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="app-shell__backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("common.close")}
        />
      ) : null}

      <div className="app-shell__content">
        <header className="app-topbar">
          <div className="app-topbar__left">
            <button
              type="button"
              className="app-topbar__menu"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("common.openMenu")}
            >
              <PanelLeft size={18} />
            </button>

            <div>
              <p className="app-topbar__eyebrow">{t("common.workspace")}</p>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="app-topbar__right">
            <div className="app-topbar__status">
              <Sparkles size={16} />
              <span>{t("common.aiPowered")}</span>
            </div>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
