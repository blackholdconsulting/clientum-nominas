"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState("Completando acceso…");

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function run() {
      // Completa sesión desde los params/fragments de la URL (magic link / OAuth)
      const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

      if (error) {
        setMsg(`Error: ${error.message}`);
        return;
      }

      // Lee el ?next=... sin usar useSearchParams
      const search = typeof window !== "undefined" ? window.location.search : "";
      const nextParam = new URLSearchParams(search).get("next");
      const next = nextParam || "/org/select";
      router.replace(next);
    }

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-2xl border p-6 bg-white">{msg}</div>
    </div>
  );
}
