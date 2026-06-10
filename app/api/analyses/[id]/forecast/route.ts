import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { forecast, autoPickMethod, type ForecastMethod, type SeriesPoint } from '@/lib/analysis/forecast'
import { generateForecastNarrative } from '@/lib/ai/forecast-narrative'
import type { AnalysisResult, Chart } from '@/types'

export const maxDuration = 30

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('forecasts')
    .select('*')
    .eq('analysis_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const horizon = Math.max(1, Math.min(12, Number(body.horizon) || 3))
  const method = (body.method as ForecastMethod | undefined)
  const chartId = body.chart_id as string | undefined
  const seriesKey = (body.series_key as string | undefined) || 'value'
  const metricNameOverride = body.metric_name as string | undefined

  const admin = createAdminClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  let q = admin.from('analyses').select('*').eq('id', id)
  if (profile?.role === 'gestor' && profile.organization_id) {
    q = q.eq('organization_id', profile.organization_id)
  } else {
    q = q.eq('user_id', user.id)
  }
  const { data: analysis } = await q.single()
  if (!analysis?.result) {
    return NextResponse.json({ error: 'Análise não disponível' }, { status: 404 })
  }

  const result = analysis.result as AnalysisResult
  const charts: Chart[] = result.dashboard_data?.charts ?? []
  if (charts.length === 0) {
    return NextResponse.json({ error: 'Esta análise não tem séries temporais para prever.' }, { status: 422 })
  }

  const chart = chartId ? charts.find(c => c.id === chartId) : charts[0]
  if (!chart) return NextResponse.json({ error: 'Gráfico não encontrado' }, { status: 404 })

  const xKey = chart.x_key || 'label'
  const yKey = (chart.y_keys && chart.y_keys.includes(seriesKey)) ? seriesKey : (chart.y_keys?.[0] ?? 'value')

  const historical: SeriesPoint[] = (chart.data || [])
    .map((row) => {
      const r = row as Record<string, unknown>
      const labelRaw = r[xKey]
      const valueRaw = r[yKey]
      const value = typeof valueRaw === 'number' ? valueRaw : parseFloat(String(valueRaw ?? '').replace(',', '.'))
      return { label: String(labelRaw ?? ''), value }
    })
    .filter((p) => isFinite(p.value))

  if (historical.length < 2) {
    return NextResponse.json({ error: 'Série muito curta para gerar previsão (mínimo 2 pontos).' }, { status: 422 })
  }

  const out = forecast({ series: historical, horizon, method: method ?? autoPickMethod(historical.length) })

  const metricName = metricNameOverride ?? chart.title ?? yKey
  const unit = result.indicators?.find(i => i.name.toLowerCase() === metricName.toLowerCase())?.unit ?? null

  const narrative = await generateForecastNarrative({
    metricName,
    unit,
    historical,
    output: out,
    analysisContext: result.executive_summary?.overview,
  })

  const { data: saved, error } = await admin
    .from('forecasts')
    .insert({
      analysis_id: id,
      user_id: user.id,
      metric_name: metricName,
      unit,
      horizon,
      method: out.method,
      source_chart_id: chart.id ?? null,
      source_series_key: yKey,
      historical,
      predictions: out.predictions,
      narrative,
      metadata: { rmse: out.rmse, trend: out.trend, trendPct: out.trendPct },
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(saved)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  const url = new URL(request.url)
  const forecastId = url.searchParams.get('forecast_id')
  if (!forecastId) return NextResponse.json({ error: 'forecast_id obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('forecasts')
    .delete()
    .eq('id', forecastId)
    .eq('analysis_id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
