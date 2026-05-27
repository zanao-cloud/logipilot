import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Gestor signup: creates user + organization + profile
export async function POST(request: NextRequest) {
  const { email, password, name, company } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (error) {
    const msg = (error.message.includes('already registered') || error.message.includes('already been registered'))
      ? 'Este e-mail já está cadastrado.'
      : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = data.user.id

  // Create organization
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: company || `${name} Transportes`, owner_id: userId })
    .select()
    .single()

  if (orgError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Erro ao criar organização' }, { status: 500 })
  }

  // Create gestor profile
  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({ id: userId, organization_id: org.id, role: 'gestor', full_name: name })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 })
  }

  return NextResponse.json({ id: userId })
}
