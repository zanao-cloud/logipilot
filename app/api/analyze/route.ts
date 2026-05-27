import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeData } from '@/lib/ai/analyze'
import * as XLSX from 'xlsx'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const title = formData.get('title') as string
  const context = formData.get('context') as string
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  const { data: analysis, error: insertError } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      title: title || 'Análise sem título',
      status: 'processing',
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Erro ao criar análise' }, { status: 500 })
  }

  try {
    const parsedFiles = await Promise.all(files.map(parseFileForAI))

    const result = await analyzeData(parsedFiles, context)

    await supabase
      .from('analyses')
      .update({ status: 'completed', result, updated_at: new Date().toISOString() })
      .eq('id', analysis.id)

    return NextResponse.json({ id: analysis.id, status: 'completed' })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Erro desconhecido'
    const message = friendlyError(raw)
    await supabase
      .from('analyses')
      .update({ status: 'error', error_message: message, updated_at: new Date().toISOString() })
      .eq('id', analysis.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('quota') || m.includes('429') || m.includes('resource_exhausted')) {
    return 'Limite da API de IA atingido. Aguarde alguns segundos e tente novamente.'
  }
  if (m.includes('api key') || m.includes('invalid key') || m.includes('permission')) {
    return 'Chave de API inválida ou sem permissão. Verifique a configuração.'
  }
  if (m.includes('timeout') || m.includes('deadline')) {
    return 'Tempo limite excedido. Tente com arquivos menores ou menos arquivos.'
  }
  if (m.includes('json') || m.includes('parse')) {
    return 'A IA não conseguiu processar os dados. Tente novamente.'
  }
  return msg.length > 200 ? 'Erro ao processar análise. Tente novamente.' : msg
}

async function parseFileForAI(file: File) {
  const name = file.name
  const type = file.type
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (type.startsWith('image/')) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { name, type, content: `[Imagem: ${name}]`, isImage: true, imageBase64: base64, imageMediaType: type }
  }

  if (ext === 'pdf' || type === 'application/pdf') {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { name, type: 'application/pdf', content: `[PDF: ${name}]`, isImage: true, imageBase64: base64, imageMediaType: 'application/pdf' }
  }

  if (ext === 'xlsx' || ext === 'xls' || type.includes('spreadsheet')) {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const parts: string[] = []
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false })
      const rows = csv.split('\n').filter(Boolean)
      parts.push(`=== Planilha: ${sheetName} (${rows.length - 1} linhas) ===\n${rows.slice(0, 200).join('\n')}`)
    }
    return { name, type, content: parts.join('\n\n') }
  }

  if (ext === 'csv' || type === 'text/csv') {
    const text = await file.text()
    const rows = text.split('\n').filter(Boolean)
    const preview = rows.slice(0, 200).join('\n')
    return { name, type, content: `CSV com ${rows.length - 1} linhas:\n\n${preview}` }
  }

  const text = await file.text().catch(() => `[Arquivo binário: ${name}]`)
  return { name, type, content: text.slice(0, 50000) }
}
