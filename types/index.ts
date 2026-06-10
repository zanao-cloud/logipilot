export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'error'

export interface Member {
  id: string
  full_name: string
  role: 'gestor' | 'operador' | 'motorista'
  phone?: string
  vehicle_plate?: string
  created_at?: string
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content?: string
}

export interface AnalysisResult {
  executive_summary: {
    title: string
    overview: string
    key_highlights: string[]
    period?: string
    data_sources: string[]
  }
  indicators: Indicator[]
  dashboard_data?: DashboardData
  diagnosis: AIDiagnosis
  bottlenecks: Issue[]
  risks: Issue[]
  inconsistencies: Inconsistency[]
  opportunities: Opportunity[]
  action_plan: ActionItem[]
  limitations: string[]
}

export interface Indicator {
  name: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trend_value?: string
  category: string
  status: 'good' | 'warning' | 'critical' | 'neutral'
}

export interface DashboardData {
  charts: Chart[]
  summary_cards: SummaryCard[]
}

export interface Chart {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'composed'
  data: Record<string, unknown>[]
  x_key?: string
  y_keys?: string[]
  colors?: string[]
}

export interface SummaryCard {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'stable'
}

export interface AIDiagnosis {
  overall_assessment: string
  health_score: number
  observed_facts: string[]
  hypotheses: string[]
  recommendations: string[]
  priority_areas: string[]
}

export interface Issue {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  evidence: string
  impact: string
}

export interface Inconsistency {
  title: string
  description: string
  location: string
  suggestion: string
  severity: 'high' | 'medium' | 'low'
}

export interface Opportunity {
  title: string
  description: string
  potential_impact: string
  effort: 'low' | 'medium' | 'high'
  timeframe: string
}

export interface ActionItem {
  priority: number
  title: string
  description: string
  responsible?: string
  deadline: string
  expected_result: string
  effort: 'low' | 'medium' | 'high'
  category: 'immediate' | 'short_term' | 'medium_term'
}

export interface Analysis {
  id: string
  user_id: string
  organization_id?: string | null
  title: string
  status: AnalysisStatus
  created_at: string
  updated_at: string
  files: UploadedFile[]
  result?: AnalysisResult
  error_message?: string
  tags?: string[]
  consent_ai_at?: string | null
  progress_pct?: number
  progress_stage?: string | null
  project_id?: string | null
  driver_id?: string | null
  period_start?: string | null
  period_end?: string | null
}

export interface Project {
  id: string
  organization_id: string
  name: string
  client_name?: string | null
  created_at: string
}

export interface NotificationRecord {
  id: string
  user_id: string
  type: 'analysis_completed' | 'analysis_failed' | 'critical_inconsistency' | 'comment_added'
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  analysis_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
