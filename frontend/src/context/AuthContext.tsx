import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, type ApiUser } from '../lib/api'

type AuthState = {
  token: string | null
  user: ApiUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<string>
  logout: () => Promise<void>
  pathForRole: (role: string) => string
}

const AuthContext = createContext<AuthState | null>(null)

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  user: '/user',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('sarafi_token'),
  )
  const [user, setUser] = useState<ApiUser | null>(() => {
    const raw = localStorage.getItem('sarafi_user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as ApiUser
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get<ApiUser>('/user')
        setUser(data)
        localStorage.setItem('sarafi_user', JSON.stringify(data))
      } catch {
        setToken(null)
        setUser(null)
        localStorage.removeItem('sarafi_token')
        localStorage.removeItem('sarafi_user')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [token])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{
      user: ApiUser
      role: string
      branch_id: number | null
      customer_id: number | null
      token: string
    }>('/login', { username, password })
    localStorage.setItem('sarafi_token', data.token)
    localStorage.setItem('sarafi_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.role
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      /* ignore */
    }
    localStorage.removeItem('sarafi_token')
    localStorage.removeItem('sarafi_user')
    setToken(null)
    setUser(null)
  }, [])

  const pathForRole = useCallback((role: string) => ROLE_HOME[role] ?? '/login', [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      pathForRole,
    }),
    [token, user, loading, login, logout, pathForRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with provider
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
