import { describe, expect, it } from 'vitest'
import { bestDiscount, discountScore, parseDiscount } from './discount.ts'

describe('parseDiscount', () => {
  it('picks the largest percentage', () => {
    expect(parseDiscount('10% na bilety, 20 % na karnety')).toEqual({ kind: 'percent', value: 20 })
  })
  it('ignores percentages that describe a cap or a financial rate', () => {
    expect(
      parseDiscount(
        'Zniżka do 10 % za całość zakupów. Łącznie rabat nie może przekroczyć 90 % wartości zakupu.',
      ),
    ).toEqual({ kind: 'percent', value: 10 })
    expect(parseDiscount('Obniżenie marży o 0,2% oraz oprocentowanie 2,50%')).toEqual({
      kind: 'other',
      value: null,
    })
  })
  it('handles decimals with comma and "proc"', () => {
    expect(parseDiscount('rabat 7,5 proc.')).toEqual({ kind: 'percent', value: 7.5 })
  })
  it('ignores percentages above 100', () => {
    expect(parseDiscount('do 150% zwrotu')).toEqual({ kind: 'other', value: null })
  })
  it('treats free entries and "100%" as a free perk', () => {
    expect(parseDiscount('Wstęp bezpłatny dla dzieci')).toEqual({ kind: 'free', value: 100 })
    expect(parseDiscount('100% rabatu na próbny trening')).toEqual({ kind: 'free', value: 100 })
  })
  it('takes the first amount in zł, not thresholds mentioned later', () => {
    expect(parseDiscount('50 zł zniżki przy zakupach powyżej 499zł')).toEqual({
      kind: 'amount',
      value: 50,
    })
  })
  it('treats an amount without discount words as a fixed price', () => {
    expect(parseDiscount('Bilety w cenie 16 zł na seanse repertuarowe')).toEqual({
      kind: 'price',
      value: 16,
    })
    expect(parseDiscount('Bilet specjalny KDR – wystawy łączone – 5 zł, stała – 3 zł')).toEqual({
      kind: 'price',
      value: 3,
    })
  })
  it('recognises "bez opłat" as free', () => {
    expect(parseDiscount('trzecie dziecko bez opłat')).toEqual({ kind: 'free', value: 100 })
  })
})

describe('bestDiscount', () => {
  it('prefers a percentage over a free perk over an amount', () => {
    const best = bestDiscount([
      { text: '', from: null, to: null, kind: 'amount', value: 50 },
      { text: '', from: null, to: null, kind: 'free', value: 100 },
      { text: '', from: null, to: null, kind: 'percent', value: 10 },
    ])
    expect(best).toEqual({ kind: 'percent', value: 10 })
  })
  it('returns null for no discounts', () => {
    expect(bestDiscount([])).toBeNull()
  })
})

describe('discountScore', () => {
  it('orders big percent, free perk, small percent, amount, other', () => {
    const scores = [
      { kind: 'percent', value: 30 },
      { kind: 'free', value: 100 },
      { kind: 'percent', value: 10 },
      { kind: 'amount', value: 20 },
      { kind: 'price', value: 5 },
      { kind: 'other', value: null },
      null,
    ].map((d) => discountScore(d as never))
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })
})
