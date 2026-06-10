import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED = new Set(['pt', 'en', 'es'])

export async function POST(request: NextRequest) {
  const { locale } = await request.json().catch(() => ({}))
  if (!SUPPORTED.has(locale)) return NextResponse.json({ error: 'invalid locale' }, { status: 400 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}
