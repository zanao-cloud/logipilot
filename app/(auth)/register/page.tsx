'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PlanKey = 'free' | 'pro' | 'enterprise'
const PLAN_LABEL: Record<PlanKey, string> = {
  free: 'Grátis',
  pro: 'Pro',
  enterprise: 'Empresarial',
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = (searchParams.get('plan') || 'free') as PlanKey
  const plan: PlanKey = ['free', 'pro', 'enterprise'].includes(planParam) ? planParam : 'free'

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  // Reflect plan in document title for clarity
  useEffect(() => {
    document.title = `Criar conta — Plano ${PLAN_LABEL[plan]} · LogiPilot AI`
  }, [plan])

  async function checkEmail(value: string) {
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return
    setCheckingEmail(true)
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      const { exists } = await res.json()
      setEmailTaken(exists)
    } catch { /* silent */ }
    setCheckingEmail(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Informe seu nome.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('E-mail inválido.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (emailTaken) { setError('Este e-mail já está cadastrado.'); return }
    if (!acceptedTerms) { setError('Você precisa aceitar os Termos e a Política de Privacidade.'); return }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, company }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Sign the new user in immediately — no email confirmation step.
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Conta criada, mas falhou ao entrar. Tente fazer login manualmente.')
      setLoading(false)
      return
    }

    // If user picked Pro or Empresarial, route them through WhatsApp upgrade flow.
    if (plan === 'pro') {
      window.location.href =
        'https://wa.me/5511939369341?text=' +
        encodeURIComponent(`Olá! Acabei de criar minha conta (${email}) e quero assinar o plano Pro (R$ 97/mês).`)
      return
    }
    if (plan === 'enterprise') {
      window.location.href =
        'https://wa.me/5511939369341?text=' +
        encodeURIComponent(`Olá! Acabei de criar minha conta (${email}) e quero ativar o plano Empresarial (R$ 297/mês).`)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Criar conta de Gestor</h1>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Plano selecionado: {PLAN_LABEL[plan]}
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 mb-6">
          <strong>Conta de Gestor</strong> — acesso completo. Você poderá adicionar operadores e motoristas depois.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Seu nome"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
          />
          <Input
            label="Nome da transportadora"
            type="text"
            name="organization"
            autoComplete="organization"
            placeholder="Ex: Rápido Transportes Ltda"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <div>
            <Input
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTaken(false) }}
              onBlur={(e) => checkEmail(e.target.value)}
              aria-invalid={emailTaken}
              aria-describedby={emailTaken ? 'email-taken-msg' : undefined}
              required
            />
            {emailTaken && (
              <p id="email-taken-msg" className="text-xs text-red-600 mt-1 ml-0.5">
                Este e-mail já está cadastrado.{' '}
                <Link href="/login" className="underline font-medium">Entrar</Link>
              </p>
            )}
            {checkingEmail && (
              <p className="text-xs text-slate-400 mt-1 ml-0.5">Verificando...</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700 block mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                aria-required="true"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus-visible:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500 rounded p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              required
              aria-required="true"
            />
            <span>
              Li e aceito os{' '}
              <Link href="/termos" target="_blank" className="text-blue-600 underline">Termos de Uso</Link>
              {' '}e a{' '}
              <Link href="/privacidade" target="_blank" className="text-blue-600 underline">Política de Privacidade</Link>.
            </span>
          </label>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Criar conta {plan !== 'free' ? `e seguir para ${PLAN_LABEL[plan]}` : ''}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
