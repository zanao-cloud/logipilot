'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Não foi possível enviar o código. Tente novamente.')
      setLoading(false)
      return
    }
    router.push(`/reset-password?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-8" style={{ background: 'linear-gradient(135deg, #030b1a, #0f2060)' }}>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Esqueci minha senha</h1>
          <p className="text-slate-300 text-sm mt-1">
            Informe seu e-mail e enviaremos um código de 6 dígitos para redefinir.
          </p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="E-mail cadastrado"
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

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Enviar código
              <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
            <p className="text-xs text-slate-500 leading-relaxed">
              Por segurança, sempre confirmamos o envio mesmo se o e-mail não estiver cadastrado.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Lembrou da senha?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
