import * as XLSX from 'xlsx'

export interface ParsedFile {
  name: string
  type: string
  content: string
  isImage?: boolean
  imageBase64?: string
  imageMediaType?: string
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name
  const type = file.type
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (type.startsWith('image/')) {
    const base64 = await fileToBase64(file)
    return {
      name,
      type,
      content: `[Imagem: ${name}]`,
      isImage: true,
      imageBase64: base64,
      imageMediaType: type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    }
  }

  if (ext === 'csv' || type === 'text/csv') {
    const text = await file.text()
    return { name, type, content: parseCsvToText(text) }
  }

  if (ext === 'xlsx' || ext === 'xls' || type.includes('spreadsheet')) {
    const buffer = await file.arrayBuffer()
    return { name, type, content: parseExcelToText(buffer) }
  }

  if (ext === 'pdf' || type === 'application/pdf') {
    const base64 = await fileToBase64(file)
    return {
      name,
      type,
      content: `[PDF: ${name}]`,
      isImage: true,
      imageBase64: base64,
      imageMediaType: 'application/pdf' as never,
    }
  }

  if (type === 'text/plain' || ext === 'txt') {
    const text = await file.text()
    return { name, type, content: text }
  }

  const text = await file.text().catch(() => `[Arquivo binário: ${name}]`)
  return { name, type, content: text }
}

function parseCsvToText(csv: string): string {
  const lines = csv.split('\n').filter(Boolean)
  if (lines.length === 0) return '[CSV vazio]'

  const preview = lines.slice(0, 100).join('\n')
  const totalRows = lines.length - 1
  return `CSV com ${totalRows} linhas de dados:\n\n${preview}${lines.length > 101 ? `\n... (${lines.length - 101} linhas adicionais)` : ''}`
}

function parseExcelToText(buffer: ArrayBuffer): string {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const parts: string[] = []

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false })
      const rows = csv.split('\n').filter(Boolean)
      parts.push(`=== Planilha: ${sheetName} (${rows.length - 1} linhas) ===\n${rows.slice(0, 150).join('\n')}`)
    }

    return parts.join('\n\n')
  } catch {
    return '[Erro ao processar Excel]'
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
