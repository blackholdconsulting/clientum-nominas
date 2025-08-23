"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function UpdatePassword() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const [pwd, setPwd] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Supabase añade un access_token en la URL al abrir el enlace de reset;
    // esto crea/recupera la sesión en el navegador.
    sb.auth.getSessionFromUrl({ storeSession: true }).finally(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await sb.auth.updateUser({ password: pwd });
    if (error) {
      setErr(error.message);
    } else {
      setOk(true);
      setTimeout(() => router.replace("/"), 800);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border shadow-sm bg-[var(--card)] p-6 space-y-4">
        <h1 className="text-xl font-semibold">Nueva contraseña</h1>
        <form onSubmit={change} className="space-y-3">
          <label className="block text-sm">Contraseña</label>
          <input
            type="password"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="••••••••"
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="w-full py-2 rounded-md text-white font-medium bg-[var(--brand)] hover:bg-[var(--brand-600)]">
            Guardar
          </button>
          {ok && <p className="text-sm text-green-600">Contraseña actualizada.</p>}
        </form>
      </div>
    </div>
  );
}
