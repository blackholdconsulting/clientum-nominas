// utils/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente SSR de Supabase (Next.js App Router, runtime Node.js)
 * - Usa cookies de la request para sesión
 * - Evita Edge runtime (añade `export const runtime = 'nodejs'` en tus pages)
 */
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/** Alias para compatibilidad con imports antiguos: `import { createClient } ...` */
export const createClient = createSupabaseServer;
