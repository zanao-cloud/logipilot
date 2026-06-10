'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export type ToastItem = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: { label: string; onClick: () => void }
}

type ToastContextValue = {
  toasts: ToastItem[]
  toast: (t: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
}

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: 'bg-white border-slate-200 text-slate-800',
  info: 'bg-white border-blue-200 text-slate-800',
  success: 'bg-white border-emerald-200 text-slate-800',
  error: 'bg-white border-red-200 text-slate-800',
  warning: 'bg-white border-amber-200 text-slate-800',
}

const ICON_COLOR: Record<ToastVariant, string> = {
  default: 'text-slate-400',
  info: 'text-blue-500',
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, duration: 4500, variant: 'default', ...t }])
    return id
  }, [])

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => {
          const variant = t.variant ?? 'default'
          const Icon = ICONS[variant]
          return (
            <ToastPrimitive.Root
              key={t.id}
              duration={t.duration}
              onOpenChange={(open) => { if (!open) dismiss(t.id) }}
              className={cn(
                'rounded-xl border shadow-lg p-4 flex items-start gap-3',
                'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
                'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
                VARIANT_CLASS[variant],
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', ICON_COLOR[variant])} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                {t.title && (
                  <ToastPrimitive.Title className="text-sm font-semibold leading-tight">
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                {t.description && (
                  <ToastPrimitive.Description className="text-sm text-slate-600 mt-0.5">
                    {t.description}
                  </ToastPrimitive.Description>
                )}
                {t.action && (
                  <ToastPrimitive.Action
                    altText={t.action.label}
                    asChild
                    onClick={t.action.onClick}
                  >
                    <button className="text-xs font-medium text-blue-600 underline mt-2">
                      {t.action.label}
                    </button>
                  </ToastPrimitive.Action>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Fechar"
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 w-full sm:w-96 max-w-full outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    // SSR-safe noop
    return {
      toast: () => '',
      dismiss: () => {},
      toasts: [] as ToastItem[],
    }
  }
  return ctx
}
