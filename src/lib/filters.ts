import type { Partner } from '../types.ts'
import { isInteresting } from './categories.ts'
import { discountScore } from './discount.ts'
import { distanceKm, type LatLng } from './geo.ts'

export const TABS = ['all', 'top', 'fun', 'new', 'favorites'] as const
export type Tab = (typeof TABS)[number]

export const SORTS = ['relevance', 'discount', 'newest', 'name', 'distance'] as const
export type SortKey = (typeof SORTS)[number]

export interface Query {
  q: string
  category: string | null
  subcategory: string | null
  tab: Tab
  sort: SortKey
}

export const DEFAULT_QUERY: Query = {
  q: '',
  category: null,
  subcategory: null,
  tab: 'all',
  sort: 'relevance',
}

export interface QueryContext {
  searchRank: Map<string, number> | null
  favorites: ReadonlySet<string>
  origin: LatLng | null
}

const NEW_WINDOW_DAYS = 180

export const isNew = (partner: Partner, now: Date = new Date()): boolean => {
  if (!partner.since) return false
  const age = (now.getTime() - new Date(partner.since).getTime()) / 86_400_000
  return age <= NEW_WINDOW_DAYS
}

const matchesTab = (partner: Partner, tab: Tab, ctx: QueryContext, now: Date): boolean => {
  switch (tab) {
    case 'all':
      return true
    case 'top':
      return discountScore(partner.bestDiscount) >= 1
    case 'fun':
      return partner.categories.some((c) => isInteresting(c.name, c.subcategories))
    case 'new':
      return isNew(partner, now)
    case 'favorites':
      return ctx.favorites.has(partner.id)
  }
}

export const matchesCategory = (
  partner: Partner,
  category: string | null,
  subcategory: string | null,
) =>
  !category ||
  partner.categories.some(
    (c) => c.name === category && (!subcategory || c.subcategories.includes(subcategory)),
  )

export function filterPartners(
  partners: Partner[],
  query: Query,
  ctx: QueryContext,
  now = new Date(),
): Partner[] {
  return partners.filter(
    (p) =>
      (!ctx.searchRank || ctx.searchRank.has(p.id)) &&
      matchesTab(p, query.tab, ctx, now) &&
      matchesCategory(p, query.category, query.subcategory),
  )
}

const sortKey = (p: Partner): string => p.entityName.replace(/^[^\p{L}\p{N}]+/u, '')

const effectiveSort = (query: Query, ctx: QueryContext): SortKey => {
  if (query.sort !== 'relevance') return query.sort
  if (ctx.searchRank) return 'relevance'
  if (query.tab === 'top') return 'discount'
  if (query.tab === 'new') return 'newest'
  if (ctx.origin) return 'distance'
  return 'name'
}

export function sortPartners(partners: Partner[], query: Query, ctx: QueryContext): Partner[] {
  const sort = effectiveSort(query, ctx)
  const byName = (a: Partner, b: Partner) => sortKey(a).localeCompare(sortKey(b), 'pl')
  const comparators: Record<SortKey, (a: Partner, b: Partner) => number> = {
    relevance: (a, b) => (ctx.searchRank?.get(a.id) ?? 0) - (ctx.searchRank?.get(b.id) ?? 0),
    discount: (a, b) =>
      discountScore(b.bestDiscount) - discountScore(a.bestDiscount) || byName(a, b),
    newest: (a, b) => (b.since ?? '').localeCompare(a.since ?? '') || byName(a, b),
    name: byName,
    distance: (a, b) => {
      if (!ctx.origin) return byName(a, b)
      const da = a.location ? distanceKm(ctx.origin, a.location) : Infinity
      const db = b.location ? distanceKm(ctx.origin, b.location) : Infinity
      return da - db || byName(a, b)
    },
  }
  return [...partners].sort(comparators[sort])
}

export function countByCategory(partners: Partner[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const p of partners) {
    for (const c of p.categories) counts.set(c.name, (counts.get(c.name) ?? 0) + 1)
  }
  return counts
}

export function countBySubcategory(partners: Partner[], category: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const p of partners) {
    for (const c of p.categories) {
      if (c.name !== category) continue
      for (const s of c.subcategories) counts.set(s, (counts.get(s) ?? 0) + 1)
    }
  }
  return counts
}
