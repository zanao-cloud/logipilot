import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { email, code, newPassword } = await request.json().catch(() => ({}))

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey || !anonKey) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 })
  }

  // Verify the OTP via the public client — this confirms the user controls
  // the inbox before we let them change the password.
  const publicClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: verifyData, error: verifyError } = await publicClient.auth.verifyOtp({
    email,
    token: String(code).trim(),
    type: 'email',
  })

  if (verifyError || !verifyData.user) {
    return NextResponse.json({ error: 'Código inválido ou expirado. Solicite um novo.' }, { status: 400 })
  }

  // Update the password using the admin client.
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: updateError } = await admin.auth.admin.updateUserById(
    verifyData.user.id,
    { password: newPassword }
  )

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar a senha. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
