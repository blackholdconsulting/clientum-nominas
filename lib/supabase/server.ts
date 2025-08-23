import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // API nueva (recomendada)
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: any) {
          // borrado: set con maxAge 0
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },

        // Compat con versiones que aún piden getAll/setAll (no estorba)
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options })
          );
        },
      },
    }
  );
}
