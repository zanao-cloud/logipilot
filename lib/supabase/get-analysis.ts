import { createClient } from './server'
import { createAdminClient } from './admin'

export async function getAnalysisForUser(id: string, select = '*') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()
  let query = admin.from('analyses').select(select).eq('id', id)

  if (profile?.role === 'gestor' && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data } = await query.single()
  return data
}
