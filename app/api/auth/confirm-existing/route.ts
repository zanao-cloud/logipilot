import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Confirms email for existing unconfirmed users
export async function POST(request: NextRequest) {
  const { email } = await request.json()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { users }, error } = await admin.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const user = users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  if (!user.email_confirmed_at) {
    await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
  }

  return NextResponse.json({ confirmed: true })
}
