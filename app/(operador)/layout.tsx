import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OperadorSidebar } from '@/components/operador/sidebar'

export default async function OperadorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/operador/login')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OperadorSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
