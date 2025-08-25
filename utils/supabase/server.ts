// utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = (cookieStore?: ReturnType<typeof cookies>) => {
  const c = cookieStore ?? cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // <-- ANON, nunca service
    {
      cookies: {
        get: (name: string) => c.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          c.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          c.set({ name, value: '', ...options });
        },
      },
    }
  );
};
