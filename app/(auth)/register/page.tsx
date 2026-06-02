'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, MailCheck } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  async function checkEmail(value: string) {
    if (!value || !value.includes('@')) return
    setCheckingEmail(true)
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      const { exists } = await res.json()
      setEmailTaken(exists)
    } catch { /* ignore */ }
    setCheckingEmail(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (emailTaken) { setError('Este e-mail já está cadastrado.'); return }
    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, company }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }

    setDone(true)
  }

  if (done) return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
          <MailCheck className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verifique seu e-mail</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Enviamos um link de confirmação para <strong className="text-slate-700">{email}</strong>.
          Clique no link para ativar sua conta e acessar o sistema.
        </p>
        <p className="text-xs text-slate-400">
          Não recebeu?{' '}
          <button onClick={() => setDone(false)} className="text-blue-600 hover:underline">
            Tentar novamente
          </button>
        </p>
        <div className="mt-6 pt-6 border-t border-slate-100">
          <Link href="/login" className="text-sm text-blue-600 font-medium hover:underline">
            Já confirmei — Entrar
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
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
          <div>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTaken(false) }}
              onBlur={(e) => checkEmail(e.target.value)}
              required
            />
            {emailTaken && (
              <p className="text-xs text-red-600 mt-1 ml-0.5">
                Este e-mail já está cadastrado.{' '}
                <a href="/login" className="underline font-medium">Entrar</a>
              </p>
            )}
            {checkingEmail && (
              <p className="text-xs text-slate-400 mt-1 ml-0.5">Verificando...</p>
            )}
          </div>
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
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
