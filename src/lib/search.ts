import MiniSearch from 'minisearch'
import type { Partner } from '../types.ts'

const stripDiacritics = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')

const processTerm = (term: string): string => stripDiacritics(term.toLowerCase())

export function buildSearchIndex(partners: Partner[]): MiniSearch<Partner> {
  const index = new MiniSearch<Partner>({
    fields: ['entityName', 'name', 'subcategories', 'discountText', 'street'],
    extractField: (partner, field) => {
      switch (field) {
        case 'subcategories':
          return partner.categories.flatMap((c) => [c.name, ...c.subcategories]).join(' ')
        case 'discountText':
          return partner.discounts.map((d) => d.text).join(' ')
        case 'street':
          return partner.address.street ?? ''
        default:
          return String(partner[field as keyof Partner] ?? '')
      }
    },
    processTerm,
    searchOptions: {
      processTerm,
      prefix: true,
      fuzzy: 0.2,
      boost: { entityName: 4, name: 3, subcategories: 2 },
    },
  })
  index.addAll(partners)
  return index
}

export function searchRank(index: MiniSearch<Partner>, q: string): Map<string, number> | null {
  const trimmed = q.trim()
  if (trimmed.length < 2) return null
  return new Map(index.search(trimmed).map((hit, i) => [String(hit.id), i]))
}
