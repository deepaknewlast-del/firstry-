import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Bulletin {
  id: string
  title: string
  service_date: string
  created_at: string
  pdf_url: string | null
  generated_content: unknown
}

export function useBulletins() {
  const { user } = useAuth()
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('bulletins')
      .select('id, title, service_date, created_at, pdf_url, generated_content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setBulletins((data as Bulletin[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  const deleteBulletin = async (id: string) => {
    await supabase.from('bulletins').delete().eq('id', id)
    setBulletins((b) => b.filter((x) => x.id !== id))
  }

  return { bulletins, loading, refetch, deleteBulletin }
}
