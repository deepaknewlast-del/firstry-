import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Profile {
  church_name: string | null
  denomination: string | null
  brand_accent_color: string | null
  logo_path: string | null
  subscription_status: 'free' | 'active' | 'past_due' | 'canceled'
  bulletins_generated_total: number
}

export function useSubscription() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    // Keep loading=true while auth resolves into a profile fetch, so paid-gate
    // UI (e.g. the navbar Upgrade pill) never flashes for paid users.
    setLoading(true)
    let cancelled = false
    supabase
      .from('profiles')
      .select('church_name, denomination, brand_accent_color, logo_path, subscription_status, bulletins_generated_total')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setProfile((data as Profile) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const isPaid = profile?.subscription_status === 'active'
  const isAtFreeLimit = !isPaid && (profile?.bulletins_generated_total ?? 0) >= 3
  const freeUsed = Math.min(profile?.bulletins_generated_total ?? 0, 3)

  return { profile, loading, isPaid, isAtFreeLimit, freeUsed }
}
