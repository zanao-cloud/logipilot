'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Truck, Phone, ArrowLeft, Star, Package, CheckCircle,
  MapPin, TrendingUp, AlertTriangle, Award, PlusCircle,
  BarChart3, Clock, FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Analysis } from '@/types'

interface Motorista {
  id: string
  full_name: string
  phone?: string
  vehicle_plate?: string
  created_at: string
}

type Tab = 'desempenho' | 'analises'

function getKpis(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const pont = 70 + (h % 28)
  return {
    hoje:   { entregas: 8  + (h % 9),  pontualidade: pont,     km: 55 + (h % 55),  meta: 15 },
    semana: { entregas: 40 + (h % 30), pontualidade: pont - 2, km: 320 + (h % 200), meta: 70 },
    mes:    { entregas: 170 + (h % 90), pontualidade: pont - 1, km: 1300 + (h % 700), meta: 250 },
  }
}

function getMockDeliveries(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const addresses = [
    'Rua das Flores, 123 — Centro', 'Av. Brasil, 456 — Jd. Norte',
    'Rua do Comércio, 789 — Vila Nova', 'Av. Paulista, 1001 — Bela Vista',
    'Rua Sete de Setembro, 42 — Centro',
  ]
  return [0,1,2,3,4].map(i => ({
    dest: addresses[(h + i) % addresses.length],
    hora: `${String(8 + ((h + i * 2) % 10)).padStart(2,'0')}:${String((h * i) % 60).padStart(2,'0')}`,
    status: (h + i) % 5 !== 3 ? 'Entregue' : 'Pendente',
    ok: (h + i) % 5 !== 3,
  }))
}

