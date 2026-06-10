'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

export type AnalysisMeta = {
  id: string
  title: string
  tags?: string[]
  project_id?: string | null
  driver_id?: string | null
  period_start?: string | null
  period_end?: string | null
}

type Option = { id: string; label: string }

export function RenameDialog({
  open,
  onOpenChange,
  analysis,
  projects = [],
  drivers = [],
  onUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: AnalysisMeta
  projects?: Option[]
  drivers?: Option[]
  onUpdated?: (next: AnalysisMeta) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState(analysis.title)
  const [tags, setTags] = useState<string[]>(analysis.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [projectId, setProjectId] = useState(analysis.project_id ?? '')
  const [driverId, setDriverId] = useState(analysis.driver_id ?? '')
  const [periodStart, setPeriodStart] = useState(analysis.period_start ?? '')
  const [periodEnd, setPeriodEnd] = useState(analysis.period_end ?? '')
  const [saving, setSaving] = useState(false)

  function addTag(raw: string) {
    const t = raw.trim()
    if (!t) return
    if (tags.includes(t) || tags.length >= 20) return
    setTags([...tags, t])
    setTagInput('')
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/analyses/${analysis.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          tags,
          project_id: projectId || null,
          driver_id: driverId || null,
          period_start: periodStart || null,
          period_end: periodEnd || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao atualizar')
      }
      const updated = await res.json()
      toast({ variant: 'success', title: 'Análise atualizada' })
      onUpdated?.({
        id: updated.id,
        title: updated.title,
        tags: updated.tags ?? [],
        project_id: updated.project_id,
        driver_id: updated.driver_id,
        period_start: updated.period_start,
        period_end: updated.period_end,
      })
      onOpenChange(false)
    } catch (err) {
      toast({ variant: 'error', title: 'Falha ao atualizar', description: err instanceof Error ? err.message : 'Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">Editar análise</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                Renomeie, marque com tags e vincule a projeto, motorista e período.
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 p-1" aria-label="Fechar">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full">
                    <TagIcon className="w-3 h-3" aria-hidden="true" />
                    {t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Remover tag ${t}`} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                onBlur={() => addTag(tagInput)}
                placeholder="Digite e pressione Enter…"
              />
            </div>

            {projects.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Projeto/Cliente</label>
                <select
                  value={projectId ?? ''}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none"
                >
                  <option value="">— Nenhum —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}

            {drivers.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Motorista</label>
                <select
                  value={driverId ?? ''}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none"
                >
                  <option value="">— Nenhum —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Período início"
                type="date"
                value={periodStart ?? ''}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
              <Input
                label="Período fim"
                type="date"
                value={periodEnd ?? ''}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <Button variant="outline">Cancelar</Button>
            </Dialog.Close>
            <Button onClick={handleSave} loading={saving}>Salvar</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
