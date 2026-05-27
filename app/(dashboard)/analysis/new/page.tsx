'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, AlertCircle, Zap, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatFileSize, getFileIcon } from '@/lib/utils'
import { AnalysisProcessingLoader } from '@/components/ui/loading'

const ACCEPTED = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
}

type ProcessingStage = 'upload' | 'parse' | 'analyze' | 'save'

export default function NewAnalysisPage() {
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [processing, setProcessing] = useState(false)
  const [stage, setStage] = useState<ProcessingStage>('upload')
  const [error, setError] = useState('')
  const router = useRouter()

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...accepted.filter(f => !names.has(f.name))]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 20 * 1024 * 1024,
  })

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) { setError('Adicione pelo menos um arquivo para análise.'); return }

    setError('')
    setProcessing(true)
    setStage('upload')

    const formData = new FormData()
    formData.append('title', title || `Análise ${new Date().toLocaleDateString('pt-BR')}`)
    formData.append('context', context)
    files.forEach(f => formData.append('files', f))

    setTimeout(() => setStage('parse'), 1000)
    setTimeout(() => setStage('analyze'), 3000)

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      setStage('save')

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao processar análise')
      }

      const { id } = await res.json()
      router.push(`/analysis/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar análise')
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div className="p-8">
        <Card className="max-w-lg mx-auto">
          <CardContent>
            <AnalysisProcessingLoader stage={stage} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nova Análise</h1>
        <p className="text-slate-500 text-sm mt-1">
          Envie seus dados em qualquer formato e a IA gerará um diagnóstico operacional completo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Identificação</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Título da análise (opcional)"
              placeholder="Ex: Análise Operacional Maio 2025 — Logística"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Contexto adicional (opcional)
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none resize-none h-24"
                placeholder="Descreva o contexto dos dados, período, departamento ou qualquer informação relevante para a análise..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Arquivos</h2>
              <span className="text-xs text-slate-400">{files.length} arquivo{files.length !== 1 ? 's' : ''} selecionado{files.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-[#1E3A5F] bg-[#1E3A5F]/5'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDragActive ? 'bg-[#1E3A5F]/10' : 'bg-slate-100'}`}>
                  <Upload className={`w-6 h-6 ${isDragActive ? 'text-[#1E3A5F]' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-slate-700">
                    {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Excel, CSV, PDF, PowerPoint, imagens, prints, texto · Máx. 20 MB por arquivo
                  </p>
                </div>
              </div>
            </div>

            {/* Format tags */}
            <div className="flex flex-wrap gap-2">
              {['📊 Excel/XLSX', '📋 CSV', '📄 PDF', '📑 PPTX', '🖼️ Imagens', '📸 Prints', '📝 Texto', '📈 Power BI exportado'].map(f => (
                <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.name} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                    <span className="text-lg flex-shrink-0">{getFileIcon(file.type, file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>A IA analisa somente os dados enviados.</strong> Ela nunca inventa números
            e sempre separa fatos observados, hipóteses, recomendações e limitações da análise.
            Tempo estimado: 1-3 minutos dependendo do volume de dados.
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={files.length === 0}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Analisar com IA
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* Tip cards */}
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {[
          { icon: '📊', title: 'Dados estruturados', desc: 'Excel e CSV geram dashboards automáticos com gráficos e indicadores.' },
          { icon: '📸', title: 'Prints e imagens', desc: 'Screenshots de sistemas, fotos de quadros ou relatórios visuais são aceitos.' },
          { icon: '📄', title: 'Relatórios Power BI', desc: 'Exporte em PDF, imagem ou Excel do Power BI e envie aqui.' },
        ].map((tip) => (
          <div key={tip.title} className="bg-white border border-slate-100 rounded-xl p-4">
            <div className="text-2xl mb-2">{tip.icon}</div>
            <p className="text-sm font-medium text-slate-700 mb-1">{tip.title}</p>
            <p className="text-xs text-slate-500">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
