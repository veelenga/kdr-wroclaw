export interface CategoryMeta {
  color: string
  icon: string
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Art.przemysłowe': { color: '#6b7280', icon: '🧰' },
  Edukacja: { color: '#2563eb', icon: '🎓' },
  Kultura: { color: '#7c3aed', icon: '🎭' },
  Łączność: { color: '#0891b2', icon: '📡' },
  Mieszkanie: { color: '#b45309', icon: '🏠' },
  'Odzież i obuwie': { color: '#db2777', icon: '👟' },
  'Sport, Rekreacja, Turystyka': { color: '#16a34a', icon: '⚽' },
  Transport: { color: '#4b5563', icon: '⛽' },
  Usługi: { color: '#0d9488', icon: '🛠️' },
  'Usługi na odległość': { color: '#4f46e5', icon: '🛒' },
  Zdrowie: { color: '#dc2626', icon: '🩺' },
  Żywność: { color: '#ea580c', icon: '🍽️' },
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_META)

const FALLBACK: CategoryMeta = { color: '#64748b', icon: '🏷️' }

export const categoryMeta = (name: string): CategoryMeta => CATEGORY_META[name] ?? FALLBACK

const ALL = '*'

export const INTERESTING: Record<string, string[] | typeof ALL> = {
  Kultura: ALL,
  'Sport, Rekreacja, Turystyka': [
    'Ośrodki sportu i rekreacji',
    'Ogrody zoologiczne i botaniczne',
    'Ośrodki wypoczynkowe',
    'Usługi sportowe',
    'Biura podróży',
  ],
  Żywność: ['Restauracja', 'Kawiarnie', 'Bary'],
  Edukacja: ['Przedszkola', 'Żłobki'],
}

export function isInteresting(category: string, subcategories: string[]): boolean {
  const rule = INTERESTING[category]
  if (!rule) return false
  if (rule === ALL) return true
  return subcategories.some((s) => rule.includes(s))
}
