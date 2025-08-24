import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as readRequestCookies } from "next/headers";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
  }

  // Response mutable donde escribiremos Set-Cookie
  const response = NextResponse.json({ ok: true });

  // Adaptador: lee del request y ESCRIBE en la response
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

  // Devuelve la response que YA trae los Set-Cookie de sesión
  return response;
}
