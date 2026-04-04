import { login } from "@/app/api/auth.api";
import { LanguageSwitcher } from "@/app/components/layout/language-switcher";
import { useAuthStore } from "@/app/store/auth.store";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ email, password });
      setAuth(result);
      navigate("/documents");
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_25%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>

        <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">
          AI Document Assistant
        </p>
        <h1 className="mt-3 text-4xl font-bold">Welcome back</h1>
        <p className="mt-2 text-zinc-400">
          Sign in and continue working with your documents.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-zinc-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-zinc-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-zinc-950 transition hover:scale-[1.01] disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-400">
          No account?{" "}
          <Link to="/register" className="text-white underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
