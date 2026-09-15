import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Profile {
  church_name: string | null
  subscription_status: 'free' | 'active' | 'past_due' | 'canceled'
  bulletins_generated_total: number
}

export function useSubscription() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('church_name, subscription_status, bulletins_generated_total')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile((data as Profile) ?? null)
        setLoading(false)
      })
  }, [user])

  const isPaid = profile?.subscription_status === 'active'
  const isAtFreeLimit = !isPaid && (profile?.bulletins_generated_total ?? 0) >= 3
  const freeUsed = Math.min(profile?.bulletins_generated_total ?? 0, 3)

  return { profile, loading, isPaid, isAtFreeLimit, freeUsed }
}
