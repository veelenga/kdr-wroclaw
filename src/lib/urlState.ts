import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_QUERY, SORTS, TABS, type Query } from './filters.ts'

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | null =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : null

export function parseQuery(search: string): Query {
  const params = new URLSearchParams(search)
  return {
    q: params.get('q') ?? DEFAULT_QUERY.q,
    category: params.get('cat'),
    subcategory: params.get('sub'),
    tab: pick(params.get('tab'), TABS) ?? DEFAULT_QUERY.tab,
    sort: pick(params.get('sort'), SORTS) ?? DEFAULT_QUERY.sort,
  }
}

export function serializeQuery(query: Query): string {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.category) params.set('cat', query.category)
  if (query.subcategory) params.set('sub', query.subcategory)
  if (query.tab !== DEFAULT_QUERY.tab) params.set('tab', query.tab)
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort)
  const s = params.toString()
  return s ? `?${s}` : ''
}

export function useQueryState(): [Query, (patch: Partial<Query>) => void] {
  const [query, setQuery] = useState<Query>(() => parseQuery(window.location.search))

  useEffect(() => {
    const onPop = () => setQuery(parseQuery(window.location.search))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const update = useCallback((patch: Partial<Query>) => {
    setQuery((prev) => {
      const next = { ...prev, ...patch }
      if (patch.category !== undefined && patch.subcategory === undefined) next.subcategory = null
      const url = `${window.location.pathname}${serializeQuery(next)}`
      window.history.replaceState(null, '', url)
      return next
    })
  }, [])

  return [query, update]
}
