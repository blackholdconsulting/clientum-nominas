// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = cookies();

  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (name: string) => {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set: (name: string, value: string, options: any) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          /* ignore set cookie errors on edge/runtime */
        }
      },
      remove: (name: string, options: any) => {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch {
          /* ignore */
        }
      },
    },
  });

  return client;
}
