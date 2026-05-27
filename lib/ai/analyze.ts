import { GoogleGenAI } from '@google/genai'
import type { AnalysisResult } from '@/types'

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada. Adicione a chave no .env.local.')
  }

  return new GoogleGenAI({ apiKey })
}

const SYSTEM_PROMPT = `Você é um analista operacional júnior especializado em diagnóstico de dados empresariais.

Sua função é analisar dados fornecidos pelo usuário (planilhas, relatórios, imagens, CSVs, PDFs) e gerar uma análise estruturada.

REGRAS FUNDAMENTAIS:
1. Use APENAS os dados fornecidos. NUNCA invente números, métricas ou informações não presentes nos dados.
2. Sempre separe claramente: fatos observados, hipóteses, recomendações e limitações.
3. Se os dados forem insuficientes para uma análise, indique explicitamente.
4. Seja preciso e objetivo. Evite linguagem vaga.
5. Para dashboards, extraia apenas dados que realmente existem nos arquivos.
6. Retorne APENAS o JSON válido pedido, sem texto adicional antes ou depois.`

const RESULT_SCHEMA = `Retorne SOMENTE este JSON (sem markdown, sem blocos de código, sem texto fora do JSON):
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
  const ai = getAI()
  const textParts: Array<{ text: string }> = []
  const inlineParts: Array<{ inlineData: { mimeType: string; data: string } }> = []

  textParts.push({
    text: `${SYSTEM_PROMPT}\n\n${RESULT_SCHEMA}\n\n${userContext ? `Contexto fornecido: ${userContext}\n\n` : ''}Analise os seguintes dados:`,
  })

  for (const file of files) {
    if (file.isImage && file.imageBase64) {
      textParts.push({ text: `\n--- Arquivo: ${file.name} ---` })
      inlineParts.push({
        inlineData: {
          mimeType: file.imageMediaType || 'image/jpeg',
          data: file.imageBase64,
        },
      })
    } else {
      textParts.push({ text: `\n--- Arquivo: ${file.name} (${file.type}) ---\n${file.content}` })
    }
  }

  const allParts = [...textParts, ...inlineParts]

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: allParts }],
    config: {
      maxOutputTokens: 8192,
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text ?? ''
  const cleanedText = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('IA não retornou JSON válido. Tente novamente.')

  try {
    return JSON.parse(jsonMatch[0]) as AnalysisResult
  } catch {
    throw new Error('IA retornou JSON mal formatado. Tente novamente com uma planilha menor ou mais limpa.')
  }
}

export async function chatWithData(
  analysisResult: AnalysisResult,
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const ai = getAI()
  const systemContext = `Você é um assistente de análise operacional. Responda perguntas sobre esta análise de dados.

Análise disponível (JSON):
${JSON.stringify(analysisResult, null, 2).slice(0, 30000)}

REGRAS:
- Responda apenas com base nos dados da análise acima
- Seja direto e objetivo, use markdown quando útil
- Se não houver dados suficientes para responder, diga claramente
- Separe fatos de hipóteses quando relevante`

  const history = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }))

  const chat = ai.chats.create({
    model: 'gemini-2.0-flash',
    history: [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Entendido. Estou pronto para responder perguntas sobre esta análise.' }] },
      ...history,
    ],
    config: { maxOutputTokens: 2048, temperature: 0.2 },
  })

  const response = await chat.sendMessage({ message: userMessage })
  return response.text ?? 'Não consegui processar sua pergunta.'
}
