'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
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

    // Auto-confirm and retry if email not confirmed
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
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong')) {
        setError('E-mail ou senha incorretos.')
      } else {
        setError(`Erro: ${error.message}`)
      }
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Entrar no LogiPilot AI</h1>
          <p className="text-slate-500 text-sm mt-2">Acesse sua central de análise operacional</p>
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

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem conta?{' '}
          <Link href="/register" className="text-[#1E3A5F] font-medium hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
