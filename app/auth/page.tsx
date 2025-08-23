"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthPage() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nextUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") || "/"
      : "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = nextUrl;
    } catch (error: any) {
      setErr(error?.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false); // el botón nunca queda bloqueado
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border shadow-sm bg-white">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            {/* Cambia por tu logo si quieres */}
            <div className="h-8 w-8 rounded-md bg-[#0E7AFE]" />
            <div className="font-semibold">Clientum Nóminas</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold mb-1">Inicia sesión</h1>
            <p className="text-sm text-slate-500">Usa tus credenciales de Clientum.</p>
          </div>

          <label className="block text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-[#0E7AFE]"
            placeholder="tucorreo@empresa.com"
            autoComplete="email"
          />

          <div>
            <label className="block text-sm">Contraseña</label>
            <div className="flex gap-2">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-[#0E7AFE]"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="px-3 rounded-md border"
                aria-label={show ? "Ocultar" : "Mostrar"}
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          {/* Botón SIEMPRE visible y clicable */}
          <button
            type="submit"
            className="w-full py-2 rounded-md text-white font-medium bg-[#0E7AFE] hover:bg-[#0969d8] transition"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-right">
            <a href="/auth/reset" className="text-sm text-[#0E7AFE] hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
