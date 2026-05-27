'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'
import {
  Truck, Package, TrendingUp, CheckCircle,
  MapPin, LogOut, Zap, Bell, Star,
} from 'lucide-react'

export default function MotoristaPage() {
  const { profile, loading } = useProfile()
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'hoje' | 'semana' | 'mes'>('hoje')

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

  // Mock KPIs — in production would come from analyses shared by gestor/operador
  const kpis = {
    hoje: { entregas: 12, pontualidade: 94, km: 87, meta: 15 },
    semana: { entregas: 58, pontualidade: 91, km: 412, meta: 70 },
    mes: { entregas: 234, pontualidade: 92, km: 1840, meta: 250 },
  }

  const data = kpis[activeTab]

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
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </button>
            <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
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
      <div className="flex-1 px-5 py-6 space-y-5">
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
            { icon: Package, label: 'Entregas', value: data.entregas, suffix: '', color: 'text-blue-600 bg-blue-50' },
            { icon: CheckCircle, label: 'Pontualidade', value: data.pontualidade, suffix: '%', color: 'text-emerald-600 bg-emerald-50' },
            { icon: MapPin, label: 'KM rodados', value: data.km, suffix: ' km', color: 'text-amber-600 bg-amber-50' },
            { icon: TrendingUp, label: 'Eficiência', value: Math.round((data.entregas / data.meta) * 100), suffix: '%', color: 'text-purple-600 bg-purple-50' },
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
              <p className="text-sm font-semibold text-amber-800">Avaliação do mês</p>
              <p className="text-xs text-amber-600 mt-0.5">Baseada em pontualidade e eficiência</p>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(data.pontualidade / 20) ? 'text-amber-500 fill-amber-500' : 'text-amber-200'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent deliveries placeholder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm">Últimas entregas</h2>
            <button className="text-xs text-[#1E3A5F]">Ver todas</button>
          </div>
          <div className="space-y-2">
            {[
              { dest: 'Rua das Flores, 123 - Centro', hora: '14:32', status: 'Entregue', ok: true },
              { dest: 'Av. Brasil, 456 - Jardim Norte', hora: '13:15', status: 'Entregue', ok: true },
              { dest: 'Rua do Comércio, 789', hora: '11:48', status: 'Pendente', ok: false },
            ].map((d, i) => (
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
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3 flex justify-around">
        {[
          { icon: LayoutDashboard, label: 'Início', active: true },
          { icon: Package, label: 'Entregas', active: false },
          { icon: MapPin, label: 'Rota', active: false },
          { icon: TrendingUp, label: 'Métricas', active: false },
        ].map(item => (
          <button key={item.label} className={`flex flex-col items-center gap-1 ${item.active ? 'text-[#1E3A5F]' : 'text-slate-400'}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function LayoutDashboard(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
