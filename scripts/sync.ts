import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Dataset } from '../src/types.ts'
import {
  API_BASE,
  fetchAll,
  fetchDetails,
  mapWithConcurrency,
  type RawDetails,
  type RawDoc,
} from './lib/kdr-api.ts'
import { normalizePartner } from './lib/normalize.ts'

const WROCLAW = { lat: 51.10998046, lng: 17.03197709, radiusKm: 15 }
const OUTPUT = path.resolve('public/data/partners.json')
const CONCURRENCY = 4

async function detailsOrNull(doc: RawDoc): Promise<RawDetails | null> {
  try {
    return await fetchDetails(doc.ID)
  } catch (error) {
    console.warn(`details failed for ${doc.ID}: ${(error as Error).message}`)
    return null
  }
}

async function main(): Promise<void> {
  console.log(`fetching partners within ${WROCLAW.radiusKm} km of Wrocław…`)
  const docs = await fetchAll(WROCLAW)
  console.log(`found ${docs.length} partners, fetching discount details…`)

  let done = 0
  const partners = await mapWithConcurrency(docs, CONCURRENCY, async (doc) => {
    const partner = normalizePartner(doc, await detailsOrNull(doc))
    done += 1
    if (done % 200 === 0) console.log(`  ${done}/${docs.length}`)
    return partner
  })
  partners.sort((a, b) => a.entityName.localeCompare(b.entityName, 'pl'))

  const dataset: Dataset = {
    syncedAt: new Date().toISOString(),
    source: API_BASE,
    center: { lat: WROCLAW.lat, lng: WROCLAW.lng },
    radiusKm: WROCLAW.radiusKm,
    partners,
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(dataset, null, 1) + '\n')

  const withDiscounts = partners.filter((p) => p.discounts.length > 0).length
  console.log(`wrote ${partners.length} partners (${withDiscounts} with discounts) to ${OUTPUT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
