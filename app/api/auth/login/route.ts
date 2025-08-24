import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as readRequestCookies } from "next/headers";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
  }

  // 1) Creamos una respuesta mutable donde vamos a escribir Set-Cookie
  const response = NextResponse.json({ ok: true });

  // 2) Adaptador de cookies que LEE del request y ESCRIBE en la response
  const reqCookies = readRequestCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => reqCookies.get(name)?.value,
        set: (name: string, value: string, options?: any) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options?: any) => {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // 3) Login en servidor (esto genera las cookies de sesión)
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // 4) Devolvemos la MISMA response donde escribimos las cookies
  return response;
}
