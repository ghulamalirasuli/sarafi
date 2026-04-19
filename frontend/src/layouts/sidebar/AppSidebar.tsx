import {
  ArrowRightOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import type { SidebarAccent, WorkspaceSidebarConfig } from './navConfigs'

const RAIL_KEY = 'sarafi_sidebar_rail_collapsed'

const navActive: Record<SidebarAccent, string> = {
  indigo:
    'border-s-indigo-600 bg-indigo-50/90 font-medium text-indigo-950 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-50',
  emerald:
    'border-s-emerald-600 bg-emerald-50/90 font-medium text-emerald-950 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-50',
  amber:
    'border-s-amber-600 bg-amber-50/90 font-medium text-amber-950 shadow-sm dark:border-amber-400 dark:bg-amber-950/60 dark:text-amber-50',
  sky: 'border-s-sky-600 bg-sky-50/90 font-medium text-sky-950 shadow-sm dark:border-sky-400 dark:bg-sky-950/60 dark:text-sky-50',
}

const navIdle =
  'border-transparent text-slate-600 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-slate-800/80'

const railActive: Record<SidebarAccent, string> = {
  indigo: 'bg-indigo-600 text-white shadow-md dark:bg-indigo-500',
  emerald: 'bg-emerald-600 text-white shadow-md dark:bg-emerald-500',
  amber: 'bg-amber-600 text-white shadow-md dark:bg-amber-500',
  sky: 'bg-sky-600 text-white shadow-md dark:bg-sky-500',
}

const brandAccent: Record<SidebarAccent, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  sky: 'text-sky-600 dark:text-sky-400',
}

const railBrandBg: Record<SidebarAccent, string> = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-600',
  sky: 'bg-sky-600',
}

type Props = {
  config: WorkspaceSidebarConfig
  userName?: string
  dark: boolean
  onToggleTheme: () => void
  onLogout: () => void
}

export function AppSidebar({ config, userName, dark, onToggleTheme, onLogout }: Props) {
  const { locale, setLocale, t } = useLocale()
  const brandLine = t(config.brandKey)

  const [railCollapsed, setRailCollapsed] = useState(() => {
    try {
      return localStorage.getItem(RAIL_KEY) === '1'
    } catch {
      return false
    }
  })

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.groups.map((g) => [g.titleKey, true])),
  )

  const persistRail = useCallback((v: boolean) => {
    setRailCollapsed(v)
    try {
      localStorage.setItem(RAIL_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const toggleGroup = (titleKey: string) => {
    setOpenGroups((s) => ({ ...s, [titleKey]: !s[titleKey] }))
  }

  const accent = config.accent
  const brandClass = brandAccent[accent]
  const railBg = railBrandBg[accent]

  const linkClass = ({ isActive }: { isActive: boolean }) => {
    if (railCollapsed) {
      return `flex justify-center rounded-xl p-2 text-sm transition-all duration-150 ${
        isActive ? railActive[accent] : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/90'
      }`
    }
    return `flex items-center gap-2.5 rounded-lg border-s-2 px-2.5 py-2 text-[13px] font-medium leading-snug transition-colors duration-150 ${
      isActive ? navActive[accent] : navIdle
    }`
  }

  const asideWidth = railCollapsed ? 'w-[4.25rem]' : 'w-[15.5rem]'

  return (
    <aside
      className={`no-print flex h-screen shrink-0 flex-col border-e border-slate-200/90 bg-white shadow-[4px_0_24px_-8px_rgba(15,23,42,0.12)] transition-[width] duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 dark:shadow-[4px_0_32px_-8px_rgba(0,0,0,0.45)] ${asideWidth}`}
    >
      <header
        className={`flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800/80 ${railCollapsed ? 'flex-col' : ''}`}
      >
        {!railCollapsed && (
          <div className={`min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight ${brandClass}`}>
            {brandLine}
          </div>
        )}
        {railCollapsed && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${railBg}`}
            title={brandLine}
          >
            S
          </div>
        )}
        <button
          type="button"
          title={railCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          onClick={() => persistRail(!railCollapsed)}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {railCollapsed ? (
            <ChevronDoubleRightIcon className="h-5 w-5 rtl:rotate-180" aria-hidden />
          ) : (
            <ChevronDoubleLeftIcon className="h-5 w-5 rtl:rotate-180" aria-hidden />
          )}
        </button>
      </header>

      <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2.5 py-3">
        {railCollapsed ? (
          <div className="flex flex-col gap-4">
            {config.groups.map((group) => (
              <div
                key={group.titleKey}
                className="flex flex-col gap-1 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800/80"
              >
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={t(item.labelKey)}
                    className={linkClass}
                  >
                    <item.Icon className="h-5 w-5 shrink-0" aria-hidden />
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {config.groups.map((group) => {
              const open = openGroups[group.titleKey] !== false
              const groupTitle = t(group.titleKey)
              return (
                <div key={group.titleKey}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.titleKey)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
                  >
                    <span className="truncate">{groupTitle}</span>
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${
                        open ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <div className="mt-1 flex flex-col gap-0.5 ps-0.5">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={linkClass}
                        >
                          <item.Icon
                            className="h-[1.125rem] w-[1.125rem] shrink-0 opacity-80"
                            aria-hidden
                          />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      <footer className="shrink-0 space-y-2.5 border-t border-slate-100 bg-slate-50/90 p-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        {!railCollapsed && userName && (
          <div className="truncate rounded-lg bg-white/80 px-2.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:text-slate-200 dark:ring-slate-700/80">
            {userName}
          </div>
        )}
        <div
          className={`flex rounded-lg bg-slate-200/60 p-0.5 dark:bg-slate-800/80 ${railCollapsed ? 'flex-col gap-0.5' : ''}`}
          role="group"
          aria-label={t('language.label')}
        >
          <button
            type="button"
            title={t('language.english')}
            onClick={() => setLocale('en')}
            className={`min-h-8 flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
              locale === 'en'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            title={t('language.farsi')}
            onClick={() => setLocale('fa')}
            className={`min-h-8 flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
              locale === 'fa'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            FA
          </button>
        </div>
        <div className={`flex gap-1.5 ${railCollapsed ? 'flex-col' : ''}`}>
          <button
            type="button"
            title={t('sidebar.theme')}
            onClick={() => onToggleTheme()}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${railCollapsed ? 'aspect-square min-h-10 px-0' : ''}`}
          >
            {dark ? (
              <SunIcon className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            ) : (
              <MoonIcon className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
            )}
            {!railCollapsed && <span>{dark ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>}
          </button>
          <button
            type="button"
            title={t('sidebar.logOut')}
            onClick={() => void onLogout()}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-900/50 dark:hover:bg-red-950/40 dark:hover:text-red-200 ${railCollapsed ? 'aspect-square min-h-10 px-0' : ''}`}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" aria-hidden />
            {!railCollapsed && <span>{t('sidebar.logOut')}</span>}
          </button>
        </div>
      </footer>
    </aside>
  )
}
