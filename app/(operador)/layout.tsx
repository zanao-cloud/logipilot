import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OperadorSidebar } from '@/components/operador/sidebar'

export default async function OperadorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/operador/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile && profile.role !== 'operador') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OperadorSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
