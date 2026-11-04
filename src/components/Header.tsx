import { LANGS, useLang, useT, type Lang } from '../i18n/index.ts'

const LOCALES: Record<Lang, string> = { en: 'en-GB', uk: 'uk-UA', pl: 'pl-PL' }

interface Props {
  syncedAt: string | null
  onLang: (lang: Lang) => void
}

export function Header({ syncedAt, onLang }: Props) {
  const t = useT()
  const lang = useLang()
  const date = syncedAt
    ? new Date(syncedAt).toLocaleDateString(LOCALES[lang], {
        dateStyle: 'long',
      })
    : null
  return (
    <header className="header">
      <div>
        <h1>{t.title}</h1>
        <p className="tagline">{t.tagline}</p>
      </div>
      <div className="header-side">
        {date && (
          <span className="synced">
            {t.synced}: {date}
          </span>
        )}
        <div className="segmented" role="group" aria-label="language">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className={lang === l ? 'on' : ''}
              onClick={() => onLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
