import { createContext, useContext } from 'react'
import { en } from './en.ts'
import { pl } from './pl.ts'
import { uk, type Dictionary } from './uk.ts'

export const LANGS = ['en', 'uk', 'pl'] as const
export type Lang = (typeof LANGS)[number]

export const DICTIONARIES: Record<Lang, Dictionary> = { en, uk, pl }

const STORAGE_KEY = 'kdr-wroclaw:lang'

const isLang = (value: string | null | undefined): value is Lang =>
  (LANGS as readonly string[]).includes(value ?? '')

const browserLang = (): Lang => {
  const preferred = navigator.languages.map((l) => l.slice(0, 2).toLowerCase()).find(isLang)
  return preferred ?? 'en'
}

export const loadLang = (): Lang => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isLang(stored) ? stored : browserLang()
}
export const saveLang = (lang: Lang): void => localStorage.setItem(STORAGE_KEY, lang)

export const LangContext = createContext<Lang>('en')

export const useT = (): Dictionary => DICTIONARIES[useContext(LangContext)]
export const useLang = (): Lang => useContext(LangContext)
