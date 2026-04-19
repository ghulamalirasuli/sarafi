import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function ProtectedRoute({
  roles,
}: {
  roles?: string[]
}) {
  const { token, user, loading } = useAuth()
  const { t } = useLocale()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        {t('common.loading')}
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
