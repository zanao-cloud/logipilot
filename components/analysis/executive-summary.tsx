'use client'

import Link from 'next/link'
import {
  CheckCircle, TrendingUp, TrendingDown, Minus,
  BarChart3, AlertTriangle, Target, Zap, FileText, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SummaryCards, ChartRenderer } from './dashboard-charts'
import { getStatusColor } from '@/lib/utils'
import type { Analysis, Indicator } from '@/types'

export function ExecutiveSummaryView({ analysis }: { analysis: Analysis }) {
  if (analysis.status === 'processing' || analysis.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#1E3A5F] animate-spin" />
        <p className="text-slate-600 font-medium">Processando análise...</p>
        <p className="text-slate-400 text-sm">Recarregue em alguns instantes</p>
      </div>
    )
  }

  if (analysis.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-slate-700 font-medium">Erro ao processar análise</p>
        <p className="text-slate-400 text-sm max-w-md text-center">{analysis.error_message}</p>
        <Link href="/analysis/new" className="text-[#1E3A5F] text-sm hover:underline">Tentar nova análise</Link>
      </div>
    )
  }

  const result = analysis.result
  if (!result) return null

  const { executive_summary: summary, indicators, dashboard_data } = result

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-br from-[#0F1B2D] to-[#1E3A5F] border-0">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">{summary.title}</h2>
              {summary.period && (
                <div className="flex items-center gap-1.5 text-slate-300 text-sm mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  Período: {summary.period}
                </div>
              )}
              <p className="text-slate-300 text-sm leading-relaxed">{summary.overview}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key highlights */}
      {summary.key_highlights.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Destaques principais
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {summary.key_highlights.map((highlight, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-slate-50 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{highlight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health score + quick stats */}
      {result.diagnosis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1 bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-center">
            <p className="text-xs text-slate-500 mb-2">Score Operacional</p>
            <div className={`text-4xl font-bold mb-1 ${
              result.diagnosis.health_score >= 70 ? 'text-emerald-600' :
              result.diagnosis.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {result.diagnosis.health_score}
            </div>
            <p className="text-xs text-slate-400">de 100</p>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  result.diagnosis.health_score >= 70 ? 'bg-emerald-500' :
                  result.diagnosis.health_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.diagnosis.health_score}%` }}
              />
            </div>
          </div>
          {[
            { label: 'Indicadores', value: indicators.length, icon: BarChart3, color: 'text-blue-600' },
            { label: 'Gargalos', value: result.bottlenecks.length, icon: AlertTriangle, color: 'text-red-600' },
            { label: 'Oportunidades', value: result.opportunities.length, icon: Target, color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard charts */}
      {dashboard_data && (
        <>
          {dashboard_data.summary_cards.length > 0 && (
            <SummaryCards cards={dashboard_data.summary_cards} />
          )}
          {dashboard_data.charts.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1E3A5F]" />
                Dashboard
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {dashboard_data.charts.map((chart) => (
                  <ChartRenderer key={chart.id} chart={chart} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Indicators */}
      {indicators.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1E3A5F]" />
              Indicadores encontrados
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {indicators.map((indicator, i) => (
                <IndicatorCard key={i} indicator={indicator} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data sources */}
      {summary.data_sources.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Fontes:</span>
          {summary.data_sources.map((source, i) => (
            <Badge key={i} variant="default">{source}</Badge>
          ))}
        </div>
      )}

      {/* Limitations */}
      {result.limitations.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Limitações desta análise</p>
          <ul className="space-y-1">
            {result.limitations.map((lim, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const TrendIcon = indicator.trend === 'up' ? TrendingUp : indicator.trend === 'down' ? TrendingDown : Minus
  const statusColors = getStatusColor(indicator.status)

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs text-slate-500 font-medium leading-tight">{indicator.name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors}`}>
          {indicator.status === 'good' ? '✓' : indicator.status === 'warning' ? '!' : indicator.status === 'critical' ? '✗' : '—'}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-slate-800">
          {indicator.value}{indicator.unit && <span className="text-sm font-normal text-slate-500 ml-0.5">{indicator.unit}</span>}
        </span>
        {indicator.trend && indicator.trend_value && (
          <span className={`text-xs flex items-center gap-0.5 mb-1 font-medium ${
            indicator.trend === 'up' ? 'text-emerald-600' :
            indicator.trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            <TrendIcon className="w-3 h-3" />
            {indicator.trend_value}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1">{indicator.category}</p>
    </div>
  )
}
