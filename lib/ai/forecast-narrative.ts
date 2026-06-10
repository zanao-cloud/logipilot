import { GoogleGenAI } from '@google/genai'
import type { ForecastOutput, SeriesPoint } from '@/lib/analysis/forecast'

const MODEL = 'gemini-2.5-flash'

const LOCALE_INSTRUCTION: Record<'pt' | 'en' | 'es', string> = {
  pt: 'Responda em português brasileiro.',
  en: 'Respond in English.',
  es: 'Responde en español.',
}

export async function generateForecastNarrative(args: {
  metricName: string
  unit?: string | null
  historical: SeriesPoint[]
  output: ForecastOutput
  analysisContext?: string
  locale?: 'pt' | 'en' | 'es'
}): Promise<string> {
  const { metricName, unit, historical, output, analysisContext, locale = 'pt' } = args
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return ''

  const ai = new GoogleGenAI({ apiKey })

  const system = `Você é um analista preditivo de operações logísticas. Recebe uma série temporal histórica e a previsão estatística gerada por um modelo (regressão linear, média móvel ou Holt). Sua função:
1. Interpretar a tendência em linguagem clara para o gestor
2. Apontar 1-2 riscos ou oportunidades concretas
3. Sugerir 1 ação prática
4. Sempre destacar limitações da previsão (incerteza, tamanho da amostra)

${LOCALE_INSTRUCTION[locale]}

Seja conciso (máx. 4 parágrafos curtos). Use markdown apenas para destaques em negrito.`

  const prompt = `Métrica: **${metricName}**${unit ? ` (${unit})` : ''}
Método: ${output.method} · RMSE in-sample: ${output.rmse.toFixed(3)}
Tendência prevista: ${output.trend} (${output.trendPct.toFixed(1)}%)

Histórico:
${historical.map((p, i) => `${i + 1}. ${p.label}: ${p.value}`).join('\n')}

Previsão (intervalo de confiança 95%):
${output.predictions.map((p, i) => `${i + 1}. ${p.label}: ${p.value.toFixed(2)} [IC ${p.ci_low.toFixed(2)} — ${p.ci_high.toFixed(2)}]`).join('\n')}

${analysisContext ? `\nContexto da análise:\n${analysisContext.slice(0, 800)}` : ''}

Gere a interpretação seguindo as regras do system prompt.`

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: system,
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    })
    return (response.text ?? '').trim()
  } catch (err) {
    console.error('[forecast-narrative] failed:', err)
    return ''
  }
}
