import { describe, expect, it } from 'vitest'
import { normalizePartner, stripHtml } from './normalize.ts'

const doc = {
  ID: '10958404',
  ID_PODMIOT: 292312,
  ID_LOGO: 1163909,
  NAZWA: 'Wrocław II',
  PODM_NAZWA: '"Dobre Domy" Sp. z o.o.',
  EMAIL: 'biuro@dobredomy.pl',
  NR_TELEFONU: '71 352 04 50',
  STRONA_WWW: 'www.dobredomy.pl',
  KOD_POCZTOWY: '53-611',
  MIEJSCOWOSC: 'WROCŁAW',
  ULICA: 'UL. STRZEGOMSKA 2-4',
  POWIAT: 'WROCŁAW',
  GEO: ' 51.112134, 17.004740',
  KATEGORIE: ['Usługi;Pozostałe;Naprawcze', 'Mieszkanie'],
  DATA_OBOWIAZYWANIA_OD: '2016-05-30T220000Z',
}

const details = {
  idoddzialu: 10958404,
  daneAdresowe: { ulica: 'ul. Strzegomska 2-4', miejscowosc: 'Wrocław', powiat: 'Wrocław' },
  ulga: [
    {
      rodzajUlgi: '15% rabatu na wszystkie projekty.\r\nNie łączy się z innymi.',
      okresObowiazywaniaOd: '2016-06-01',
      okresObowiazywaniaDo: '',
    },
  ],
}

describe('normalizePartner', () => {
  it('merges the search document with details', () => {
    const partner = normalizePartner(doc, details)
    expect(partner).toMatchObject({
      id: '10958404',
      entityId: '292312',
      logoId: '1163909',
      name: 'Wrocław II',
      entityName: '"Dobre Domy" Sp. z o.o.',
      website: 'https://www.dobredomy.pl',
      address: { street: 'ul. Strzegomska 2-4', city: 'Wrocław', postalCode: '53-611' },
      location: { lat: 51.112134, lng: 17.00474 },
      categories: [
        { name: 'Usługi', subcategories: ['Pozostałe', 'Naprawcze'] },
        { name: 'Mieszkanie', subcategories: [] },
      ],
      bestDiscount: { kind: 'percent', value: 15 },
      since: '2016-05-30',
    })
    expect(partner.discounts[0]).toMatchObject({ from: '2016-06-01', to: null, value: 15 })
    expect(partner.discounts[0].text).not.toContain('\r')
  })

  it('title-cases the address when details are missing', () => {
    const partner = normalizePartner(doc)
    expect(partner.address).toMatchObject({ street: 'Ul. Strzegomska 2-4', city: 'Wrocław' })
    expect(partner.discounts).toEqual([])
  })

  it('keeps already cased details but title-cases shouting values', () => {
    const partner = normalizePartner(doc, {
      daneAdresowe: { miejscowosc: 'WROCLAW', ulica: 'al. Jana Pawła II 5' },
    })
    expect(partner.address).toMatchObject({ city: 'Wroclaw', street: 'al. Jana Pawła II 5' })
  })

  it('title-cases shouting names but keeps short acronyms', () => {
    expect(normalizePartner({ ID: 1, NAZWA: 'ZAKŁAD OPTYCZNY "AMIR" SP. Z O.O.' }).name).toBe(
      'Zakład Optyczny "Amir" Sp. z o.o.',
    )
    expect(normalizePartner({ ID: 1, NAZWA: 'MUZEUM ARCHITEKTURY WE WROCŁAWIU' }).name).toBe(
      'Muzeum Architektury we Wrocławiu',
    )
    expect(normalizePartner({ ID: 1, NAZWA: 'PZU SA' }).name).toBe('PZU SA')
  })

  it('tolerates missing optional fields', () => {
    expect(normalizePartner({ ID: 1 })).toMatchObject({
      name: '',
      location: null,
      discounts: [],
      bestDiscount: null,
      since: null,
      website: null,
    })
  })
})

describe('stripHtml', () => {
  it('removes tags, decodes entities and keeps line breaks', () => {
    const html =
      '<p class="x"><font color="#000">10% rabatu &amp; wi&#281;cej</font></p><p>Drugi&nbsp;akapit<br/>trzeci</p>'
    expect(stripHtml(html)).toBe('10% rabatu & więcej\nDrugi akapit\ntrzeci')
  })
})
