'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEMO_CREDENTIALS, DEMO_PASSWORD } from '@/lib/auth/demo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, ArrowLeft } from 'lucide-react'

export default function OperadorLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Demo: entra sempre na conta de demonstração, sem checar o que foi digitado.
    await supabase.auth.signInWithPassword({ email: DEMO_CREDENTIALS.operador, password: DEMO_PASSWORD })
    router.push('/operador')
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
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal do Operador</h1>
          <p className="text-slate-300 text-sm mt-1">Análises e dados operacionais da frota</p>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
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
