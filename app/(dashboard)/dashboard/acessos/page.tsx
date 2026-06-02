'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  KeyRound, UserPlus, Copy, Check, Eye, EyeOff,
  Truck, Users, ExternalLink, X, Calendar, Phone,
  Shield, Trash2, Pencil, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Member } from '@/types'

interface Credentials {
  name: string
  email: string
  password: string
  role: string
  loginUrl: string
}

type Tab = 'colaborador' | 'motorista'

const PORTAL = {
  colaborador: { path: '/operador/login' },
  motorista:   { path: '/motorista/login' },
}

const emptyForm = { full_name: '', email: '', password: '', phone: '', vehicle_plate: '' }

// Mercosul plate format: LLLNLNN (3 letras + 1 número + 1 letra + 2 números)
function formatMercosulPlate(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  let result = ''
  for (let i = 0; i < cleaned.length && i < 7; i++) {
    const ch = cleaned[i]
    const expectsLetter = i < 3 || i === 4
    if (expectsLetter && /[A-Z]/.test(ch)) result += ch
    else if (!expectsLetter && /[0-9]/.test(ch)) result += ch
  }
  return result
}

const isPlateValid = (plate: string) => /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(plate)

function PlateInput({
  value, onChange, required = false,
}: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const valid = isPlateValid(value)
  const showError = value.length === 7 && !valid
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 block mb-1.5">
        Placa do veículo {required ? '' : '(opcional)'}
      </label>
      <input
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={7}
        placeholder="AAA0A00"
        value={value}
        onChange={e => onChange(formatMercosulPlate(e.target.value))}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white font-mono tracking-widest uppercase placeholder:text-slate-600 placeholder:tracking-widest outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${showError ? 'rgba(239,68,68,0.5)' : value && valid ? 'rgba(56,189,248,0.45)' : 'rgba(255,255,255,0.1)'}`,
        }}
      />
      <p className={`text-[11px] mt-1 ${showError ? 'text-red-400' : 'text-slate-500'}`}>
        {showError
          ? 'Formato inválido. Use o padrão Mercosul: 3 letras, 1 número, 1 letra, 2 números (ex: ABC1D23).'
          : 'Padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números (ex: ABC1D23).'}
      </p>
    </div>
  )
}

function getInitials(name: string) {
  const parts = (name || '').trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0] || '?').slice(0, 2).toUpperCase()
}

function DarkInput({
  label, ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 block mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.45)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      />
    </div>
  )
}

export default function AcessosPage() {
  const [tab, setTab]               = useState<Tab>('colaborador')
  const [team, setTeam]             = useState<Member[]>([])
  const [loading, setLoading]       = useState(true)
  const [forbidden, setForbidden]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [showPass, setShowPass]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [createError, setCreateError] = useState('')
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied]         = useState<string | null>(null)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editForm, setEditForm]     = useState({ full_name: '', phone: '', vehicle_plate: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState('')
  const [search, setSearch]         = useState('')

  const fetchTeam = useCallback(async () => {
    try {
      const res  = await fetch('/api/organization/team')
      if (!res.ok) {
        setForbidden(res.status === 403)
        setTeam([])
        setLoading(false)
        return
      }
      const data = await res.json()
      setTeam(Array.isArray(data) ? data : [])
      setForbidden(false)
    } catch {
      setTeam([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${PORTAL[tab].path}`
    : PORTAL[tab].path

  const visible = team.filter(m => {
    const matchTab    = tab === 'colaborador' ? m.role === 'operador' : m.role === 'motorista'
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function openCreate() {
    setForm(emptyForm); setCreateError(''); setShowPass(false); setShowCreate(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    const role = tab === 'colaborador' ? 'operador' : 'motorista'
    if (role === 'motorista' && form.vehicle_plate && !isPlateValid(form.vehicle_plate)) {
      setCreateError('Placa inválida. Use o padrão Mercosul (ex: ABC1D23) ou deixe em branco.')
      return
    }
    setSaving(true)
    const res  = await fetch('/api/organization/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    })
    const data = await res.json()
    if (!res.ok) { setCreateError(data.error); setSaving(false); return }
    setCredentials({ name: form.full_name, email: form.email, password: form.password, role, loginUrl: portalUrl })
    setShowCreate(false); setSaving(false)
    await fetchTeam()
  }

  function openEdit(member: Member) {
    setEditMember(member)
    setEditForm({ full_name: member.full_name, phone: member.phone || '', vehicle_plate: member.vehicle_plate || '' })
    setEditError('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editMember) return
    setEditError('')
    if (editMember.role === 'motorista' && editForm.vehicle_plate && !isPlateValid(editForm.vehicle_plate)) {
      setEditError('Placa inválida. Use o padrão Mercosul (ex: ABC1D23) ou deixe em branco.')
      return
    }
    setEditSaving(true)
    const res  = await fetch('/api/organization/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: editMember.id, ...editForm }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error); setEditSaving(false); return }
    setTeam(prev => prev.map(m => m.id === editMember.id
      ? { ...m, full_name: editForm.full_name || m.full_name, phone: editForm.phone || undefined, vehicle_plate: editForm.vehicle_plate || undefined }
      : m
    ))
    setEditMember(null); setEditSaving(false)
  }

  async function handleRemove(member: Member) {
    if (!confirm(`Remover o acesso de ${member.full_name}? Esta ação não pode ser desfeita.`)) return
    await fetch('/api/organization/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id }),
    })
    setTeam(prev => prev.filter(m => m.id !== member.id))
  }

  const isColaborador = tab === 'colaborador'
  const accentColor   = isColaborador ? '#f59e0b' : '#38bdf8'
  const accentGlow    = isColaborador ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.15)'
  const accentBorder  = isColaborador ? 'rgba(245,158,11,0.25)' : 'rgba(56,189,248,0.25)'

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#060d1a] p-8 flex items-start justify-center">
        <div className="max-w-md w-full rounded-2xl p-8 mt-12 text-center"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <Shield className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Acesso restrito a gestores</h1>
          <p className="text-sm text-slate-400 mb-6">
            Apenas a conta gestora da empresa pode criar acessos para colaboradores e motoristas.
            Sua conta atual não tem essa permissão.
          </p>
          <a href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            Entrar como gestor
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060d1a] p-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 0 24px rgba(14,165,233,0.35)' }}>
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Acessos</h1>
            <p className="text-slate-400 text-sm mt-0.5">Crie e gerencie logins de colaboradores e motoristas</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 mt-1">
          <UserPlus className="w-4 h-4" />
          Criar acesso
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {([
          { key: 'colaborador' as Tab, label: 'Colaboradores', Icon: Users,  color: '#f59e0b', count: team.filter(m => m.role === 'operador').length },
          { key: 'motorista'   as Tab, label: 'Motoristas',    Icon: Truck,  color: '#38bdf8', count: team.filter(m => m.role === 'motorista').length },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={tab === t.key ? { background: 'rgba(255,255,255,0.1)' } : {}}>
            <t.Icon className="w-4 h-4" style={tab === t.key ? { color: t.color } : {}} />
            {t.label}
            <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
              style={tab === t.key
                ? { background: `${t.color}20`, color: t.color }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Portal link card */}
      <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 mb-6"
        style={{ background: accentGlow, border: `1px solid ${accentBorder}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: accentColor }}>
              Link de login — {isColaborador ? 'Colaboradores' : 'Motoristas'}
            </p>
            <p className="text-sm text-slate-300 font-mono truncate">{PORTAL[tab].path}</p>
          </div>
        </div>
        <button onClick={() => copyText(portalUrl, 'portal')}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: accentColor }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}15` }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {copied === 'portal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === 'portal' ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Member list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl py-16 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {isColaborador
            ? <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            : <Truck className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
          }
          <p className="text-slate-500 text-sm mb-4">
            Nenhum {isColaborador ? 'colaborador' : 'motorista'} com acesso ainda.
          </p>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <UserPlus className="w-3.5 h-3.5" />
            Criar primeiro acesso
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(member => (
            <div key={member.id} className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: accentGlow, color: accentColor, border: `1px solid ${accentBorder}` }}>
                {getInitials(member.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{member.full_name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {member.created_at ? formatDate(member.created_at) : '—'}
                  </span>
                  {member.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />{member.phone}
                    </span>
                  )}
                  {member.vehicle_plate && (
                    <span className="flex items-center gap-1 font-mono" style={{ color: accentColor, opacity: 0.75 }}>
                      <Truck className="w-3 h-3" />{member.vehicle_plate}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(member)} title="Editar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleRemove(member)} title="Remover acesso"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal base ── */}
      {(showCreate || !!editMember || !!credentials) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>

          {/* Create */}
          {showCreate && (
            <div className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0b1424', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-white">Criar — {isColaborador ? 'Colaborador' : 'Motorista'}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{PORTAL[tab].path}</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <DarkInput label="Nome completo" placeholder="Ex: João Silva" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
                <DarkInput label="E-mail" type="email" placeholder="joao@empresa.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Senha temporária</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required minLength={6}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white placeholder:text-slate-600 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <DarkInput label="Telefone (opcional)" placeholder="(11) 99999-9999" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                {!isColaborador && (
                  <PlateInput
                    value={form.vehicle_plate}
                    onChange={v => setForm(f => ({ ...f, vehicle_plate: v }))}
                  />
                )}
                {createError && (
                  <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-xl">{createError}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button type="submit" loading={saving} className="flex-1">Criar acesso</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                </div>
              </form>
            </div>
          )}

          {/* Edit */}
          {editMember && (
            <div className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0b1424', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-white">Editar {editMember.full_name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{editMember.role === 'operador' ? 'Colaborador' : 'Motorista'}</p>
                </div>
                <button onClick={() => setEditMember(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <DarkInput label="Nome completo" value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} required />
                <DarkInput label="Telefone" placeholder="(11) 99999-9999" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                {editMember.role === 'motorista' && (
                  <PlateInput
                    value={editForm.vehicle_plate}
                    onChange={v => setEditForm(f => ({ ...f, vehicle_plate: v }))}
                  />
                )}
                {editError && (
                  <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-xl">{editError}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button type="submit" loading={editSaving} className="flex-1">Salvar</Button>
                  <Button type="button" variant="outline" onClick={() => setEditMember(null)}>Cancelar</Button>
                </div>
              </form>
            </div>
          )}

          {/* Credentials */}
          {credentials && (
            <div className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0b1424', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="font-bold text-white">Acesso criado!</h2>
                </div>
                <button onClick={() => setCredentials(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-5 ml-10">
                Envie para <strong className="text-white">{credentials.name}</strong>
              </p>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Portal de acesso', value: credentials.loginUrl, key: 'url'   },
                  { label: 'E-mail',           value: credentials.email,    key: 'email' },
                  { label: 'Senha',            value: credentials.password, key: 'pass', mono: true },
                ].map(row => (
                  <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{row.label}</p>
                      <p className={`text-sm text-slate-200 truncate ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                    </div>
                    <button onClick={() => copyText(row.value, row.key)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
                      {copied === row.key ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => copyText(
                  `Olá ${credentials.name}! Seu acesso ao LogiPilot AI:\n\nPortal: ${credentials.loginUrl}\nE-mail: ${credentials.email}\nSenha: ${credentials.password}\n\nRecomendamos trocar a senha no primeiro acesso.`,
                  'all'
                )}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-slate-400 hover:text-sky-400 transition-all mb-3"
                style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                {copied === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied === 'all' ? 'Copiado!' : 'Copiar tudo para enviar via WhatsApp'}
              </button>
              <Button className="w-full" onClick={() => setCredentials(null)}>Feito</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
