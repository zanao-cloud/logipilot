'use client'

import { useEffect, useState } from 'react'
import { Plus, Briefcase, Building2, Trash2, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((d) => { setProjects(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, client_name: clientName || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      setProjects([data, ...projects])
      setName(''); setClientName('')
      toast({ variant: 'success', title: 'Projeto criado' })
    } catch (err) {
      toast({ variant: 'error', title: 'Não foi possível criar', description: err instanceof Error ? err.message : '' })
    } finally {
      setCreating(false)
    }
  }

  async function deleteProject(p: Project) {
    if (!confirm(`Excluir projeto "${p.name}"? Análises ligadas perderão o vínculo.`)) return
    const res = await fetch(`/api/projects/${p.id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(projects.filter(x => x.id !== p.id))
      toast({ variant: 'success', title: 'Projeto excluído' })
    } else {
      toast({ variant: 'error', title: 'Erro ao excluir' })
    }
  }

  async function saveEdit() {
    if (!editing) return
    const res = await fetch(`/api/projects/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editing.name, client_name: editing.client_name }),
    })
    if (res.ok) {
      const data = await res.json()
      setProjects(projects.map(p => p.id === data.id ? data : p))
      setEditing(null)
      toast({ variant: 'success', title: 'Projeto atualizado' })
    } else {
      toast({ variant: 'error', title: 'Erro ao atualizar' })
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-1">
        <Briefcase className="w-5 h-5 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">Projetos & Clientes</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Organize análises por cliente ou projeto. Apenas gestores podem criar/editar.
      </p>

      <Card className="mb-6">
        <CardContent className="py-5">
          <form onSubmit={createProject} className="grid sm:grid-cols-3 gap-3 items-end">
            <Input label="Nome do projeto" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Operação Sudeste" required />
            <Input label="Cliente (opcional)" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Cliente XYZ" />
            <Button type="submit" loading={creating} className="gap-2">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum projeto ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {editing?.id === p.id ? (
                    <div className="flex gap-2">
                      <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <Input value={editing.client_name ?? ''} onChange={(e) => setEditing({ ...editing, client_name: e.target.value })} />
                      <Button size="sm" onClick={saveEdit}>Salvar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-slate-800 truncate">{p.name}</p>
                      {p.client_name && <p className="text-xs text-slate-500 mt-0.5">Cliente: {p.client_name}</p>}
                    </>
                  )}
                </div>
                {editing?.id !== p.id && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(p)} aria-label="Editar" className="p-2 text-slate-500 hover:text-slate-800 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProject(p)} aria-label="Excluir" className="p-2 text-red-500 hover:text-red-700 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
