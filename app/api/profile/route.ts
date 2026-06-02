import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Read via admin client to bypass RLS — we've already validated the user
  // through Supabase auth above, so it's safe to read their own profile row.
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin
    .from('user_profiles')
    .select('*, organizations(id, name)')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) return NextResponse.json(profile)

  // No profile yet — create a gestor profile + org so the user can start using
  // the tool. This is idempotent because we just checked there's no profile.
  const fullName = (user.user_metadata?.full_name as string)
    || user.email?.split('@')[0]
    || 'Usuário'

  const { data: org } = await admin
    .from('organizations')
    .insert({ name: `${fullName} Transportes`, owner_id: user.id })
    .select()
    .single()

  if (!org) return NextResponse.json(null)

  await admin
    .from('user_profiles')
    .insert({ id: user.id, organization_id: org.id, role: 'gestor', full_name: fullName })

  const { data: created } = await admin
    .from('user_profiles')
    .select('*, organizations(id, name)')
    .eq('id', user.id)
    .single()

  return NextResponse.json(created || null)
}
