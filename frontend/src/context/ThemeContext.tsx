import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ThemeCtx = {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('sarafi_theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('sarafi_theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])

  const value = useMemo(() => ({ dark, toggle }), [dark, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with provider
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
