import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  HomeIcon,
  LockClosedIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
  UsersIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

export type SidebarLink = { to: string; labelKey: string; end?: boolean; Icon: NavIcon }

export type SidebarGroup = { titleKey: string; items: SidebarLink[] }

export type SidebarAccent = 'indigo' | 'emerald' | 'amber' | 'sky'

export type WorkspaceSidebarConfig = {
  brandKey: string
  accent: SidebarAccent
  groups: SidebarGroup[]
}

export const adminSidebarConfig: WorkspaceSidebarConfig = {
  brandKey: 'sidebar.brandAdmin',
  accent: 'indigo',
  groups: [
    {
      titleKey: 'navGroup.overview',
      items: [{ to: '/admin', labelKey: 'nav.dashboard', end: true, Icon: HomeIcon }],
    },
    {
      titleKey: 'navGroup.userManagement',
      items: [
        { to: '/admin/users', labelKey: 'nav.users', Icon: UsersIcon },
        { to: '/admin/system-settings', labelKey: 'nav.systemSettings', Icon: Cog6ToothIcon },
      ],
    },
    {
      titleKey: 'navGroup.cms',
      items: [
        { to: '/admin/currencies', labelKey: 'nav.currencies', Icon: CurrencyDollarIcon },
        { to: '/admin/agencies', labelKey: 'nav.agencies', Icon: BuildingStorefrontIcon },
        { to: '/admin/banks', labelKey: 'nav.banks', Icon: BuildingLibraryIcon },
        { to: '/admin/customers', labelKey: 'nav.customers', Icon: UserGroupIcon },
      ],
    },
    {
      titleKey: 'navGroup.hawala',
      items: [
        { to: '/admin/send-hawala', labelKey: 'nav.sendHawala', Icon: ArrowUpTrayIcon },
        { to: '/admin/receive-hawala', labelKey: 'nav.receiveHawala', Icon: ArrowDownTrayIcon },
        { to: '/admin/exchange', labelKey: 'nav.exchange', Icon: ArrowsRightLeftIcon },
        { to: '/admin/transfer', labelKey: 'nav.transfer', Icon: BanknotesIcon },
      ],
    },
    {
      titleKey: 'navGroup.deposits',
      items: [
        { to: '/admin/deposits', labelKey: 'nav.deposits', Icon: WalletIcon },
      ],
    },
    {
      titleKey: 'navGroup.finance',
      items: [
        { to: '/admin/cash-box', labelKey: 'nav.cashBox', Icon: LockClosedIcon },
        { to: '/admin/bank-box', labelKey: 'nav.bankBox', Icon: BuildingLibraryIcon },
        { to: '/admin/expenses', labelKey: 'nav.expenses', Icon: ReceiptPercentIcon },
      ],
    },
    {
      titleKey: 'navGroup.reports',
      items: [
        { to: '/admin/customer-ledger', labelKey: 'nav.customerLedger', Icon: BookOpenIcon },
        { to: '/admin/agency-ledger', labelKey: 'nav.agencyLedger', Icon: BookOpenIcon },
        { to: '/admin/reports', labelKey: 'nav.reports', Icon: ChartBarIcon },
      ],
    },
  ],
}

export const userSidebarConfig: WorkspaceSidebarConfig = {
  brandKey: 'sidebar.brandUser',
  accent: 'amber',
  groups: [
    {
      titleKey: 'navGroup.overview',
      items: [{ to: '/user', labelKey: 'nav.dashboard', end: true, Icon: HomeIcon }],
    },
    {
      titleKey: 'navGroup.cms',
      items: [
        { to: '/user/currencies', labelKey: 'nav.currencies', Icon: CurrencyDollarIcon },
        { to: '/user/agencies', labelKey: 'nav.agencies', Icon: BuildingStorefrontIcon },
        { to: '/user/banks', labelKey: 'nav.banks', Icon: BuildingLibraryIcon },
        { to: '/user/customers', labelKey: 'nav.customers', Icon: UserGroupIcon },
      ],
    },
    {
      titleKey: 'navGroup.hawala',
      items: [
        { to: '/user/send-hawala', labelKey: 'nav.sendHawala', Icon: ArrowUpTrayIcon },
        { to: '/user/receive-hawala', labelKey: 'nav.receiveHawala', Icon: ArrowDownTrayIcon },
        { to: '/user/exchange', labelKey: 'nav.exchange', Icon: ArrowsRightLeftIcon },
        { to: '/user/transfer', labelKey: 'nav.transfer', Icon: BanknotesIcon },
      ],
    },
    {
      titleKey: 'navGroup.deposits',
      items: [
        { to: '/user/deposits', labelKey: 'nav.deposits', Icon: WalletIcon },
      ],
    },
    {
      titleKey: 'navGroup.finance',
      items: [
        { to: '/user/cash-box', labelKey: 'nav.cashBox', Icon: LockClosedIcon },
        { to: '/user/bank-box', labelKey: 'nav.bankBox', Icon: BuildingLibraryIcon },
        { to: '/user/expenses', labelKey: 'nav.expenses', Icon: ReceiptPercentIcon },
      ],
    },
    {
      titleKey: 'navGroup.reports',
      items: [
        { to: '/user/customer-ledger', labelKey: 'nav.customerLedger', Icon: BookOpenIcon },
        { to: '/user/agency-ledger', labelKey: 'nav.agencyLedger', Icon: BookOpenIcon },
        { to: '/user/reports', labelKey: 'nav.reports', Icon: ChartBarIcon },
      ],
    },
  ],
}
