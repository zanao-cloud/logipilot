import Groq from 'groq-sdk'
import type { AnalysisResult } from '@/types'

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada.')
  return new Groq({ apiKey })
}

const SYSTEM_PROMPT = `Você é um analista operacional especializado em diagnóstico de dados empresariais.

Sua função é analisar dados fornecidos pelo usuário (planilhas, relatórios, CSVs, PDFs) e gerar uma análise estruturada.

REGRAS FUNDAMENTAIS:
1. Use APENAS os dados fornecidos. NUNCA invente números, métricas ou informações não presentes nos dados.
2. Sempre separe claramente: fatos observados, hipóteses, recomendações e limitações.
3. Se os dados forem insuficientes para uma análise, indique explicitamente.
4. Seja preciso e objetivo. Evite linguagem vaga.
5. Para dashboards, extraia apenas dados que realmente existem nos arquivos.
6. Retorne APENAS o JSON válido pedido, sem texto adicional antes ou depois.`

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
  const groq = getGroq()

  const parts: string[] = [
    `${SYSTEM_PROMPT}\n\n${RESULT_SCHEMA}`,
    userContext ? `Contexto fornecido pelo usuário: ${userContext}` : '',
    'Analise os seguintes dados:',
  ].filter(Boolean)

  for (const file of files) {
    parts.push(`\n--- Arquivo: ${file.name} (${file.type}) ---\n${file.content}`)
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: parts.join('\n') }],
    max_tokens: 8192,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''
  if (!text) throw new Error('IA não retornou resposta. Tente novamente.')

  try {
    return JSON.parse(text) as AnalysisResult
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON válido. Tente novamente.')
    return JSON.parse(jsonMatch[0]) as AnalysisResult
  }
}

export async function chatWithData(
  analysisResult: AnalysisResult,
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const groq = getGroq()

  const systemContext = `Você é um assistente de análise operacional. Responda perguntas sobre esta análise de dados.

Análise disponível (JSON):
${JSON.stringify(analysisResult, null, 2).slice(0, 30000)}

REGRAS:
- Responda apenas com base nos dados da análise acima
- Seja direto e objetivo, use markdown quando útil
- Se não houver dados suficientes para responder, diga claramente
- Separe fatos de hipóteses quando relevante`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemContext },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userMessage },
    ],
    max_tokens: 2048,
    temperature: 0.2,
  })

  return completion.choices[0]?.message?.content ?? 'Não consegui processar sua pergunta.'
}
