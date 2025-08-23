import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/auth', '/auth/callback', '/api/health']

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  if (PUBLIC_PATHS.some(p => url.pathname.startsWith(p))) return NextResponse.next()

  const supabaseSession = req.cookies.get('sb-' ) // cookie de supabase (prefijo)
  if (!supabaseSession) {
    const login = new URL('/auth', url.origin)
    login.searchParams.set('next', url.pathname)
    return NextResponse.redirect(login)
  }

  const orgCookie = req.cookies.get('clientum_active_org')?.value
  if (!orgCookie && !url.pathname.startsWith('/org')) {
    return NextResponse.redirect(new URL('/org/select', url.origin))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
