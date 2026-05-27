import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import type { UserProfile } from '@/lib/hooks/use-profile'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, full_name, organization_id, phone, vehicle_plate, organizations(id, name)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar serverProfile={profile as UserProfile | null} />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
