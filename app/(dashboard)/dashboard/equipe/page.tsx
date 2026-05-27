'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Trash2, Truck, UserCog, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

const ROLE_CONFIG = {
  gestor: { label: 'Gestor', variant: 'info' as const, icon: UserCog },
  operador: { label: 'Operador', variant: 'warning' as const, icon: Users },
  motorista: { label: 'Motorista', variant: 'default' as const, icon: Truck },
}

export default function EquipePage() {
  const [team, setTeam] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'operador', phone: '', vehicle_plate: '' })

  useEffect(() => { fetchTeam() }, [])

  async function fetchTeam() {
    const res = await fetch('/api/organization/team')
    const data = await res.json()
    setTeam(data || [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAdding(true)

    const res = await fetch('/api/organization/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setAdding(false); return }

    await fetchTeam()
    setShowForm(false)
    setForm({ full_name: '', email: '', password: '', role: 'operador', phone: '', vehicle_plate: '' })
    setAdding(false)
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remover este membro da equipe?')) return
    await fetch('/api/organization/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setTeam(prev => prev.filter(m => m.id !== memberId))
  }

  const operadores = team.filter(m => m.role === 'operador')
  const motoristas = team.filter(m => m.role === 'motorista')
  const gestores = team.filter(m => m.role === 'gestor')

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
          <p className="text-slate-500 text-sm mt-1">{team.length} membro{team.length !== 1 ? 's' : ''} cadastrado{team.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Adicionar membro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Gestores', count: gestores.length, icon: UserCog, color: 'text-blue-600 bg-blue-50' },
          { label: 'Operadores', count: operadores.length, icon: Users, color: 'text-amber-600 bg-amber-50' },
          { label: 'Motoristas', count: motoristas.length, icon: Truck, color: 'text-slate-600 bg-slate-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
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

      {/* Team list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
      ) : team.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum membro ainda. Adicione operadores e motoristas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {team.map(member => {
            const cfg = ROLE_CONFIG[member.role]
            return (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    member.role === 'motorista' ? 'bg-slate-100' :
                    member.role === 'operador' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}>
                    <cfg.icon className={`w-5 h-5 ${
                      member.role === 'motorista' ? 'text-slate-500' :
                      member.role === 'operador' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{member.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{formatDate(member.created_at)}</span>
                      {member.phone && <span>📱 {member.phone}</span>}
                      {member.vehicle_plate && <span>🚛 {member.vehicle_plate}</span>}
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  {member.role !== 'gestor' && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add member modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Adicionar membro</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Perfil</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['operador', 'motorista'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        form.role === r ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]' : 'border-slate-100 text-slate-600'
                      }`}
                    >
                      {r === 'operador' ? <Users className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      {r === 'operador' ? 'Operador' : 'Motorista'}
                    </button>
                  ))}
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

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={adding} className="flex-1">Adicionar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
