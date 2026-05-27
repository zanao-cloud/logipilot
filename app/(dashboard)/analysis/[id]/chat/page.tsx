'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [analysisId, setAnalysisId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    params.then(({ id }) => {
      setAnalysisId(id)
      fetch(`/api/analyses/${id}/chat`)
        .then(r => r.json())
        .then(data => { setMessages(data || []); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [params])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const suggestedQuestions = [
    'Quais são os principais problemas identificados?',
    'Qual é o item mais urgente do plano de ação?',
    'Quais indicadores estão abaixo do esperado?',
    'Que oportunidades existem para melhorar a eficiência?',
  ]

  function createOptimisticMessage(role: 'user' | 'assistant', content: string): ChatMessage {
    return {
      id: `optimistic-${role}-${crypto.randomUUID()}`,
      analysis_id: analysisId,
      role,
      content,
      created_at: new Date().toISOString(),
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
      const assistantMsg = createOptimisticMessage('assistant', data.reply)
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, createOptimisticMessage('assistant', 'Erro ao processar sua mensagem. Tente novamente.')])
    } finally {
      setSending(false)
    }
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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Chat com os dados</h2>
        <p className="text-sm text-slate-500">Faça perguntas sobre a análise. A IA responde apenas com base nos dados enviados.</p>
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
              <p className="text-sm text-slate-400 mt-1">Experimente uma das sugestões abaixo</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 transition-colors text-slate-700"
                >
                  {q}
                </button>
              ))}
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
