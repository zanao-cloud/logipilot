'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight, CheckCircle, Shield, ShieldAlert, ScanSearch,
  ScrollText, LayoutDashboard, BotMessageSquare, CloudUpload,
  ClipboardList, TrendingUp, Target, Star, Activity, AlertTriangle,
  Layers, FileSpreadsheet, Table2, FileText, Presentation,
  Image, ScanLine, Type, BarChart2, MessageCircle, Mail,
} from 'lucide-react'
import { HeroBackground } from '@/components/landing/hero-background'

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ─── Sub-components ─── */

function DataOrb() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto lp-float">
      {/* Outer atmosphere */}
      <div className="absolute inset-[-40%] rounded-full lp-pulse-ring" style={{
        background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 65%)',
        filter: 'blur(24px)',
      }} />
      {/* Mid ring */}
      <div className="absolute inset-[-12%] rounded-full lp-pulse-ring" style={{
        background: 'radial-gradient(circle, transparent 46%, rgba(56,189,248,0.1) 54%, transparent 65%)',
      }} />
      {/* Core sphere */}
      <div className="absolute inset-0 rounded-full" style={{
        background: 'radial-gradient(ellipse at 32% 28%, rgba(186,230,253,0.85) 0%, rgba(56,189,248,0.7) 18%, rgba(14,165,233,0.65) 34%, rgba(2,132,199,0.55) 52%, rgba(12,74,110,0.8) 70%, rgba(3,30,60,0.95) 85%, #020408 100%)',
        boxShadow: '0 0 70px rgba(14,165,233,0.45), 0 0 140px rgba(14,165,233,0.15), 0 0 300px rgba(56,189,248,0.06), inset 0 0 80px rgba(0,0,0,0.45)',
      }} />
      {/* Specular highlight */}
      <div className="absolute rounded-full" style={{
        top: '10%', left: '16%', width: '38%', height: '24%',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
        filter: 'blur(6px)',
      }} />
      {/* SVG globe lines + data nodes */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120" style={{ opacity: 0.35 }}>
        <ellipse cx="60" cy="60" rx="58" ry="22" fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth="0.6" strokeDasharray="4 3">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="20s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="60" cy="60" rx="22" ry="58" fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="0.6" strokeDasharray="4 3" />
        <circle cx="42" cy="40" r="2" fill="rgba(56,189,248,0.9)">
          <animate attributeName="r" values="2;2.8;2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="82" cy="50" r="1.5" fill="rgba(56,189,248,0.7)">
          <animate attributeName="r" values="1.5;2.2;1.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="78" r="1.8" fill="rgba(56,189,248,0.8)">
          <animate attributeName="r" values="1.8;2.5;1.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="48" cy="70" r="1.2" fill="rgba(56,189,248,0.6)" />
        <line x1="42" y1="40" x2="82" y2="50" stroke="rgba(56,189,248,0.25)" strokeWidth="0.4" />
        <line x1="82" y1="50" x2="65" y2="78" stroke="rgba(56,189,248,0.25)" strokeWidth="0.4" />
        <line x1="42" y1="40" x2="48" y2="70" stroke="rgba(56,189,248,0.2)" strokeWidth="0.4" />
        <line x1="48" y1="70" x2="65" y2="78" stroke="rgba(56,189,248,0.2)" strokeWidth="0.4" />
      </svg>
      {/* Inner texture layer */}
      <div className="absolute inset-[8%] rounded-full" style={{
        background: 'radial-gradient(ellipse at 65% 38%, rgba(99,102,241,0.18) 0%, transparent 55%), radial-gradient(ellipse at 28% 72%, rgba(14,165,233,0.14) 0%, transparent 55%)',
        filter: 'blur(5px)',
      }} />
    </div>
  )
}

type CardProps = { children: React.ReactNode; className?: string; animClass?: string }

