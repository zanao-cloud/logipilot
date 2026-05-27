import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ExecutiveSummaryView } from '@/components/analysis/executive-summary'
import type { Analysis } from '@/types'

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
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
  let query = admin.from('analyses').select('*').eq('id', id)

  if (profile?.role === 'gestor' && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data: analysis } = await query.single()
  if (!analysis) notFound()

  return <ExecutiveSummaryView analysis={analysis as unknown as Analysis} />
}
