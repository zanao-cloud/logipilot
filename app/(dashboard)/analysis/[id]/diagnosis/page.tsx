import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Brain, CheckCircle, Lightbulb, Target, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Analysis } from '@/types'

export default async function DiagnosisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: analysis } = await supabase
    .from('analyses').select('*').eq('id', id).eq('user_id', user.id).single()

  if (!analysis || !(analysis as Analysis).result) notFound()

  const result = (analysis as Analysis).result!
  const { diagnosis, bottlenecks, risks } = result

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Assessment */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="font-semibold text-slate-800">Avaliação Geral da IA</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 items-center mb-4">
            <div className="text-center flex-shrink-0">
              <div className={`text-5xl font-bold ${
                diagnosis.health_score >= 70 ? 'text-emerald-600' :
                diagnosis.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>{diagnosis.health_score}</div>
              <p className="text-xs text-slate-400 mt-1">Score /100</p>
            </div>
            <p className="text-slate-700 leading-relaxed">{diagnosis.overall_assessment}</p>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                diagnosis.health_score >= 70 ? 'bg-emerald-500' :
                diagnosis.health_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${diagnosis.health_score}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Observed facts */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Fatos Observados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dados concretos identificados nos arquivos</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {diagnosis.observed_facts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {fact}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Hypotheses */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Hipóteses
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Inferências baseadas nos padrões — não são certezas</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {diagnosis.hypotheses.map((hyp, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
                  {hyp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Recomendações
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Sugestões baseadas nos dados analisados</p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {diagnosis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-emerald-50 rounded-lg p-3">
                <span className="text-emerald-600 flex-shrink-0 mt-0.5">→</span>
                <p className="text-sm text-slate-700">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority areas */}
      {diagnosis.priority_areas.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Áreas Prioritárias
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {diagnosis.priority_areas.map((area, i) => (
                <span key={i} className="bg-red-50 text-red-700 text-sm px-3 py-1.5 rounded-full border border-red-100">
                  🎯 {area}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Gargalos Identificados
          </h3>
          <div className="space-y-3">
            {bottlenecks.map((item, i) => (
              <IssueCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Riscos Identificados
          </h3>
          <div className="space-y-3">
            {risks.map((item, i) => (
              <IssueCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IssueCard({ item }: { item: { title: string; description: string; severity: string; evidence: string; impact: string } }) {
  const severityConfig = {
    high: { label: 'Alta', class: 'bg-red-50 border-red-200 text-red-700', badge: 'bg-red-100 text-red-700' },
    medium: { label: 'Média', class: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    low: { label: 'Baixa', class: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  }

  const config = severityConfig[item.severity as keyof typeof severityConfig] || severityConfig.medium

  return (
    <div className={`border rounded-xl p-4 ${config.class}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-sm">{item.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${config.badge}`}>
          {config.label}
        </span>
      </div>
      <p className="text-sm opacity-90 mb-3">{item.description}</p>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div>
          <span className="font-semibold opacity-70">Evidência: </span>
          <span className="opacity-80">{item.evidence}</span>
        </div>
        <div>
          <span className="font-semibold opacity-70">Impacto: </span>
          <span className="opacity-80">{item.impact}</span>
        </div>
      </div>
    </div>
  )
}
