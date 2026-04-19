import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from '../i18n/messages'
import { resolveMessage } from '../i18n/messages'

const STORAGE_KEY = 'sarafi_locale'

function readInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'fa' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined') {
    const tag = navigator.language?.toLowerCase() ?? ''
    if (tag.startsWith('fa')) return 'fa'
  }
  return 'en'
}

type LocaleCtx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleCtx | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale())

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale === 'fa' ? 'fa' : 'en'
    root.dir = locale === 'fa' ? 'rtl' : 'ltr'
    root.classList.toggle('locale-fa', locale === 'fa')
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => setLocaleState(l), [])

  const t = useCallback(
    (key: string) => resolveMessage(locale, key) ?? resolveMessage('en', key) ?? key,
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with provider
export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
