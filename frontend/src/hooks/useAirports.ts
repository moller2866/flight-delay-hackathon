import { useCallback, useEffect, useState } from 'react'
import { fetchAirports, ApiError } from '../api'
import type { Airport } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

let cachedAirports: Airport[] | null = null

export function useAirports() {
  const [airports, setAirports] = useState<Airport[]>(cachedAirports ?? [])
  const [status, setStatus] = useState<Status>(cachedAirports ? 'success' : 'idle')
  const [error, setError] = useState<string | null>(null)

  const loadAirports = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const data = await fetchAirports()
      cachedAirports = data
      setAirports(data)
      setStatus('success')
    } catch (err) {
      console.error('Failed to fetch airports', err)
      setStatus('error')
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to load airports. Please try again.')
      }
    }
  }, [])

  useEffect(() => {
    if (!cachedAirports) {
      void loadAirports()
    }
  }, [loadAirports])

  return {
    airports,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    refetch: loadAirports,
  }
}
