import { lazy, Suspense, useMemo, useState } from 'react'
import { Filters } from './components/Filters.tsx'
import { Header } from './components/Header.tsx'
import { PartnerList } from './components/PartnerList.tsx'
import { Toolbar, type View } from './components/Toolbar.tsx'
import { LangContext, loadLang, saveLang, useT, type Lang } from './i18n/index.ts'
import { useDataset } from './lib/dataset.ts'
import { useFavorites } from './lib/favorites.ts'
import {
  countByCategory,
  countBySubcategory,
  filterPartners,
  sortPartners,
  type QueryContext,
} from './lib/filters.ts'
import { useGeolocation } from './lib/geolocation.ts'
import { buildSearchIndex, searchRank } from './lib/search.ts'
import { useQueryState } from './lib/urlState.ts'
import type { Dataset } from './types.ts'

const MapView = lazy(() => import('./components/MapView.tsx').then((m) => ({ default: m.MapView })))

function Footer() {
  const t = useT()
  return (
    <footer className="footer">
      <p>{t.sourceNote}</p>
      <p>
        {t.source}:{' '}
        <a
          href="https://empatia.gov.pl/znizki-i-ulgi-partnerow-kdr"
          target="_blank"
          rel="noopener noreferrer"
        >
          empatia.gov.pl
        </a>{' '}
        · CC BY-NC-ND 3.0 PL
      </p>
    </footer>
  )
}

export function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const dataset = useDataset()
  const changeLang = (next: Lang) => {
    saveLang(next)
    setLang(next)
  }
  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        {dataset.status === 'ready' ? (
          <Catalog data={dataset.data} onLang={changeLang} />
        ) : (
          <>
            <Header syncedAt={null} onLang={changeLang} />
            <p className="empty">{dataset.status === 'error' ? dataset.message : '…'}</p>
          </>
        )}
      </div>
    </LangContext.Provider>
  )
}

function Catalog({ data, onLang }: { data: Dataset; onLang: (lang: Lang) => void }) {
  const t = useT()
  const index = useMemo(() => buildSearchIndex(data.partners), [data])
  const [query, updateQuery] = useQueryState()
  const [view, setView] = useState<View>('list')
  const [favorites, toggleFavorite] = useFavorites()
  const geo = useGeolocation()

  const ctx = useMemo<QueryContext>(
    () => ({ searchRank: searchRank(index, query.q), favorites, origin: geo.origin }),
    [index, query.q, favorites, geo.origin],
  )

  const baseForCounts = useMemo(
    () => filterPartners(data.partners, { ...query, category: null, subcategory: null }, ctx),
    [data, query, ctx],
  )
  const categoryCounts = useMemo(() => countByCategory(baseForCounts), [baseForCounts])
  const subcategoryCounts = useMemo(
    () =>
      query.category
        ? countBySubcategory(baseForCounts, query.category)
        : new Map<string, number>(),
    [baseForCounts, query.category],
  )

  const results = useMemo(
    () => sortPartners(filterPartners(data.partners, query, ctx), query, ctx),
    [data, query, ctx],
  )

  return (
    <>
      <Header syncedAt={data.syncedAt} onLang={onLang} />
      <Toolbar
        query={query}
        onChange={updateQuery}
        view={view}
        onView={setView}
        geoStatus={geo.status}
        onLocate={geo.locate}
        onClearLocation={geo.clear}
        resultCount={results.length}
      />
      <div className="layout">
        <Filters
          query={query}
          categoryCounts={categoryCounts}
          subcategoryCounts={subcategoryCounts}
          onChange={updateQuery}
        />
        <main className="content">
          {view === 'map' ? (
            <Suspense fallback={<p className="empty">…</p>}>
              <MapView
                partners={results}
                center={data.center}
                origin={geo.origin}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            </Suspense>
          ) : (
            <PartnerList
              partners={results}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              origin={geo.origin}
              emptyMessage={query.tab === 'favorites' ? t.emptyFavorites : undefined}
            />
          )}
        </main>
      </div>
      <Footer />
    </>
  )
}
