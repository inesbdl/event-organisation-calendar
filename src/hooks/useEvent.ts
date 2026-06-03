import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { EventState } from '../types'

export function useEvent(eventId: string | null) {
  const [state, setState] = useState<EventState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!eventId) return
    try {
      const data = await api.getEvent(eventId)
      setState(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!eventId) return
    const interval = setInterval(refresh, 2500)
    return () => clearInterval(interval)
  }, [eventId, refresh])

  return { state, loading, error, refresh, setState }
}
