import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

const url = get('NEXT_PUBLIC_SUPABASE_URL')
const key = get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

let ok = true

// 1. avatar_url column
console.log('\n[1/3] Coluna avatar_url no user_profiles…')
const { error: colErr } = await supabase
  .from('user_profiles')
  .select('id, avatar_url')
  .limit(1)
if (colErr) { console.log('   ❌', colErr.message); ok = false }
else        { console.log('   ✅ existe') }

// 2. avatars bucket
console.log('\n[2/3] Bucket avatars…')
const { data: buckets, error: bErr } = await supabase.storage.listBuckets()
if (bErr) { console.log('   ❌', bErr.message); ok = false }
else {
  const b = buckets.find(x => x.id === 'avatars')
  if (!b)            { console.log('   ❌ não encontrado'); ok = false }
  else if (!b.public){ console.log('   ⚠️  existe mas não é público'); ok = false }
  else               { console.log('   ✅ existe e é público') }
}

// 3. End-to-end upload via service role (simulates what the API does)
console.log('\n[3/3] Upload de teste no bucket…')
const testPath = `__healthcheck__/test-${Date.now()}.png`
// 1x1 PNG
const pngBytes = Buffer.from([
  0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0x0d,0x49,0x48,0x44,0x52,
  0,0,0,1,0,0,0,1,8,2,0,0,0,0x90,0x77,0x53,0xde,0,0,0,0x0c,0x49,0x44,
  0x41,0x54,0x08,0x99,0x63,0x60,0,0,0,0x02,0,0x01,0xe2,0x21,0xbc,0x33,
  0,0,0,0,0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82,
])

const { error: upErr } = await supabase.storage
  .from('avatars')
  .upload(testPath, pngBytes, { contentType: 'image/png', upsert: true })
if (upErr) { console.log('   ❌', upErr.message); ok = false }
else {
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(testPath)
  const r = await fetch(pub.publicUrl)
  console.log(`   upload ok · GET público devolveu ${r.status} ${r.statusText}`)
  if (r.ok) console.log('   ✅ Storage funcionando ponta a ponta')
  else { console.log('   ❌ Bucket existe mas a leitura pública falhou'); ok = false }
  await supabase.storage.from('avatars').remove([testPath])
}

console.log(ok ? '\n🟢 Tudo certo — upload deve funcionar no app.\n' : '\n🔴 Algum item falhou — leia acima.\n')
process.exit(ok ? 0 : 1)
