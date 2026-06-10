import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeData } from '@/lib/ai/analyze'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type * as XLSXType from 'xlsx'
import type { AnalysisResult, Chart } from '@/types'
import { dispatchAnalysisNotifications } from '@/lib/notifications/dispatch'

export const maxDuration = 60

const MAX_TOTAL_UPLOAD_BYTES = 24 * 1024 * 1024
const MAX_SHEETS = 8
const MAX_ROWS_PER_SHEET = 250
const MAX_TOTAL_CONTENT_CHARS = 120000
const MAX_CELL_CHARS = 250
const MAX_TEXT_CONTENT_CHARS = 60000

interface ParsedAIFile {
  name: string
  type: string
  content: string
  isImage?: boolean
  imageBase64?: string
  imageMediaType?: string
}

export async function POST(request: NextRequest) {
  // Top-level try-catch ensures every error returns JSON, never drops the connection.
  let admin: ReturnType<typeof createAnalysisAdminClient> | null = null
  let analysisId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    admin = createAnalysisAdminClient()

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Falha ao ler o arquivo enviado. Verifique o tamanho e o formato e tente novamente.' },
        { status: 400 },
      )
    }

    const title = formData.get('title') as string
    const context = formData.get('context') as string
    const analysisMode = formData.get('analysisMode') === 'local' ? 'local' : 'ai'
    const files = formData.getAll('files') as File[]
    const projectId = (formData.get('project_id') as string) || null
    const driverId = (formData.get('driver_id') as string) || null
    const periodStart = (formData.get('period_start') as string) || null
    const periodEnd = (formData.get('period_end') as string) || null
    const tagsRaw = (formData.get('tags') as string) || ''
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean).slice(0, 20)

    if (!files.length) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      return NextResponse.json({
        error: 'Arquivos muito grandes para uma única análise. Envie menos arquivos ou reduza a planilha.',
      }, { status: 413 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const { data: analysis, error: insertError } = await admin
      .from('analyses')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id ?? null,
        title: title || 'Análise sem título',
        status: 'processing',
        files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        tags,
        project_id: projectId,
        driver_id: driverId,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[analyze] insert failed', insertError.message)
      return NextResponse.json({ error: friendlyDatabaseError(insertError.message) }, { status: 500 })
    }

    analysisId = analysis.id
    const consentAI = formData.get('consentAI') === 'true'
    if (consentAI) {
      await admin.from('analyses')
        .update({ consent_ai_at: new Date().toISOString(), progress_pct: 10, progress_stage: 'upload' })
        .eq('id', analysis.id)
    } else {
      await admin.from('analyses')
        .update({ progress_pct: 10, progress_stage: 'upload' })
        .eq('id', analysis.id)
    }

    let parsedFiles: ParsedAIFile[] = []

    try {
    parsedFiles = await Promise.all(files.map(parseFileForAI))
    await admin.from('analyses')
      .update({ progress_pct: 35, progress_stage: 'parse' })
      .eq('id', analysis.id)

    if (analysisMode === 'local') {
      const result = createLocalAnalysis(parsedFiles, context)
      const { error: updateError } = await admin
        .from('analyses')
        .update({ status: 'completed', result, progress_pct: 100, progress_stage: 'save', updated_at: new Date().toISOString() })
        .eq('id', analysis.id)

      if (updateError) {
        throw new Error(`Erro ao salvar resultado da análise: ${updateError.message}`)
      }

      await dispatchAnalysisNotifications(admin, user.id, analysis.id, title || 'Análise sem título', result)
      return NextResponse.json({ id: analysis.id, status: 'completed', mode: 'local' })
    }

    await admin.from('analyses')
      .update({ progress_pct: 55, progress_stage: 'analyze' })
      .eq('id', analysis.id)

    const result = await analyzeData(parsedFiles, context)

    await admin.from('analyses')
      .update({ progress_pct: 90, progress_stage: 'save' })
      .eq('id', analysis.id)

    const { error: updateError } = await admin
      .from('analyses')
      .update({ status: 'completed', result, progress_pct: 100, progress_stage: 'save', updated_at: new Date().toISOString() })
      .eq('id', analysis.id)

    if (updateError) {
      throw new Error(`Erro ao salvar resultado da análise: ${updateError.message}`)
    }

    await dispatchAnalysisNotifications(admin, user.id, analysis.id, title || 'Análise sem título', result)

    return NextResponse.json({ id: analysis.id, status: 'completed' })
  } catch (err) {
    const raw = getErrorMessage(err)
    console.error('[analyze] failed', raw)

    if (parsedFiles.length > 0 && isNetworkAIError(raw)) {
      const fallbackResult = createLocalAnalysis(parsedFiles, context, true)
      const { error: fallbackUpdateError } = await admin
        .from('analyses')
        .update({ status: 'completed', result: fallbackResult, progress_pct: 100, progress_stage: 'save', updated_at: new Date().toISOString() })
        .eq('id', analysis.id)

      if (fallbackUpdateError) {
        console.error('[analyze] failed to save fallback result', fallbackUpdateError.message)
      } else {
        await dispatchAnalysisNotifications(admin, user.id, analysis.id, title || 'Análise sem título', fallbackResult)
        return NextResponse.json({
          id: analysis.id,
          status: 'completed',
          warning: 'A IA não respondeu, então uma análise básica foi gerada a partir da estrutura da planilha.',
        })
      }
    }

    const message = friendlyError(raw)
    const { error: errorUpdateError } = await admin
      .from('analyses')
      .update({ status: 'error', error_message: message, updated_at: new Date().toISOString() })
      .eq('id', analysis.id)

    if (errorUpdateError) {
      console.error('[analyze] failed to save error status', errorUpdateError.message)
    }

    return NextResponse.json({ error: message }, { status: 500 })
    }
  } catch (outerErr) {
    const msg = getErrorMessage(outerErr)
    console.error('[analyze] outer error', msg)

    if (admin && analysisId) {
      try {
        await admin
          .from('analyses')
          .update({ status: 'error', error_message: 'Erro inesperado ao processar a análise.', updated_at: new Date().toISOString() })
          .eq('id', analysisId)
      } catch { /* best-effort */ }
    }

    return NextResponse.json(
      { error: friendlyError(msg) || 'Erro inesperado ao processar a análise. Tente novamente.' },
      { status: 500 },
    )
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const cause = 'cause' in err && err.cause instanceof Error ? ` | cause: ${err.cause.message}` : ''
    return `${err.message}${cause}`
  }
  return 'Erro desconhecido'
}

