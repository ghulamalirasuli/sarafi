import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function Login() {
  const { login, token, user, loading, pathForRole } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">{t('common.loading')}</div>
    )
  }

  if (token && user) {
    return <Navigate to={pathForRole(user.role)} replace />
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const role = await login(username, password)
      navigate(pathForRole(role), { replace: true })
    } catch {
      setError(t('login.invalidCredentials'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="relative w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <div
          className="absolute end-4 top-4 flex gap-1 rounded-md border border-slate-200 p-0.5 dark:border-slate-700"
          role="group"
          aria-label={t('language.label')}
        >
          <button
            type="button"
            title={t('language.english')}
            onClick={() => setLocale('en')}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              locale === 'en'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            title={t('language.farsi')}
            onClick={() => setLocale('fa')}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              locale === 'fa'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            FA
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Sarafi</h1>
          <p className="text-sm text-slate-500">{t('login.subtitle')}</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('login.username')}</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('login.password')}</span>
          <input
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
    </div>
  )
}
