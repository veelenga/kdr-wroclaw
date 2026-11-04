export const API_BASE = 'https://kdr-api.mrpips.gov.pl'

export interface RawDoc {
  ID: string | number
  ID_PODMIOT?: string | number
  ID_LOGO?: string | number | null
  NAZWA?: string
  PODM_NAZWA?: string
  EMAIL?: string
  NR_TELEFONU?: string
  STRONA_WWW?: string
  KOD_POCZTOWY?: string
  MIEJSCOWOSC?: string
  ULICA?: string
  WOJEWODZTWO?: string
  POWIAT?: string
  GMINA?: string
  GEO?: string
  KATEGORIE?: string[]
  DATA_OBOWIAZYWANIA_OD?: string
}

export interface RawDetails {
  idoddzialu?: number
  idpodmiotu?: number
  idLogo?: number | null
  nazwa?: string
  email?: string
  nrTelefonu?: string
  stronawww?: string
  daneAdresowe?: {
    kodPocztowy?: string
    miejscowosc?: string
    ulica?: string
    powiat?: string
    szerokoscGeo?: string
    dlugoscGeo?: string
  }
  daneKategoriiPodkategorii?: { nazwaKategorii: string; nazwyPodkategorii?: string[] }[]
  ulga?: { rodzajUlgi?: string; okresObowiazywaniaOd?: string; okresObowiazywaniaDo?: string }[]
}

interface SolrResponse {
  response: { numFound: number; start: number; docs: RawDoc[] }
}

export interface SearchArea {
  lat: number
  lng: number
  radiusKm: number
}

const RETRIES = 3

async function getJson<T>(url: string, attempt = 1): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) {
    if (attempt < RETRIES && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 500 * attempt))
      return getJson<T>(url, attempt + 1)
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`)
  }
  return (await res.json()) as T
}

export async function fetchPage(
  area: SearchArea,
  start: number,
  rows: number,
): Promise<SolrResponse> {
  const params = new URLSearchParams({
    q: '*:*',
    fq: '{!geofilt}',
    sfield: 'GEO',
    pt: `${area.lat},${area.lng}`,
    d: String(area.radiusKm),
    sort: 'NAZWA_PL asc',
    wt: 'json',
    start: String(start),
    rows: String(rows),
  })
  return getJson<SolrResponse>(`${API_BASE}/select?${params}`)
}

export async function fetchAll(area: SearchArea, rows = 200): Promise<RawDoc[]> {
  const docs: RawDoc[] = []
  let start = 0
  for (;;) {
    const page = await fetchPage(area, start, rows)
    docs.push(...page.response.docs)
    start += rows
    if (start >= page.response.numFound || page.response.docs.length === 0) break
  }
  return docs
}

export function fetchDetails(id: string | number): Promise<RawDetails> {
  return getJson<RawDetails>(`${API_BASE}/oddzial/${id}`)
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}
