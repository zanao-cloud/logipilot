'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, CheckCircle2, AlertTriangle, MessageSquare, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import type { NotificationRecord } from '@/types'

const TYPE_ICONS = {
  analysis_completed: CheckCircle2,
  analysis_failed: AlertCircle,
  critical_inconsistency: AlertTriangle,
  comment_added: MessageSquare,
} as const

const TYPE_LABELS: Record<NotificationRecord['type'], string> = {
  analysis_completed: 'Análise concluída',
  analysis_failed: 'Falha na análise',
  critical_inconsistency: 'Inconsistência grave detectada',
  comment_added: 'Novo comentário',
}

const TYPE_COLORS: Record<NotificationRecord['type'], string> = {
  analysis_completed: 'text-emerald-500',
  analysis_failed: 'text-red-500',
  critical_inconsistency: 'text-amber-500',
  comment_added: 'text-blue-500',
}

export function BellDropdown({ userId }: { userId: string }) {
  const [items, setItems] = useState<NotificationRecord[]>([])
  const [open, setOpen] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const { toast } = useToast()

  const unread = items.filter(i => !i.read_at).length

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then((d) => {
      if (Array.isArray(d)) setItems(d)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as NotificationRecord
          setItems(prev => [n, ...prev])
          const title = TYPE_LABELS[n.type] ?? 'Nova notificação'
          const description =
            (n.payload as { title?: string; message?: string })?.title ??
            (n.payload as { title?: string; message?: string })?.message
          const variant =
            n.type === 'analysis_completed' ? 'success' :
            n.type === 'critical_inconsistency' ? 'warning' :
            n.type === 'analysis_failed' ? 'error' : 'info'
          toast({ variant, title, description })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, toast])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
  }

  function notificationHref(n: NotificationRecord): string {
    const aid = (n.payload as { analysis_id?: string })?.analysis_id
    if (n.type === 'analysis_completed' && aid) return `/analysis/${aid}`
    if (n.type === 'critical_inconsistency' && aid) return `/analysis/${aid}/inconsistencies`
    if (n.type === 'comment_added' && aid) return `/analysis/${aid}`
    return '#'
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger
        aria-label={`${unread} notificações não lidas`}
        className="relative w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
      >
        <Bell className="w-4 h-4 text-slate-600" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-semibold px-1 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 max-h-[480px] overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">Notificações</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sem notificações ainda</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Bell
                  const color = TYPE_COLORS[n.type] ?? 'text-slate-400'
                  const href = notificationHref(n)
                  return (
                    <li key={n.id} className={`px-4 py-3 hover:bg-slate-50 ${!n.read_at ? 'bg-blue-50/40' : ''}`}>
                      <Link href={href} className="flex items-start gap-3" onClick={() => setOpen(false)}>
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{TYPE_LABELS[n.type]}</p>
                          {((n.payload as { title?: string })?.title) && (
                            <p className="text-xs text-slate-500 truncate">{(n.payload as { title?: string }).title}</p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {!n.read_at && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" aria-label="Não lida" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
