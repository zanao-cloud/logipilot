'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  KeyRound, UserPlus, Copy, Check, Eye, EyeOff,
  Truck, Users, ExternalLink, X, Calendar, Phone,
  Shield, Trash2, Pencil, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  colaborador: { path: '/operador/login', label: 'Portal do Colaborador', color: 'amber' },
  motorista:   { path: '/motorista/login', label: 'Portal do Motorista',   color: 'emerald' },
}

const emptyForm = { full_name: '', email: '', password: '', phone: '', vehicle_plate: '' }

export default function AcessosPage() {
  const [tab, setTab]             = useState<Tab>('colaborador')
  const [team, setTeam]           = useState<Member[]>([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [showPass, setShowPass]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [createError, setCreateError] = useState('')
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied]       = useState<string | null>(null)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editForm, setEditForm]   = useState({ full_name: '', phone: '', vehicle_plate: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [search, setSearch] = useState('')

  const fetchTeam = useCallback(async () => {
    const res  = await fetch('/api/organization/team')
    const data = await res.json()
    setTeam(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${PORTAL[tab].path}`
    : PORTAL[tab].path

  const visible = team.filter(m => {
    const matchTab = tab === 'colaborador' ? m.role === 'operador' : m.role === 'motorista'
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function openCreate() {
    setForm(emptyForm)
    setCreateError('')
    setShowPass(false)
    setShowCreate(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setSaving(true)

    const role = tab === 'colaborador' ? 'operador' : 'motorista'
    const res  = await fetch('/api/organization/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    })
    const data = await res.json()

    if (!res.ok) { setCreateError(data.error); setSaving(false); return }

    setCredentials({
      name: form.full_name,
      email: form.email,
      password: form.password,
      role,
      loginUrl: portalUrl,
    })
    setShowCreate(false)
    setSaving(false)
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
    setEditMember(null)
    setEditSaving(false)
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
  const accentColor   = isColaborador ? 'amber' : 'emerald'

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-slate-500" />
            <h1 className="text-2xl font-bold text-slate-900">Acessos</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Crie e gerencie os logins de colaboradores e motoristas
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Criar acesso
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: 'colaborador' as Tab, label: 'Colaboradores', icon: Users  },
          { key: 'motorista'   as Tab, label: 'Motoristas',    icon: Truck  },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
              tab === t.key ? 'bg-slate-100 text-slate-600' : 'bg-white text-slate-400'
            }`}>
              {team.filter(m => m.role === (t.key === 'colaborador' ? 'operador' : 'motorista')).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none"
        />
      </div>

      {/* Portal URL card */}
      <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 mb-6 ${
        isColaborador
          ? 'bg-amber-50 border-amber-100'
          : 'bg-emerald-50 border-emerald-100'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <ExternalLink className={`w-4 h-4 flex-shrink-0 ${isColaborador ? 'text-amber-500' : 'text-emerald-500'}`} />
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${isColaborador ? 'text-amber-600' : 'text-emerald-600'}`}>
              Link de login — {isColaborador ? 'Colaboradores' : 'Motoristas'}
            </p>
            <p className="text-sm text-slate-700 font-mono truncate">{PORTAL[tab].path}</p>
          </div>
        </div>
        <button
          onClick={() => copyText(portalUrl, 'portal')}
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isColaborador
              ? 'text-amber-700 hover:bg-amber-100'
              : 'text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {copied === 'portal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === 'portal' ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Member list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-100" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            {isColaborador
              ? <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              : <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            }
            <p className="text-slate-400 text-sm mb-3">
              Nenhum {isColaborador ? 'colaborador' : 'motorista'} com acesso ainda.
            </p>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <UserPlus className="w-3.5 h-3.5" />
              Criar primeiro acesso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map(member => (
            <Card key={member.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isColaborador
                    ? 'bg-amber-50 border-amber-100 text-amber-600'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                  {isColaborador ? <Users className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{member.full_name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Desde {member.created_at ? formatDate(member.created_at) : '—'}
                    </span>
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />{member.phone}
                      </span>
                    )}
                    {member.vehicle_plate && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />{member.vehicle_plate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(member)}
                    title="Editar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(member)}
                    title="Remover acesso"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create access modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Criar acesso — {isColaborador ? 'Colaborador' : 'Motorista'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  O acesso funcionará em <span className="font-mono">{PORTAL[tab].path}</span>
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nome completo"
                placeholder="Ex: João Silva"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="joao@empresa.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Senha temporária</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Input
                label="Telefone (opcional)"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              {!isColaborador && (
                <Input
                  label="Placa do veículo (opcional)"
                  placeholder="ABC-1234"
                  value={form.vehicle_plate}
                  onChange={e => setForm(f => ({ ...f, vehicle_plate: e.target.value }))}
                />
              )}
              {createError && (
                <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">
                  {createError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={saving} className="flex-1">Criar acesso</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">Editar {editMember.full_name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editMember.role === 'operador' ? 'Colaborador' : 'Motorista'}</p>
              </div>
              <button onClick={() => setEditMember(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                label="Nome completo"
                value={editForm.full_name}
                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
              <Input
                label="Telefone"
                placeholder="(11) 99999-9999"
                value={editForm.phone}
                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
              />
              {editMember.role === 'motorista' && (
                <Input
                  label="Placa do veículo"
                  placeholder="ABC-1234"
                  value={editForm.vehicle_plate}
                  onChange={e => setEditForm(f => ({ ...f, vehicle_plate: e.target.value }))}
                />
              )}
              {editError && (
                <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">{editError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={editSaving} className="flex-1">Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setEditMember(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Credentials card ── */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-slate-900">Acesso criado!</h2>
              <button onClick={() => setCredentials(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Envie estas informações para <strong>{credentials.name}</strong> acessar o portal.
            </p>

            <div className="space-y-2.5 mb-4">
              {[
                { label: 'Portal de acesso', value: credentials.loginUrl, key: 'url' },
                { label: 'E-mail',           value: credentials.email,    key: 'email' },
                { label: 'Senha',            value: credentials.password, key: 'pass', mono: true },
              ].map(row => (
                <div key={row.key} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{row.label}</p>
                    <p className={`text-sm text-slate-700 truncate ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                  </div>
                  <button
                    onClick={() => copyText(row.value, row.key)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors"
                  >
                    {copied === row.key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => copyText(
                `Olá ${credentials.name}! Seu acesso ao LogiPilot AI:\n\nPortal: ${credentials.loginUrl}\nE-mail: ${credentials.email}\nSenha: ${credentials.password}\n\nRecomendamos trocar a senha no primeiro acesso.`,
                'all'
              )}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all mb-3"
            >
              {copied === 'all' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied === 'all' ? 'Copiado!' : 'Copiar tudo para enviar via WhatsApp'}
            </button>

            <Button className="w-full" onClick={() => setCredentials(null)}>Feito</Button>
          </div>
        </div>
      )}
    </div>
  )
}
