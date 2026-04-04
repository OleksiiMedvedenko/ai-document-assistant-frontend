import { useAuthStore } from "@/app/store/auth.store";
import {
  FileText,
  GitCompareArrows,
  LogOut,
  MessageSquareText,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "./language-switcher";

export function AppShell() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.15),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 border-r border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:block">
          <div className="mb-10">
            <p className="text-sm text-zinc-400">AI Workspace</p>
            <h1 className="text-2xl font-bold">Document Assistant</h1>
          </div>

          <nav className="space-y-2">
            <Link
              to="/documents"
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                location.pathname.startsWith("/documents")
                  ? "bg-white text-zinc-950"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <FileText size={18} />
              Documents
            </Link>

            <Link
              to="/compare"
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                location.pathname.startsWith("/compare")
                  ? "bg-white text-zinc-950"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <GitCompareArrows size={18} />
              Compare
            </Link>

            <Link
              to="/documents"
              className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
            >
              <MessageSquareText size={18} />
              AI Chat
            </Link>
          </nav>

          <div className="mt-8">
            <LanguageSwitcher />
          </div>

          <button
            onClick={logout}
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 transition hover:bg-white/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
