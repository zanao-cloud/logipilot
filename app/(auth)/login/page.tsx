'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Users, Truck, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    const profileRes = await fetch('/api/profile')
    const profile = await profileRes.json()

    const redirectMap: Record<string, string> = {
      gestor: '/dashboard',
      operador: '/operador',
      motorista: '/motorista',
    }

    router.push(redirectMap[profile?.role] ?? '/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-8" style={{ background: 'linear-gradient(135deg, #030b1a, #0f2060)' }}>
          <div className="flex items-center gap-2 mb-6">
            <img
              src="/logo.png"
              alt="Logipilot AI"
              className="h-10 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Empresarial</h1>
          <p className="text-slate-300 text-sm mt-1">Gestão, análises e relatórios da sua frota</p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
            />
            <div>
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700 block mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500 rounded p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Empresa nova?{' '}
            <Link href="/register?plan=free" className="text-blue-600 font-medium hover:underline">
              Criar conta grátis
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Outros acessos</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/operador/login"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Portal Operador
              </Link>
              <Link
                href="/motorista/login"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                App Motorista
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
