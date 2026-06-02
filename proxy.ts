import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (!user) {
    if (pathname.startsWith('/operador') && pathname !== '/operador/login') {
      return NextResponse.redirect(new URL('/operador/login', request.url))
    }
    if (pathname.startsWith('/motorista') && pathname !== '/motorista/login') {
      return NextResponse.redirect(new URL('/motorista/login', request.url))
    }
    if (['/dashboard', '/analysis', '/history'].some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Logged-in role-based routing — keep each role inside their own portal
  if (user) {
    const isLoginPage = pathname === '/login' || pathname === '/register'
                     || pathname === '/operador/login' || pathname === '/motorista/login'
    const isGestorArea  = ['/dashboard', '/analysis', '/history'].some(p => pathname.startsWith(p))
    const isOperadorArea = pathname.startsWith('/operador') && pathname !== '/operador/login'
    const isMotoristaArea = pathname.startsWith('/motorista') && pathname !== '/motorista/login'

    if (isLoginPage || isGestorArea || isOperadorArea || isMotoristaArea) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role
      const home = role === 'motorista' ? '/motorista'
                 : role === 'operador'  ? '/operador'
                 : '/dashboard'

      if (isLoginPage) {
        return NextResponse.redirect(new URL(home, request.url))
      }
      if (role === 'motorista' && !isMotoristaArea) {
        return NextResponse.redirect(new URL('/motorista', request.url))
      }
      if (role === 'operador' && !isOperadorArea) {
        return NextResponse.redirect(new URL('/operador', request.url))
      }
      if (role === 'gestor' && !isGestorArea) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
