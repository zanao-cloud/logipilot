import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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

  // TEMPORÁRIO: gate de login desativado a pedido (projeto Supabase
  // hbijlpheqicxecrhczza fora do ar / DNS não resolve). Reativar o bloco
  // abaixo assim que o Supabase voltar — sem ele, /dashboard, /operador e
  // /motorista ficam acessíveis sem autenticação.
  // if (!user) {
  //   if (pathname.startsWith('/operador') && pathname !== '/operador/login') {
  //     return NextResponse.redirect(new URL('/operador/login', request.url))
  //   }
  //   if (pathname.startsWith('/motorista') && pathname !== '/motorista/login') {
  //     return NextResponse.redirect(new URL('/motorista/login', request.url))
  //   }
  //   if (['/dashboard', '/analysis', '/history'].some(p => pathname.startsWith(p))) {
  //     return NextResponse.redirect(new URL('/login', request.url))
  //   }
  //   return supabaseResponse
  // }
  if (!user) return supabaseResponse

  // Logged-in. Bounce login/register to the right home for the user's role.
  if (pathname === '/login' || pathname === '/register'
      || pathname === '/operador/login' || pathname === '/motorista/login') {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let role: string | undefined
    if (serviceKey) {
      const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      const { data: profile } = await admin
        .from('user_profiles').select('role').eq('id', user.id).maybeSingle()
      role = profile?.role
    }
    const home = role === 'motorista' ? '/motorista'
               : role === 'operador'  ? '/operador'
               : '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
