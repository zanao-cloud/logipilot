'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Truck, Phone, Star, TrendingUp, ChevronRight,
  Users, CheckCircle, MapPin, Calendar, UserPlus,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Motorista {
  id: string
  full_name: string
  phone?: string
  vehicle_plate?: string
  created_at: string
}

function getKpis(id: string, period: 'hoje' | 'semana' | 'mes') {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const pont = 70 + (h % 28)
  return {
    hoje:   { entregas: 8  + (h % 9),   pontualidade: pont,     km: 55  + (h % 55),  meta: 15 },
    semana: { entregas: 40 + (h % 30),  pontualidade: pont - 2, km: 320 + (h % 200), meta: 70 },
    mes:    { entregas: 170 + (h % 90), pontualidade: pont - 1, km: 1300 + (h % 700), meta: 250 },
  }[period]
}

function getStatus(pont: number) {
  if (pont >= 90) return { label: 'Excelente', bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' }
  if (pont >= 75) return { label: 'Regular',   bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' }
  return            { label: 'Atenção',         bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.25)' }
}

function getInitials(name: string) {
  const parts = (name || '').trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0] || '?').slice(0, 2).toUpperCase()
}

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.5)' },
  { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', shadow: 'rgba(148,163,184,0.35)' },
  { bg: 'linear-gradient(135deg, #fb923c, #ea580c)', shadow: 'rgba(251,146,60,0.4)' },
]

export default function MotoristasPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('mes')

  useEffect(() => {
    fetch('/api/organization/team')
      .then(r => r.json())
      .then(data => {
        setMotoristas((data || []).filter((m: { role: string }) => m.role === 'motorista'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const kpis = motoristas.map(m => ({ ...m, kpi: getKpis(m.id, period) }))
  const avgPont      = kpis.length ? Math.round(kpis.reduce((s, m) => s + m.kpi.pontualidade, 0) / kpis.length) : 0
  const totalEntregas = kpis.reduce((s, m) => s + m.kpi.entregas, 0)
  const totalKm      = kpis.reduce((s, m) => s + m.kpi.km, 0)

  return (
    <div className="min-h-screen bg-[#060d1a] p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', boxShadow: '0 0 24px rgba(14,165,233,0.35)' }}>
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Supervisão de Motoristas</h1>
            <p className="text-slate-400 text-sm mt-0.5">Desempenho e dados de cada motorista da frota</p>
          </div>
        </div>
        <Link href="/dashboard/acessos"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 0 16px rgba(14,165,233,0.2)' }}>
          <UserPlus className="w-4 h-4" />
          Adicionar motorista
        </Link>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 rounded-xl p-1 mb-8 w-fit"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {(['hoje', 'semana', 'mes'] as const).map(t => (
          <button key={t} onClick={() => setPeriod(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              period === t ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={period === t
              ? { background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 0 12px rgba(14,165,233,0.25)' }
              : {}}>
            {t === 'hoje' ? 'Hoje' : t === 'semana' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      {!loading && motoristas.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { Icon: Users,       label: 'Motoristas',    value: motoristas.length,  suffix: '',    color: '#3b82f6' },
            { Icon: CheckCircle, label: 'Pont. média',    value: avgPont,            suffix: '%',   color: '#10b981' },
            { Icon: Truck,       label: 'Total entregas', value: totalEntregas,      suffix: '',    color: '#f59e0b' },
            { Icon: MapPin,      label: 'KM total',       value: totalKm,            suffix: ' km', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}28`, boxShadow: `0 0 14px ${s.color}22` }}>
                <s.Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value.toLocaleString('pt-BR')}{s.suffix}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Motoristas list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : motoristas.length === 0 ? (
        <div className="rounded-2xl py-20 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)' }}>
            <Truck className="w-8 h-8" style={{ color: 'rgba(56,189,248,0.4)' }} />
          </div>
          <p className="font-semibold text-slate-400 mb-1">Nenhum motorista cadastrado</p>
          <p className="text-slate-600 text-sm mb-5">Adicione motoristas pela página de Acessos</p>
          <Link href="/dashboard/acessos"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl text-sky-400 transition-all"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <UserPlus className="w-4 h-4" />
            Ir para Acessos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {kpis
            .sort((a, b) => b.kpi.pontualidade - a.kpi.pontualidade)
            .map((m, rank) => {
              const stars    = Math.round(m.kpi.pontualidade / 20)
              const progress = Math.min(100, (m.kpi.entregas / m.kpi.meta) * 100)
              const status   = getStatus(m.kpi.pontualidade)
              const rankStyle = rank < 3 ? RANK_STYLES[rank] : null
              return (
                <Link key={m.id} href={`/dashboard/motoristas/${m.id}`}>
                  <div className="rounded-2xl p-5 transition-all group cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-start gap-4">

                      {/* Rank badge */}
                      <div className="flex-shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white"
                          style={rankStyle
                            ? { background: rankStyle.bg, boxShadow: `0 0 16px ${rankStyle.shadow}` }
                            : { background: 'rgba(255,255,255,0.08)' }}>
                          #{rank + 1}
                        </div>
                      </div>

                      {/* Driver info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <p className="font-semibold text-white text-base">{m.full_name}</p>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}>
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mb-2.5 flex-wrap">
                          {m.vehicle_plate ? (
                            <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-sky-400 px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                              <Truck className="w-3 h-3" />{m.vehicle_plate}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 italic">Sem placa</span>
                          )}
                          {m.phone && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />{m.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Calendar className="w-3 h-3" />{formatDate(m.created_at)}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-2.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                          ))}
                          <span className="text-xs text-slate-500 ml-1">{m.kpi.pontualidade}% pontualidade</span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${progress}%`,
                              background: progress >= 100 ? '#10b981' : progress >= 70 ? '#f59e0b' : '#ef4444',
                            }} />
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {m.kpi.entregas}/{m.kpi.meta} entregas
                          </span>
                        </div>
                      </div>

                      {/* KPI columns */}
                      <div className="flex items-center gap-5 flex-shrink-0">
                        {[
                          { value: m.kpi.entregas, label: 'Entregas', color: '#94a3b8' },
                          { value: `${m.kpi.pontualidade}%`, label: 'Pontual.',  color: status.text },
                          { value: m.kpi.km,       label: 'KM',       color: '#f59e0b' },
                          { value: `${Math.round((m.kpi.entregas / m.kpi.meta) * 100)}%`, label: 'Meta', color: '#a78bfa' },
                        ].map(k => (
                          <div key={k.label} className="text-center min-w-[48px]">
                            <p className="text-xl font-bold" style={{ color: k.color }}>
                              {typeof k.value === 'number' ? k.value.toLocaleString('pt-BR') : k.value}
                            </p>
                            <p className="text-xs text-slate-600">{k.label}</p>
                          </div>
                        ))}
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
        </div>
      )}

      {motoristas.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-600">
            Classificados por pontualidade · Clique para ver detalhamento completo
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <TrendingUp className="w-3.5 h-3.5" />
            KPIs estimados para fins de visualização
          </div>
        </div>
      )}
    </div>
  )
}
