import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getFileIcon(type: string, name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (type.startsWith('image/')) return '🖼️'
  if (ext === 'pdf') return '📄'
  if (ext === 'xlsx' || ext === 'xls') return '📊'
  if (ext === 'csv') return '📋'
  if (ext === 'pptx' || ext === 'ppt') return '📑'
  if (ext === 'txt') return '📝'
  return '📁'
}

export function getSeverityColor(severity: 'high' | 'medium' | 'low') {
  return {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  }[severity]
}

export function getStatusColor(status: 'good' | 'warning' | 'critical' | 'neutral') {
  return {
    good: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  }[status]
}

export function getTrendIcon(trend?: 'up' | 'down' | 'stable') {
  if (!trend) return ''
  return { up: '↑', down: '↓', stable: '→' }[trend]
}

export function getHealthScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}
