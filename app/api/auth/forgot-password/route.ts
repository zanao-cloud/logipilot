import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({ email: '' }))

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey || !anonKey) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check if user exists. If not, still return ok to avoid email enumeration.
  const { data: { users } } = await admin.auth.admin.listUsers()
  const exists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!exists) {
    return NextResponse.json({ ok: true })
  }

  // Send OTP via the public client. shouldCreateUser=false so the email isn't
  // taken over by signup if the user no longer exists.
  const publicClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await publicClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    return NextResponse.json({ error: 'Falha ao enviar código. Tente novamente em alguns minutos.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
