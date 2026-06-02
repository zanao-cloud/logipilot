import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

const supabase = createClient(
  get('NEXT_PUBLIC_SUPABASE_URL'),
  get('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const target = process.argv[2] || 'joaozanao7@gmail.com'

const { data: { users } } = await supabase.auth.admin.listUsers()
const user = users.find(u => u.email?.toLowerCase() === target.toLowerCase())

if (!user) {
  console.log('NO AUTH USER for', target)
  process.exit(0)
}

console.log('AUTH USER:', { id: user.id, email: user.email, confirmed_at: user.email_confirmed_at, created_at: user.created_at })

const { data: profile, error: pErr } = await supabase
  .from('user_profiles')
  .select('*, organizations(id, name, owner_id)')
  .eq('id', user.id)
  .maybeSingle()

console.log('PROFILE:', profile, 'ERR:', pErr?.message)

const { data: ownedOrgs } = await supabase
  .from('organizations')
  .select('id, name, created_at')
  .eq('owner_id', user.id)

console.log('OWNED ORGS:', ownedOrgs)

// Also check by email match in case there are duplicates
const sameEmailUsers = users.filter(u => u.email?.toLowerCase() === target.toLowerCase())
console.log('ALL AUTH USERS WITH THIS EMAIL:', sameEmailUsers.length, sameEmailUsers.map(u => u.id))
