import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

const supabase = createClient(
  get('NEXT_PUBLIC_SUPABASE_URL'),
  get('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const target = process.argv[2]
const orgName = process.argv[3] || null

if (!target) {
  console.error('Usage: node fix-user-profile.mjs <email> [orgName]')
  process.exit(1)
}

const { data: { users } } = await supabase.auth.admin.listUsers()
const user = users.find(u => u.email?.toLowerCase() === target.toLowerCase())

if (!user) {
  console.error('No auth user found for', target)
  process.exit(1)
}

const { data: existing } = await supabase
  .from('user_profiles').select('id, role').eq('id', user.id).maybeSingle()

if (existing) {
  console.log('Profile already exists:', existing)
  process.exit(0)
}

const fullName = user.user_metadata?.full_name || user.email.split('@')[0]
const finalOrgName = orgName || `${fullName} Transportes`

const { data: org, error: orgErr } = await supabase
  .from('organizations')
  .insert({ name: finalOrgName, owner_id: user.id })
  .select().single()

if (orgErr) { console.error('Org error:', orgErr); process.exit(1) }
console.log('Created org:', org)

const { error: profErr } = await supabase
  .from('user_profiles')
  .insert({ id: user.id, organization_id: org.id, role: 'gestor', full_name: fullName })

if (profErr) { console.error('Profile error:', profErr); process.exit(1) }

console.log(`✓ Created gestor profile for ${target} in org "${finalOrgName}"`)
