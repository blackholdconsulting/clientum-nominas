"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthPage() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const next =
      new URLSearchParams(window.location.search).get("next") || "/";

    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    // si todo ok -> dashboard o ruta next
    window.location.href = next;
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border shadow-sm bg-[var(--card)]">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[var(--brand)]" />
            <div className="font-semibold">Clientum Nóminas</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold mb-1">Inicia sesión</h1>
            <p className="text-sm text-[var(--muted)]">
              Usa tus credenciales de Clientum.
            </p>
          </div>

          <label className="block text-sm">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="tucorreo@empresa.com"
          />

          <div>
            <label className="block text-sm">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="••••••••"
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md text-white font-medium bg-[var(--brand)] hover:bg-[var(--brand-600)] transition disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-right">
            <Link
              href="/auth/reset"
              className="text-sm text-[var(--brand)] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
