import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const store = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get: (name) => store.get(name)?.value,
      set: (name, value, options) => { try { store.set(name, value, options); } catch {} },
      remove: (name, options) => { try { store.set(name, "", { ...options, maxAge: 0 }); } catch {} },
    },
  });
}
