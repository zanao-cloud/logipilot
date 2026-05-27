import { notFound } from 'next/navigation'
import { getAnalysisForUser } from '@/lib/supabase/get-analysis'
import { Target, Clock, Zap, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Analysis, ActionItem } from '@/types'

export default async function ActionPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const analysis = await getAnalysisForUser(id)

  if (!analysis || !(analysis as unknown as Analysis).result) notFound()

  const { action_plan, opportunities } = (analysis as unknown as Analysis).result!

  const byCategory = {
    immediate: action_plan.filter(a => a.category === 'immediate'),
    short_term: action_plan.filter(a => a.category === 'short_term'),
    medium_term: action_plan.filter(a => a.category === 'medium_term'),
  }

  const categoryConfig = {
    immediate: { label: 'Imediato', icon: Zap, color: 'text-red-600 bg-red-50', border: 'border-red-200' },
    short_term: { label: 'Curto prazo', icon: Clock, color: 'text-amber-600 bg-amber-50', border: 'border-amber-200' },
    medium_term: { label: 'Médio prazo', icon: TrendingUp, color: 'text-blue-600 bg-blue-50', border: 'border-blue-200' },
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Plano de Ação</h2>
        <p className="text-slate-500 text-sm mt-1">
          {action_plan.length} ações priorizadas por urgência, esforço e impacto esperado
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(byCategory) as (keyof typeof byCategory)[]).map((cat) => {
          const cfg = categoryConfig[cat]
          return (
            <div key={cat} className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${cfg.border}`}>
              <div className={`w-9 h-9 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                <cfg.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{byCategory[cat].length}</p>
                <p className="text-xs text-slate-500">{cfg.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions by category */}
      {(Object.keys(byCategory) as (keyof typeof byCategory)[]).map((cat) => {
        const items = byCategory[cat]
        if (!items.length) return null
        const cfg = categoryConfig[cat]

        return (
          <div key={cat}>
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${cfg.color} w-fit`}>
              <cfg.icon className="w-4 h-4" />
              <span className="font-semibold text-sm">{cfg.label}</span>
              <span className="text-xs opacity-70">({items.length})</span>
            </div>
            <div className="space-y-3">
              {items.sort((a, b) => a.priority - b.priority).map((item, i) => (
                <ActionCard key={i} item={item} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Oportunidades Identificadas
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {opportunities.map((opp, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-slate-800 text-sm">{opp.title}</h4>
                    <Badge variant={opp.effort === 'low' ? 'success' : opp.effort === 'medium' ? 'warning' : 'danger'}>
                      {opp.effort === 'low' ? 'Fácil' : opp.effort === 'medium' ? 'Médio' : 'Complexo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{opp.description}</p>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div><span className="font-medium text-slate-600">Impacto: </span>{opp.potential_impact}</div>
                    <div><span className="font-medium text-slate-600">Prazo: </span>{opp.timeframe}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({ item }: { item: ActionItem }) {
  const effortConfig = {
    low: { label: 'Baixo esforço', variant: 'success' as const },
    medium: { label: 'Médio esforço', variant: 'warning' as const },
    high: { label: 'Alto esforço', variant: 'danger' as const },
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {item.priority}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-slate-800">{item.title}</h4>
            <Badge variant={effortConfig[item.effort].variant} className="flex-shrink-0">
              {effortConfig[item.effort].label}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mb-3">{item.description}</p>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {item.responsible && (
              <div>
                <span className="text-slate-400">Responsável: </span>
                <span className="text-slate-600 font-medium">{item.responsible}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Prazo: </span>
              <span className="text-slate-600 font-medium">{item.deadline}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400">Resultado esperado: </span>
              <span className="text-slate-600 font-medium">{item.expected_result}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
