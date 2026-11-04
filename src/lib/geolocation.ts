import { useCallback, useState } from 'react'
import type { LatLng } from './geo.ts'

export type GeoStatus = 'idle' | 'loading' | 'ready' | 'denied'

export function useGeolocation(): {
  origin: LatLng | null
  status: GeoStatus
  locate: () => void
  clear: () => void
} {
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  const locate = useCallback(() => {
    if (!navigator.geolocation) return setStatus('denied')
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('ready')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  }, [])

  const clear = useCallback(() => {
    setOrigin(null)
    setStatus('idle')
  }, [])

  return { origin, status, locate, clear }
}
