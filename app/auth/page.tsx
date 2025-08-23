"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = supabaseBrowser();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    const redirectTo =
      `${process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 bg-white">
        <h1 className="text-2xl font-semibold mb-1">Accede a Clientum Nóminas</h1>
        <p className="text-sm text-gray-500 mb-6">Te enviaremos un enlace mágico al correo.</p>

        {sent ? (
          <div className="text-sm">
            ✅ Revisa tu bandeja de entrada. Si no llega, mira el spam.
          </div>
        ) : (
          <form onSubmit={sendMagicLink} className="space-y-3">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md p-2"
            />
            <button className="w-full rounded-md bg-black text-white py-2">Enviar enlace</button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}

        {/* (Opcional) Botones OAuth
        <div className="mt-6">
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_DOMAIN}/auth/callback` } })}
            className="w-full border rounded-md py-2"
          >
            Continuar con Google
          </button>
        </div>
        */}
      </div>
    </div>
  );
}
