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
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { profile, loading }
}
