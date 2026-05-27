import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithData } from '@/lib/ai/analyze'

export const maxDuration = 30

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('result')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis?.result) {
    return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
  }

  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('analysis_id', id)
    .order('created_at', { ascending: true })
    .limit(20)

  const messages = (history || []) as { role: 'user' | 'assistant'; content: string }[]

  const reply = await chatWithData(analysis.result, messages, message)

  await supabase.from('chat_messages').insert([
    { analysis_id: id, user_id: user.id, role: 'user', content: message },
    { analysis_id: id, user_id: user.id, role: 'assistant', content: reply },
  ])

  return NextResponse.json({ reply })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('analysis_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json(data || [])
}
