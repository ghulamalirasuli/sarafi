import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { AppSidebar } from './sidebar/AppSidebar'
import { userSidebarConfig } from './sidebar/navConfigs'

export function UserLayout() {
  const { logout, user } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        config={userSidebarConfig}
        userName={user?.fullname}
        dark={dark}
        onToggleTheme={() => toggle()}
        onLogout={() => void logout()}
      />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
