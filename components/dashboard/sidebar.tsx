'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, PlusCircle, History, LogOut, ChevronRight, Zap, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/analysis/new', icon: PlusCircle, label: 'Nova Análise' },
  { href: '/history', icon: History, label: 'Histórico' },
  { href: '/dashboard/equipe', icon: Users, label: 'Equipe', gestorOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter(i => !i.gestorOnly || profile?.role === 'gestor')

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0F1B2D] flex flex-col z-40">
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">LogiPilot <span className="text-emerald-400">AI</span></span>
        </Link>
        {profile && (
          <div className="mt-3 px-1">
            <p className="text-xs text-slate-400 truncate">{profile.full_name}</p>
            <span className="text-xs font-medium text-emerald-400 capitalize">{profile.role}</span>
            {profile.organizations?.name && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{profile.organizations.name}</p>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
