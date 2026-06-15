'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, PlusCircle, History, LogOut,
  Truck, BarChart3, KeyRound, Briefcase, Camera, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'
import { Avatar } from '@/components/ui/avatar'

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
      { href: '/dashboard/projetos',   icon: Briefcase, label: 'Projetos',    gestorOnly: true },
      { href: '/dashboard/acessos',    icon: KeyRound,  label: 'Acessos',     gestorOnly: true },
      { href: '/dashboard/analises',   icon: BarChart3, label: 'Análises',    gestorOnly: true },
    ],
  },
]

export function Sidebar({ serverProfile }: { serverProfile?: import('@/lib/hooks/use-profile').UserProfile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile: clientProfile, loading: clientLoading } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  // serverProfile !== undefined means the server already ran the query (even if result is null)
  const serverAnswered = serverProfile !== undefined
  const profile = serverAnswered ? (serverProfile ?? clientProfile) : clientProfile
  const profileLoading = !serverAnswered && clientLoading
  const currentAvatar = avatarUrl !== undefined ? avatarUrl : profile?.avatar_url ?? null

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok && data.avatar_url) {
        setAvatarUrl(data.avatar_url)
        router.refresh()
      } else {
        alert(data.error || 'Falha ao enviar imagem.')
      }
    } catch {
      alert('Erro de rede ao enviar imagem.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
          <img
            src="/logo.png"
            alt="Logipilot AI"
            className="h-20 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </Link>
      </div>

      {/* User card */}
      {profile && (
        <div className="mx-3 mb-4 rounded-xl bg-white/5 border border-white/8 p-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Alterar foto de perfil"
            className="relative group flex-shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <Avatar src={currentAvatar} name={profile.full_name || ''} role={profile.role} size="md" />
            <span className="absolute inset-0 rounded-xl bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
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

          // Hide gestor-only groups entirely when we know the user is not gestor.
          // If profile is still null (e.g. fetch failed but loading=false), keep
          // the gestor group visible — the worst case is showing a link the
          // server will then forbid, vs hiding it from a real gestor.
          const isGestor = !profile || profile.role === 'gestor'
          const visible = group.items.filter(i => !i.gestorOnly || isGestor)
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
                        active ? 'text-sky-400' : 'group-hover:text-slate-300'
                      )} />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
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
