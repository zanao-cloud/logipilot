import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, title, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

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
