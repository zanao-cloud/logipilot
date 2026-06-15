import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/hooks/use-profile'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await admin
    .from('user_profiles')
    .select('id, role, full_name, organization_id, phone, vehicle_plate, organizations(id, name)')
    .eq('id', user.id)
    .maybeSingle()

  return (data as unknown as UserProfile | null) ?? null
})
