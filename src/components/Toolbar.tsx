import { Search } from 'lucide-react'
import { useT } from '../i18n/index.ts'
import { SORTS, TABS, type Query } from '../lib/filters.ts'
import type { GeoStatus } from '../lib/geolocation.ts'

export type View = 'list' | 'map'

interface Props {
  query: Query
  onChange: (patch: Partial<Query>) => void
  view: View
  onView: (view: View) => void
  geoStatus: GeoStatus
  onLocate: () => void
  onClearLocation: () => void
  resultCount: number
}

export function Toolbar({
  query,
  onChange,
  view,
  onView,
  geoStatus,
  onLocate,
  onClearLocation,
  resultCount,
}: Props) {
  const t = useT()
  const geoLabel =
    geoStatus === 'loading'
      ? t.locating
      : geoStatus === 'denied'
        ? t.locationDenied
        : geoStatus === 'ready'
          ? `📍 ${t.nearMe}`
          : t.nearMe

  return (
    <div className="toolbar">
      <label className="search-wrap">
        <Search size={18} className="search-icon" />
        <input
          type="search"
          className="search"
          placeholder={t.searchPlaceholder}
          value={query.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </label>

      <nav className="tabs" aria-label="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab${query.tab === tab ? ' tab-on' : ''}`}
            onClick={() => onChange({ tab })}
          >
            {t.tabs[tab]}
          </button>
        ))}
      </nav>

      <div className="toolbar-row">
        <span className="count">{t.results(resultCount)}</span>
        <label className="sort">
          <span className="sort-label">{t.sort.label}</span>
          <select
            value={query.sort}
            onChange={(e) => onChange({ sort: e.target.value as Query['sort'] })}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t.sort[s]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`btn${geoStatus === 'ready' ? ' btn-on' : ''}`}
          onClick={geoStatus === 'ready' ? onClearLocation : onLocate}
          disabled={geoStatus === 'loading'}
          title={geoStatus === 'ready' ? t.clearLocation : t.nearMe}
        >
          {geoLabel}
        </button>
        <div className="segmented" role="group">
          <button
            type="button"
            className={view === 'list' ? 'on' : ''}
            onClick={() => onView('list')}
          >
            {t.view.list}
          </button>
          <button
            type="button"
            className={view === 'map' ? 'on' : ''}
            onClick={() => onView('map')}
          >
            {t.view.map}
          </button>
        </div>
      </div>
    </div>
  )
}
