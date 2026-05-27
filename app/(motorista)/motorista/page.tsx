'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'
import {
  Truck, Package, TrendingUp, CheckCircle,
  MapPin, LogOut, Zap, Bell, Star, ChevronDown, ChevronUp,
  LayoutDashboard,
} from 'lucide-react'

type Section = 'inicio' | 'entregas' | 'rota' | 'metricas'

const allDeliveries = [
  { dest: 'Rua das Flores, 123 - Centro', hora: '14:32', status: 'Entregue', ok: true },
  { dest: 'Av. Brasil, 456 - Jardim Norte', hora: '13:15', status: 'Entregue', ok: true },
  { dest: 'Rua do Comércio, 789', hora: '11:48', status: 'Pendente', ok: false },
  { dest: 'Av. Paulista, 1001 - Bela Vista', hora: '10:20', status: 'Entregue', ok: true },
  { dest: 'Rua Sete de Setembro, 42', hora: '09:05', status: 'Entregue', ok: true },
]

export default function MotoristaPage() {
  const { profile, loading } = useProfile()
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'hoje' | 'semana' | 'mes'>('hoje')
  const [activeSection, setActiveSection] = useState<Section>('inicio')
  const [showAllDeliveries, setShowAllDeliveries] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Bom dia' : greetingHour < 18 ? 'Boa tarde' : 'Boa noite'

  const kpis = {
    hoje:   { entregas: 12, pontualidade: 94, km: 87,   meta: 15 },
    semana: { entregas: 58, pontualidade: 91, km: 412,  meta: 70 },
    mes:    { entregas: 234, pontualidade: 92, km: 1840, meta: 250 },
  }

  const data = kpis[activeTab]
  const displayedDeliveries = showAllDeliveries ? allDeliveries : allDeliveries.slice(0, 3)

  const navItems: { icon: React.FC<{ className?: string }>, label: string, section: Section }[] = [
    { icon: LayoutDashboard, label: 'Início', section: 'inicio' },
    { icon: Package, label: 'Entregas', section: 'entregas' },
    { icon: MapPin, label: 'Rota', section: 'rota' },
    { icon: TrendingUp, label: 'Métricas', section: 'metricas' },
  ]

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F1B2D] to-[#1E3A5F] px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">LogiPilot AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label="Notificações"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Bell className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleLogout}
              aria-label="Sair"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <p className="text-slate-400 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          {profile?.full_name?.split(' ')[0] || 'Motorista'}
        </h1>
        {profile?.organizations?.name && (
          <p className="text-slate-400 text-xs mt-1">{profile.organizations.name}</p>
        )}
        {profile?.vehicle_plate && (
          <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mt-3">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-white text-xs font-medium">{profile.vehicle_plate}</span>
          </div>
        )}

        {/* Score */}
        <div className="mt-6 bg-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{data.pontualidade}%</div>
            <div className="text-xs text-slate-400 mt-0.5">Pontualidade</div>
          </div>
          <div className="flex-1 h-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{data.entregas}</div>
            <div className="text-xs text-slate-400 mt-0.5">Entregas</div>
          </div>
          <div className="flex-1 h-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">{data.km}</div>
            <div className="text-xs text-slate-400 mt-0.5">KM</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 space-y-5 pb-24">
        {/* Period tabs */}
        <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
          {(['hoje', 'semana', 'mes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'hoje' ? 'Hoje' : tab === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        {/* Section: Início ou Métricas */}
        {(activeSection === 'inicio' || activeSection === 'metricas') && (
          <>
            {/* Meta progress */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">Meta de entregas</p>
                <span className="text-sm text-slate-500">{data.entregas}/{data.meta}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    data.entregas / data.meta >= 1 ? 'bg-emerald-500' :
                    data.entregas / data.meta >= 0.7 ? 'bg-amber-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, (data.entregas / data.meta) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {data.entregas >= data.meta
                  ? '✅ Meta atingida!'
                  : `${data.meta - data.entregas} entregas para atingir a meta`}
              </p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Package,    label: 'Entregas',    value: data.entregas,                               suffix: '',   color: 'text-blue-600 bg-blue-50' },
                { icon: CheckCircle,label: 'Pontualidade', value: data.pontualidade,                          suffix: '%',  color: 'text-emerald-600 bg-emerald-50' },
                { icon: MapPin,     label: 'KM rodados',  value: data.km,                                    suffix: ' km', color: 'text-amber-600 bg-amber-50' },
                { icon: TrendingUp, label: 'Eficiência',  value: Math.round((data.entregas / data.meta) * 100), suffix: '%', color: 'text-purple-600 bg-purple-50' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                  <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center mb-2`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{kpi.value}<span className="text-sm font-normal text-slate-400">{kpi.suffix}</span></p>
                  <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-800">Avaliação do período</p>
                  <p className="text-xs text-amber-600 mt-0.5">Baseada em pontualidade e eficiência</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-5 h-5 ${i <= Math.round(data.pontualidade / 20) ? 'text-amber-500 fill-amber-500' : 'text-amber-200'}`} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Section: Entregas */}
        {(activeSection === 'entregas' || activeSection === 'inicio') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 text-sm">
                {activeSection === 'entregas' ? 'Todas as entregas' : 'Últimas entregas'}
              </h2>
              <button
                onClick={() => setShowAllDeliveries(prev => !prev)}
                className="flex items-center gap-1 text-xs text-[#1E3A5F] font-medium hover:underline"
              >
                {showAllDeliveries ? (
                  <><ChevronUp className="w-3 h-3" /> Mostrar menos</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Ver todas</>
                )}
              </button>
            </div>
            <div className="space-y-2">
              {displayedDeliveries.map((d, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ok ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{d.dest}</p>
                    <p className="text-xs text-slate-400">{d.hora}</p>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${d.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Rota */}
        {activeSection === 'rota' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 text-sm">Mapa de rota</p>
            <p className="text-xs text-slate-400 mt-1">Integração com GPS em breve</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-3 flex justify-around max-w-md mx-auto">
        {navItems.map(item => (
          <button
            key={item.section}
            onClick={() => setActiveSection(item.section)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeSection === item.section ? 'text-[#1E3A5F]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
