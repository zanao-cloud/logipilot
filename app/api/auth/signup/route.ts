import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPasswordStrong } from '@/lib/auth/password'
import { checkEmailDomain, emailErrorMessage } from '@/lib/auth/email-validation'

export async function POST(request: NextRequest) {
  const { email, password, name, company } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  const emailCheck = await checkEmailDomain(email)
  if (!emailCheck.ok) {
    return NextResponse.json({ error: emailErrorMessage(emailCheck.reason) }, { status: 400 })
  }

  if (!isPasswordStrong(password)) {
    return NextResponse.json({
      error: 'A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.',
    }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Conta já criada confirmada — login liberado imediatamente após o cadastro.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, company },
  })

  if (createError) {
    const msg = createError.message.toLowerCase()
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 })
    }
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const userId = created.user.id

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: company || `${name} Transportes`, owner_id: userId })
    .select()
    .single()

  if (orgError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Erro ao criar organização' }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({ id: userId, organization_id: org.id, role: 'gestor', full_name: name })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 })
  }

  return NextResponse.json({ id: userId, email })
}
