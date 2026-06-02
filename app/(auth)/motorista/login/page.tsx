'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Truck, Eye, EyeOff } from 'lucide-react'

export default function MotoristaLoginPage() {
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/motorista')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #030b1a 0%, #0f2060 50%, #030b1a 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="flex items-center gap-2 mb-12">
          <img src="/logo.png" alt="Logipilot AI" className="h-7 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

        <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mb-6">
          <Truck className="w-12 h-12 text-sky-400" />
        </div>

        <h1 className="text-3xl font-bold text-white text-center">App do Motorista</h1>
        <p className="text-slate-400 text-center mt-2 text-sm">Acompanhe suas entregas e desempenho</p>
      </div>

      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <p className="text-xs text-slate-400 text-center mb-6">
          Use o e-mail e senha cadastrados pelo seu gestor
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Problemas de acesso? Fale com o gestor da sua empresa.
        </p>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Portal Empresarial
          </Link>
        </div>
      </div>
    </div>
  )
}
