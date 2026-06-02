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
if (!target) { console.error('Usage: cleanup-dup-orgs.mjs <email>'); process.exit(1) }

const { data: { users } } = await supabase.auth.admin.listUsers()
const user = users.find(u => u.email?.toLowerCase() === target.toLowerCase())
if (!user) { console.error('No user'); process.exit(1) }

const { data: profile } = await supabase
  .from('user_profiles').select('organization_id').eq('id', user.id).single()
const keepOrgId = profile?.organization_id
console.log('Keeping org:', keepOrgId)

const { data: ownedOrgs } = await supabase
  .from('organizations').select('id, name').eq('owner_id', user.id)

const toDelete = ownedOrgs.filter(o => o.id !== keepOrgId)
console.log(`Found ${toDelete.length} duplicate orgs to delete`)

for (const o of toDelete) {
  const { error } = await supabase.from('organizations').delete().eq('id', o.id)
  console.log(error ? `✗ ${o.id}: ${error.message}` : `✓ deleted ${o.id}`)
}
