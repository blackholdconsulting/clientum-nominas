"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Completando acceso…");

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function run() {
      // Gestiona magic link u OAuth (ambos colocan tokens en la URL)
      const { error } = await supabase.auth.getSessionFromUrl({
        storeSession: true,
        // Nota: limpia los fragmentos de la URL
      });

      if (error) {
        setMsg(`Error: ${error.message}`);
        return;
      }

      // Si el usuario tiene varias empresas, lo enviamos al selector.
      const next = params.get("next") || "/org/select";
      router.replace(next);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-2xl border p-6 bg-white">
        {msg}
      </div>
    </div>
  );
}
