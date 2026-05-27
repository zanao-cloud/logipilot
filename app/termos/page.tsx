import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'

export default function TermosPage() {
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
        <h1 className="text-3xl font-bold text-[#0F1B2D] mb-2">Termos de Uso</h1>
        <p className="text-slate-500 text-sm mb-10">Última atualização: maio de 2025</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Aceitação dos termos</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Ao criar uma conta e utilizar o LogiPilot AI, você concorda com estes Termos de Uso. Se não concordar,
              não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Uso do serviço</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              O LogiPilot AI é uma ferramenta de análise operacional baseada em IA. Você é responsável pelos dados
              que envia para análise e pelo uso das informações geradas. Os resultados são diagnósticos automáticos
              e não substituem decisões de gestão profissional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Limitações da IA</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              As análises geradas pela IA são baseadas exclusivamente nos dados enviados. O sistema não inventa
              informações, mas pode estar sujeito a imprecisões. Sempre valide os resultados com o contexto real
              do seu negócio antes de tomar decisões.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Assinaturas e pagamentos</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Os planos pagos são cobrados mensalmente. Você pode cancelar a qualquer momento sem multa — o acesso
              continua ativo até o final do período pago. Não realizamos reembolsos proporcionais por cancelamento
              antecipado dentro do período vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Propriedade intelectual</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              O LogiPilot AI e seu conteúdo são protegidos por direitos autorais. Os dados e análises que você gera
              são seus. Não reivindicamos propriedade sobre os arquivos que você envia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Modificações</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Podemos atualizar estes termos a qualquer momento. Notificaremos os usuários por e-mail em caso de
              mudanças relevantes. O uso continuado após a atualização implica aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Contato</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato pelo e-mail{' '}
              <a href="mailto:suporte@logipilot.ai" className="text-emerald-600 hover:underline">
                suporte@logipilot.ai
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
