// lib/supabase/server.ts
// Helper para crear el cliente de Supabase en Server Components / Route Handlers.
// NO usar "use server" aquí: no es una Server Action.

import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para SSR/RSC (compat con imports existentes):
 *  - getSupabaseServerClient()
 *  - supabaseServer()
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // En RSC Next no permite set/remove; envolvemos en try/catch para no romper.
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* noop: evitamos tirar el SSR */
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            /* noop */
          }
        },
      },
      global: {
        headers: {
          'x-forwarded-host': headers().get('host') ?? '',
        },
      },
    }
  );

  return supabase;
}

// Alias de compatibilidad con tu código actual
export const supabaseServer = getSupabaseServerClient;
export default getSupabaseServerClient;
