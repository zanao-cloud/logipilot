export type MetricLocale = 'pt' | 'en' | 'es'

export type MetricFormula = {
  /** Aliases (lowercase) que casam com `name` do indicador ou título do card */
  aliases: string[]
  formula: string
  description: Record<MetricLocale, string>
}

export const METRIC_FORMULAS: MetricFormula[] = [
  {
    aliases: ['otif', 'on time in full', 'pontualidade integral'],
    formula: 'OTIF = entregas no prazo e completas ÷ total de entregas',
    description: {
      pt: 'Mede o percentual de entregas feitas no prazo combinado E sem divergências de quantidade. Padrão de referência: ≥ 95% bom · 90-95% atenção · < 90% crítico.',
      en: 'Share of deliveries that arrived on time AND complete. Reference: ≥95% good · 90-95% attention · <90% critical.',
      es: 'Porcentaje de entregas hechas a tiempo Y completas. Referencia: ≥95% bueno · 90-95% atención · <90% crítico.',
    },
  },
  {
    aliases: ['custo por km', 'custo/km', 'cpk', 'cost per km'],
    formula: 'Custo por km = (combustível + manutenção + pedágio + outros) ÷ km rodados',
    description: {
      pt: 'Custo total dividido pelos km rodados no período. Quanto menor, melhor. Compare com benchmark da operação.',
      en: 'Total operational cost divided by kilometers run in the period. Lower is better.',
      es: 'Costo total dividido entre los km recorridos en el período. Menor es mejor.',
    },
  },
  {
    aliases: ['margem', 'margem operacional', 'margin'],
    formula: 'Margem = (receita − custo) ÷ receita',
    description: {
      pt: 'Quanto sobra de cada R$ faturado depois de pagar os custos diretos. ≥ 15% saudável · 5-15% atenção · < 5% crítico.',
      en: 'Share of revenue left after covering direct costs. ≥15% healthy · 5-15% attention · <5% critical.',
      es: 'Porcentaje de ingresos restantes tras costos directos. ≥15% saludable · 5-15% atención · <5% crítico.',
    },
  },
  {
    aliases: ['ocupação', 'taxa de ocupação', 'load factor', 'fill rate'],
    formula: 'Ocupação = volume utilizado ÷ capacidade total',
    description: {
      pt: 'Volume utilizado em relação à capacidade total do veículo. Baixa ocupação indica rotas com folga ou mix sub-ótimo.',
      en: 'Used volume over total vehicle capacity. Low fill suggests slack routes or sub-optimal mix.',
      es: 'Volumen utilizado sobre la capacidad total. Bajo nivel sugiere holgura o mezcla subóptima.',
    },
  },
  {
    aliases: ['lead time', 'tempo de ciclo', 'cycle time'],
    formula: 'Lead time = data de entrega − data de coleta/pedido',
    description: {
      pt: 'Tempo total entre o pedido (ou coleta) e a entrega ao destinatário. Inclui processamento + trânsito + última milha.',
      en: 'Total time from order/pickup to final delivery, including processing + transit + last mile.',
      es: 'Tiempo total desde el pedido/recogida hasta la entrega final.',
    },
  },
  {
    aliases: ['avarias', 'taxa de avaria', 'damage rate'],
    formula: 'Taxa de avaria = entregas com avaria ÷ total de entregas',
    description: {
      pt: 'Percentual de entregas com algum tipo de dano à mercadoria. Bom: < 0,5%. Acima de 1% requer ação.',
      en: 'Share of deliveries with damaged cargo. Good: <0.5%. Above 1% requires action.',
      es: 'Porcentaje de entregas con mercancía dañada. Bueno: <0,5%. Más de 1% requiere acción.',
    },
  },
  {
    aliases: ['devolução', 'taxa de devolução', 'return rate'],
    formula: 'Taxa de devolução = devoluções ÷ total de entregas',
    description: {
      pt: 'Percentual de cargas recusadas ou devolvidas pelo destinatário. Inclui falhas de roteirização, atrasos e divergências.',
      en: 'Share of shipments refused or returned by the recipient. Includes routing errors, delays, and divergences.',
      es: 'Porcentaje de cargas rechazadas o devueltas por el destinatario.',
    },
  },
  {
    aliases: ['consumo médio', 'km/l', 'km por litro', 'fuel efficiency'],
    formula: 'Consumo médio = km rodados ÷ litros consumidos',
    description: {
      pt: 'Eficiência de combustível em km/l. Varia muito por tipo de veículo, mas quedas constantes sinalizam manutenção ou condução agressiva.',
      en: 'Fuel efficiency in km/l. Drops over time suggest maintenance issues or aggressive driving.',
      es: 'Eficiencia de combustible en km/l. Caídas constantes pueden indicar mantenimiento o conducción agresiva.',
    },
  },
  {
    aliases: ['nps', 'satisfação', 'net promoter score'],
    formula: 'NPS = % promotores (9-10) − % detratores (0-6)',
    description: {
      pt: 'Indicador de satisfação do cliente. ≥ 50 excelente · 0-50 razoável · < 0 crítico.',
      en: 'Customer satisfaction indicator. ≥50 excellent · 0-50 acceptable · <0 critical.',
      es: 'Indicador de satisfacción del cliente. ≥50 excelente · 0-50 aceptable · <0 crítico.',
    },
  },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export function findMetricFormula(name: string): MetricFormula | null {
  const n = normalize(name)
  return METRIC_FORMULAS.find(m => m.aliases.some(a => n.includes(normalize(a)))) ?? null
}

export function getFormulaTooltip(name: string, locale: MetricLocale = 'pt'): { formula: string; description: string } | null {
  const m = findMetricFormula(name)
  if (!m) return null
  return {
    formula: m.formula,
    description: m.description[locale],
  }
}
