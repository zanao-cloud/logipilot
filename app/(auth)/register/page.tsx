'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2 } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, company }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { router.push('/login'); return }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#1E3A5F]" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Criar conta de Gestor</h1>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 mb-6">
          <strong>Conta de Gestor</strong> — acesso completo ao sistema. Você poderá adicionar operadores e motoristas depois.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Seu nome"
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Nome da transportadora"
            type="text"
            placeholder="Ex: Rápido Transportes Ltda"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
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
            placeholder="Mínimo 6 caracteres"
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
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#1E3A5F] font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
