import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

// GET — list team members
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminRead = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: myProfile } = await adminRead
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!myProfile || myProfile.role === 'motorista') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: team } = await adminRead
    .from('user_profiles')
    .select('id, full_name, role, phone, vehicle_plate, created_at')
    .eq('organization_id', myProfile.organization_id)
    .order('role')

  return NextResponse.json(team || [])
}

// POST — add team member (gestor only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminRead = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: myProfile } = await adminRead
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!myProfile || myProfile.role !== 'gestor') {
    return NextResponse.json({ error: 'Apenas gestores podem adicionar membros' }, { status: 403 })
  }

  const { full_name, email, password, role, phone, vehicle_plate } = await request.json()

  if (!email || !password || !role || !full_name) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Create auth user
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) {
    const msg = authError.message.includes('already') ? 'E-mail já cadastrado.' : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Create profile
  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({
      id: newUser.user.id,
      organization_id: myProfile.organization_id,
      role,
      full_name,
      phone: phone || null,
      vehicle_plate: vehicle_plate || null,
    })

  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ id: newUser.user.id })
}

// PATCH — edit team member (gestor only)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminRead = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: myProfile } = await adminRead
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!myProfile || myProfile.role !== 'gestor') {
    return NextResponse.json({ error: 'Apenas gestores podem editar membros' }, { status: 403 })
  }

  const { memberId, full_name, phone, vehicle_plate } = await request.json()
  if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await admin
    .from('user_profiles')
    .update({
      ...(full_name ? { full_name } : {}),
      phone: phone ?? null,
      vehicle_plate: vehicle_plate ?? null,
    })
    .eq('id', memberId)
    .eq('organization_id', myProfile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE — remove team member
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminRead = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: myProfile } = await adminRead
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!myProfile || myProfile.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { memberId } = await request.json()
  if (memberId === user.id) return NextResponse.json({ error: 'Não pode remover a si mesmo' }, { status: 400 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await admin.auth.admin.deleteUser(memberId)
  return NextResponse.json({ ok: true })
}
