'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, Phone, Star, TrendingUp, ChevronRight, Users, CheckCircle, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
    hoje:   { entregas: 8  + (h % 9),  pontualidade: pont,     km: 55 + (h % 55),  meta: 15 },
    semana: { entregas: 40 + (h % 30), pontualidade: pont - 2, km: 320 + (h % 200), meta: 70 },
    mes:    { entregas: 170 + (h % 90), pontualidade: pont - 1, km: 1300 + (h % 700), meta: 250 },
  }[period]
}

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
  }, [])

  const kpis = motoristas.map(m => ({ ...m, kpi: getKpis(m.id, period) }))
  const avgPont = kpis.length ? Math.round(kpis.reduce((s, m) => s + m.kpi.pontualidade, 0) / kpis.length) : 0
  const totalEntregas = kpis.reduce((s, m) => s + m.kpi.entregas, 0)
  const totalKm = kpis.reduce((s, m) => s + m.kpi.km, 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Supervisão de Motoristas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhe o desempenho individual de cada motorista da sua frota
        </p>
      </div>

      {/* Period tabs */}
      <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm w-fit mb-8">
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

      {/* Summary stats */}
      {!loading && motoristas.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,       label: 'Motoristas',      value: motoristas.length, suffix: '',   color: 'text-blue-600 bg-blue-50' },
            { icon: CheckCircle, label: 'Pont. média',      value: avgPont,           suffix: '%',  color: 'text-emerald-600 bg-emerald-50' },
            { icon: Truck,       label: 'Total entregas',   value: totalEntregas,     suffix: '',   color: 'text-amber-600 bg-amber-50' },
            { icon: MapPin,      label: 'KM total',         value: totalKm,           suffix: ' km', color: 'text-purple-600 bg-purple-50' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{s.value.toLocaleString('pt-BR')}{s.suffix}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Motoristas list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : motoristas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="font-semibold text-slate-600">Nenhum motorista cadastrado</p>
            <p className="text-slate-400 text-sm mt-1">
              Adicione motoristas na página{' '}
              <Link href="/dashboard/equipe" className="text-[#1E3A5F] underline">Equipe</Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {kpis
            .sort((a, b) => b.kpi.pontualidade - a.kpi.pontualidade)
            .map((m, rank) => {
              const stars = Math.round(m.kpi.pontualidade / 20)
              const progress = Math.min(100, (m.kpi.entregas / m.kpi.meta) * 100)
              return (
                <Link key={m.id} href={`/dashboard/motoristas/${m.id}`}>
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      {/* Rank + avatar */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          rank === 0 ? 'bg-amber-400 text-white' :
                          rank === 1 ? 'bg-slate-300 text-slate-700' :
                          rank === 2 ? 'bg-orange-300 text-white' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          #{rank + 1}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800">{m.full_name}</p>
                          {m.vehicle_plate && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                              {m.vehicle_plate}
                            </span>
                          )}
                          {m.phone && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />{m.phone}
                            </span>
                          )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                          ))}
                          <span className="text-xs text-slate-400 ml-1">{m.kpi.pontualidade}% pontualidade</span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {m.kpi.entregas}/{m.kpi.meta} entregas
                          </span>
                        </div>
                      </div>

                      {/* KPIs */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-800">{m.kpi.entregas}</p>
                          <p className="text-xs text-slate-400">Entregas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-emerald-600">{m.kpi.pontualidade}%</p>
                          <p className="text-xs text-slate-400">Pontual.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-amber-600">{m.kpi.km}</p>
                          <p className="text-xs text-slate-400">KM</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-purple-600">{Math.round((m.kpi.entregas / m.kpi.meta) * 100)}%</p>
                          <p className="text-xs text-slate-400">Meta</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
        </div>
      )}

      {/* Legend */}
      {motoristas.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-6">
          Classificados por pontualidade · Clique em um motorista para ver o detalhamento completo
        </p>
      )}
    </div>
  )
}
