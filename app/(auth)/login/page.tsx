'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Users, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLES = [
  {
    id: 'gestor',
    label: 'Gestor',
    description: 'Acesso completo, relatórios e equipe',
    icon: Building2,
    redirect: '/dashboard',
  },
  {
    id: 'operador',
    label: 'Operador',
    description: 'Análises e dados operacionais',
    icon: Users,
    redirect: '/operador',
  },
  {
    id: 'motorista',
    label: 'Motorista',
    description: 'Minhas entregas e desempenho',
    icon: Truck,
    redirect: '/motorista',
  },
]

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string>('gestor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('not confirmed')) {
        const res = await fetch('/api/auth/confirm-existing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (res.ok) {
          const retry = await supabase.auth.signInWithPassword({ email, password })
          data = retry.data
          error = retry.error
        }
      }
    }

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('Não foi possível autenticar. Tente novamente.')
      setLoading(false)
      return
    }

    // Fetch profile to get real role and redirect correctly
    const profileRes = await fetch('/api/profile')
    const profile = await profileRes.json()

    if (!profile || !profile.role) {
      // No profile yet — legacy user, send to dashboard
      router.push('/dashboard')
      router.refresh()
      return
    }

    const roleConfig = ROLES.find(r => r.id === profile.role)
    router.push(roleConfig?.redirect ?? '/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Entrar no LogiPilot AI</h1>
          <p className="text-slate-500 text-sm mt-1">Selecione seu perfil de acesso</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all',
                selectedRole === role.id
                  ? 'border-[#1E3A5F] bg-[#1E3A5F]/5'
                  : 'border-slate-100 hover:border-slate-200'
              )}
            >
              <role.icon className={cn('w-5 h-5', selectedRole === role.id ? 'text-[#1E3A5F]' : 'text-slate-400')} />
              <span className={cn('text-xs font-semibold', selectedRole === role.id ? 'text-[#1E3A5F]' : 'text-slate-500')}>
                {role.label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-slate-400 mb-5 -mt-3">
          {ROLES.find(r => r.id === selectedRole)?.description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Entrar como {ROLES.find(r => r.id === selectedRole)?.label}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Empresa nova?{' '}
          <Link href="/register" className="text-[#1E3A5F] font-medium hover:underline">
            Criar conta de gestor
          </Link>
        </p>
      </div>
    </div>
  )
}
