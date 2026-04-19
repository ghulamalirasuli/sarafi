import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function HomeRedirect() {
  const { token, user, loading, pathForRole } = useAuth()
  const { t } = useLocale()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">{t('common.loading')}</div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={pathForRole(user.role)} replace />
}
