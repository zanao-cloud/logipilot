'use client'

import { useEffect, useMemo, useState } from 'react'
import { use } from 'react'
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2, Trash2, Brain, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { ForecastChart } from '@/components/analysis/forecast-chart'
import ReactMarkdown from 'react-markdown'
import type { Analysis, AnalysisResult, Chart } from '@/types'
import type { ForecastMethod, ForecastPoint, SeriesPoint } from '@/lib/analysis/forecast'

type ForecastRecord = {
  id: string
  metric_name: string
  unit: string | null
  horizon: number
  method: ForecastMethod
  source_chart_id: string | null
  source_series_key: string | null
  historical: SeriesPoint[]
  predictions: ForecastPoint[]
  narrative: string | null
  metadata: { rmse?: number; trend?: 'up' | 'down' | 'stable'; trendPct?: number }
  created_at: string
}

const METHOD_LABELS: Record<ForecastMethod, string> = {
  linear: 'Regressão linear',
  moving_avg: 'Média móvel',
  holt: 'Holt (suavização exponencial)',
}

export default function ForecastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [horizon, setHorizon] = useState(3)
  const [method, setMethod] = useState<ForecastMethod | 'auto'>('auto')

  useEffect(() => {
    Promise.all([
      fetch(`/api/analyses/${id}`).then(r => r.json()),
      fetch(`/api/analyses/${id}/forecast`).then(r => r.json()),
    ]).then(([a, f]) => {
      setAnalysis(a)
      setForecasts(Array.isArray(f) ? f : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const charts = useMemo(() => {
    const result = analysis?.result as AnalysisResult | undefined
    return (result?.dashboard_data?.charts ?? []) as Chart[]
  }, [analysis])

  async function generate(chart: Chart, seriesKey: string) {
    const key = `${chart.id ?? chart.title}::${seriesKey}`
    setGenerating(key)
    try {
      const res = await fetch(`/api/analyses/${id}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart_id: chart.id,
          series_key: seriesKey,
          horizon,
          method: method === 'auto' ? undefined : method,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao gerar previsão')
      }
      const saved: ForecastRecord = await res.json()
      setForecasts(prev => [saved, ...prev])
      toast({ variant: 'success', title: 'Previsão gerada', description: `${saved.metric_name} · ${horizon} períodos` })
    } catch (err) {
      toast({ variant: 'error', title: 'Não foi possível prever', description: err instanceof Error ? err.message : '' })
    } finally {
      setGenerating(null)
    }
  }

  async function deleteForecast(f: ForecastRecord) {
    if (!confirm(`Excluir previsão de "${f.metric_name}"?`)) return
    const res = await fetch(`/api/analyses/${id}/forecast?forecast_id=${f.id}`, { method: 'DELETE' })
    if (res.ok) {
      setForecasts(prev => prev.filter(x => x.id !== f.id))
      toast({ variant: 'success', title: 'Previsão excluída' })
    } else {
      toast({ variant: 'error', title: 'Erro ao excluir' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Análise preditiva</h2>
          </div>
          <p className="text-slate-500 text-sm">
            Previsões estatísticas a partir das séries da análise · IC 95% · narrativa pela IA.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-500">Horizonte</label>
          <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="px-2 py-1 rounded-lg border border-slate-200 text-sm">
            {[1, 2, 3, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n} períodos</option>)}
          </select>
          <label className="text-slate-500 ml-2">Método</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as ForecastMethod | 'auto')} className="px-2 py-1 rounded-lg border border-slate-200 text-sm">
            <option value="auto">Automático</option>
            <option value="linear">Linear</option>
            <option value="moving_avg">Média móvel</option>
            <option value="holt">Holt</option>
          </select>
        </div>
      </div>

      {/* Séries disponíveis */}
      {charts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Esta análise não tem séries temporais nos gráficos para prever.</p>
            <p className="text-xs text-slate-400 mt-1">Reanalise com dados que contenham pelo menos uma coluna numérica em sequência temporal.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-slate-700 mb-3">Séries disponíveis</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {charts.map((c) => {
                const yKeys = c.y_keys && c.y_keys.length > 0 ? c.y_keys : ['value']
                return yKeys.map((yk) => {
                  const key = `${c.id ?? c.title}::${yk}`
                  const isGenerating = generating === key
                  return (
                    <div key={key} className="flex items-center gap-3 border border-slate-100 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                        <p className="text-xs text-slate-400">
                          série: {yk} · {(c.data || []).length} pontos
                        </p>
                      </div>
                      <Button size="sm" onClick={() => generate(c, yk)} loading={isGenerating} className="gap-1.5">
                        <Brain className="w-3.5 h-3.5" />
                        Prever
                      </Button>
                    </div>
                  )
                })
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previsões geradas */}
      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Nenhuma previsão gerada ainda.</p>
            <p className="text-xs text-slate-400 mt-1">Escolha uma série acima e clique em &quot;Prever&quot;.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {forecasts.map((f) => {
            const trend = f.metadata?.trend ?? 'stable'
            const trendPct = f.metadata?.trendPct ?? 0
            const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
            const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
            return (
              <Card key={f.id}>
                <CardContent className="py-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{f.metric_name}{f.unit ? ` (${f.unit})` : ''}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">Método: {METHOD_LABELS[f.method]}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-500">Horizonte: {f.horizon} períodos</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-500">RMSE: {(f.metadata?.rmse ?? 0).toFixed(2)}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className={`text-xs font-medium inline-flex items-center gap-1 ${trendColor}`}>
                          <TrendIcon className="w-3.5 h-3.5" />
                          {trend === 'stable' ? 'estável' : `${trendPct > 0 ? '+' : ''}${trendPct.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteForecast(f)}
                      aria-label="Excluir previsão"
                      className="p-2 text-red-500 hover:text-red-700 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <ForecastChart
                    data={{ historical: f.historical, predictions: f.predictions }}
                    unit={f.unit}
                  />

                  {f.narrative ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                      <p className="text-xs font-medium text-slate-500 mb-2 inline-flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" /> Interpretação da IA
                      </p>
                      <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-strong:text-slate-800">
                        <ReactMarkdown>{f.narrative}</ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">
        ⚠️ Previsões estatísticas dependem da qualidade da série histórica. Use as bandas de incerteza como guia, não como certeza.
      </p>
    </div>
  )
}
