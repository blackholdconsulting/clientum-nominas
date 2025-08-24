// lib/supabase/server.ts
'use server';

import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para Server Components / Route Handlers.
 * Es compatible con los imports que ya tienes:
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
        // En Server Components, Next no deja modificar cookies.
        // Si se llama aquí, lo ignoramos para no romper el render.
        set(name: string, value: string, options: any) {
          try {
            // Solo tendrá efecto en Server Actions / Route Handlers.
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

// Alias para compatibilidad con código existente
export const supabaseServer = getSupabaseServerClient;
export default getSupabaseServerClient;
