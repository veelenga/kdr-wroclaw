import type { Discount, Partner } from '../../src/types.ts'
import { bestDiscount, parseDiscount } from '../../src/lib/discount.ts'
import type { RawDetails, RawDoc } from './kdr-api.ts'

const text = (value: unknown): string | null => {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s.length > 0 ? s : null
}

const id = (value: unknown): string | null =>
  value === undefined || value === null ? null : String(value)

const SMALL_WORDS = new Set([
  'i',
  'w',
  'we',
  'z',
  'ze',
  'na',
  'do',
  'od',
  'o',
  'u',
  'a',
  'oraz',
  'dla',
  'przy',
  'pod',
  'im',
  'o.o',
  'z o.o',
])

const capitalize = (word: string): string =>
  word.replace(
    /(^|[-/."'(])(\p{L})/gu,
    (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl'),
  )

const titleCase = (value: string): string =>
  value
    .toLocaleLowerCase('pl')
    .split(/(\s+)/)
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word.replace(/[.,]+$/, '')) ? word : capitalize(word),
    )
    .join('')

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export const stripHtml = (value: string): string =>
  value
    .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
      if (code[0] === '#')
        return String.fromCodePoint(
          parseInt(code.slice(code[1] === 'x' ? 2 : 1), code[1] === 'x' ? 16 : 10),
        )
      return ENTITIES[code.toLowerCase()] ?? match
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()

const isUpperCase = (value: string): boolean =>
  value === value.toLocaleUpperCase('pl') && /\p{L}/u.test(value)

const normalizeWebsite = (value: string | null): string | null => {
  if (!value) return null
  const trimmed = value.replace(/\s+/g, '')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const parseGeo = (geo: string | undefined): Partner['location'] => {
  const parts = (geo ?? '').split(',').map((p) => Number(p.trim()))
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null
  return { lat: parts[0], lng: parts[1] }
}

const parseCategories = (raw: string[] | undefined): Partner['categories'] =>
  (raw ?? []).map((entry) => {
    const [name, ...subcategories] = entry.split(';').map((s) => s.trim())
    return { name, subcategories: subcategories.filter(Boolean) }
  })

const parseDiscounts = (details: RawDetails | null): Discount[] =>
  (details?.ulga ?? [])
    .map((ulga) => stripHtml((ulga.rodzajUlgi ?? '').replace(/\r\n/g, '\n')))
    .map((body, i) => ({
      text: body,
      from: text(details?.ulga?.[i].okresObowiazywaniaOd),
      to: text(details?.ulga?.[i].okresObowiazywaniaDo),
      ...parseDiscount(body),
    }))
    .filter((d) => d.text.length > 0)

const isoDate = (value: string | undefined): string | null => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '')
  return match ? match[1] : null
}

const earliest = (dates: (string | null)[]): string | null =>
  dates.filter((d): d is string => d !== null).sort()[0] ?? null

const SHOUTING_MIN_LENGTH = 12

const unshout = (value: string | null): string | null =>
  value && value.length >= SHOUTING_MIN_LENGTH && isUpperCase(value) ? titleCase(value) : value

const cased = (preferred: string | undefined, fallback: string | undefined): string | null => {
  const value = text(preferred) ?? text(fallback)
  if (!value) return null
  return isUpperCase(value) ? titleCase(value) : value
}

export function normalizePartner(doc: RawDoc, details: RawDetails | null = null): Partner {
  const discounts = parseDiscounts(details)
  const address = details?.daneAdresowe
  return {
    id: String(doc.ID),
    entityId: id(doc.ID_PODMIOT),
    name: unshout(text(doc.NAZWA) ?? text(details?.nazwa)) ?? '',
    entityName: unshout(text(doc.PODM_NAZWA) ?? text(doc.NAZWA)) ?? '',
    logoId: id(doc.ID_LOGO ?? details?.idLogo),
    categories: parseCategories(doc.KATEGORIE),
    address: {
      street: cased(address?.ulica, doc.ULICA),
      postalCode: text(doc.KOD_POCZTOWY) ?? text(address?.kodPocztowy),
      city: cased(address?.miejscowosc, doc.MIEJSCOWOSC),
      district: cased(address?.powiat, doc.POWIAT),
    },
    location: parseGeo(doc.GEO),
    phone: text(doc.NR_TELEFONU) ?? text(details?.nrTelefonu),
    email: text(doc.EMAIL) ?? text(details?.email),
    website: normalizeWebsite(text(doc.STRONA_WWW) ?? text(details?.stronawww)),
    discounts,
    bestDiscount: bestDiscount(discounts),
    since: isoDate(doc.DATA_OBOWIAZYWANIA_OD) ?? earliest(discounts.map((d) => d.from)),
  }
}
