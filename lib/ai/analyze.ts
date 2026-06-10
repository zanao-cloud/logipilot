import { GoogleGenAI, type Part } from '@google/genai'
import type { AnalysisResult } from '@/types'

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.')
  return new GoogleGenAI({ apiKey })
}

const MODEL = 'gemini-2.5-flash'

const SYSTEM_PROMPT = `Você é um analista operacional especializado em diagnóstico de dados empresariais.

Sua função é analisar dados fornecidos pelo usuário (planilhas, relatórios, CSVs, PDFs, imagens, prints de tela) e gerar uma análise estruturada.

REGRAS FUNDAMENTAIS:
1. Use APENAS os dados fornecidos. NUNCA invente números, métricas ou informações não presentes nos dados.
2. Para imagens: leia atentamente todo o conteúdo visual (números, gráficos, tabelas, textos) e baseie sua análise no que efetivamente está visível.
3. Sempre separe claramente: fatos observados, hipóteses, recomendações e limitações.
4. Se os dados forem insuficientes para uma análise, indique explicitamente.
5. Seja preciso e objetivo. Evite linguagem vaga.
6. Para dashboards, extraia apenas dados que realmente existem nos arquivos.
7. Retorne APENAS o JSON válido pedido, sem texto adicional antes ou depois.`

const RESULT_SCHEMA = `Retorne SOMENTE este JSON válido (sem markdown, sem blocos de código):
{
  "executive_summary": {
    "title": "string",
    "overview": "string",
    "key_highlights": ["string"],
    "period": "string ou null",
    "data_sources": ["string"]
  },
  "indicators": [
    { "name": "string", "value": "string", "unit": "string", "trend": "up|down|stable", "trend_value": "string", "category": "string", "status": "good|warning|critical|neutral" }
  ],
  "dashboard_data": {
    "charts": [
      { "id": "string", "title": "string", "type": "bar|line|pie|area", "data": [{"label": "string", "value": 0}], "x_key": "label", "y_keys": ["value"], "colors": ["#1E3A5F"] }
    ],
    "summary_cards": [
      { "title": "string", "value": "string", "change": "string", "trend": "up|down|stable" }
    ]
  },
  "diagnosis": {
    "overall_assessment": "string",
    "health_score": 0,
    "observed_facts": ["string"],
    "hypotheses": ["string"],
    "recommendations": ["string"],
    "priority_areas": ["string"]
  },
  "bottlenecks": [
    { "title": "string", "description": "string", "severity": "high|medium|low", "evidence": "string", "impact": "string" }
  ],
  "risks": [
    { "title": "string", "description": "string", "severity": "high|medium|low", "evidence": "string", "impact": "string" }
  ],
  "inconsistencies": [
    { "title": "string", "description": "string", "location": "string", "suggestion": "string", "severity": "high|medium|low" }
  ],
  "opportunities": [
    { "title": "string", "description": "string", "potential_impact": "string", "effort": "low|medium|high", "timeframe": "string" }
  ],
  "action_plan": [
    { "priority": 1, "title": "string", "description": "string", "responsible": "string", "deadline": "string", "expected_result": "string", "effort": "low|medium|high", "category": "immediate|short_term|medium_term" }
  ],
  "limitations": ["string"]
}`

interface FileInput {
  name: string
  type: string
  content: string
  isImage?: boolean
  imageBase64?: string
  imageMediaType?: string
}

export async function analyzeData(files: FileInput[], userContext?: string): Promise<AnalysisResult> {
  const ai = getGemini()
  const imageFiles = files.filter(f => f.isImage && f.imageBase64)
  const textFiles  = files.filter(f => !f.isImage)
  const hasImages  = imageFiles.length > 0

  const textParts: string[] = [
    `${SYSTEM_PROMPT}\n\n${RESULT_SCHEMA}`,
    userContext ? `Contexto fornecido pelo usuário: ${userContext}` : '',
  ].filter(Boolean)

  if (hasImages) {
    textParts.push(`\nForam enviadas ${imageFiles.length} imagem(ns) para análise visual:`)
    imageFiles.forEach(img => textParts.push(`- ${img.name} (${img.type})`))
  }

  if (textFiles.length > 0) {
    textParts.push('\nDados em texto/planilha enviados:')
    for (const file of textFiles) {
      textParts.push(`\n--- Arquivo: ${file.name} (${file.type}) ---\n${file.content}`)
    }
  }

  textParts.push('\nAnalise tudo (imagens + dados acima) e retorne SOMENTE o JSON pedido no schema.')

  const parts: Part[] = [{ text: textParts.join('\n') }]
  for (const img of imageFiles) {
    parts.push({
      inlineData: {
        mimeType: img.imageMediaType || 'image/jpeg',
        data: img.imageBase64!,
      },
    })
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      temperature: 0.1,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 1024 },
    },
  })

  const text = response.text ?? ''
  const finishReason = response.candidates?.[0]?.finishReason
  if (finishReason && finishReason !== 'STOP') {
    console.error('[gemini] non-STOP finishReason:', finishReason, 'usage:', response.usageMetadata)
  }
  return parseAIResult(text)
}

function parseAIResult(text: string): AnalysisResult {
  if (!text) throw new Error('IA não retornou resposta. Tente novamente.')

  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as AnalysisResult
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) as AnalysisResult } catch { /* fall through */ }
    }
    console.error('[gemini] invalid JSON, last 400 chars:', cleaned.slice(-400))
    throw new Error('IA não retornou JSON válido. Tente novamente.')
  }
}

export type ChatCitation = {
  type: 'indicator' | 'inconsistency' | 'action' | 'opportunity' | 'section'
  ref: string
  label?: string
}

export type ChatReply = {
  answer: string
  citations: ChatCitation[]
}

export async function chatWithData(
  analysisResult: AnalysisResult,
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<ChatReply> {
  const ai = getGemini()

  const systemContext = `Você é um assistente de análise operacional. Responda perguntas sobre esta análise de dados em português brasileiro.

Análise disponível (JSON):
${JSON.stringify(analysisResult, null, 2).slice(0, 30000)}

REGRAS:
- Responda apenas com base nos dados da análise acima
- Seja direto e objetivo, use markdown quando útil
- Se não houver dados suficientes para responder, diga claramente
- Separe fatos de hipóteses quando relevante
- Sempre que possível, cite suas fontes (indicador, inconsistência, ação ou seção) usando o campo "citations"

FORMATO OBRIGATÓRIO DE RESPOSTA (JSON puro, sem markdown):
{
  "answer": "sua resposta em markdown aqui",
  "citations": [
    { "type": "indicator", "ref": "<nome exato do indicador>", "label": "rótulo curto" },
    { "type": "inconsistency", "ref": "<título exato>", "label": "..." },
    { "type": "action", "ref": "<título da ação>", "label": "..." },
    { "type": "opportunity", "ref": "<título>", "label": "..." },
    { "type": "section", "ref": "diagnosis|executive_summary|action_plan|inconsistencies|opportunities", "label": "..." }
  ]
}`

  const history = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    config: {
      systemInstruction: systemContext,
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  })

  const raw = response.text ?? ''
  return parseChatReply(raw)
}

function parseChatReply(raw: string): ChatReply {
  if (!raw) return { answer: 'Não consegui processar sua pergunta.', citations: [] }
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (typeof parsed === 'object' && parsed && typeof parsed.answer === 'string') {
      return {
        answer: parsed.answer,
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      }
    }
  } catch { /* fall through */ }
  return { answer: cleaned || raw, citations: [] }
}
