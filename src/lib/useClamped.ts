import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

export function useClamped<T extends HTMLElement>(text: string): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [clamped, setClamped] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return [ref, clamped]
}
