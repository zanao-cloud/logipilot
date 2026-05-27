import Anthropic from '@anthropic-ai/sdk'
import type { AnalysisResult } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Você é um analista operacional júnior especializado em diagnóstico de dados empresariais.

Sua função é analisar dados fornecidos pelo usuário (planilhas, relatórios, imagens, CSVs, PDFs) e gerar uma análise estruturada.

REGRAS FUNDAMENTAIS:
1. Use APENAS os dados fornecidos. NUNCA invente números, métricas ou informações não presentes nos dados.
2. Sempre separe claramente: fatos observados, hipóteses, recomendações e limitações.
3. Se os dados forem insuficientes para uma análise, indique explicitamente.
4. Seja preciso e objetivo. Evite linguagem vaga.
5. Para dashboards, extraia apenas dados que realmente existem nos arquivos.

Retorne SEMPRE um JSON válido no seguinte formato, sem texto adicional fora do JSON:`

const RESULT_SCHEMA = `{
  "executive_summary": {
    "title": "string - título descritivo baseado no conteúdo",
    "overview": "string - visão geral em 2-3 parágrafos",
    "key_highlights": ["string - 3 a 6 destaques principais"],
    "period": "string - período identificado nos dados (ou null)",
    "data_sources": ["string - fontes identificadas"]
  },
  "indicators": [
    {
      "name": "string",
      "value": "string ou número",
      "unit": "string (opcional)",
      "trend": "up|down|stable (opcional)",
      "trend_value": "string (opcional, ex: +12%)",
      "category": "string (ex: Financeiro, Operacional, Logístico)",
      "status": "good|warning|critical|neutral"
    }
  ],
  "dashboard_data": {
    "charts": [
      {
        "id": "string",
        "title": "string",
        "type": "bar|line|pie|area",
        "data": [{"label": "string", "value": number, "...outros campos conforme tipo"}],
        "x_key": "string",
        "y_keys": ["string"],
        "colors": ["string"]
      }
    ],
    "summary_cards": [
      {
        "title": "string",
        "value": "string",
        "change": "string (opcional)",
        "trend": "up|down|stable (opcional)"
      }
    ]
  },
  "diagnosis": {
    "overall_assessment": "string - avaliação geral em 1 parágrafo",
    "health_score": number (0-100),
    "observed_facts": ["string - fatos concretos observados nos dados"],
    "hypotheses": ["string - hipóteses baseadas nos padrões (indicar que são hipóteses)"],
    "recommendations": ["string - recomendações concretas"],
    "priority_areas": ["string - áreas que precisam de atenção imediata"]
  },
  "bottlenecks": [
    {
      "title": "string",
      "description": "string",
      "severity": "high|medium|low",
      "evidence": "string - evidência nos dados",
      "impact": "string"
    }
  ],
  "risks": [
    {
      "title": "string",
      "description": "string",
      "severity": "high|medium|low",
      "evidence": "string",
      "impact": "string"
    }
  ],
  "inconsistencies": [
    {
      "title": "string",
      "description": "string",
      "location": "string - onde foi encontrado",
      "suggestion": "string",
      "severity": "high|medium|low"
    }
  ],
  "opportunities": [
    {
      "title": "string",
      "description": "string",
      "potential_impact": "string",
      "effort": "low|medium|high",
      "timeframe": "string (ex: 30 dias, 3 meses)"
    }
  ],
  "action_plan": [
    {
      "priority": number (1=mais urgente),
      "title": "string",
      "description": "string",
      "responsible": "string (opcional)",
      "deadline": "string",
      "expected_result": "string",
      "effort": "low|medium|high",
      "category": "immediate|short_term|medium_term"
    }
  ],
  "limitations": ["string - limitações desta análise, dados faltantes, alertas sobre qualidade dos dados"]
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
  const contentBlocks: Anthropic.MessageParam['content'] = []

  contentBlocks.push({
    type: 'text',
    text: `Analise os seguintes dados operacionais e retorne o JSON estruturado conforme o schema.\n\n${RESULT_SCHEMA}\n\n${userContext ? `Contexto adicional fornecido pelo usuário: ${userContext}\n\n` : ''}Arquivos para análise:`,
  })

  for (const file of files) {
    if (file.isImage && file.imageBase64 && file.imageMediaType) {
      if (file.imageMediaType === 'application/pdf') {
        contentBlocks.push({
          type: 'text',
          text: `\n--- Arquivo PDF: ${file.name} ---`,
        })
        contentBlocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.imageBase64,
          },
        } as Anthropic.DocumentBlockParam)
      } else {
        contentBlocks.push({
          type: 'text',
          text: `\n--- Imagem: ${file.name} ---`,
        })
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.imageMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: file.imageBase64,
          },
        })
      }
    } else {
      contentBlocks.push({
        type: 'text',
        text: `\n--- Arquivo: ${file.name} (${file.type}) ---\n${file.content}`,
      })
    }
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  const responseText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('IA não retornou JSON válido')

  return JSON.parse(jsonMatch[0]) as AnalysisResult
}

export async function chatWithData(
  analysisResult: AnalysisResult,
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `Você é um analista operacional assistente. Responda perguntas sobre esta análise de dados.

Análise disponível:
${JSON.stringify(analysisResult, null, 2)}

REGRAS:
- Responda apenas com base nos dados analisados
- Seja direto e objetivo
- Se não souber ou os dados não permitirem responder, diga claramente
- Use formatação markdown quando útil
- Separe fatos de hipóteses quando relevante`

  const apiMessages = [
    ...messages,
    { role: 'user' as const, content: userMessage },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: apiMessages,
  })

  return (response.content[0] as Anthropic.TextBlock).text
}
