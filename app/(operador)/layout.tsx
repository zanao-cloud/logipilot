import { redirect } from 'next/navigation'
import { OperadorSidebar } from '@/components/operador/sidebar'
import { ProfileProvider } from '@/lib/profile-context'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth-cache'

export default async function OperadorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/operador/login')

  const profile = await getCurrentProfile()
  if (profile && profile.role !== 'operador') redirect('/dashboard')

  return (
    <ProfileProvider value={profile}>
      <div className="min-h-screen bg-slate-50 flex">
        <OperadorSidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </ProfileProvider>
  )
}
