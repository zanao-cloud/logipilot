import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { BellDropdown } from '@/components/notifications/bell-dropdown'
import { ProfileProvider } from '@/lib/profile-context'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth-cache'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()

  return (
    <ProfileProvider value={profile}>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar serverProfile={profile} />
        <main className="flex-1 ml-64 min-h-screen overflow-auto flex flex-col relative">
          <div className="absolute top-3 right-4 z-30">
            <BellDropdown userId={user.id} />
          </div>
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </ProfileProvider>
  )
}
