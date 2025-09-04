import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/']

  // Admin routes that require admin role
  const adminRoutes = ['/admin']

  // Coach routes that require coach or admin role  
  const coachRoutes = ['/games', '/players/manage']

  // Check if route requires authentication
  const requiresAuth = !publicRoutes.some(route => pathname.startsWith(route))

  if (requiresAuth && !session) {
    // Redirect to login if not authenticated
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && requiresAuth) {
    // Get user role from database
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      // User not found in database, redirect to login
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (user.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Check coach routes (admin and coach allowed)
    if (coachRoutes.some(route => pathname.startsWith(route))) {
      if (!['admin', 'coach'].includes(user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }

  // Redirect authenticated users from auth pages
  if (session && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}