function HoloCard({ children, className = '', animClass = 'lp-card-1' }: CardProps) {
  return (
    <div className={`absolute ${animClass} ${className}`} style={{
      background: 'rgba(8,15,32,0.82)',
      border: '1px solid rgba(56,189,248,0.18)',
      backdropFilter: 'blur(16px)',
      borderRadius: '14px',
      padding: '12px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {children}
    </div>
  )
}

/* ─── Main page ─── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="fixed top-0 w-full z-50 transition-all duration-500" style={{
        background: scrolled ? 'rgba(2,4,8,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="/logo.png"
            alt="Logipilot AI"
            className="h-32 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#how"      className="hover:text-white transition-colors">Como funciona</a>
            <a href="#formats"  className="hover:text-white transition-colors">Formatos</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register?plan=free" className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all" style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              boxShadow: '0 0 20px rgba(6,182,212,0.25)',
            }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-6 pt-28 pb-24 overflow-hidden">
        <HeroBackground />

        {/* ── Headline FIRST ── */}
        <div className="relative z-10 max-w-4xl mx-auto text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Você não está enviando arquivos.<br className="hidden sm:block" />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #22d3ee, #60a5fa, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {' '}Está ativando um analista
            </span>{' '}
            <span className="text-white">operacional com IA.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            O LogiPilot AI transforma planilhas, PDFs, prints, relatórios e dados soltos em
            diagnóstico, indicadores, gargalos, oportunidades e plano de ação — em minutos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register?plan=free" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:opacity-90" style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              boxShadow: '0 0 50px rgba(6,182,212,0.35), 0 8px 24px rgba(0,0,0,0.4)',
            }}>
              Analisar meus dados agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white font-medium px-8 py-4 rounded-xl text-base transition-all hover:bg-white/10" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              Ver como funciona
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              'Sem necessidade de BI',
              'Excel, PDF, imagens e relatórios',
              'Resultado em minutos',
              'IA baseada nos seus dados',
            ].map(badge => (
              <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-full" style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* ── Orb + floating cards BELOW headline ── */}
        <div className="relative z-10">
          <DataOrb />

          <HoloCard className="hidden md:block -top-6 -left-40" animClass="lp-card-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Score Operacional</p>
            <p className="text-2xl font-bold text-amber-400 leading-none">74<span className="text-sm text-slate-500 font-normal">/100</span></p>
          </HoloCard>

          <HoloCard className="hidden md:block top-6 -right-44" animClass="lp-card-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3 h-3 text-cyan-400 lp-glow" />
              <p className="text-[10px] text-slate-400">Processando arquivos</p>
            </div>
            <div className="flex gap-1.5">
              {['.xlsx', '.pdf', '.csv'].map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300" style={{
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.2)',
                }}>{f}</span>
              ))}
            </div>
          </HoloCard>

          <HoloCard className="hidden md:block -bottom-4 -left-44" animClass="lp-card-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[10px] text-slate-300">3 gargalos detectados</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 pl-5">Setor de logística</p>
          </HoloCard>

          <HoloCard className="hidden md:block bottom-2 -right-36" animClass="lp-card-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] text-slate-300">5 oportunidades</p>
            </div>
            <div className="w-24 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full w-3/5" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </div>
          </HoloCard>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '8+', label: 'Formatos suportados',   color: '#22d3ee' },
            { value: '< 3min', label: 'Análise completa',  color: '#60a5fa' },
            { value: '6',  label: 'Módulos de diagnóstico', color: '#a78bfa' },
            { value: '100%', label: 'Baseado nos seus dados', color: '#34d399' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dashboard 3D Mockup ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(14,165,233,0.05) 0%, transparent 65%)',
        }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-center text-xs font-semibold text-slate-600 uppercase tracking-widest mb-14">
            Dashboard analítico gerado automaticamente pela IA
          </p>
          <div style={{ perspective: '1400px' }}>
            <div className="lp-float-slow rounded-2xl overflow-hidden" style={{
              transform: 'rotateX(7deg) rotateY(-2deg)',
              transformStyle: 'preserve-3d',
              background: 'rgba(6,11,22,0.97)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 60px 120px rgba(0,0,0,0.75), 0 0 80px rgba(14,165,233,0.08), 0 0 0 1px rgba(14,165,233,0.05)',
            }}>
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="ml-3 text-xs text-slate-600 font-mono">logipilot.ai — análise operacional</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 lp-glow" />
                  <span className="text-[10px] text-emerald-400">Análise concluída</span>
                </div>
              </div>

              <div className="p-6">
                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {/* Score */}
                  <div className="flex flex-col items-center justify-center rounded-xl py-4" style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
                    border: '1px solid rgba(245,158,11,0.18)',
                  }}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Score</p>
                    <p className="text-3xl font-bold text-amber-400 leading-none">74</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">/100</p>
                  </div>
                  {[
                    { label: 'Indicadores',   value: '12', color: 'text-cyan-400',    from: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.18)' },
                    { label: 'Gargalos',      value: '3',  color: 'text-red-400',     from: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.16)' },
                    { label: 'Oportunidades', value: '5',  color: 'text-emerald-400', from: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.16)' },
                    { label: 'Plano de ação', value: '8',  color: 'text-violet-400',  from: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.16)' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3" style={{
                      background: `linear-gradient(135deg, ${s.from}, rgba(6,11,22,0.8))`,
                      border: `1px solid ${s.border}`,
                    }}>
                      <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  {/* Bar chart */}
                  <div className="md:col-span-2 rounded-xl p-4" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Desempenho por período</p>
                    <div className="flex items-end gap-2 h-16">
                      {[38, 62, 44, 78, 52, 68, 74].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{
                          height: `${h}%`,
                          background: i === 6
                            ? 'linear-gradient(to top, rgba(6,182,212,0.9), rgba(56,189,248,0.6))'
                            : 'rgba(255,255,255,0.055)',
                          boxShadow: i === 6 ? '0 0 12px rgba(6,182,212,0.35)' : 'none',
                        }} />
                      ))}
                    </div>
                  </div>
                  {/* Donut */}
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div className="relative w-16 h-16">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(6,182,212,0.8)" strokeWidth="8"
                          strokeDasharray="163.4" strokeDashoffset="44" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-cyan-400">74%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Saúde geral</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.14)',
                }}>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-300">
                    3 arquivos processados · Plano de ação com 8 itens · Diagnóstico completo gerado
                  </span>
                </div>
              </div>
            </div>

            {/* Floor reflection */}
            <div className="absolute inset-x-12 rounded-b-2xl" style={{
              top: '100%', height: '60px',
              background: 'linear-gradient(to bottom, rgba(6,182,212,0.06), transparent)',
              filter: 'blur(10px)',
              transform: 'scaleY(-0.25) translateY(-8px)',
            }} />
          </div>
        </div>
      </section>

      {/* ── Formats ── */}
      <section id="formats" className="py-20 px-6" style={{ background: 'linear-gradient(180deg, #020408, #06101e, #020408)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#22d3ee' }}>Compatibilidade</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Aceita qualquer formato de dados</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { Icon: FileSpreadsheet, label: 'Excel / XLSX',  color: '#34d399', glow: 'rgba(52,211,153,0.08)'  },
              { Icon: Table2,          label: 'CSV',            color: '#2dd4bf', glow: 'rgba(45,212,191,0.08)'  },
              { Icon: FileText,        label: 'PDF',            color: '#f87171', glow: 'rgba(239,68,68,0.08)'   },
              { Icon: Presentation,    label: 'PowerPoint',     color: '#fb923c', glow: 'rgba(249,115,22,0.08)'  },
              { Icon: Image,           label: 'Imagens',        color: '#a78bfa', glow: 'rgba(139,92,246,0.08)'  },
              { Icon: ScanLine,        label: 'Prints / Fotos', color: '#c084fc', glow: 'rgba(192,132,252,0.08)' },
              { Icon: Type,            label: 'Texto',          color: '#94a3b8', glow: 'rgba(148,163,184,0.06)' },
              { Icon: BarChart2,       label: 'Power BI',       color: '#fbbf24', glow: 'rgba(234,179,8,0.08)'   },
            ].map(f => (
              <div key={f.label} className="lp-hover flex items-center gap-2.5 text-sm font-medium text-slate-300 px-4 py-3 rounded-xl cursor-default" style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 0 24px ${f.glow}`,
              }}>
                <f.Icon className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 relative" style={{ background: 'linear-gradient(180deg, #020408, #080e1e, #020408)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(14,165,233,0.4), transparent)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 60%)',
        }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#818cf8' }}>Funcionalidades</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que você precisa para{' '}
              <span style={{
                backgroundImage: 'linear-gradient(90deg, #22d3ee, #60a5fa, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                decisões operacionais
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              O LogiPilot AI atua como um analista operacional júnior — separando fatos,
              hipóteses e recomendações com base somente nos seus dados.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: ScrollText,       accent: '#3b82f6', title: 'Resumo Executivo',    desc: 'Visão clara com highlights principais, indicadores encontrados e período analisado.' },
              { icon: ScanSearch,       accent: '#8b5cf6', title: 'Diagnóstico com IA',  desc: 'Score de saúde operacional, fatos observados, hipóteses e recomendações priorizadas.' },
              { icon: LayoutDashboard,  accent: '#10b981', title: 'Dashboard Automático',desc: 'Quando há dados estruturados, gera gráficos interativos automaticamente.' },
              { icon: ShieldAlert,      accent: '#ef4444', title: 'Riscos e Gargalos',   desc: 'Identifica pontos críticos com severidade, evidências e impacto estimado.' },
              { icon: ClipboardList,    accent: '#f59e0b', title: 'Plano de Ação',       desc: 'Ações priorizadas com prazo, esforço e resultado esperado — prontas para executar.' },
              { icon: BotMessageSquare, accent: '#06b6d4', title: 'Chat com os Dados',   desc: 'Faça perguntas sobre sua análise. A IA responde com base nos arquivos enviados.' },
            ].map(f => (
              <div key={f.title} className="lp-hover group relative rounded-2xl p-6 overflow-hidden" style={{
                background: `linear-gradient(135deg, ${f.accent}14 0%, rgba(6,11,22,0.9) 60%)`,
                border: `1px solid ${f.accent}25`,
              }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{
                  background: `${f.accent}18`,
                  border: `1px solid ${f.accent}30`,
                }}>
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6 relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)' }} />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#22d3ee' }}>Processo</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Como funciona</h2>
            <p className="text-slate-400 text-lg">Três passos para transformar dados em decisões</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector lines (desktop) */}
            <div className="hidden md:block absolute top-[26px] left-[calc(33.3%-16px)] w-[calc(33.3%+32px)]" style={{
              height: '1px',
              background: 'linear-gradient(90deg, rgba(6,182,212,0.4), rgba(6,182,212,0.8), rgba(6,182,212,0.4))',
              boxShadow: '0 0 8px rgba(6,182,212,0.3)',
            }} />
            {[
              { step: '01', icon: CloudUpload,   title: 'Envie seus dados',  desc: 'Upload de Excel, CSV, PDF, imagens, prints ou texto. Qualquer formato, qualquer combinação.' },
              { step: '02', icon: ScanSearch,   title: 'IA analisa tudo',   desc: 'O modelo multimodal processa todos os arquivos e gera análise estruturada em minutos.' },
              { step: '03', icon: ClipboardList,title: 'Decida e execute',  desc: 'Acesse o dashboard, diagnóstico, plano de ação e exporte o relatório em PDF.' },
            ].map(s => (
              <div key={s.step} className="text-center relative z-10">
                <div className="relative w-14 h-14 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-2xl lp-pulse-ring" style={{
                    background: 'rgba(6,182,212,0.12)',
                    filter: 'blur(8px)',
                  }} />
                  <div className="relative w-full h-full rounded-2xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.08))',
                    border: '1px solid rgba(6,182,212,0.25)',
                  }}>
                    <s.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="text-xs font-bold text-cyan-600 mb-2 tracking-widest">PASSO {s.step}</div>
                <h3 className="font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Responsible ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl p-10 md:p-14 text-center overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(8,14,28,0.98), rgba(12,20,42,0.98))',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {/* Top glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px rounded-full" style={{
              background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.55), transparent)',
            }} />
            {/* Background halo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 70%)',
            }} />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs font-semibold text-cyan-400" style={{
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.2)',
              }}>
                <Shield className="w-3 h-3" />
                IA Responsável
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">A IA usa apenas os seus dados</h2>
              <p className="text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                O LogiPilot AI age como um analista operacional júnior. Ele não inventa números
                e separa fatos observados, hipóteses, recomendações e limitações da análise.
              </p>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { icon: CheckCircle,   accent: '#10b981', label: 'Fatos observados', desc: 'Dados reais dos arquivos'  },
                  { icon: Layers,        accent: '#3b82f6', label: 'Hipóteses',         desc: 'Sinalizadas como tal'     },
                  { icon: Target,        accent: '#8b5cf6', label: 'Recomendações',     desc: 'Baseadas nos dados'       },
                  { icon: AlertTriangle, accent: '#f59e0b', label: 'Limitações',        desc: 'Transparência total'      },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl p-4" style={{
                    background: `${item.accent}0f`,
                    border: `1px solid ${item.accent}22`,
                  }}>
                    <item.icon className="w-5 h-5 mx-auto mb-2" style={{ color: item.accent }} />
                    <p className="text-white text-sm font-medium mb-1">{item.label}</p>
                    <p className="text-slate-500 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #020408, #07101e, #020408)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(59,130,246,0.4), transparent)' }} />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#22d3ee' }}>Preços</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Planos e preços</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Comece grátis e escale quando precisar. Sem burocracia, sem contrato de longo prazo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Free */}
            <div className="relative rounded-2xl p-8 flex flex-col" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Grátis</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">R$ 0</span>
                </div>
                <p className="text-sm text-slate-600">Para sempre, sem cartão</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['5 análises por mês', 'Excel, CSV e texto', 'Resumo executivo', 'Dashboard automático', '1 usuário'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=free" className="block text-center font-semibold px-6 py-3 rounded-xl text-sm text-white transition-all hover:bg-white/10" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                Começar grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl p-8 flex flex-col overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(59,130,246,0.08))',
              border: '1px solid rgba(6,182,212,0.28)',
              boxShadow: '0 0 60px rgba(6,182,212,0.08), 0 0 0 1px rgba(6,182,212,0.06)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{
                background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.75), transparent)',
              }} />
              <div className="absolute top-4 right-4">
                <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                }}>
                  <Star className="w-3 h-3 fill-current" /> Popular
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">Pro</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">R$ 97</span>
                  <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <p className="text-sm text-slate-400">Cobrado mensalmente</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['40 análises por mês', 'Todos os formatos (PDF, PPTX, imagens)', 'Diagnóstico completo com IA', 'Plano de ação com prioridades', 'Chat com os dados', 'Exportação em PDF', 'Histórico completo', 'Até 5 usuários'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a
                href="https://wa.me/5511939369341?text=Ol%C3%A1%21%20Quero%20assinar%20o%20plano%20Pro%20do%20LogiPilot%20AI%20%28R%24%2097%2Fm%C3%AAs%29.%20Pode%20me%20ajudar%20a%20ativar%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center font-semibold px-6 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 8px 24px rgba(6,182,212,0.25)',
                }}
              >
                Assinar Pro
              </a>
            </div>

            {/* Enterprise */}
            <div className="relative rounded-2xl p-8 flex flex-col" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Empresarial</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">R$ 297</span>
                  <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <p className="text-sm text-slate-600">Para frotas e operações maiores</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['200 análises por mês', 'Até 25 usuários', 'Gestão de motoristas', 'Supervisão de equipe', 'Análises por organização', 'Suporte prioritário', 'Onboarding dedicado'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a
                href="https://wa.me/5511939369341?text=Ol%C3%A1%21%20Tenho%20interesse%20no%20plano%20Empresarial%20do%20LogiPilot%20AI%20%28R%24%20297%2Fm%C3%AAs%29.%20Posso%20conversar%20com%20vendas%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center font-semibold px-6 py-3 rounded-xl text-sm text-white transition-all hover:bg-white/10"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Falar com vendas
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-slate-700 mt-8">
            Todos os planos incluem SSL, backups automáticos e conformidade com LGPD. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(8,14,28,0.98), rgba(12,20,42,0.98))',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.09) 0%, transparent 65%)',
            }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-px" style={{
              background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)',
            }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Transforme dados soltos em{' '}
                <span style={{
                  backgroundImage: 'linear-gradient(90deg, #22d3ee, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  decisão operacional.
                </span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
                Sem configuração complexa. Sem BI. Envie seus dados e receba um diagnóstico
                operacional completo em minutos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register?plan=free" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold px-10 py-4 rounded-xl text-base text-white transition-all hover:opacity-90" style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 0 48px rgba(6,182,212,0.3), 0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  Começar análise grátis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-medium px-10 py-4 rounded-xl text-base text-white transition-all hover:bg-white/10" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  Entrar na minha conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://wa.me/5511939369341" target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp (11) 93936-9341"
              className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-slate-300 transition-all"
              style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)' }}>
              <MessageCircle className="w-4 h-4" style={{ color: '#25d366' }} />
              <span className="font-medium">(11) 93936-9341</span>
            </a>

            <a href="https://instagram.com/logipilotai" target="_blank" rel="noopener noreferrer"
              aria-label="Instagram @logipilotai"
              className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-slate-300 transition-all"
              style={{ background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,48,108,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,48,108,0.08)' }}>
              <InstagramIcon className="w-4 h-4" style={{ color: '#e1306c' }} />
              <span className="font-medium">@logipilotai</span>
            </a>

            <a href="mailto:logipilot@gmail.com"
              aria-label="E-mail logipilot@gmail.com"
              className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-slate-300 transition-all"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.08)' }}>
              <Mail className="w-4 h-4 text-sky-400" />
              <span className="font-medium">logipilot@gmail.com</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <img
              src="/logo.png"
              alt="Logipilot AI"
              className="h-28 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <p className="text-xs text-slate-600 text-center">© 2025 LogiPilot AI. Central inteligente de análise operacional multimodal.</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <Link href="/privacidade" className="hover:text-slate-300 transition-colors">Privacidade</Link>
              <Link href="/termos"      className="hover:text-slate-300 transition-colors">Termos</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
