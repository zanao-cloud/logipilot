import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined
  const all = body.all === true

  let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id)
  if (!all && ids?.length) q = q.in('id', ids)
  if (!all && !ids?.length) return NextResponse.json({ error: 'ids ou all obrigatórios' }, { status: 400 })

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
