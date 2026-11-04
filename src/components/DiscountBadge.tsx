import type { Partner } from '../types.ts'
import { useT } from '../i18n/index.ts'

const formatValue = (value: number | null, suffix: string): string =>
  value === null ? '' : `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`

export function DiscountBadge({
  best,
  size = 'md',
}: {
  best: Partner['bestDiscount']
  size?: 'md' | 'lg'
}) {
  const t = useT()
  if (!best) return null
  const label =
    best.kind === 'free'
      ? t.free
      : best.kind === 'percent'
        ? t.discountOff(formatValue(best.value, '%'))
        : best.kind === 'amount'
          ? t.discountOff(formatValue(best.value, ' zł'))
          : best.kind === 'price'
            ? t.priceFrom(formatValue(best.value, ' zł'))
            : t.special
  return <span className={`badge badge-${best.kind} badge-${size}`}>{label}</span>
}
