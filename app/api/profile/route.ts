import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, organizations(id, name)')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) return NextResponse.json(profile)

  // Auto-repair: user is authenticated but has no profile row.
  // Create a gestor profile + org so they're not stuck. This recovers
  // from signups where the profile creation step failed or was skipped.
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const fullName = (user.user_metadata?.full_name as string)
    || user.email?.split('@')[0]
    || 'Gestor'

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: `${fullName} Transportes`, owner_id: user.id })
    .select()
    .single()

  if (orgError || !org) {
    return NextResponse.json(null)
  }

  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({ id: user.id, organization_id: org.id, role: 'gestor', full_name: fullName })

  if (profileError) {
    return NextResponse.json(null)
  }

  const { data: created } = await supabase
    .from('user_profiles')
    .select('*, organizations(id, name)')
    .eq('id', user.id)
    .single()

  return NextResponse.json(created || null)
}
