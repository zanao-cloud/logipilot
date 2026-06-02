import {
  Image as ImageIcon, FileText, FileSpreadsheet,
  FileBarChart, Presentation, File as FileIco,
  type LucideIcon,
} from 'lucide-react'
import { getFileKind, type FileKind } from '@/lib/utils'

const MAP: Record<FileKind, { Icon: LucideIcon; color: string }> = {
  image:       { Icon: ImageIcon,       color: '#38bdf8' },
  pdf:         { Icon: FileText,        color: '#ef4444' },
  spreadsheet: { Icon: FileSpreadsheet, color: '#10b981' },
  csv:         { Icon: FileBarChart,    color: '#10b981' },
  slides:      { Icon: Presentation,    color: '#f59e0b' },
  text:        { Icon: FileText,        color: '#94a3b8' },
  doc:         { Icon: FileText,        color: '#3b82f6' },
  file:        { Icon: FileIco,         color: '#94a3b8' },
}

export function FileIcon({
  type, name, className = 'w-4 h-4',
}: { type: string; name: string; className?: string }) {
  const { Icon, color } = MAP[getFileKind(type, name)]
  return <Icon className={className} style={{ color }} />
}
