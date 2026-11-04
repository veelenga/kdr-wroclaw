import { useState } from 'react'
import { categoryMeta } from '../lib/categories.ts'
import type { Partner } from '../types.ts'

const LOGO_BASE = 'https://kdr-api.mrpips.gov.pl/logo/'

export function Logo({ partner }: { partner: Partner }) {
  const [failed, setFailed] = useState(false)
  const { icon } = categoryMeta(partner.categories[0]?.name ?? '')
  if (!partner.logoId || failed) {
    return (
      <div className="logo logo-fallback" aria-hidden="true">
        {icon}
      </div>
    )
  }
  return (
    <div className="logo">
      <img
        src={`${LOGO_BASE}${partner.logoId}`}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
