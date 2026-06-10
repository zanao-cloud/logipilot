'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, Download, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { ChatMessage } from '@/types'
import type { ChatCitation } from '@/lib/ai/analyze'
import ReactMarkdown from 'react-markdown'
import { ChatMessageCitations } from '@/components/analysis/chat-message-citations'
import { useToast } from '@/components/ui/toast'

type ChatMessageWithCitations = ChatMessage & { citations?: ChatCitation[] }

const SUGGESTED_QUESTIONS = [
  'Quais são os principais problemas identificados?',
  'Qual é o item mais urgente do plano de ação?',
  'Quais indicadores estão abaixo do esperado?',
  'Que oportunidades existem para melhorar a eficiência?',
  'Há inconsistências graves nos dados?',
  'Resuma o diagnóstico em 3 pontos.',
]

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [analysisId, setAnalysisId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessageWithCitations[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    params.then(({ id }) => {
      setAnalysisId(id)
      fetch(`/api/analyses/${id}/chat`)
        .then(r => r.json())
        .then((data: Array<ChatMessage & { metadata?: { citations?: ChatCitation[] } }>) => {
          setMessages((data || []).map(m => ({
            ...m,
            citations: m.metadata?.citations,
          })))
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [params])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function createOptimisticMessage(role: 'user' | 'assistant', content: string, citations?: ChatCitation[]): ChatMessageWithCitations {
    return {
      id: `optimistic-${role}-${crypto.randomUUID()}`,
      analysis_id: analysisId,
      role,
      content,
      created_at: new Date().toISOString(),
      citations,
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || sending || !analysisId) return
    setInput('')
    setSending(true)

    const userMsg = createOptimisticMessage('user', content.trim())
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      })

      const data = await res.json()
      const assistantMsg = createOptimisticMessage('assistant', data.reply, data.citations)
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, createOptimisticMessage('assistant', 'Erro ao processar sua mensagem. Tente novamente.')])
    } finally {
      setSending(false)
    }
  }

  function exportConversation() {
    if (messages.length === 0) {
      toast({ variant: 'warning', title: 'Sem mensagens para exportar' })
      return
    }
    const lines = ['# Conversa com a IA — LogiPilot', '']
    for (const m of messages) {
      const who = m.role === 'user' ? '**Você**' : '**IA**'
      const ts = new Date(m.created_at).toLocaleString()
      lines.push(`### ${who} — ${ts}`)
      lines.push('')
      lines.push(m.content)
      if (m.citations && m.citations.length > 0) {
        lines.push('')
        lines.push('_Fontes:_ ' + m.citations.map(c => `${c.type}:${c.ref}`).join(' · '))
      }
      lines.push('')
      lines.push('---')
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa-logipilot-${analysisId.slice(0, 8)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ variant: 'success', title: 'Conversa exportada' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Chat com os dados</h2>
          <p className="text-sm text-slate-500">Faça perguntas sobre a análise. A IA responde apenas com base nos dados enviados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportConversation} className="gap-1.5 whitespace-nowrap">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* FAQ chips persistentes */}
      <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Perguntas frequentes">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 mr-1">
          <HelpCircle className="w-3 h-3" aria-hidden="true" /> Sugestões:
        </span>
        {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            disabled={sending}
            className="text-xs bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border border-slate-100 rounded-xl p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="w-16 h-16 bg-[#1E3A5F]/5 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-[#1E3A5F]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Pergunte sobre sua análise</p>
              <p className="text-sm text-slate-400 mt-1">Use uma das sugestões acima ou digite uma pergunta abaixo</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-[#1E3A5F] text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1E3A5F] text-white rounded-tr-sm'
                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none
                    prose-headings:font-semibold prose-headings:text-slate-800 prose-headings:mb-1 prose-headings:mt-3 first:prose-headings:mt-0
                    prose-h3:text-sm prose-h2:text-sm prose-h1:text-sm
                    prose-p:text-slate-700 prose-p:my-1
                    prose-strong:text-slate-800 prose-strong:font-semibold
                    prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                    prose-ol:my-1 prose-ol:pl-4">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === 'assistant' && <ChatMessageCitations citations={msg.citations} />}
              <span className="text-xs text-slate-400 mt-1 px-1">{formatDate(msg.created_at)}</span>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
        className="flex gap-2 mt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre os dados analisados..."
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none"
          disabled={sending}
        />
        <Button type="submit" disabled={!input.trim() || sending} className="px-4">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>

      <p className="text-xs text-slate-400 mt-2 text-center">
        A IA responde somente com base nos dados da análise · Respostas podem conter imprecisões
      </p>
    </div>
  )
}
