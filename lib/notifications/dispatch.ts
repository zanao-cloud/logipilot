import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnalysisResult } from '@/types'

export type NotificationType =
  | 'analysis_completed'
  | 'analysis_failed'
  | 'critical_inconsistency'
  | 'comment_added'

export type NotificationPayload = {
  analysis_id?: string
  title?: string
  count?: number
  message?: string
  [key: string]: unknown
}

export async function notify(
  admin: SupabaseClient,
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
): Promise<void> {
  try {
    await admin.from('notifications').insert({
      user_id: userId,
      type,
      payload,
    })
  } catch (err) {
    console.error('[notify] failed to insert notification', err)
  }
}

export async function dispatchAnalysisNotifications(
  admin: SupabaseClient,
  userId: string,
  analysisId: string,
  title: string,
  result: AnalysisResult,
): Promise<void> {
  await notify(admin, userId, 'analysis_completed', { analysis_id: analysisId, title })

  const critical = (result.inconsistencies ?? []).filter((i) => i.severity === 'high')
  if (critical.length > 0) {
    await notify(admin, userId, 'critical_inconsistency', {
      analysis_id: analysisId,
      title,
      count: critical.length,
      message: critical[0]?.title,
    })
  }
}
