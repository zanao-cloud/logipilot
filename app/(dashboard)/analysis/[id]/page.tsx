import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExecutiveSummaryView } from '@/components/analysis/executive-summary'
import type { Analysis } from '@/types'

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis) notFound()

  return <ExecutiveSummaryView analysis={analysis as Analysis} />
}
