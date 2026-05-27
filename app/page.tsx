import Link from 'next/link'
import {
  Zap, Upload, Brain, FileText, BarChart3, MessageSquare,
  CheckCircle, ArrowRight, Shield, TrendingUp, Target, ChevronRight, Star,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#0F1B2D]">LogiPilot <span className="text-emerald-500">AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-[#1E3A5F] transition-colors">Funcionalidades</a>
            <a href="#how" className="hover:text-[#1E3A5F] transition-colors">Como funciona</a>
            <a href="#formats" className="hover:text-[#1E3A5F] transition-colors">Formatos</a>
            <a href="#pricing" className="hover:text-[#1E3A5F] transition-colors">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[#1E3A5F] transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#0F1B2D] via-[#1E3A5F] to-[#0F1B2D]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-emerald-400/30">
            <Zap className="w-3 h-3" />
            IA Multimodal para Análise Operacional
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Envie arquivos, relatórios,{' '}
            <span className="text-emerald-400">prints</span> ou planilhas.
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-4">
            O LogiPilot AI transforma dados espalhados em{' '}
            <span className="text-white font-semibold">decisões operacionais.</span>
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10">
            Diagnóstico completo com IA: resumo executivo, indicadores, gargalos, riscos,
            inconsistências, oportunidades e plano de ação — em minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-base shadow-lg shadow-emerald-500/25">
              Analisar meus dados agora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-8 py-3.5 rounded-xl transition-all text-base border border-white/20">
              Já tenho conta
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-400 flex-wrap">
            {['Sem necessidade de BI', 'Multimodal (Excel, PDF, imagens)', 'Resultado em minutos'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        {/* Dashboard mockup */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-1">
            <div className="bg-[#0F1B2D] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-500">logipilot.ai — análise operacional</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Score Operacional', value: '74/100', color: 'text-amber-400' },
                  { label: 'Indicadores', value: '12', color: 'text-emerald-400' },
                  { label: 'Gargalos', value: '3', color: 'text-red-400' },
                  { label: 'Oportunidades', value: '5', color: 'text-blue-400' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-300">
                ✓ Análise concluída · 3 arquivos processados · Plano de ação com 8 itens gerado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formats */}
      <section id="formats" className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
            Aceita qualquer formato de dados
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: '📊', label: 'Excel / XLSX' },
              { icon: '📋', label: 'CSV' },
              { icon: '📄', label: 'PDF' },
              { icon: '📑', label: 'PowerPoint' },
              { icon: '🖼️', label: 'Imagens' },
              { icon: '📸', label: 'Prints / Fotos' },
              { icon: '📝', label: 'Texto' },
              { icon: '📈', label: 'Relatórios Power BI' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#0F1B2D] mb-4">Tudo que você precisa para decisões operacionais</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              O LogiPilot AI atua como um analista operacional júnior —
              separando fatos, hipóteses e recomendações com base somente nos seus dados.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, color: 'bg-blue-50 text-blue-600', title: 'Resumo Executivo', desc: 'Visão geral clara com highlights principais, indicadores encontrados e período analisado.' },
              { icon: Brain, color: 'bg-purple-50 text-purple-600', title: 'Diagnóstico com IA', desc: 'Score de saúde operacional, fatos observados, hipóteses e recomendações priorizadas.' },
              { icon: BarChart3, color: 'bg-emerald-50 text-emerald-600', title: 'Dashboard Automático', desc: 'Quando há dados estruturados, gera gráficos interativos automaticamente.' },
              { icon: Shield, color: 'bg-red-50 text-red-600', title: 'Riscos e Gargalos', desc: 'Identifica pontos críticos com severidade, evidências nos dados e impacto estimado.' },
              { icon: Target, color: 'bg-amber-50 text-amber-600', title: 'Plano de Ação', desc: 'Ações priorizadas com prazo, esforço e resultado esperado — prontas para executar.' },
              { icon: MessageSquare, color: 'bg-slate-50 text-slate-600', title: 'Chat com os Dados', desc: 'Faça perguntas sobre sua análise. A IA responde com base somente nos dados enviados.' },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#0F1B2D] mb-4">Como funciona</h2>
            <p className="text-slate-500">Três passos para transformar dados em decisões</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { step: '01', icon: Upload, title: 'Envie seus dados', desc: 'Upload de Excel, CSV, PDF, imagens, prints ou texto. Qualquer formato, qualquer combinação.' },
              { step: '02', icon: Brain, title: 'IA analisa tudo', desc: 'O modelo multimodal processa todos os arquivos e gera análise estruturada em minutos.' },
              { step: '03', icon: TrendingUp, title: 'Decida e execute', desc: 'Acesse o dashboard, diagnóstico, plano de ação e exporte o relatório em PDF.' },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-12 h-12 rounded-xl bg-[#1E3A5F] text-white flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-400 mb-2">PASSO {s.step}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Principles */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-[#0F1B2D] rounded-2xl p-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Shield className="w-3 h-3" />
            IA Responsável
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">A IA usa apenas os seus dados</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            O LogiPilot AI age como um analista operacional júnior. Nunca inventa números
            e sempre separa fatos observados, hipóteses, recomendações e limitações da análise.
          </p>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { icon: '✅', label: 'Fatos observados', desc: 'Dados reais dos arquivos' },
              { icon: '💡', label: 'Hipóteses', desc: 'Sinalizadas como tal' },
              { icon: '🎯', label: 'Recomendações', desc: 'Baseadas nos dados' },
              { icon: '⚠️', label: 'Limitações', desc: 'Transparência total' },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0F1B2D] mb-4">Planos e preços</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Comece grátis e escale quando precisar. Sem burocracia, sem contrato de longo prazo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Free */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Grátis</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-[#0F1B2D]">R$ 0</span>
                </div>
                <p className="text-sm text-slate-400">Para sempre, sem cartão</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '5 análises por mês',
                  'Excel, CSV e texto',
                  'Resumo executivo',
                  'Dashboard automático',
                  '1 usuário',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Começar grátis
              </Link>
            </div>

            {/* Pro — destaque */}
            <div className="bg-[#1E3A5F] rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-xl shadow-[#1E3A5F]/20">
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-400 text-[#0F1B2D] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Popular
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Pro</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">R$ 97</span>
                  <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <p className="text-sm text-slate-400">Cobrado mensalmente</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Análises ilimitadas',
                  'Todos os formatos (PDF, PPTX, imagens)',
                  'Diagnóstico completo com IA',
                  'Plano de ação com prioridades',
                  'Chat com os dados',
                  'Exportação em PDF',
                  'Histórico completo',
                  'Até 5 usuários',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/30">
                Assinar Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Empresarial</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-[#0F1B2D]">R$ 297</span>
                  <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <p className="text-sm text-slate-400">Para frotas e operações maiores</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tudo do plano Pro',
                  'Usuários ilimitados',
                  'Gestão de motoristas',
                  'Supervisão de equipe',
                  'Análises por organização',
                  'Suporte prioritário',
                  'Onboarding dedicado',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Falar com vendas
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">
            Todos os planos incluem SSL, backups automáticos e conformidade com LGPD.
            Cancele quando quiser, sem multa.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Comece sua análise agora</h2>
          <p className="text-emerald-100 mb-8">
            Sem configuração. Sem BI. Envie seus dados e receba diagnóstico operacional em minutos.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-xl text-base hover:bg-emerald-50 transition-colors shadow-lg">
            Criar conta grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F1B2D]">LogiPilot AI</span>
          </div>
          <p className="text-xs text-slate-400">© 2025 LogiPilot AI. Central inteligente de análise operacional multimodal.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/privacidade" className="hover:text-slate-600">Privacidade</Link>
            <Link href="/termos" className="hover:text-slate-600">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
