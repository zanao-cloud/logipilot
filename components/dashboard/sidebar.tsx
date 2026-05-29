'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, PlusCircle, History, LogOut,
  Zap, Truck, BarChart3, KeyRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'

const ROLE_COLOR: Record<string, string> = {
  gestor:   'bg-blue-500',
  operador: 'bg-amber-500',
  motorista:'bg-emerald-500',
}

const ROLE_LABEL: Record<string, string> = {
  gestor:   'Gestor',
  operador: 'Operador',
  motorista:'Motorista',
}

interface NavGroup {
  title?: string
  items: { href: string; icon: React.FC<{ className?: string }>; label: string; gestorOnly?: boolean }[]
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Visão geral' },
    ],
  },
  {
    title: 'Análise',
    items: [
      { href: '/analysis/new', icon: PlusCircle, label: 'Nova análise' },
      { href: '/history',      icon: History,    label: 'Histórico' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { href: '/dashboard/motoristas', icon: Truck,     label: 'Motoristas', gestorOnly: true },
      { href: '/dashboard/acessos',    icon: KeyRound,  label: 'Acessos',     gestorOnly: true },
      { href: '/dashboard/analises',   icon: BarChart3, label: 'Análises',    gestorOnly: true },
    ],
  },
]

function getInitials(name: string) {
  const parts = (name || '').trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0] || '?').slice(0, 2).toUpperCase()
}

export function Sidebar({ serverProfile }: { serverProfile?: import('@/lib/hooks/use-profile').UserProfile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile: clientProfile, loading: clientLoading } = useProfile()

  // serverProfile !== undefined means the server already ran the query (even if result is null)
  const serverAnswered = serverProfile !== undefined
  const profile = serverAnswered ? (serverProfile ?? clientProfile) : clientProfile
  const profileLoading = !serverAnswered && clientLoading

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0A1628] flex flex-col z-40 border-r border-white/5">

      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">
            LogiPilot <span className="text-emerald-400">AI</span>
          </span>
        </Link>
      </div>

      {/* User card */}
      {profile && (
        <div className="mx-3 mb-4 rounded-xl bg-white/5 border border-white/8 p-3 flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md',
            ROLE_COLOR[profile.role] || 'bg-slate-500'
          )}>
            {getInitials(profile.full_name || '')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {profile.full_name?.split(' ')[0] || 'Usuário'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
                ROLE_COLOR[profile.role] || 'bg-slate-500'
              )} />
              <span className="text-xs text-slate-400 truncate">
                {ROLE_LABEL[profile.role] || profile.role}
                {profile.organizations?.name ? ` · ${profile.organizations.name}` : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        {navGroups.map((group, gi) => {
          const isGestaoGroup = group.items.every(i => i.gestorOnly)

          // While loading: show skeleton for gestor-only groups
          if (profileLoading && isGestaoGroup) {
            return (
              <div key={gi}>
                {group.title && (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
                    {group.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((_, i) => (
                    <div key={i} className="h-9 mx-1 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              </div>
            )
          }

          const visible = group.items.filter(i => !i.gestorOnly || profile?.role === 'gestor')
          if (!visible.length) return null
          return (
            <div key={gi}>
              {group.title && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visible.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <item.icon className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        active ? 'text-emerald-400' : 'group-hover:text-slate-300'
                      )} />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
