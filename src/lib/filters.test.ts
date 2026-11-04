import { describe, expect, it } from 'vitest'
import type { Partner } from '../types.ts'
import { DEFAULT_QUERY, filterPartners, sortPartners, type QueryContext } from './filters.ts'

const partner = (overrides: Partial<Partner>): Partner => ({
  id: '1',
  entityId: null,
  name: 'A',
  entityName: 'A',
  logoId: null,
  categories: [{ name: 'Usługi', subcategories: ['Pozostałe'] }],
  address: { street: null, postalCode: null, city: null, district: null },
  location: null,
  phone: null,
  email: null,
  website: null,
  discounts: [],
  bestDiscount: null,
  since: null,
  ...overrides,
})

const ctx: QueryContext = { searchRank: null, favorites: new Set(), origin: null }
const now = new Date('2026-11-04')

const partners = [
  partner({
    id: '1',
    entityName: 'Teatr',
    categories: [{ name: 'Kultura', subcategories: ['Teatr'] }],
    bestDiscount: { kind: 'percent', value: 20 },
    since: '2026-10-01',
  }),
  partner({
    id: '2',
    entityName: 'Optyk',
    categories: [{ name: 'Zdrowie', subcategories: ['Wyroby medyczne'] }],
    bestDiscount: { kind: 'percent', value: 5 },
    since: '2018-01-01',
  }),
  partner({
    id: '3',
    entityName: 'Bar',
    categories: [{ name: 'Żywność', subcategories: ['Bary'] }],
    bestDiscount: { kind: 'free', value: 100 },
    since: '2020-01-01',
  }),
  partner({
    id: '4',
    entityName: 'Sklep',
    categories: [{ name: 'Żywność', subcategories: ['Sklepy'] }],
    bestDiscount: { kind: 'other', value: null },
  }),
]

describe('filterPartners', () => {
  it('filters by category and subcategory', () => {
    const ids = filterPartners(
      partners,
      { ...DEFAULT_QUERY, category: 'Żywność', subcategory: 'Bary' },
      ctx,
      now,
    ).map((p) => p.id)
    expect(ids).toEqual(['3'])
  })
  it('keeps only interesting partners on the fun tab', () => {
    const ids = filterPartners(partners, { ...DEFAULT_QUERY, tab: 'fun' }, ctx, now).map(
      (p) => p.id,
    )
    expect(ids).toEqual(['1', '3'])
  })
  it('keeps only recent partners on the new tab', () => {
    const ids = filterPartners(partners, { ...DEFAULT_QUERY, tab: 'new' }, ctx, now).map(
      (p) => p.id,
    )
    expect(ids).toEqual(['1'])
  })
  it('respects the search ranking set', () => {
    const ranked = { ...ctx, searchRank: new Map([['2', 0]]) }
    expect(filterPartners(partners, DEFAULT_QUERY, ranked, now).map((p) => p.id)).toEqual(['2'])
  })
})

describe('sortPartners', () => {
  it('sorts by discount on the top tab by default', () => {
    const ids = sortPartners(partners, { ...DEFAULT_QUERY, tab: 'top' }, ctx).map((p) => p.id)
    expect(ids).toEqual(['3', '1', '2', '4'])
  })
  it('sorts by distance when an origin is known', () => {
    const located = partners.map((p, i) => ({ ...p, location: { lat: 51 + i * 0.01, lng: 17 } }))
    const ids = sortPartners(located, DEFAULT_QUERY, {
      ...ctx,
      origin: { lat: 51.03, lng: 17 },
    }).map((p) => p.id)
    expect(ids).toEqual(['4', '3', '2', '1'])
  })
  it('sorts by search relevance when searching', () => {
    const ranked = {
      ...ctx,
      searchRank: new Map([
        ['2', 0],
        ['1', 1],
      ]),
    }
    const ids = sortPartners(partners.slice(0, 2), DEFAULT_QUERY, ranked).map((p) => p.id)
    expect(ids).toEqual(['2', '1'])
  })
})
