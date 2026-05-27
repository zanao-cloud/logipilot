import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Analysis, Inconsistency } from '@/types'

export default async function InconsistenciesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: analysis } = await supabase
    .from('analyses').select('*').eq('id', id).eq('user_id', user.id).single()

  if (!analysis || !(analysis as Analysis).result) notFound()

  const { inconsistencies } = (analysis as Analysis).result!

  const bySeverity = {
    high: inconsistencies.filter(i => i.severity === 'high'),
    medium: inconsistencies.filter(i => i.severity === 'medium'),
    low: inconsistencies.filter(i => i.severity === 'low'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inconsistências Detectadas</h2>
          <p className="text-slate-500 text-sm mt-1">
            Dados conflitantes, valores suspeitos ou informações contraditórias encontradas nos arquivos
          </p>
        </div>
      </div>

      {inconsistencies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Nenhuma inconsistência detectada</p>
            <p className="text-slate-400 text-sm mt-1">Os dados analisados parecem consistentes entre si</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Alta severidade', count: bySeverity.high.length, variant: 'danger' as const, color: 'border-red-200' },
              { label: 'Média severidade', count: bySeverity.medium.length, variant: 'warning' as const, color: 'border-amber-200' },
              { label: 'Baixa severidade', count: bySeverity.low.length, variant: 'success' as const, color: 'border-emerald-200' },
            ].map((item) => (
              <div key={item.label} className={`bg-white border rounded-xl p-4 text-center ${item.color}`}>
                <p className="text-2xl font-bold text-slate-800">{item.count}</p>
                <Badge variant={item.variant} className="mt-1">{item.label}</Badge>
              </div>
            ))}
          </div>

          {/* List by severity */}
          {(['high', 'medium', 'low'] as const).map((severity) => {
            const items = bySeverity[severity]
            if (!items.length) return null

            return (
              <div key={severity}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className={`w-4 h-4 ${
                    severity === 'high' ? 'text-red-500' :
                    severity === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                  <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                    Severidade {severity === 'high' ? 'Alta' : severity === 'medium' ? 'Média' : 'Baixa'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <InconsistencyCard key={i} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function InconsistencyCard({ item }: { item: Inconsistency }) {
  const config = {
    high: { bg: 'bg-red-50 border-red-200', badge: 'danger' as const, text: 'text-red-700' },
    medium: { bg: 'bg-amber-50 border-amber-200', badge: 'warning' as const, text: 'text-amber-700' },
    low: { bg: 'bg-emerald-50 border-emerald-200', badge: 'success' as const, text: 'text-emerald-700' },
  }[item.severity]

  return (
    <div className={`border rounded-xl p-4 ${config.bg}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`font-semibold text-sm ${config.text}`}>{item.title}</h4>
        <Badge variant={config.badge} className="flex-shrink-0">
          {item.severity === 'high' ? 'Alta' : item.severity === 'medium' ? 'Média' : 'Baixa'}
        </Badge>
      </div>
      <p className={`text-sm mb-3 opacity-90 ${config.text}`}>{item.description}</p>
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className={`${config.text} opacity-80`}>
          <span className="font-semibold">Localização: </span>
          {item.location}
        </div>
        <div className={`${config.text} opacity-80`}>
          <span className="font-semibold">Sugestão: </span>
          {item.suggestion}
        </div>
      </div>
    </div>
  )
}
