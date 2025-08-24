import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  const headerList = headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
      global: {
        headers: {
          'X-Client-Info': headerList.get('user-agent') ?? 'clientum',
        },
      },
    }
  );

  return supabase;
}
