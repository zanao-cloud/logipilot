import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AnalysisNav } from '@/components/analysis/analysis-nav'

export default async function AnalysisLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()
  let query = admin.from('analyses').select('id, title, status').eq('id', id)

  if (profile?.role === 'gestor' && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data: analysis } = await query.single()
  if (!analysis) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <AnalysisNav analysisId={id} title={analysis.title} />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
}
