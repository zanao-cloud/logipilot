import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { BellDropdown } from '@/components/notifications/bell-dropdown'
import { LocaleSwitcher } from '@/components/ui/locale-switcher'
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
      <main className="flex-1 ml-64 min-h-screen overflow-auto flex flex-col">
        <header className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 px-6 h-12 flex items-center justify-end gap-2">
          <LocaleSwitcher />
          <BellDropdown userId={user.id} />
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