function isNetworkAIError(msg: string): boolean {
  const m = msg.toLowerCase()
  return m.includes('fetch failed') || m.includes('network') || m.includes('econnreset') || m.includes('etimedout') || m.includes('enotfound')
}

function createAnalysisAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service role não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function friendlyDatabaseError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('organization_id')) {
    return 'Não consegui vincular a análise à organização do usuário. Verifique o cadastro do perfil.'
  }
  if (m.includes('row-level security') || m.includes('violates row-level security')) {
    return 'Permissão negada ao criar a análise. Verifique as políticas RLS do Supabase.'
  }
  if (m.includes('relation') && m.includes('does not exist')) {
    return 'Tabela de análises não encontrada. Execute as migrations do Supabase.'
  }
  return msg.length > 200 ? 'Erro ao criar análise no banco de dados.' : msg
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('quota') || m.includes('429') || m.includes('resource_exhausted') || m.includes('rate_limit')) {
    return 'Limite da API de IA atingido. Aguarde alguns segundos e tente novamente.'
  }
  if (m.includes('api key') || m.includes('invalid key') || m.includes('permission') || m.includes('401')) {
    return 'Chave de API inválida ou sem permissão. Verifique a configuração.'
  }
  if (m.includes('groq_api_key') || m.includes('groq_api_key não configurada')) {
    return 'Chave do Groq não configurada. Verifique as variáveis de ambiente.'
  }
  if (m.includes('não consegui ler a planilha') || m.includes('planilha vazia')) {
    return msg
  }
  if (m.includes('timeout') || m.includes('deadline')) {
    return 'Tempo limite excedido. Tente com arquivos menores ou menos arquivos.'
  }
  if (m.includes('fetch failed') || m.includes('network') || m.includes('enotfound') || m.includes('etimedout')) {
    return 'Não consegui conectar à API de IA. Verifique a conexão e a chave da API e tente novamente.'
  }
  if (m.includes('json') || m.includes('parse')) {
    return 'A IA não conseguiu processar os dados. Tente novamente.'
  }
  return msg.length > 200 ? 'Erro ao processar análise. Tente novamente.' : msg
}

async function parseFileForAI(file: File): Promise<ParsedAIFile> {
  const name = file.name
  const type = file.type
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (type.startsWith('image/')) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return {
      name,
      type,
      content: [
        `Arquivo de imagem: ${name}`,
        `Tipo: ${type || 'desconhecido'}`,
        `Tamanho: ${file.size} bytes`,
        'Leitura local: metadados do arquivo. Para interpretar conteúdo visual, use o modo Com IA.',
      ].join('\n'),
      isImage: true,
      imageBase64: base64,
      imageMediaType: type,
    }
  }

  if (ext === 'pdf' || type === 'application/pdf') {
    const buffer = await file.arrayBuffer()
    return { name, type: 'application/pdf', content: await parsePdf(buffer, name) }
  }

  if (ext === 'pptx' || type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    const buffer = await file.arrayBuffer()
    return { name, type, content: await parsePptx(buffer, name) }
  }

  if (ext === 'docx' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const buffer = await file.arrayBuffer()
    return { name, type, content: await parseDocx(buffer, name) }
  }

  if (ext === 'xlsx' || ext === 'xls' || type.includes('spreadsheet')) {
    const buffer = await file.arrayBuffer()
    return { name, type, content: await parseWorkbook(buffer, name) }
  }

  if (ext === 'csv' || type === 'text/csv') {
    const text = await file.text()
    return { name, type, content: await parseCsv(text, name) }
  }

  const text = await file.text().catch(() => `[Arquivo binário: ${name}]`)
  return { name, type, content: limitText(`Arquivo de texto: ${name}\n\n${text}`) }
}

async function parsePdf(buffer: ArrayBuffer, fileName: string): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })

  try {
    const result = await parser.getText() as { text?: string; total?: number }
    const text = (result.text || '').trim()
    return limitText([
      `Arquivo PDF: ${fileName}`,
      typeof result.total === 'number' ? `Páginas detectadas: ${result.total}` : '',
      text ? `Texto extraído:\n${text}` : 'Nenhum texto selecionável foi encontrado no PDF. Pode ser um PDF escaneado/imagem.',
    ].filter(Boolean).join('\n'))
  } catch {
    return `Arquivo PDF: ${fileName}\nNão foi possível extrair texto localmente. O arquivo pode estar protegido, corrompido ou ser composto por imagens.`
  } finally {
    await parser.destroy().catch(() => {})
  }
}

