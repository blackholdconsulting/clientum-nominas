import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as readRequestCookies } from "next/headers";

export async function GET() {
  const response = NextResponse.json({});

  const reqCookies = readRequestCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => reqCookies.get(name)?.value,
        set: (name: string, value: string, options?: any) =>
          response.cookies.set({ name, value, ...options }),
        remove: (name: string, options?: any) =>
          response.cookies.set({ name, value: "", ...options, maxAge: 0 }),
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json(
    {
      ok: !error && !!data?.user,
      error: error?.message || null,
      user: data?.user ? { id: data.user.id, email: data.user.email } : null,
      cookies: Array.from(reqCookies.getAll()).map((c) => c.name),
    },
    { status: 200 }
  );
}