export default function MotoristaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('mes')
  const [tab, setTab] = useState<Tab>('desempenho')

  useEffect(() => {
    fetch('/api/organization/team')
      .then(r => r.json())
      .then(data => {
        const found = (data || []).find((m: Motorista) => m.id === id)
        setMotorista(found || null)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    fetch('/api/analyses')
      .then(r => r.json())
      .then((data: Analysis[]) => {
        setAnalyses(data || [])
        setLoadingAnalyses(false)
      })
      .catch(() => setLoadingAnalyses(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1E3A5F] rounded-full animate-spin" />
      </div>
    )
  }

  if (!motorista) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Motorista não encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-[#1E3A5F] text-sm underline">Voltar</button>
      </div>
    )
  }

  const allKpis = getKpis(motorista.id)
  const data = allKpis[period]
  const deliveries = getMockDeliveries(motorista.id)
  const stars = Math.round(data.pontualidade / 20)
  const progress = Math.min(100, (data.entregas / data.meta) * 100)
  const efficiency = Math.round((data.entregas / data.meta) * 100)
  const statusColor = data.pontualidade >= 90 ? 'emerald' : data.pontualidade >= 75 ? 'amber' : 'red'
  const statusLabel = data.pontualidade >= 90 ? 'Excelente' : data.pontualidade >= 75 ? 'Regular' : 'Atenção'

  const driverAnalyses = analyses.filter(a =>
    a.title?.toLowerCase().includes(motorista.full_name.toLowerCase()) ||
    a.title?.toLowerCase().includes(motorista.full_name.split(' ')[0].toLowerCase())
  )

  const newAnalysisUrl = `/analysis/new?title=${encodeURIComponent(`Análise — ${motorista.full_name}`)}&context=${encodeURIComponent(`Dados de desempenho do motorista ${motorista.full_name}${motorista.vehicle_plate ? `, placa ${motorista.vehicle_plate}` : ''}.`)}`

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{motorista.full_name}</h1>
            {motorista.vehicle_plate && (
              <span className="flex items-center gap-1.5 bg-[#1E3A5F]/5 border border-[#1E3A5F]/20 text-[#1E3A5F] text-sm font-medium px-3 py-1 rounded-full">
                <Truck className="w-3.5 h-3.5" />{motorista.vehicle_plate}
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
              statusColor === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            }`}>
              {statusLabel}
            </span>
          </div>
          {motorista.phone && (
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />{motorista.phone}
            </p>
          )}
        </div>
        {/* Analyze button always visible */}
        <Link href={newAnalysisUrl}>
          <button className="flex items-center gap-2 bg-[#1E3A5F] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#162d4a] transition-colors">
            <PlusCircle className="w-4 h-4" />
            Analisar dados
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm w-fit gap-0.5">
        {([
          { key: 'desempenho', label: 'Desempenho' },
          { key: 'analises',   label: `Análises${driverAnalyses.length > 0 ? ` (${driverAnalyses.length})` : ''}` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.key ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Aba Desempenho ── */}
      {tab === 'desempenho' && (
        <>
          {/* Period tabs */}
          <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm w-fit">
            {(['hoje', 'semana', 'mes'] as const).map(t => (
              <button
                key={t}
                onClick={() => setPeriod(t)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                  period === t ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'hoje' ? 'Hoje' : t === 'semana' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Package,    label: 'Entregas',     value: data.entregas,     suffix: '',   color: 'text-blue-600 bg-blue-50' },
              { icon: CheckCircle, label: 'Pontualidade', value: data.pontualidade, suffix: '%',  color: `text-${statusColor}-600 bg-${statusColor}-50` },
              { icon: MapPin,     label: 'KM rodados',   value: data.km,           suffix: ' km', color: 'text-amber-600 bg-amber-50' },
              { icon: TrendingUp, label: 'Eficiência',   value: efficiency,        suffix: '%',  color: 'text-purple-600 bg-purple-50' },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent className="py-5">
                  <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {kpi.value}<span className="text-sm font-normal text-slate-400">{kpi.suffix}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Meta progress */}
            <Card>
              <CardHeader><h2 className="font-semibold text-slate-800">Meta de entregas</h2></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Realizadas</span>
                  <span className="font-semibold text-slate-800">{data.entregas} / {data.meta}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {data.entregas >= data.meta ? '✅ Meta atingida!' : `Faltam ${data.meta - data.entregas} entregas`}
                </p>
              </CardContent>
            </Card>

            {/* Rating */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Avaliação do período
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-6 h-6 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-slate-800">{stars}/5</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Pontualidade', val: data.pontualidade },
                    { label: 'Meta de entregas', val: efficiency },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{item.label}</span><span>{item.val}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.val >= 90 ? 'bg-emerald-500' : item.val >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(100, item.val)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert */}
          {data.pontualidade < 80 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Atenção necessária</p>
                <p className="text-sm text-red-700 mt-0.5">
                  Pontualidade de {data.pontualidade}% está abaixo do esperado (80%). Considere conversar com {motorista.full_name.split(' ')[0]}.
                </p>
              </div>
            </div>
          )}

          {/* Recent deliveries */}
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Últimas entregas registradas</h2></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deliveries.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ok ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{d.dest}</p>
                      <p className="text-xs text-slate-400">{d.hora}</p>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${d.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Histórico de desempenho</h2></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['hoje', 'semana', 'mes'] as const).map(p => {
                  const k = allKpis[p]
                  return (
                    <div key={p} className={`rounded-xl p-4 border ${period === p ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-slate-100 bg-slate-50'}`}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Entregas', val: String(k.entregas), color: '' },
                          { label: 'Pontual.', val: `${k.pontualidade}%`, color: k.pontualidade >= 90 ? 'text-emerald-600' : k.pontualidade >= 75 ? 'text-amber-600' : 'text-red-600' },
                          { label: 'KM', val: String(k.km), color: '' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between text-xs">
                            <span className="text-slate-400">{row.label}</span>
                            <span className={`font-semibold ${row.color || 'text-slate-700'}`}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Aba Análises ── */}
      {tab === 'analises' && (
        <div className="space-y-4">
          {/* Upload CTA */}
          <div className="bg-gradient-to-br from-[#0F1B2D] to-[#1E3A5F] rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">Analisar dados de {motorista.full_name.split(' ')[0]}</h3>
                <p className="text-slate-300 text-sm">
                  Envie uma planilha com entregas, rotas ou desempenho. O sistema extrai indicadores, calcula totais e gera dashboard automaticamente.
                </p>
                <p className="text-slate-400 text-xs mt-2">Aceita: Excel, CSV, PDF, imagens de relatório</p>
              </div>
              <Link href={newAnalysisUrl} className="flex-shrink-0">
                <button className="flex items-center gap-2 bg-white text-[#1E3A5F] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Nova análise
                </button>
              </Link>
            </div>
          </div>

          {/* Analyses list */}
          {loadingAnalyses ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}
            </div>
          ) : driverAnalyses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-medium text-slate-500 text-sm">Nenhuma análise encontrada para {motorista.full_name.split(' ')[0]}</p>
                <p className="text-slate-400 text-xs mt-1 mb-4">Crie uma análise com o nome do motorista no título para ela aparecer aqui.</p>
                <Link href={newAnalysisUrl}>
                  <button className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#162d4a] transition-colors">
                    <PlusCircle className="w-4 h-4" />
                    Criar primeira análise
                  </button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {driverAnalyses.map(a => {
                const statusCfg = {
                  completed:  { label: 'Concluída',   variant: 'success' as const,  icon: CheckCircle },
                  processing: { label: 'Processando', variant: 'warning' as const,  icon: Clock },
                  pending:    { label: 'Pendente',    variant: 'default' as const,  icon: Clock },
                  error:      { label: 'Erro',        variant: 'danger' as const,   icon: AlertTriangle },
                }
                const cfg = statusCfg[a.status]
                const isClickable = a.status === 'completed'
                const card = (
                  <Card hover={isClickable}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{a.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.created_at)}</p>
                      </div>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </CardContent>
                  </Card>
                )
                return isClickable
                  ? <Link key={a.id} href={`/analysis/${a.id}`}>{card}</Link>
                  : <div key={a.id}>{card}</div>
              })}
            </div>
          )}

          {/* All analyses link */}
          <p className="text-xs text-slate-400 text-center">
            Análises vinculadas pelo nome do motorista no título.{' '}
            <Link href="/history" className="text-[#1E3A5F] underline">Ver todas as análises</Link>
          </p>
        </div>
      )}
    </div>
  )
}
