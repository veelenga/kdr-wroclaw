import type { Discount, DiscountKind } from '../types.ts'

const FREE_WORDS =
  /\b(bezpłatn|bezplatn|darmow|za darmo|gratis|nieodpłatn|bez opłat|wstęp wolny|100\s?%)/i
const PERCENT = /(\d{1,3}(?:[.,]\d+)?)\s*(?:%|proc\b|procent)/gi
const AMOUNT = /(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:zł|pln|złot)/gi
const CAP_WORDS =
  /(przekrocz|maksymaln|max\b|LTV|oprocentowan|wskaźnik|RRSO|marż|prowizj|VAT|podat)/i
const DISCOUNT_WORDS = /(zniżk|rabat|upust|taniej|obniż|oszczędn|bon\b|mniej|odliczen|zwrot)/i
const CONTEXT_CHARS = 60

const toNumber = (raw: string): number => Number(raw.replace(',', '.'))

export function parseDiscount(text: string): { kind: DiscountKind; value: number | null } {
  const percents = [...text.matchAll(PERCENT)]
    .filter((m) => !CAP_WORDS.test(text.slice(Math.max(0, m.index - CONTEXT_CHARS), m.index)))
    .map((m) => toNumber(m[1]))
    .filter((v) => v < 100)
  if (percents.length > 0) return { kind: 'percent', value: Math.max(...percents) }
  if (FREE_WORDS.test(text)) return { kind: 'free', value: 100 }
  const amounts = [...text.matchAll(AMOUNT)]
  const discounted = amounts.find((m) =>
    DISCOUNT_WORDS.test(
      text.slice(Math.max(0, m.index - CONTEXT_CHARS), m.index + m[0].length + CONTEXT_CHARS),
    ),
  )
  if (discounted) return { kind: 'amount', value: toNumber(discounted[1]) }
  if (amounts.length > 0)
    return { kind: 'price', value: Math.min(...amounts.map((m) => toNumber(m[1]))) }
  return { kind: 'other', value: null }
}

const KIND_RANK: Record<DiscountKind, number> = {
  percent: 4,
  free: 3,
  amount: 2,
  price: 1,
  other: 0,
}
const FREE_SCORE = 25

export function bestDiscount(discounts: Discount[]): Pick<Discount, 'kind' | 'value'> | null {
  if (discounts.length === 0) return null
  return discounts
    .map(({ kind, value }) => ({ kind, value }))
    .sort((a, b) => KIND_RANK[b.kind] - KIND_RANK[a.kind] || (b.value ?? 0) - (a.value ?? 0))[0]
}

export function discountScore(best: Pick<Discount, 'kind' | 'value'> | null): number {
  if (!best) return -1
  switch (best.kind) {
    case 'percent':
      return best.value ?? 0
    case 'free':
      return FREE_SCORE
    case 'amount':
      return 1 + Math.min(best.value ?? 0, 999) / 1000
    case 'price':
      return 0.5
    default:
      return 0
  }
}
