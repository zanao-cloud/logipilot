import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LogiPilot AI — Análise Operacional Inteligente',
  description: 'Envie arquivos, relatórios, prints ou planilhas. O LogiPilot AI transforma dados espalhados em decisões operacionais.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
