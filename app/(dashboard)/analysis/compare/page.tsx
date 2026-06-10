import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { compareAnalyses, summarizeComparison } from '@/lib/analysis/compare'
import { CompareTable, CompareSummaryBadge } from '@/components/analysis/compare-table'
import { GitCompare, FileText, ArrowLeft } from 'lucide-react'
import type { Analysis, AnalysisResult } from '@/types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ a?: string; b?: string }>

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const { a, b } = await searchParams
  if (!a || !b) return notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()
  let q = admin.from('analyses').select('*').in('id', [a, b])
  if (profile?.role === 'gestor' && profile.organization_id) {
    q = q.eq('organization_id', profile.organization_id)
  } else {
    q = q.eq('user_id', user.id)
  }

  const { data } = await q
  const items = (data as Analysis[] | null) ?? []
  const analysisA = items.find(i => i.id === a)
  const analysisB = items.find(i => i.id === b)

  if (!analysisA?.result || !analysisB?.result) return notFound()

  const rows = compareAnalyses(analysisA.result as AnalysisResult, analysisB.result as AnalysisResult)
  const summary = summarizeComparison(rows)

  return (
    <div className="p-8 max-w-6xl">
      <Link href="/history" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Voltar para o histórico
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <GitCompare className="w-5 h-5 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">Comparação de análises</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">Lado a lado: indicadores comuns, deltas e direção.</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">A</span>
          </div>
          <p className="font-semibold text-slate-800">{analysisA.title}</p>
          <p className="text-xs text-slate-500 mt-1">{new Date(analysisA.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">B</span>
          </div>
          <p className="font-semibold text-slate-800">{analysisB.title}</p>
          <p className="text-xs text-slate-500 mt-1">{new Date(analysisB.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="mb-4">
        <CompareSummaryBadge better={summary.better} worse={summary.worse} neutral={summary.neutral} />
      </div>

      <CompareTable rows={rows} labelA={analysisA.title} labelB={analysisB.title} />
    </div>
  )
}
