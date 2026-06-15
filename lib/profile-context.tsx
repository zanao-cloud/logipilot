'use client'

import { ProfileContext } from '@/lib/hooks/use-profile'
import type { UserProfile } from '@/lib/hooks/use-profile'

export function ProfileProvider({
  value,
  children,
}: {
  value: UserProfile | null
  children: React.ReactNode
}) {
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
