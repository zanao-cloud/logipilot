import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()
  let query = admin
    .from('analyses')
    .select('id, title, status, created_at, files, error_message, user_id')
    .order('created_at', { ascending: false })

  if (profile?.role === 'gestor' && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
