import Groq from 'groq-sdk'
import type { AnalysisResult } from '@/types'

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada.')
  return new Groq({ apiKey })
}

// Multimodal model — accepts both text and images
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
// Text-only fallback for when no images are present (faster, cheaper)
const TEXT_MODEL = 'llama-3.1-8b-instant'

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

type GroqContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export async function analyzeData(files: FileInput[], userContext?: string): Promise<AnalysisResult> {
  const groq = getGroq()
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

  if (hasImages) {
    // Multimodal request — text + image parts
    const content: GroqContentPart[] = [{ type: 'text', text: textParts.join('\n') }]
    for (const img of imageFiles) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${img.imageMediaType || 'image/jpeg'};base64,${img.imageBase64}` },
      })
    }

    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [{ role: 'user', content: content as never }],
      max_tokens: 8192,
      temperature: 0.1,
    })

    return parseAIResult(completion.choices[0]?.message?.content ?? '')
  }

  // Text-only path — keep the lighter/faster model and json_object enforcement
  const completion = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: 'user', content: textParts.join('\n') }],
    max_tokens: 8192,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  return parseAIResult(completion.choices[0]?.message?.content ?? '')
}

function parseAIResult(text: string): AnalysisResult {
  if (!text) throw new Error('IA não retornou resposta. Tente novamente.')

  // Strip code fences in case the vision model wraps the JSON
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as AnalysisResult
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
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
    model: TEXT_MODEL,
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
