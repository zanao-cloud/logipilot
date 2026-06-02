import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  // Determine site URL for email redirect
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://logipilot.vercel.app')

  // Use public client's signUp so Supabase sends the confirmation email
  const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: authData, error: authError } = await publicClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/login`,
      data: { full_name: name },
    },
  })

  if (authError) {
    const msg = (authError.message.includes('already registered') || authError.message.includes('already been registered'))
      ? 'Este e-mail já está cadastrado.'
      : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // signUp returns user=null when email already exists (Supabase prevents enumeration)
  if (!authData.user) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 })
  }

  const userId = authData.user.id

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
