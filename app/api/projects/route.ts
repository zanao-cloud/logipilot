import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return NextResponse.json([])

  const admin = createAdminClient()
  const { data } = await admin
    .from('projects')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body?.name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Sem organização' }, { status: 400 })
  if (profile.role !== 'gestor') return NextResponse.json({ error: 'Apenas gestores podem criar projetos' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('projects')
    .insert({
      organization_id: profile.organization_id,
      name: String(body.name).slice(0, 120),
      client_name: body.client_name ? String(body.client_name).slice(0, 120) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
