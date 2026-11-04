import { useEffect, useRef } from 'react'
import { useT } from '../i18n/index.ts'
import { CATEGORY_ORDER, categoryMeta } from '../lib/categories.ts'
import type { Query } from '../lib/filters.ts'

interface Props {
  query: Query
  categoryCounts: Map<string, number>
  subcategoryCounts: Map<string, number>
  onChange: (patch: Partial<Query>) => void
}

export function Filters({ query, categoryCounts, subcategoryCounts, onChange }: Props) {
  const t = useT()
  const total = [...categoryCounts.values()].reduce((a, b) => a + b, 0)
  const subcategories = [...subcategoryCounts.entries()].sort((a, b) => b[1] - a[1])
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    list.current?.querySelector('.chip-on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [query.category])

  return (
    <aside className="filters">
      <h2>{t.categories}</h2>
      <ul className="chips chips-col" ref={list}>
        <li>
          <button
            type="button"
            className={`chip${query.category === null ? ' chip-on' : ''}`}
            onClick={() => onChange({ category: null })}
          >
            <span>{t.allCategories}</span>
            <small>{total}</small>
          </button>
        </li>
        {CATEGORY_ORDER.map((name) => {
          const count = categoryCounts.get(name) ?? 0
          const { icon, color } = categoryMeta(name)
          return (
            <li key={name}>
              <button
                type="button"
                className={`chip${query.category === name ? ' chip-on' : ''}`}
                style={{ '--cat': color } as React.CSSProperties}
                disabled={count === 0 && query.category !== name}
                onClick={() => onChange({ category: query.category === name ? null : name })}
              >
                <span>
                  {icon} {t.category[name] ?? name}
                </span>
                <small>{count}</small>
              </button>
            </li>
          )
        })}
      </ul>

      {query.category && subcategories.length > 0 && (
        <>
          <h2>{t.subcategories}</h2>
          <ul className="chips">
            {subcategories.map(([name, count]) => (
              <li key={name}>
                <button
                  type="button"
                  className={`chip chip-sm${query.subcategory === name ? ' chip-on' : ''}`}
                  onClick={() =>
                    onChange({
                      category: query.category,
                      subcategory: query.subcategory === name ? null : name,
                    })
                  }
                >
                  <span>{name}</span>
                  <small>{count}</small>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}
