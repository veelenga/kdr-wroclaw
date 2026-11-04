import { CalendarDays, ChevronDown, Globe, MapPin, Navigation, Phone, Star } from 'lucide-react'
import { useState } from 'react'
import { useLang, useT } from '../i18n/index.ts'
import { categoryMeta } from '../lib/categories.ts'
import { isNew } from '../lib/filters.ts'
import { distanceKm, formatDistance, type LatLng } from '../lib/geo.ts'
import { useClamped } from '../lib/useClamped.ts'
import type { Partner } from '../types.ts'
import { DiscountBadge } from './DiscountBadge.tsx'
import { Logo } from './Logo.tsx'

interface Props {
  partner: Partner
  favorite: boolean
  onToggleFavorite: (id: string) => void
  origin: LatLng | null
  compact?: boolean
}

const MAX_TAGS = 2
const LOCALES = { en: 'en-GB', uk: 'uk-UA', pl: 'pl-PL' } as const

const routeUrl = (p: Partner): string | null =>
  p.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}`
    : null

const latestEnd = (p: Partner): string | null =>
  p.discounts
    .map((d) => d.to)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1) ?? null

export function PartnerCard({
  partner,
  favorite,
  onToggleFavorite,
  origin,
  compact = false,
}: Props) {
  const t = useT()
  const lang = useLang()
  const [expanded, setExpanded] = useState(false)
  const category = partner.categories[0]
  const meta = categoryMeta(category?.name ?? '')
  const showBranch = partner.name !== partner.entityName
  const text = partner.discounts.map((d) => d.text).join('\n\n')
  const [textRef, clamped] = useClamped<HTMLDivElement>(text)
  const distance = origin && partner.location ? distanceKm(origin, partner.location) : null
  const address = [partner.address.street, partner.address.city].filter(Boolean).join(', ')
  const route = routeUrl(partner)
  const subcategories = category?.subcategories ?? []
  const hiddenTags = Math.max(0, subcategories.length - MAX_TAGS)
  const validTo = latestEnd(partner)

  return (
    <article
      className={`card${compact ? ' card-compact' : ''}`}
      style={{ '--cat': meta.color } as React.CSSProperties}
    >
      <header className="card-head">
        <Logo partner={partner} />
        <div className="card-title">
          <h3 title={partner.entityName}>{partner.entityName}</h3>
          {showBranch && (
            <p className="card-branch" title={`${t.branch}: ${partner.name}`}>
              {partner.name}
            </p>
          )}
        </div>
        <button
          type="button"
          className={`fav${favorite ? ' fav-on' : ''}`}
          aria-label={favorite ? t.unfavorite : t.favorite}
          aria-pressed={favorite}
          title={favorite ? t.unfavorite : t.favorite}
          onClick={() => onToggleFavorite(partner.id)}
        >
          <Star size={20} />
        </button>
      </header>

      <div className="card-offer">
        <DiscountBadge best={partner.bestDiscount} size="lg" />
        <div className="card-offer-body">
          <div ref={textRef} className={`card-text${expanded ? '' : ' card-text-clamp'}`}>
            {text}
          </div>
          {(clamped || expanded) && (
            <button
              type="button"
              className={`link${expanded ? ' link-open' : ''}`}
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? t.readLess : t.readMore}
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="card-tags">
        <span className="tag tag-cat">
          {meta.icon} {t.category[category?.name] ?? category?.name}
        </span>
        {subcategories.slice(0, MAX_TAGS).map((s) => (
          <span key={s} className="tag">
            {s}
          </span>
        ))}
        {hiddenTags > 0 && (
          <span className="tag" title={subcategories.slice(MAX_TAGS).join(', ')}>
            +{hiddenTags}
          </span>
        )}
        {isNew(partner) && <span className="tag tag-new">{t.newTag}</span>}
        {validTo && (
          <span className="tag tag-date">
            <CalendarDays size={12} />
            {t.validUntil(new Date(validTo).toLocaleDateString(LOCALES[lang]))}
          </span>
        )}
      </p>

      <footer className="card-foot">
        {address && (
          <span className="card-address">
            <MapPin size={14} />
            <span>
              {address}
              {distance !== null && <strong> · {formatDistance(distance)}</strong>}
            </span>
          </span>
        )}
        <span className="card-actions">
          {partner.phone && (
            <a
              className="action action-icon"
              href={`tel:${partner.phone.replace(/\s+/g, '')}`}
              aria-label={`${t.call}: ${partner.phone}`}
              title={`${t.call}: ${partner.phone}`}
            >
              <Phone size={16} />
            </a>
          )}
          {partner.website && (
            <a
              className="action action-icon"
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.website}
              title={partner.website.replace(/^https?:\/\//, '')}
            >
              <Globe size={16} />
            </a>
          )}
          {route && (
            <a
              className="action action-primary"
              href={route}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={15} />
              {t.route}
            </a>
          )}
        </span>
      </footer>
    </article>
  )
}
