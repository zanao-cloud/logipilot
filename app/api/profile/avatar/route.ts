import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Imagem acima de 5 MB.' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const ext = file.type.split('/')[1] || 'jpg'
  const path = `${user.id}/avatar-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true, cacheControl: '3600' })

  if (uploadErr) {
    return NextResponse.json({ error: `Falha no upload: ${uploadErr.message}` }, { status: 500 })
  }

  const { data: pub } = admin.storage.from('avatars').getPublicUrl(path)
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

  const { error: updateErr } = await admin
    .from('user_profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateErr) {
    return NextResponse.json({ error: `Falha ao salvar: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: publicUrl })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: files } = await admin.storage.from('avatars').list(user.id)
  if (files?.length) {
    await admin.storage
      .from('avatars')
      .remove(files.map(f => `${user.id}/${f.name}`))
  }

  await admin.from('user_profiles').update({ avatar_url: null }).eq('id', user.id)
  return NextResponse.json({ ok: true })
}
