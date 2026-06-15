'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, PlusCircle, History, LogOut, ChevronRight, Zap, Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/use-profile'
import { Avatar } from '@/components/ui/avatar'

const navItems = [
  { href: '/operador', icon: LayoutDashboard, label: 'Painel' },
  { href: '/operador/nova-analise', icon: PlusCircle, label: 'Nova Análise' },
  { href: '/operador/historico', icon: History, label: 'Histórico' },
]

export function OperadorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
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

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1a2e1a] flex flex-col z-40">
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/operador" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">LogiPilot <span className="text-amber-400">AI</span></span>
        </Link>
        {profile && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Alterar foto de perfil"
              className="relative group rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Avatar src={currentAvatar} name={profile.full_name || ''} role="operador" size="md" />
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
              <p className="text-xs text-slate-300 truncate font-medium">{profile.full_name}</p>
              <span className="text-xs font-medium text-amber-400">Operador</span>
              {profile.organizations?.name && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{profile.organizations.name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/operador' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
