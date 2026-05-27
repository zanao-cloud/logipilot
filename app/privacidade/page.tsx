import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#0F1B2D] text-sm">LogiPilot <span className="text-emerald-500">AI</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#0F1B2D] mb-2">Política de Privacidade</h1>
        <p className="text-slate-500 text-sm mb-10">Última atualização: maio de 2025</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Dados coletados</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Coletamos apenas os dados necessários para o funcionamento do serviço: nome, e-mail, dados de perfil e
              os arquivos que você nos envia para análise. Os arquivos são processados para geração do diagnóstico e não
              são compartilhados com terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Uso dos dados</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Os dados são utilizados exclusivamente para fornecer o serviço de análise operacional, melhorar a experiência
              do produto e enviar comunicações relacionadas à sua conta. Não vendemos dados a terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Retenção de dados</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Seus dados são mantidos enquanto sua conta estiver ativa. Você pode solicitar a exclusão a qualquer momento
              pelo suporte. Arquivos enviados para análise são removidos automaticamente após o processamento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Segurança</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Utilizamos criptografia em trânsito (TLS/SSL) e em repouso. Nossa infraestrutura é gerenciada pelo Supabase,
              em conformidade com padrões de segurança internacionais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Conformidade com LGPD</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              O LogiPilot AI está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              Você tem direito de acessar, corrigir ou solicitar a exclusão dos seus dados a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Contato</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Para exercer seus direitos ou tirar dúvidas, entre em contato pelo e-mail{' '}
              <a href="mailto:privacidade@logipilot.ai" className="text-emerald-600 hover:underline">
                privacidade@logipilot.ai
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
