import { redirect } from 'next/navigation'
import { ProfileProvider } from '@/lib/profile-context'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth-cache'

export default async function MotoristaLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/motorista/login')

  const profile = await getCurrentProfile()
  if (profile && profile.role !== 'motorista') redirect('/dashboard')

  return (
    <ProfileProvider value={profile}>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </ProfileProvider>
  )
}
