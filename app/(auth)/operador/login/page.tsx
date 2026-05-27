'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Zap, ArrowLeft } from 'lucide-react'

export default function OperadorLoginPage() {
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      setError('E-mail ou senha incorretos. Verifique com seu gestor.')
      setLoading(false)
      return
    }

    router.push('/operador')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#1a2e1a] to-[#2d5a2d] px-8 py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#1a2e1a]" />
            </div>
            <span className="text-white font-bold text-sm">LogiPilot AI</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal do Operador</h1>
          <p className="text-green-200 text-sm mt-1">Análises e dados operacionais da frota</p>
        </div>

        <div className="px-8 py-8">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-amber-800">
              Sua conta foi criada pelo gestor da empresa. Use o e-mail e senha cadastrados.
            </p>
          </div>

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

            <Button
              type="submit"
              className="w-full bg-[#2d5a2d] hover:bg-[#1a2e1a] text-white border-0"
              size="lg"
              loading={loading}
            >
              Entrar como Operador
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Sou gestor — Portal Empresarial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
