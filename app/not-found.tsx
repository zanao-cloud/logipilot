import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020408] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold mb-4" style={{
          backgroundImage: 'linear-gradient(90deg, #22d3ee, #60a5fa, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </p>
        <h1 className="text-2xl font-bold text-white mb-3">Página não encontrada</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          O endereço acessado não existe ou foi movido. Voltar pode resolver — se o problema persistir,
          fale com a gente pelo WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 font-semibold px-5 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Ir para o início
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 font-medium px-5 py-3 rounded-xl text-sm text-white transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Abrir dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