async function parseDocx(buffer: ArrayBuffer, fileName: string): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    const text = result.value.trim()
    const warnings = result.messages.map(message => message.message).filter(Boolean)
    return limitText([
      `Arquivo Word/DOCX: ${fileName}`,
      warnings.length ? `Avisos de leitura: ${warnings.join(' | ')}` : '',
      text ? `Texto extraído:\n${text}` : 'Nenhum texto foi encontrado no documento.',
    ].filter(Boolean).join('\n'))
  } catch {
    return `Arquivo Word/DOCX: ${fileName}\nNão foi possível extrair texto localmente.`
  }
}

async function parsePptx(buffer: ArrayBuffer, fileName: string): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)
    const slideFiles = Object.keys(zip.files)
      .filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path))
      .sort((a, b) => extractNumber(a) - extractNumber(b))
    const notesFiles = Object.keys(zip.files)
      .filter(path => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(path))
      .sort((a, b) => extractNumber(a) - extractNumber(b))
    const mediaCount = Object.keys(zip.files).filter(path => path.startsWith('ppt/media/') && !zip.files[path].dir).length

    const slides: string[] = []
    for (const path of slideFiles) {
      const xml = await zip.files[path].async('text')
      const text = extractOfficeXmlText(xml)
      slides.push(`Slide ${extractNumber(path)}:\n${text || '[Sem texto detectado]'}`)
    }

    const notes: string[] = []
    for (const path of notesFiles) {
      const xml = await zip.files[path].async('text')
      const text = extractOfficeXmlText(xml)
      if (text) notes.push(`Notas do slide ${extractNumber(path)}:\n${text}`)
    }

    return limitText([
      `Arquivo PowerPoint/PPTX: ${fileName}`,
      `Slides detectados: ${slideFiles.length}`,
      `Mídias/imagens incorporadas: ${mediaCount}`,
      slides.length ? `\nTexto dos slides:\n${slides.join('\n\n')}` : 'Nenhum slide com texto foi encontrado.',
      notes.length ? `\nNotas:\n${notes.join('\n\n')}` : '',
    ].filter(Boolean).join('\n'))
  } catch {
    return `Arquivo PowerPoint/PPTX: ${fileName}\nNão foi possível extrair texto localmente. Verifique se o arquivo é PPTX válido.`
  }
}

async function parseWorkbook(buffer: ArrayBuffer, fileName: string): Promise<string> {
  const XLSX = await import('xlsx')
  try {
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: 'array',
      cellFormula: false,
      cellHTML: false,
      cellDates: true,
      raw: false,
    })
    return workbookToAnalysisText(XLSX, workbook, fileName)
  } catch {
    throw new Error(`Não consegui ler a planilha "${fileName}". Verifique se o arquivo não está corrompido ou exporte novamente em XLSX/CSV.`)
  }
}

async function parseCsv(csv: string, fileName: string): Promise<string> {
  const XLSX = await import('xlsx')
  try {
    const workbook = XLSX.read(csv, { type: 'string', raw: false })
    return workbookToAnalysisText(XLSX, workbook, fileName)
  } catch {
    const rows = csv.split(/\r?\n/).filter(Boolean)
    if (!rows.length) throw new Error(`Planilha vazia: "${fileName}".`)
    return limitContent(`Arquivo CSV: ${fileName}\nLinhas detectadas: ${Math.max(0, rows.length - 1)}\n\n${rows.slice(0, MAX_ROWS_PER_SHEET).join('\n')}`)
  }
}

function workbookToAnalysisText(XLSX: typeof XLSXType, workbook: XLSXType.WorkBook, fileName: string): string {
  if (!workbook.SheetNames.length) {
    throw new Error(`Planilha vazia: "${fileName}".`)
  }

  const parts: string[] = [
    `Arquivo de planilha: ${fileName}`,
    `Abas detectadas: ${workbook.SheetNames.join(', ')}`,
  ]

  for (const sheetName of workbook.SheetNames.slice(0, MAX_SHEETS)) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const ref = sheet['!ref']
    if (!ref) {
      parts.push(`\n=== Aba: ${sheetName} ===\nAba vazia.`)
      continue
    }

    const range = XLSX.utils.decode_range(ref)
    const totalRows = range.e.r - range.s.r + 1
    const totalCols = range.e.c - range.s.c + 1
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
      blankrows: false,
    })

    if (rows.length > 0) {
      const columns = collectColumns(rows)
      const sample = rows.slice(0, MAX_ROWS_PER_SHEET)
      parts.push([
        `\n=== Aba: ${sheetName} ===`,
        `Dimensões: ${totalRows} linhas x ${totalCols} colunas`,
        `Colunas: ${columns.join(' | ')}`,
        `Amostra estruturada (${sample.length} de ${rows.length} linhas de dados):`,
        rowsToTsv(sample, columns),
        rows.length > sample.length ? `... ${rows.length - sample.length} linhas adicionais omitidas nesta aba.` : '',
      ].filter(Boolean).join('\n'))
      continue
    }

    const arrayRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    }).filter(row => (row as unknown[]).some(cell => String(cell).trim() !== ''))

    parts.push([
      `\n=== Aba: ${sheetName} ===`,
      `Dimensões: ${totalRows} linhas x ${totalCols} colunas`,
      `Amostra (${Math.min(arrayRows.length, MAX_ROWS_PER_SHEET)} de ${arrayRows.length} linhas):`,
      arrayRows.slice(0, MAX_ROWS_PER_SHEET).map(row => (row as unknown[]).map(formatCell).join('\t')).join('\n'),
      arrayRows.length > MAX_ROWS_PER_SHEET ? `... ${arrayRows.length - MAX_ROWS_PER_SHEET} linhas adicionais omitidas nesta aba.` : '',
    ].filter(Boolean).join('\n'))
  }

  if (workbook.SheetNames.length > MAX_SHEETS) {
    parts.push(`\n${workbook.SheetNames.length - MAX_SHEETS} abas adicionais omitidas para manter a análise estável.`)
  }

  return limitContent(parts.join('\n'))
}

