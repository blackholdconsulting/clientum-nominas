// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseServerClient() {
  const cookieStore = cookies(); // OK leer aquí

  // MUY IMPORTANTE: no llames cookieStore.set() aquí.
  // Este cliente se usa solo en Server Components/Route Handlers.

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // NOOP: no se permite modificar cookies en Server Components
        },
        remove() {
          // NOOP
        },
      },
      // opcionalmente reenvía headers (para RLS basados en JWT si fuese tu caso)
      global: { headers: { "x-forwarded-host": headers().get("host") ?? "" } },
    }
  );

  return supabase;
}
