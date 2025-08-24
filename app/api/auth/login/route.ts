import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as readRequestCookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });

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

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
  } catch (e: any) {
    console.error("LOGIN ERROR", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