function collectColumns(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>()
  for (const row of rows.slice(0, 50)) {
    Object.keys(row).forEach(column => columns.add(column))
  }
  return [...columns]
}

function rowsToTsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join('\t')
  const body = rows.map(row => columns.map(column => formatCell(row[column])).join('\t')).join('\n')
  return `${header}\n${body}`
}

function formatCell(value: unknown): string {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length > MAX_CELL_CHARS ? `${text.slice(0, MAX_CELL_CHARS)}...` : text
}

function limitContent(content: string): string {
  if (content.length <= MAX_TOTAL_CONTENT_CHARS) return content
  return `${content.slice(0, MAX_TOTAL_CONTENT_CHARS)}\n\n[Conteúdo truncado para manter a análise estável.]`
}

function limitText(content: string): string {
  if (content.length <= MAX_TEXT_CONTENT_CHARS) return content
  return `${content.slice(0, MAX_TEXT_CONTENT_CHARS)}\n\n[Texto truncado para manter o processamento estável.]`
}

function extractNumber(path: string): number {
  return Number(path.match(/(\d+)/)?.[1] || 0)
}

function extractOfficeXmlText(xml: string): string {
  const matches = [...xml.matchAll(/<(?:a|w):t(?:\s[^>]*)?>([\s\S]*?)<\/(?:a|w):t>/g)]
  return matches
    .map(match => decodeXmlEntities(match[1] || '').trim())
    .filter(Boolean)
    .join('\n')
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

function createLocalAnalysis(files: ParsedAIFile[], userContext?: string, aiUnavailable = false): AnalysisResult {
  const spreadsheetFiles = files.filter(isSpreadsheetLike)
  const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf')
  const presentationFiles = files.filter(f => f.name.toLowerCase().endsWith('.pptx') || f.type.includes('presentation'))
  const documentFiles = files.filter(f => f.name.toLowerCase().endsWith('.docx') || f.type.includes('wordprocessingml'))
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  const truncated = files.some(f => f.content.includes('[Conteúdo truncado') || f.content.includes('[Texto truncado'))
  const dataSources = files.map(f => f.name)

  // Parse actual spreadsheet structure for real indicators
  const allSheets = spreadsheetFiles.flatMap(f => parseSheetData(f))
  const totalRows = allSheets.reduce((s, sh) => s + sh.totalRows, 0)
  const totalSheets = allSheets.length
  const allColumns = allSheets.flatMap(sh => sh.columns)
  const allNumericCols = allSheets.flatMap(sh => sh.numericCols)
  const slideCount = presentationFiles.reduce((s, f) => s + estimateSlides(f.content), 0)
  const textLength = files.reduce((s, f) => s + f.content.length, 0)

  const supportedKinds = [
    spreadsheetFiles.length ? `${spreadsheetFiles.length} planilha(s)` : '',
    pdfFiles.length ? `${pdfFiles.length} PDF(s)` : '',
    presentationFiles.length ? `${presentationFiles.length} apresentação(ões)` : '',
    documentFiles.length ? `${documentFiles.length} documento(s)` : '',
    imageFiles.length ? `${imageFiles.length} imagem(ns)` : '',
  ].filter(Boolean).join(', ')

  // Build highlights from actual data
  const highlights: string[] = [
    `${files.length} arquivo${files.length === 1 ? '' : 's'} recebido${files.length === 1 ? '' : 's'} para análise.`,
    supportedKinds ? `Tipos identificados: ${supportedKinds}.` : 'Os arquivos foram recebidos, mas sem formato de extração local avançada.',
  ]
  if (allSheets.length > 0) {
    highlights.push(`${totalSheets} aba${totalSheets === 1 ? '' : 's'} lida${totalSheets === 1 ? '' : 's'} com ${totalRows > 0 ? `${totalRows} linha${totalRows === 1 ? '' : 's'} de dados` : 'estrutura detectada'}.`)
    if (allColumns.length > 0) {
      const uniqueCols = [...new Set(allColumns)].slice(0, 8)
      highlights.push(`Colunas encontradas: ${uniqueCols.join(', ')}${allColumns.length > 8 ? ` e mais ${allColumns.length - 8}` : ''}.`)
    }
    if (allNumericCols.length > 0) {
      highlights.push(`${allNumericCols.length} coluna${allNumericCols.length === 1 ? '' : 's'} numérica${allNumericCols.length === 1 ? '' : 's'} detectada${allNumericCols.length === 1 ? '' : 's'}: ${allNumericCols.slice(0, 4).map(c => c.name).join(', ')}.`)
    }
  }
  if (presentationFiles.length > 0) highlights.push(`${slideCount} slide${slideCount === 1 ? '' : 's'} com texto extraído.`)
  highlights.push(
    aiUnavailable
      ? 'Análise concluída em modo básico — a API de IA estava indisponível no momento do processamento.'
      : 'Análise concluída localmente, sem consumo de créditos de IA.',
  )

  // Build real numeric indicators from the data
  const numericIndicators = allNumericCols.slice(0, 3).map(col => ({
    name: col.name,
    value: Math.round(col.sum * 100) / 100,
    unit: '',
    trend: 'stable' as const,
    trend_value: `Mín: ${formatNumber(col.min)} | Máx: ${formatNumber(col.max)} | Média: ${formatNumber(col.avg)}`,
    category: 'Planilha',
    status: 'neutral' as const,
  }))

  const indicators = [
    ...numericIndicators,
    {
      name: spreadsheetFiles.length > 0 ? 'Linhas de dados' : 'Arquivos processados',
      value: spreadsheetFiles.length > 0 ? (totalRows || files.length) : files.length,
      unit: spreadsheetFiles.length > 0 ? 'linha(s)' : 'arquivo(s)',
      trend: 'stable' as const,
      trend_value: truncated ? 'Amostra parcial (conteúdo truncado)' : 'Leitura completa',
      category: 'Volume',
      status: (totalRows > 0 || files.length > 0) ? 'good' as const : 'warning' as const,
    },
    {
      name: 'Colunas mapeadas',
      value: [...new Set(allColumns)].length || files.length,
      unit: [...new Set(allColumns)].length > 0 ? 'coluna(s)' : 'arquivo(s)',
      trend: 'stable' as const,
      trend_value: [...new Set(allColumns)].length > 0
        ? `${allNumericCols.length} numérica${allNumericCols.length !== 1 ? 's' : ''}`
        : supportedKinds || 'Sem colunas detectadas',
      category: 'Estrutura',
      status: [...new Set(allColumns)].length > 0 ? 'good' as const : 'neutral' as const,
    },
  ]

  // Build charts: prefer real numeric data over just file type counts
  const charts: Chart[] = []
  if (allNumericCols.length >= 2) {
    charts.push({
      id: 'local-numeric-totals',
      title: `Totais por coluna numérica`,
      type: 'bar',
      data: allNumericCols.slice(0, 8).map(c => ({ label: c.name, value: Math.round(c.sum * 100) / 100 })),
      x_key: 'label',
      y_keys: ['value'],
      colors: ['#1E3A5F'],
    })
    charts.push({
      id: 'local-numeric-avg',
      title: 'Médias por coluna numérica',
      type: 'bar',
      data: allNumericCols.slice(0, 8).map(c => ({ label: c.name, value: Math.round(c.avg * 100) / 100 })),
      x_key: 'label',
      y_keys: ['value'],
      colors: ['#059669'],
    })
  } else {
    charts.push({
      id: 'local-files',
      title: 'Arquivos por tipo',
      type: 'bar',
      data: countByType(files),
      x_key: 'label',
      y_keys: ['value'],
      colors: ['#1E3A5F'],
    })
  }

  const uniqueCols = [...new Set(allColumns)]
  const diagnosisFacts = [
    `Fontes analisadas: ${dataSources.join(', ') || 'nenhuma'}.`,
    supportedKinds ? `Formatos lidos: ${supportedKinds}.` : 'Nenhum formato com extração avançada foi identificado.',
    allSheets.length > 0
      ? `${totalSheets} aba${totalSheets !== 1 ? 's' : ''} com ${totalRows > 0 ? `${totalRows} linha${totalRows !== 1 ? 's' : ''} de dados` : 'estrutura detectada'}.`
      : `${textLength.toLocaleString('pt-BR')} caracteres de conteúdo preparados para análise.`,
    uniqueCols.length > 0
      ? `Colunas identificadas: ${uniqueCols.slice(0, 10).join(', ')}${uniqueCols.length > 10 ? ` (+${uniqueCols.length - 10})` : ''}.`
      : '',
    allNumericCols.length > 0
      ? `Colunas numéricas: ${allNumericCols.map(c => `${c.name} (total: ${formatNumber(c.sum)}, média: ${formatNumber(c.avg)})`).slice(0, 5).join('; ')}.`
      : '',
  ].filter(Boolean)

  return {
    executive_summary: {
      title: aiUnavailable ? 'Análise básica dos arquivos enviados' : 'Análise estrutural dos dados',
      overview: aiUnavailable
        ? 'Os arquivos foram lidos com sucesso, mas a etapa de IA ficou indisponível por falha de conexão. Esta visão resume a estrutura dos dados identificada localmente.'
        : allSheets.length > 0
          ? `A planilha foi lida e estruturada localmente. Foram encontradas ${totalSheets} aba${totalSheets !== 1 ? 's' : ''} com ${totalRows > 0 ? `${totalRows} linha${totalRows !== 1 ? 's' : ''} de dados` : 'estrutura detectada'} e ${uniqueCols.length} coluna${uniqueCols.length !== 1 ? 's' : ''}${allNumericCols.length > 0 ? `, incluindo ${allNumericCols.length} numérica${allNumericCols.length !== 1 ? 's' : ''}` : ''}. Para diagnóstico estratégico e recomendações, use a análise com IA.`
          : 'Os arquivos foram lidos e estruturados localmente. Esta visão cobre volume, tipos de arquivo e estrutura tabular — para interpretação semântica avançada, ative a análise com IA.',
      key_highlights: highlights,
      data_sources: dataSources,
    },
    indicators,
    dashboard_data: {
      summary_cards: [
        { title: 'Linhas', value: String(totalRows || files.length), trend: 'stable' },
        { title: 'Colunas', value: String(uniqueCols.length || '-'), trend: 'stable' },
        { title: 'Abas', value: String(totalSheets || spreadsheetFiles.length), trend: 'stable' },
        { title: 'Numéricas', value: String(allNumericCols.length), trend: 'stable' },
      ],
      charts,
    },
    diagnosis: {
      overall_assessment: aiUnavailable
        ? 'A leitura dos dados funcionou, mas a conexão com a API de IA falhou antes de gerar o diagnóstico. Os dados estão intactos — tente novamente quando a API estiver acessível.'
        : allSheets.length > 0
          ? `Planilha lida com sucesso: ${totalSheets} aba${totalSheets !== 1 ? 's' : ''}, ${totalRows} linha${totalRows !== 1 ? 's' : ''}, ${uniqueCols.length} coluna${uniqueCols.length !== 1 ? 's' : ''}${allNumericCols.length > 0 ? `. Colunas numéricas calculadas: ${allNumericCols.map(c => `${c.name} (total: ${formatNumber(c.sum)})`).slice(0, 4).join(', ')}.` : '. Nenhuma coluna numérica detectada na amostra.'}`
          : imageFiles.length > 0
            ? `${imageFiles.length} imagem${imageFiles.length !== 1 ? 's' : ''} recebida${imageFiles.length !== 1 ? 's' : ''}. O modo local acessa apenas metadados (nome, tipo, tamanho). O conteúdo visual não pode ser interpretado sem a etapa de IA.`
            : 'Arquivos lidos. Metadados e estrutura extraídos com sucesso.',
      health_score: aiUnavailable ? 50 : allSheets.length > 0 && allNumericCols.length > 0 ? 75 : 60,
      observed_facts: diagnosisFacts,
      hypotheses: [
        aiUnavailable
          ? 'A falha ocorreu na chamada externa à API de IA, não na leitura do arquivo — os dados estão íntegros.'
          : allNumericCols.length > 0
            ? `${allNumericCols.length} coluna${allNumericCols.length !== 1 ? 's' : ''} numérica${allNumericCols.length !== 1 ? 's' : ''} detectada${allNumericCols.length !== 1 ? 's' : ''}: ${allNumericCols.map(c => `${c.name} (média ${formatNumber(c.avg)})`).slice(0, 3).join(', ')}.`
            : uniqueCols.length > 0
              ? 'As colunas parecem textuais ou categóricas. Não foi possível calcular totais ou médias automaticamente.'
              : 'Sem colunas identificadas na amostra.',
      ].filter(Boolean),
      recommendations: [
        aiUnavailable
          ? 'Tente novamente em alguns minutos quando a API estiver estável.'
          : allNumericCols.length > 0
            ? `Verifique se os valores de ${allNumericCols[0].name} (máx: ${formatNumber(allNumericCols[0].max)}, mín: ${formatNumber(allNumericCols[0].min)}) estão dentro do esperado para o período.`
            : uniqueCols.length > 0
              ? `Confirme que as colunas ${uniqueCols.slice(0, 4).join(', ')} estão preenchidas em todos os registros.`
              : 'Organize os dados com cabeçalhos nomeados para facilitar análises futuras.',
        aiUnavailable
          ? 'Verifique a chave GEMINI_API_KEY nas variáveis de ambiente se o erro persistir.'
          : truncated
            ? 'Parte do conteúdo foi truncada. Para análise completa, envie a planilha com menos abas ou colunas.'
            : totalRows > 100
              ? `${totalRows} registros lidos. Para análises históricas, considere filtrar por período antes de enviar.`
              : '',
      ].filter(Boolean),
      priority_areas: aiUnavailable
        ? ['Conectividade com API', 'Validação dos dados']
        : allNumericCols.length > 0
          ? allNumericCols.slice(0, 3).map(c => c.name)
          : uniqueCols.length > 0
            ? uniqueCols.slice(0, 3)
            : ['Estrutura dos dados'],
    },
    bottlenecks: aiUnavailable ? [
      {
        title: 'API de IA indisponível',
        description: 'A chamada à API de IA falhou com erro de rede durante o processamento.',
        severity: 'medium',
        evidence: 'Erro de conexão ao tentar chamar o modelo de linguagem.',
        impact: 'O sistema gerou apenas a análise estrutural local até a API responder normalmente.',
      },
    ] : [],
    risks: [],
    inconsistencies: [],
    opportunities: buildOpportunities(allSheets, allNumericCols, uniqueCols, totalRows, aiUnavailable),
    action_plan: buildActionPlan(allSheets, allNumericCols, uniqueCols, totalRows, imageFiles, aiUnavailable),
    limitations: [
      aiUnavailable
        ? 'Análise gerada em modo básico — a API de IA estava indisponível durante o processamento.'
        : `Análise estrutural local: ${allSheets.length > 0 ? `${totalRows} linhas lidas, totais e médias calculados` : 'metadados de arquivo extraídos'}. Interpretação semântica e diagnóstico estratégico não estão disponíveis neste modo.`,
      userContext ? `Contexto informado: ${userContext}` : '',
      truncated ? 'Parte do conteúdo foi truncada para manter o processamento estável. Envie a planilha em partes menores para análise completa.' : '',
    ].filter(Boolean),
  }
}

function buildOpportunities(
  sheets: SheetData[],
  numericCols: Array<{ name: string; sum: number; min: number; max: number; avg: number }>,
  uniqueCols: string[],
  totalRows: number,
  aiUnavailable: boolean,
) {
  if (aiUnavailable) {
    return [{
      title: 'Reprocessar após restaurar a conexão',
      description: 'A estrutura dos dados foi lida com sucesso. Tente novamente quando a API estiver acessível.',
      potential_impact: 'Diagnóstico completo com gargalos, riscos e plano de ação baseado nos dados.',
      effort: 'low' as const,
      timeframe: 'Imediato',
    }]
  }

  const opps = []

  if (numericCols.length >= 2) {
    const top = numericCols[0]
    opps.push({
      title: `Acompanhar evolução de ${top.name}`,
      description: `Total acumulado: ${formatNumber(top.sum)}. Maior valor registrado: ${formatNumber(top.max)}. Monitorar variação entre períodos pode identificar tendências de crescimento ou queda.`,
      potential_impact: `Detecção antecipada de desvios em ${top.name}.`,
      effort: 'low' as const,
      timeframe: 'Próxima análise',
    })
    const sec = numericCols[1]
    opps.push({
      title: `Correlacionar ${top.name} com ${sec.name}`,
      description: `${top.name} (média: ${formatNumber(top.avg)}) e ${sec.name} (média: ${formatNumber(sec.avg)}) estão ambas presentes na planilha. Cruzar os valores pode revelar padrões operacionais.`,
      potential_impact: 'Identificação de eficiência ou ineficiência entre métricas.',
      effort: 'medium' as const,
      timeframe: 'Curto prazo',
    })
  } else if (numericCols.length === 1) {
    const col = numericCols[0]
    opps.push({
      title: `Distribuição de ${col.name}`,
      description: `Valores entre ${formatNumber(col.min)} e ${formatNumber(col.max)}, média de ${formatNumber(col.avg)}. Investigar registros abaixo ou acima de 2× a média pode revelar outliers.`,
      potential_impact: 'Identificação de registros anômalos que precisam de atenção.',
      effort: 'low' as const,
      timeframe: 'Imediato',
    })
  } else if (sheets.length > 0 && totalRows > 0) {
    opps.push({
      title: `Verificar completude das ${totalRows} linhas`,
      description: `A planilha tem ${totalRows} registros com ${uniqueCols.length} colunas. Filtrar registros com valores vazios nas colunas obrigatórias garante a integridade dos dados.`,
      potential_impact: 'Base de dados mais confiável para análises futuras.',
      effort: 'low' as const,
      timeframe: 'Imediato',
    })
  }

  return opps.length > 0 ? opps : [{
    title: 'Estruturar os dados para análise',
    description: `${uniqueCols.length > 0 ? `Colunas detectadas: ${uniqueCols.slice(0, 5).join(', ')}. ` : ''}Organizar os dados com colunas nomeadas facilita a extração automática de KPIs.`,
    potential_impact: 'Indicadores calculados automaticamente em análises futuras.',
    effort: 'low' as const,
    timeframe: 'Próxima análise',
  }]
}

function buildActionPlan(
  sheets: SheetData[],
  numericCols: Array<{ name: string; sum: number; min: number; max: number; avg: number }>,
  uniqueCols: string[],
  totalRows: number,
  imageFiles: ParsedAIFile[],
  aiUnavailable: boolean,
) {
  if (aiUnavailable) {
    return [
      {
        priority: 1,
        title: 'Verificar conexão com a API',
        description: 'Confirmar que GEMINI_API_KEY está correta e que a rede consegue alcançar generativelanguage.googleapis.com. A leitura dos dados funcionou — só a etapa de IA falhou.',
        deadline: 'Hoje',
        expected_result: 'Análise completa gerada na próxima tentativa.',
        effort: 'low' as const,
        category: 'immediate' as const,
      },
      {
        priority: 2,
        title: 'Reenviar o arquivo',
        description: 'Após corrigir a conexão, reenvie o mesmo arquivo para gerar o diagnóstico completo.',
        deadline: 'Após corrigir a API',
        expected_result: 'Relatório com indicadores, gargalos e plano de ação.',
        effort: 'low' as const,
        category: 'short_term' as const,
      },
    ]
  }

  const plan = []

  if (numericCols.length > 0) {
    const mainCol = numericCols[0]
    plan.push({
      priority: 1,
      title: `Revisar valores de ${mainCol.name}`,
      description: `Total: ${formatNumber(mainCol.sum)} | Média: ${formatNumber(mainCol.avg)} | Mín: ${formatNumber(mainCol.min)} | Máx: ${formatNumber(mainCol.max)}. Identificar registros fora do intervalo esperado e corrigir inconsistências.`,
      deadline: 'Esta semana',
      expected_result: `Integridade dos dados de ${mainCol.name} validada.`,
      effort: 'low' as const,
      category: 'immediate' as const,
    })
    if (numericCols.length > 1) {
      const secCol = numericCols[1]
      plan.push({
        priority: 2,
        title: `Conferir ${secCol.name}`,
        description: `Total: ${formatNumber(secCol.sum)} | Média: ${formatNumber(secCol.avg)}. Verificar se os valores de ${secCol.name} estão coerentes com os de ${mainCol.name}.`,
        deadline: 'Esta semana',
        expected_result: `Relação entre ${mainCol.name} e ${secCol.name} compreendida.`,
        effort: 'low' as const,
        category: 'short_term' as const,
      })
    }
  } else if (sheets.length > 0 && totalRows > 0) {
    plan.push({
      priority: 1,
      title: `Validar as ${totalRows} linhas da planilha`,
      description: `${uniqueCols.length > 0 ? `Colunas: ${uniqueCols.slice(0, 5).join(', ')}. ` : ''}Verificar valores ausentes, duplicatas e registros inconsistentes garante qualidade na análise.`,
      deadline: 'Esta semana',
      expected_result: 'Dados limpos e prontos para análise.',
      effort: 'low' as const,
      category: 'immediate' as const,
    })
    plan.push({
      priority: 2,
      title: 'Adicionar colunas numéricas',
      description: uniqueCols.length > 0
        ? `A planilha tem as colunas ${uniqueCols.slice(0, 5).join(', ')}, mas sem valores numéricos identificados. Adicionar métricas como quantidade, valor ou tempo permite calcular totais e médias automaticamente.`
        : 'Planilhas com colunas numéricas (quantidade, valor, distância, tempo) permitem totais e médias automáticos neste modo.',
      deadline: 'Próxima versão',
      expected_result: 'KPIs calculados automaticamente sem IA.',
      effort: 'medium' as const,
      category: 'short_term' as const,
    })
  } else if (imageFiles.length > 0) {
    plan.push({
      priority: 1,
      title: 'Usar modo Com IA para imagens',
      description: `${imageFiles.length > 1 ? `${imageFiles.length} imagens enviadas.` : `Imagem "${imageFiles[0].name}" enviada.`} Imagens precisam do modo Com IA para interpretar o conteúdo visual — o modo local só acessa metadados.`,
      deadline: 'Imediato',
      expected_result: 'Análise do conteúdo visual com diagnóstico completo.',
      effort: 'low' as const,
      category: 'immediate' as const,
    })
  } else {
    plan.push({
      priority: 1,
      title: 'Estruturar os dados',
      description: 'Envie planilhas com colunas nomeadas e valores numéricos para que o modo local calcule totais e médias automaticamente.',
      deadline: 'Próxima análise',
      expected_result: 'Indicadores calculados sem depender de IA.',
      effort: 'low' as const,
      category: 'immediate' as const,
    })
  }

  return plan
}

interface SheetData {
  name: string
  columns: string[]
  totalRows: number
  numericCols: Array<{ name: string; sum: number; min: number; max: number; avg: number }>
}

function parseSheetData(file: ParsedAIFile): SheetData[] {
  const content = file.content
  const sheets: SheetData[] = []
  const sections = content.split(/(?=\n=== Aba:)/)

  for (const section of sections) {
    const nameMatch = section.match(/=== Aba: (.+?) ===/)
    if (!nameMatch) continue
    const name = nameMatch[1].trim()

    const colLine = section.match(/^Colunas: (.+)$/m)
    const columns = colLine ? colLine[1].split(' | ').map(c => c.trim()).filter(Boolean) : []

    const rowMatch =
      section.match(/Amostra estruturada \(\d+ de (\d+) linhas de dados\)/) ||
      section.match(/Amostra \(\d+ de (\d+) linhas\)/)
    const totalRows = Number(rowMatch?.[1] || 0)

    const stats: Record<string, { sum: number; min: number; max: number; count: number }> = {}

    if (columns.length > 0) {
      const blockMatch = section.match(/Amostra estruturada[^\n]*\n([\s\S]*?)(?:\.\.\. |$)/)
      if (blockMatch) {
        const lines = blockMatch[1].split('\n').filter(l => l.trim())
        for (const line of lines.slice(1)) {
          const cells = line.split('\t')
          columns.forEach((col, i) => {
            const raw = (cells[i] ?? '').trim()
            const cleaned = raw.replace(/\s/g, '').replace(/\.(?=\d{3}[,\.])/g, '').replace(',', '.')
            const n = Number(cleaned)
            if (!isNaN(n) && isFinite(n) && raw !== '' && raw !== '-') {
              if (!stats[col]) stats[col] = { sum: 0, min: n, max: n, count: 0 }
              stats[col].sum += n
              stats[col].min = Math.min(stats[col].min, n)
              stats[col].max = Math.max(stats[col].max, n)
              stats[col].count++
            }
          })
        }
      }
    }

    const numericCols = Object.entries(stats)
      .filter(([, s]) => s.count > 0)
      .map(([colName, s]) => ({ name: colName, sum: s.sum, min: s.min, max: s.max, avg: s.sum / s.count }))

    sheets.push({ name, columns, totalRows, numericCols })
  }

  return sheets
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')} M`
  if (Math.abs(n) >= 1_000) return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function isSpreadsheetLike(file: ParsedAIFile): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || file.type.includes('spreadsheet') || file.type === 'text/csv'
}

function estimateSlides(content: string): number {
  return Number(content.match(/Slides detectados: (\d+)/)?.[1] || 0)
}

function countByType(files: ParsedAIFile[]): Array<{ label: string; value: number }> {
  const counts = files.reduce<Record<string, number>>((acc, file) => {
    const label = file.name.split('.').pop()?.toUpperCase() || file.type || 'Arquivo'
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([label, value]) => ({ label, value }))
}
