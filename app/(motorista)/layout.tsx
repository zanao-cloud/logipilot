import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MotoristaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/motorista/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile && profile.role !== 'motorista') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  )
}
