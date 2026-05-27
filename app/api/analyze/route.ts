import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeData } from '@/lib/ai/analyze'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import type { AnalysisResult } from '@/types'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAnalysisAdminClient()

  const formData = await request.formData()
  const title = formData.get('title') as string
  const context = formData.get('context') as string
  const analysisMode = formData.get('analysisMode') === 'local' ? 'local' : 'ai'
  const files = formData.getAll('files') as File[]

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
    })
    .select()
    .single()

  if (insertError) {
    console.error('[analyze] insert failed', insertError.message)
    return NextResponse.json({ error: friendlyDatabaseError(insertError.message) }, { status: 500 })
  }

  let parsedFiles: ParsedAIFile[] = []

  try {
    parsedFiles = await Promise.all(files.map(parseFileForAI))

    if (analysisMode === 'local') {
      const result = createLocalAnalysis(parsedFiles, context)
      const { error: updateError } = await admin
        .from('analyses')
        .update({ status: 'completed', result, updated_at: new Date().toISOString() })
        .eq('id', analysis.id)

      if (updateError) {
        throw new Error(`Erro ao salvar resultado da análise: ${updateError.message}`)
      }

      return NextResponse.json({ id: analysis.id, status: 'completed', mode: 'local' })
    }

    const result = await analyzeData(parsedFiles, context)

    const { error: updateError } = await admin
      .from('analyses')
      .update({ status: 'completed', result, updated_at: new Date().toISOString() })
      .eq('id', analysis.id)

    if (updateError) {
      throw new Error(`Erro ao salvar resultado da análise: ${updateError.message}`)
    }

    return NextResponse.json({ id: analysis.id, status: 'completed' })
  } catch (err) {
    const raw = getErrorMessage(err)
    console.error('[analyze] failed', raw)

    if (parsedFiles.length > 0 && isNetworkAIError(raw)) {
      const fallbackResult = createLocalAnalysis(parsedFiles, context, true)
      const { error: fallbackUpdateError } = await admin
        .from('analyses')
        .update({ status: 'completed', result: fallbackResult, updated_at: new Date().toISOString() })
        .eq('id', analysis.id)

      if (fallbackUpdateError) {
        console.error('[analyze] failed to save fallback result', fallbackUpdateError.message)
      } else {
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
    return 'Não consegui conectar à API de IA. Verifique a conexão/chave do Gemini e tente novamente.'
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
    return { name, type, content: parseWorkbook(buffer, name) }
  }

  if (ext === 'csv' || type === 'text/csv') {
    const text = await file.text()
    return { name, type, content: parseCsv(text, name) }
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

function parseWorkbook(buffer: ArrayBuffer, fileName: string): string {
  try {
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: 'array',
      cellFormula: false,
      cellHTML: false,
      cellDates: true,
      raw: false,
    })

    return workbookToAnalysisText(workbook, fileName)
  } catch {
    throw new Error(`Não consegui ler a planilha "${fileName}". Verifique se o arquivo não está corrompido ou exporte novamente em XLSX/CSV.`)
  }
}

function parseCsv(csv: string, fileName: string): string {
  try {
    const workbook = XLSX.read(csv, { type: 'string', raw: false })
    return workbookToAnalysisText(workbook, fileName)
  } catch {
    const rows = csv.split(/\r?\n/).filter(Boolean)
    if (!rows.length) throw new Error(`Planilha vazia: "${fileName}".`)
    return limitContent(`Arquivo CSV: ${fileName}\nLinhas detectadas: ${Math.max(0, rows.length - 1)}\n\n${rows.slice(0, MAX_ROWS_PER_SHEET).join('\n')}`)
  }
}

function workbookToAnalysisText(workbook: XLSX.WorkBook, fileName: string): string {
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
    }).filter(row => row.some(cell => String(cell).trim() !== ''))

    parts.push([
      `\n=== Aba: ${sheetName} ===`,
      `Dimensões: ${totalRows} linhas x ${totalCols} colunas`,
      `Amostra (${Math.min(arrayRows.length, MAX_ROWS_PER_SHEET)} de ${arrayRows.length} linhas):`,
      arrayRows.slice(0, MAX_ROWS_PER_SHEET).map(row => row.map(formatCell).join('\t')).join('\n'),
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
  const spreadsheetFiles = files.filter(file => isSpreadsheetLike(file))
  const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf')
  const presentationFiles = files.filter(file => file.name.toLowerCase().endsWith('.pptx') || file.type.includes('presentation'))
  const documentFiles = files.filter(file => file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml'))
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  const rows = spreadsheetFiles.reduce((sum, file) => sum + estimateRows(file.content), 0)
  const sheets = spreadsheetFiles.reduce((sum, file) => sum + estimateSheets(file.content), 0)
  const slideCount = presentationFiles.reduce((sum, file) => sum + estimateSlides(file.content), 0)
  const textLength = files.reduce((sum, file) => sum + file.content.length, 0)
  const truncated = files.some(file => file.content.includes('[Conteúdo truncado') || file.content.includes('[Texto truncado'))
  const dataSources = files.map(file => file.name)
  const supportedKinds = [
    spreadsheetFiles.length ? `${spreadsheetFiles.length} planilha(s)` : '',
    pdfFiles.length ? `${pdfFiles.length} PDF(s)` : '',
    presentationFiles.length ? `${presentationFiles.length} apresentação(ões)` : '',
    documentFiles.length ? `${documentFiles.length} documento(s)` : '',
    imageFiles.length ? `${imageFiles.length} imagem(ns)` : '',
  ].filter(Boolean).join(', ')
  const highlights = [
    `${files.length} arquivo${files.length === 1 ? '' : 's'} recebido${files.length === 1 ? '' : 's'} para análise.`,
    supportedKinds ? `Tipos lidos localmente: ${supportedKinds}.` : 'Os arquivos foram recebidos, mas não há formato com extração local avançada.',
    spreadsheetFiles.length > 0 ? `${sheets} aba${sheets === 1 ? '' : 's'} e aproximadamente ${rows} linha${rows === 1 ? '' : 's'} de dados tabulares.` : '',
    presentationFiles.length > 0 ? `${slideCount} slide${slideCount === 1 ? '' : 's'} com texto extraído de PPTX.` : '',
    aiUnavailable
      ? 'A análise foi concluída em modo básico porque a API de IA não respondeu no momento do processamento.'
      : 'A análise foi concluída localmente, sem consumo de tokens de API.',
  ].filter(Boolean)

  return {
    executive_summary: {
      title: aiUnavailable ? 'Análise básica dos arquivos enviados' : 'Análise local dos arquivos enviados',
      overview: aiUnavailable
        ? 'Os arquivos foram lidos e estruturados com sucesso, mas a etapa de IA ficou indisponível por falha de conexão. Esta visão resume o que foi possível identificar localmente a partir da estrutura dos dados.'
        : 'Os arquivos foram lidos e estruturados localmente, sem chamada a APIs de IA. Esta visão resume a estrutura dos dados, volumes identificados e pontos objetivos que podem ser calculados sem tokens.',
      key_highlights: highlights,
      data_sources: dataSources,
    },
    indicators: [
      {
        name: 'Arquivos processados',
        value: files.length,
        unit: 'arquivo(s)',
        trend: 'stable',
        trend_value: 'Processado localmente',
        category: 'Processamento',
        status: 'neutral',
      },
      {
        name: 'Formatos com leitura local',
        value: [spreadsheetFiles, pdfFiles, presentationFiles, documentFiles, imageFiles].filter(group => group.length > 0).length,
        unit: 'tipo(s)',
        trend: 'stable',
        trend_value: supportedKinds || 'Sem extração avançada',
        category: 'Dados',
        status: supportedKinds ? 'good' : 'warning',
      },
      {
        name: spreadsheetFiles.length > 0 ? 'Linhas estimadas' : 'Texto extraído',
        value: spreadsheetFiles.length > 0 ? rows : textLength,
        unit: spreadsheetFiles.length > 0 ? 'linha(s)' : 'caractere(s)',
        trend: 'stable',
        trend_value: truncated ? 'Conteúdo truncado' : 'Amostra completa dentro do limite',
        category: 'Volume',
        status: rows > 0 || textLength > 0 ? 'good' : 'warning',
      },
    ],
    dashboard_data: {
      summary_cards: [
        { title: 'Arquivos', value: String(files.length), trend: 'stable' },
        { title: 'Planilhas', value: String(spreadsheetFiles.length), trend: 'stable' },
        { title: 'PDF/PPTX/DOCX', value: String(pdfFiles.length + presentationFiles.length + documentFiles.length), trend: 'stable' },
        { title: spreadsheetFiles.length > 0 ? 'Linhas estimadas' : 'Texto extraído', value: String(spreadsheetFiles.length > 0 ? rows : textLength), trend: 'stable' },
      ],
      charts: [
        {
          id: 'fallback-files',
          title: 'Arquivos por tipo',
          type: 'bar',
          data: countByType(files),
          x_key: 'label',
          y_keys: ['value'],
          colors: ['#1E3A5F'],
        },
      ],
    },
    diagnosis: {
      overall_assessment: aiUnavailable
        ? 'A leitura estrutural dos arquivos funcionou, mas o diagnóstico inteligente não pôde ser gerado porque a conexão com a API de IA falhou. Reprocessar a análise quando a API estiver acessível deve gerar o diagnóstico completo.'
        : 'A leitura estrutural dos arquivos funcionou em modo local. O diagnóstico sem IA cobre volume, tipos de arquivo e estrutura tabular, mas não interpreta contexto operacional avançado.',
      health_score: aiUnavailable ? 50 : 65,
      observed_facts: [
        `Fontes recebidas: ${dataSources.join(', ') || 'nenhuma'}.`,
        supportedKinds ? `Formatos processados localmente: ${supportedKinds}.` : 'Nenhum formato com extração local avançada foi identificado.',
        rows > 0 ? `Aproximadamente ${rows} linha(s) de dados foram detectadas nas planilhas.` : `${textLength} caractere(s) de conteúdo/metadados foram preparados para análise local.`,
      ],
      hypotheses: [
        aiUnavailable
          ? 'A falha ocorreu na chamada externa da IA, não na leitura inicial da planilha.'
          : 'Os dados parecem adequados para uma análise estrutural local; recomendações estratégicas exigem regras de negócio específicas ou IA opcional.',
      ],
      recommendations: [
        aiUnavailable ? 'Tente reprocessar a análise em alguns minutos.' : 'Use este modo para análises rápidas sem custo de tokens.',
        aiUnavailable ? 'Se o erro persistir, valide a chave GEMINI_API_KEY e a conectividade do ambiente com a API do Gemini.' : 'Para diagnóstico estratégico, ative a análise completa com IA quando quiser.',
        'Para planilhas grandes, envie uma versão filtrada com as abas e colunas mais importantes.',
      ],
      priority_areas: aiUnavailable ? ['Conectividade com IA', 'Validação da planilha'] : ['Qualidade dos dados', 'Estrutura da planilha'],
    },
    bottlenecks: aiUnavailable ? [
      {
        title: 'IA indisponível no processamento',
        description: 'A chamada externa para geração do diagnóstico falhou com erro de rede.',
        severity: 'medium',
        evidence: 'Erro interno: fetch failed.',
        impact: 'O sistema gera apenas uma análise básica até a API de IA responder normalmente.',
      },
    ] : [],
    risks: [],
    inconsistencies: [],
    opportunities: [
      {
        title: aiUnavailable ? 'Reprocessar com IA após estabilizar a conexão' : 'Evoluir regras locais por tipo de planilha',
        description: aiUnavailable
          ? 'A estrutura da planilha já foi lida; uma nova tentativa pode gerar o relatório completo.'
          : 'Mapear nomes de colunas recorrentes para gerar KPIs específicos de logística sem depender de IA.',
        potential_impact: aiUnavailable ? 'Diagnóstico completo com indicadores, gargalos, riscos e plano de ação.' : 'Mais indicadores automáticos sem custo de API.',
        effort: 'low',
        timeframe: aiUnavailable ? 'Imediato' : 'Curto prazo',
      },
    ],
    action_plan: [
      {
        priority: 1,
        title: aiUnavailable ? 'Validar conexão com Gemini' : 'Padronizar colunas principais',
        description: aiUnavailable
          ? 'Confirmar que GEMINI_API_KEY está válida e que o ambiente consegue acessar a API de IA.'
          : 'Organizar a planilha com nomes claros para colunas de data, motorista, rota, status, valor, prazo e quantidade.',
        deadline: aiUnavailable ? 'Hoje' : 'Próxima análise',
        expected_result: aiUnavailable ? 'Análises completas voltam a ser geradas sem fallback.' : 'Mais KPIs locais identificados automaticamente.',
        effort: 'low',
        category: 'immediate',
      },
      {
        priority: 2,
        title: aiUnavailable ? 'Reenviar a planilha' : 'Usar IA apenas quando necessário',
        description: aiUnavailable
          ? 'Executar uma nova análise com o mesmo arquivo após validar a conexão.'
          : 'Rodar análise completa com IA somente para relatórios que precisam de interpretação e plano de ação detalhado.',
        deadline: aiUnavailable ? 'Após validação da API' : 'Sob demanda',
        expected_result: aiUnavailable ? 'Relatório operacional completo com IA.' : 'Controle de custo sem bloquear o uso do produto.',
        effort: 'low',
        category: 'short_term',
      },
    ],
    limitations: [
      aiUnavailable ? 'Diagnóstico gerado em modo básico por indisponibilidade da API de IA.' : 'Diagnóstico gerado sem IA e sem consumo de tokens de API.',
      userContext ? `Contexto informado pelo usuário: ${userContext}` : 'Nenhum contexto adicional foi informado pelo usuário.',
      truncated ? 'Parte do conteúdo da planilha foi truncada para manter o processamento estável.' : 'A interpretação semântica completa dos dados depende de regras locais específicas ou da etapa opcional de IA.',
    ],
  }
}

function isSpreadsheetLike(file: ParsedAIFile): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || file.type.includes('spreadsheet') || file.type === 'text/csv'
}

function estimateRows(content: string): number {
  const structuredMatches = [...content.matchAll(/Amostra estruturada \(\d+ de (\d+) linhas de dados\)/g)]
  const arrayMatches = [...content.matchAll(/Amostra \(\d+ de (\d+) linhas\)/g)]
  const csvMatches = [...content.matchAll(/Linhas detectadas: (\d+)/g)]
  return [...structuredMatches, ...arrayMatches, ...csvMatches].reduce((sum, match) => sum + Number(match[1] || 0), 0)
}

function estimateSheets(content: string): number {
  return (content.match(/=== Aba:/g) || []).length
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
