export type Category =
  | 'Art.przemysłowe'
  | 'Edukacja'
  | 'Kultura'
  | 'Łączność'
  | 'Mieszkanie'
  | 'Odzież i obuwie'
  | 'Sport, Rekreacja, Turystyka'
  | 'Transport'
  | 'Usługi'
  | 'Usługi na odległość'
  | 'Zdrowie'
  | 'Żywność'

export type DiscountKind = 'percent' | 'amount' | 'free' | 'price' | 'other'

export interface Discount {
  text: string
  from: string | null
  to: string | null
  kind: DiscountKind
  value: number | null
}

export interface Partner {
  id: string
  entityId: string | null
  name: string
  entityName: string
  logoId: string | null
  categories: { name: string; subcategories: string[] }[]
  address: {
    street: string | null
    postalCode: string | null
    city: string | null
    district: string | null
  }
  location: { lat: number; lng: number } | null
  phone: string | null
  email: string | null
  website: string | null
  discounts: Discount[]
  bestDiscount: { kind: DiscountKind; value: number | null } | null
  since: string | null
}

export interface Dataset {
  syncedAt: string
  source: string
  center: { lat: number; lng: number }
  radiusKm: number
  partners: Partner[]
}
