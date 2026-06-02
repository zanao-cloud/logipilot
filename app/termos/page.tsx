import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="LogiPilot AI — início">
            <img
              src="/logo.png"
              alt="Logipilot AI"
              className="h-9 w-auto"
            />
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#0F1B2D] mb-2">Termos de Uso</h1>
        <p className="text-slate-500 text-sm mb-10">Última atualização: junho de 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Aceitação dos termos</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Ao criar uma conta e utilizar o LogiPilot AI, você concorda integralmente com estes Termos de Uso e
              com a nossa{' '}
              <Link href="/privacidade" className="text-cyan-600 underline">Política de Privacidade</Link>. Se não
              concordar com algum item, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Uso do serviço</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              O LogiPilot AI é uma ferramenta de análise operacional baseada em inteligência artificial multimodal.
              Você é responsável pelos dados que envia para análise e pelo uso das informações geradas. Os resultados
              são diagnósticos automáticos e não substituem decisões de gestão profissional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Limitações da inteligência artificial</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              As análises geradas pela IA são produzidas exclusivamente a partir dos dados que você envia. O sistema
              não inventa informações e separa, sempre que possível, fatos observados, hipóteses, recomendações e
              limitações da análise.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Ainda assim, a IA pode apresentar imprecisões ou interpretações incorretas. Valide os resultados com o
              contexto real do seu negócio antes de tomar decisões. O LogiPilot AI não se responsabiliza por decisões
              de negócio baseadas exclusivamente nos diagnósticos gerados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Conta e responsabilidade</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na
              sua conta. Notifique-nos imediatamente em caso de uso não autorizado. Não envie dados que não tenha
              autorização para tratar — em especial dados pessoais de terceiros sem base legal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Assinaturas e pagamentos</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Os planos pagos (Pro e Empresarial) são cobrados mensalmente. Você pode cancelar a qualquer momento sem
              multa — o acesso continua ativo até o final do período pago. Não realizamos reembolsos proporcionais
              por cancelamento antecipado dentro do período vigente. A ativação e o cancelamento são feitos
              diretamente pelo nosso atendimento via WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Propriedade intelectual</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              O LogiPilot AI, sua marca, código e conteúdo são protegidos por direitos autorais. Os dados que você
              envia e as análises geradas a partir deles são seus — não reivindicamos propriedade sobre os arquivos
              enviados nem os utilizamos para treinar modelos de IA de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Suspensão e encerramento</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Podemos suspender ou encerrar contas em caso de violação destes Termos, uso fraudulento ou risco à
              segurança do serviço. Você pode encerrar sua conta a qualquer momento solicitando a exclusão pelo
              canal de suporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Modificações</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Podemos atualizar estes termos a qualquer momento. Em caso de mudanças relevantes, notificaremos os
              usuários por e-mail ou por aviso dentro do produto. O uso continuado após a atualização implica
              aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Contato</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato pelo e-mail{' '}
              <a href="mailto:logipilot@gmail.com" className="text-cyan-600 hover:underline">
                logipilot@gmail.com
              </a>
              {' '}ou pelo WhatsApp{' '}
              <a href="https://wa.me/5511939369341" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                (11) 93936-9341
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
