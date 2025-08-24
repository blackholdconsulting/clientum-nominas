import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/auth",
  "/auth/reset",
  "/auth/update-password",
  "/api/auth/login",
  "/api/health",
  "/api/dev/check-user",
  "/api/dev/force-password",
  "/api/dev/generate-recovery-link",
  "/api/dev/whoami"
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // público
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // cliente Supabase usando SOLO cookies del request (en middleware no podemos escribir)
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: () => {},     // en middleware no se escriben cookies
        remove: () => {},  // no-op
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  // Si error por token/cookies inválidos => a /auth
  if (error || !data?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    // protege todo excepto assets estáticos de Next
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
