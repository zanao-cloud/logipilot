'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Trash2, Truck, UserCog, X, Search,
  Pencil, Copy, Check, ExternalLink, Phone, Calendar, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Member {
  id: string
  full_name: string
  role: 'gestor' | 'operador' | 'motorista'
  phone?: string
  vehicle_plate?: string
  created_at: string
}

type RoleFilter = 'todos' | 'gestor' | 'operador' | 'motorista'

const ROLE_CFG = {
  gestor:    { label: 'Gestor',    variant: 'info' as const,    icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  operador:  { label: 'Operador',  variant: 'warning' as const, icon: Users,  color: 'text-amber-600 bg-amber-50 border-amber-100' },
  motorista: { label: 'Motorista', variant: 'default' as const, icon: Truck,  color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
}

interface Credentials { name: string; email: string; password: string; role: string; loginUrl: string }

export default function EquipePage() {
  const [team, setTeam] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'operador', phone: '', vehicle_plate: '' })

  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', vehicle_plate: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos')

  const fetchTeam = useCallback(async () => {
    const res = await fetch('/api/organization/team')
    const data = await res.json()
    setTeam(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    const res = await fetch('/api/organization/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error); setAdding(false); return }

    const loginUrl = form.role === 'motorista'
      ? `${window.location.origin}/motorista/login`
      : `${window.location.origin}/operador/login`

    setCredentials({ name: form.full_name, email: form.email, password: form.password, role: form.role, loginUrl })
    setShowAdd(false)
    setForm({ full_name: '', email: '', password: '', role: 'operador', phone: '', vehicle_plate: '' })
    setAdding(false)
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
    setSaving(true)
    const res = await fetch('/api/organization/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: editMember.id, ...editForm }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error); setSaving(false); return }
    setTeam(prev => prev.map(m => m.id === editMember.id
      ? { ...m, full_name: editForm.full_name || m.full_name, phone: editForm.phone || undefined, vehicle_plate: editForm.vehicle_plate || undefined }
      : m
    ))
    setEditMember(null)
    setSaving(false)
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remover ${name} da equipe? Esta ação não pode ser desfeita.`)) return
    await fetch('/api/organization/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setTeam(prev => prev.filter(m => m.id !== memberId))
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = team.filter(m => {
    const matchRole = roleFilter === 'todos' || m.role === roleFilter
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const counts = {
    gestor:   team.filter(m => m.role === 'gestor').length,
    operador: team.filter(m => m.role === 'operador').length,
    motorista:team.filter(m => m.role === 'motorista').length,
  }

  const tabs: { key: RoleFilter; label: string; count: number }[] = [
    { key: 'todos',    label: 'Todos',      count: team.length },
    { key: 'gestor',   label: 'Gestores',   count: counts.gestor },
    { key: 'operador', label: 'Operadores', count: counts.operador },
    { key: 'motorista',label: 'Motoristas', count: counts.motorista },
  ]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
          <p className="text-slate-500 text-sm mt-0.5">{team.length} membro{team.length !== 1 ? 's' : ''} na organização</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: 'Gestores',   count: counts.gestor,   icon: Shield, color: 'text-blue-600 bg-blue-50' },
          { label: 'Operadores', count: counts.operador, icon: Users,  color: 'text-amber-600 bg-amber-50' },
          { label: 'Motoristas', count: counts.motorista,icon: Truck,  color: 'text-emerald-600 bg-emerald-50' },
        ]).map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setRoleFilter(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === t.key
                  ? 'bg-[#1E3A5F] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                roleFilter === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {search || roleFilter !== 'todos' ? 'Nenhum membro encontrado com este filtro.' : 'Nenhum membro ainda. Adicione operadores e motoristas.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => {
            const cfg = ROLE_CFG[member.role]
            return (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <cfg.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{member.full_name}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(member.created_at)}</span>
                      {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>}
                      {member.vehicle_plate && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{member.vehicle_plate}</span>}
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => openEdit(member)}
                      title="Editar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {member.role !== 'gestor' && (
                      <button
                        onClick={() => handleRemove(member.id, member.full_name)}
                        title="Remover"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Add member modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Adicionar colaborador</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Perfil</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['operador', 'motorista'] as const).map(r => {
                    const Icon = ROLE_CFG[r].icon
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.role === r ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]' : 'border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {ROLE_CFG[r].label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Input label="Nome completo" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
              <Input label="E-mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input label="Senha temporária" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              {form.role === 'motorista' && (
                <>
                  <Input label="Telefone (opcional)" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input label="Placa do veículo (opcional)" placeholder="ABC-1234" value={form.vehicle_plate} onChange={e => setForm(f => ({ ...f, vehicle_plate: e.target.value }))} />
                </>
              )}
              {form.role === 'operador' && (
                <Input label="Telefone (opcional)" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              )}
              {addError && <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">{addError}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={adding} className="flex-1">Adicionar</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit member modal ── */}
      {editMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">Editar colaborador</h2>
                <p className="text-xs text-slate-400 mt-0.5">{ROLE_CFG[editMember.role].label}</p>
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
              {editError && <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={saving} className="flex-1">Salvar alterações</Button>
                <Button type="button" variant="outline" onClick={() => setEditMember(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Credentials card modal ── */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Membro adicionado!</h2>
              <button onClick={() => setCredentials(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Copie e envie estas informações de acesso para <strong>{credentials.name}</strong>.
            </p>

            <div className="space-y-2.5">
              {[
                { label: 'Link de acesso', value: credentials.loginUrl, key: 'url', mono: false },
                { label: 'E-mail',         value: credentials.email,    key: 'email', mono: false },
                { label: 'Senha',          value: credentials.password, key: 'pass', mono: true },
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
                `Olá ${credentials.name}! Seu acesso ao LogiPilot AI:\n\nLink: ${credentials.loginUrl}\nE-mail: ${credentials.email}\nSenha: ${credentials.password}\n\nRecomendamos trocar a senha no primeiro acesso.`,
                'all'
              )}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all"
            >
              {copied === 'all' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied === 'all' ? 'Copiado!' : 'Copiar tudo para enviar'}
            </button>

            <Button className="w-full mt-3" onClick={() => setCredentials(null)}>Feito</Button>
          </div>
        </div>
      )}
    </div>
  )
}
