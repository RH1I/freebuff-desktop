import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ar, en, type Dict } from './dicts'

export type Lang = 'ar' | 'en'

const DICTS: Record<Lang, Dict> = { ar, en }

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof Dict) => string
  list: (key: 'wnItems') => string[]
}

const Ctx = createContext<I18n>({
  lang: 'ar',
  setLang: () => {},
  t: (k) => String(k),
  list: () => [],
})

function initialLang(): Lang {
  const url = new URL(window.location.href)
  const fromUrl = url.searchParams.get('lang')
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl
  const saved = localStorage.getItem('ascii0x.lang')
  if (saved === 'ar' || saved === 'en') return saved
  return 'ar'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('ascii0x.lang', l)
  }

  const t = (key: keyof Dict) => DICTS[lang][key] as string
  const list = (key: 'wnItems') => DICTS[lang][key]

  return <Ctx.Provider value={{ lang, setLang, t, list }}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  return useContext(Ctx)
}
