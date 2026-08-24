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

  // `user` não é mais lido fora do bloco comentado abaixo, mas a chamada
  // segue aqui para manter a sessão do cookie renovada quando ela existir.
  await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // TEMPORÁRIO: gate de login desativado a pedido (projeto Supabase
  // hbijlpheqicxecrhczza fora do ar / DNS não resolve). Reativar tudo isso
  // assim que o Supabase voltar:
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
  // if (pathname === '/login' || pathname === '/register'
  //     || pathname === '/operador/login' || pathname === '/motorista/login') {
  //   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  //   let role: string | undefined
  //   if (serviceKey) {
  //     const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  //     const { data: profile } = await admin
  //       .from('user_profiles').select('role').eq('id', user.id).maybeSingle()
  //     role = profile?.role
  //   }
  //   const home = role === 'motorista' ? '/motorista'
  //              : role === 'operador'  ? '/operador'
  //              : '/dashboard'
  //   return NextResponse.redirect(new URL(home, request.url))
  // }

  // As telas de login/registro pulam direto pro portal correspondente.
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (pathname === '/operador/login') {
    return NextResponse.redirect(new URL('/operador', request.url))
  }
  if (pathname === '/motorista/login') {
    return NextResponse.redirect(new URL('/motorista', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
