import { useState } from 'react'
import { useT } from '../i18n/index.ts'
import type { LatLng } from '../lib/geo.ts'
import type { Partner } from '../types.ts'
import { PartnerCard } from './PartnerCard.tsx'

interface Props {
  partners: Partner[]
  favorites: ReadonlySet<string>
  onToggleFavorite: (id: string) => void
  origin: LatLng | null
  emptyMessage?: string
}

const PAGE = 48

export function PartnerList({
  partners,
  favorites,
  onToggleFavorite,
  origin,
  emptyMessage,
}: Props) {
  const t = useT()
  const [paging, setPaging] = useState({ partners, limit: PAGE })
  const limit = paging.partners === partners ? paging.limit : PAGE
  const showMore = () => setPaging({ partners, limit: limit + PAGE })

  if (partners.length === 0) return <p className="empty">{emptyMessage ?? t.empty}</p>

  return (
    <>
      <div className="grid">
        {partners.slice(0, limit).map((p) => (
          <PartnerCard
            key={p.id}
            partner={p}
            favorite={favorites.has(p.id)}
            onToggleFavorite={onToggleFavorite}
            origin={origin}
          />
        ))}
      </div>
      {limit < partners.length && (
        <button type="button" className="btn btn-more" onClick={showMore}>
          {t.showMore} ({partners.length - limit})
        </button>
      )}
    </>
  )
}
