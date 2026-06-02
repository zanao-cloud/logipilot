'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [resendInfo, setResendInfo] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6))
  }

  async function handleResend() {
    if (!email || resendCooldown > 0) return
    setError('')
    setResendInfo('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Não foi possível reenviar o código.')
      return
    }
    setResendInfo('Novo código enviado. Verifique sua caixa de entrada.')
    setResendCooldown(45)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos.')
      return
    }
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword: password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Não foi possível redefinir a senha.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Senha redefinida!</h1>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            Você já pode entrar com sua nova senha.
          </p>
          <Link href="/login">
            <Button className="w-full" size="lg">Ir para o login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-8" style={{ background: 'linear-gradient(135deg, #030b1a, #0f2060)' }}>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Redefinir senha</h1>
          <p className="text-slate-300 text-sm mt-1">
            Digite o código de 6 dígitos que enviamos para o seu e-mail e a nova senha.
          </p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!initialEmail}
              className={initialEmail ? 'bg-slate-50 cursor-not-allowed' : ''}
            />

            <div>
              <label htmlFor="reset-code" className="block text-sm font-medium text-slate-700 mb-1.5">
                Código de verificação
              </label>
              <input
                id="reset-code"
                name="one-time-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                required
                aria-required="true"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-2xl font-mono tracking-[0.6em] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="one-time-code"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">Válido por 60 minutos.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || !email}
                  className="text-xs font-medium text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-blue-500 rounded"
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
              {resendInfo && (
                <p role="status" className="text-xs text-emerald-600 mt-2">{resendInfo}</p>
              )}
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  id="new-password"
                  name="new-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-required="true"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPass}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-500 rounded p-0.5"
                >
                  {showPass ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Input
              label="Confirmar nova senha"
              type={showPass ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              aria-required="true"
            />

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Redefinir senha
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md bg-white rounded-2xl px-8 py-12 text-center text-slate-400">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
