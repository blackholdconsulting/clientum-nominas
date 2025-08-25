// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");

  // Si no hay sesión y NO es ruta pública -> a /auth
  if (!user && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Si hay sesión y pide "/" o "/auth" -> mandarlo al dashboard
  if (user && (pathname === "/" || pathname === "/auth")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

// Excluye assets estáticos y lo que no deba pasar por el middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/diag).*)"],
};
