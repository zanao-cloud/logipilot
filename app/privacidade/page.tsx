import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-bold text-[#0F1B2D] mb-2">Política de Privacidade</h1>
        <p className="text-slate-500 text-sm mb-10">Última atualização: junho de 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Dados que coletamos</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              Coletamos apenas o necessário para o funcionamento do serviço:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm leading-relaxed space-y-1">
              <li><strong>Dados de cadastro</strong>: nome, e-mail, nome da empresa, telefone (opcional).</li>
              <li><strong>Dados operacionais</strong>: os arquivos que você envia para análise (planilhas, PDFs, imagens, texto).</li>
              <li><strong>Dados de uso</strong>: registros técnicos (data e hora de acesso, IP, dispositivo) necessários para segurança e operação.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Como usamos seus dados</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Os dados são utilizados exclusivamente para fornecer o serviço de análise operacional, gerar os
              diagnósticos com IA, melhorar a experiência do produto e enviar comunicações essenciais sobre a sua
              conta. <strong>Não vendemos dados a terceiros</strong> e não usamos seus arquivos para treinar modelos
              de IA — nem nossos, nem de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Compartilhamento com terceiros</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              Para operar o serviço, utilizamos provedores que processam dados em nosso nome:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm leading-relaxed space-y-1">
              <li><strong>Supabase</strong> — autenticação e banco de dados.</li>
              <li><strong>Vercel</strong> — hospedagem da aplicação.</li>
              <li><strong>Google Gemini</strong> — geração das análises com IA. Os arquivos enviados são processados pela API do Google e não são armazenados pelo provedor após o processamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Retenção e exclusão</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              <strong>Arquivos enviados</strong>: o conteúdo bruto é processado e descartado após a geração da
              análise. O resultado em formato estruturado (JSON) é guardado para que você possa rever e exportar.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              <strong>Dados de conta</strong>: mantidos enquanto a conta estiver ativa. Após a solicitação de
              exclusão, removemos todos os dados pessoais em até 30 dias, exceto registros mínimos exigidos por lei.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              <strong>Para excluir sua conta e dados</strong>: envie um e-mail para{' '}
              <a href="mailto:logipilot@gmail.com" className="text-cyan-600 hover:underline">logipilot@gmail.com</a>
              {' '}com o assunto &quot;Exclusão de dados — LGPD&quot; a partir do e-mail cadastrado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Segurança</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Utilizamos criptografia em trânsito (TLS/SSL) e em repouso. O acesso aos dados é controlado por
              autenticação e segregação por organização. Nossos provedores de infraestrutura seguem padrões
              internacionais de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Seus direitos sob a LGPD</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito de:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm leading-relaxed space-y-1">
              <li>confirmar a existência de tratamento dos seus dados;</li>
              <li>acessar seus dados;</li>
              <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
              <li>solicitar a portabilidade dos seus dados;</li>
              <li>revogar consentimento a qualquer momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Contato — Encarregado de Dados</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Para exercer seus direitos ou tirar dúvidas sobre privacidade, escreva para{' '}
              <a href="mailto:logipilot@gmail.com" className="text-cyan-600 hover:underline">
                logipilot@gmail.com
              </a>
              {' '}ou WhatsApp{' '}
              <a href="https://wa.me/5511939369341" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                (11) 93936-9341
              </a>. Responderemos em até 15 dias úteis.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
