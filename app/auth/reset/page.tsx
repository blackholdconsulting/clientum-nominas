"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ResetRequest() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const redirectTo = `${
      process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.origin
    }/auth/update-password`;

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border shadow-sm bg-[var(--card)] p-6 space-y-4">
        <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
        {sent ? (
          <p className="text-sm">
            Te enviamos un enlace para restablecer la contraseña. Revisa tu
            correo.
          </p>
        ) : (
          <form onSubmit={request} className="space-y-3">
            <label className="block text-sm">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="tucorreo@empresa.com"
            />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="w-full py-2 rounded-md text-white font-medium bg-[var(--brand)] hover:bg-[var(--brand-600)]">
              Enviar enlace
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
