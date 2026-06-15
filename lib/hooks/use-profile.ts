'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export interface UserProfile {
  id: string
  organization_id: string
  role: 'gestor' | 'operador' | 'motorista'
  full_name: string
  phone?: string
  vehicle_plate?: string
  avatar_url?: string | null
  organizations: { id: string; name: string } | null
}

// undefined = no provider in tree (legacy mode → hook will fetch)
// null      = provider in tree, but no profile
export const ProfileContext = createContext<UserProfile | null | undefined>(undefined)

export function useProfile() {
  const ctxProfile = useContext(ProfileContext)
  const hasCtx = ctxProfile !== undefined

  const [profile, setProfile] = useState<UserProfile | null>(hasCtx ? (ctxProfile as UserProfile | null) : null)
  const [loading, setLoading] = useState(!hasCtx)

  useEffect(() => {
    if (hasCtx) {
      setProfile(ctxProfile as UserProfile | null)
      setLoading(false)
      return
    }
    let cancelled = false
    let retries = 0
    function attempt() {
      fetch('/api/profile')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (cancelled) return
          if (data) { setProfile(data); setLoading(false) }
          else if (retries < 2) { retries++; setTimeout(attempt, 1500) }
          else setLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          if (retries < 2) { retries++; setTimeout(attempt, 1500) }
          else setLoading(false)
        })
    }
    attempt()
    return () => { cancelled = true }
  }, [hasCtx, ctxProfile])

  return { profile, loading }
}
