'use client'

import { useEffect, useState } from 'react'

export interface UserProfile {
  id: string
  organization_id: string
  role: 'gestor' | 'operador' | 'motorista'
  full_name: string
  phone?: string
  vehicle_plate?: string
  organizations: { id: string; name: string } | null
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let retries = 0
    function attempt() {
      fetch('/api/profile')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) { setProfile(data); setLoading(false) }
          else if (retries < 2) { retries++; setTimeout(attempt, 1500) }
          else setLoading(false)
        })
        .catch(() => {
          if (retries < 2) { retries++; setTimeout(attempt, 1500) }
          else setLoading(false)
        })
    }
    attempt()
  }, [])

  return { profile, loading }
}
