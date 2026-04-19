import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Link } from 'react-router-dom'
import { 
  PaperAirplaneIcon, 
  ArrowDownLeftIcon, 
  ArrowUpRightIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export function AdminDashboard() {
  const q = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin')
      return data as Record<string, any>
    },
  })

  if (q.isLoading) return <p className="text-sm text-slate-500 p-6">Loading…</p>
  if (q.isError) return <p className="text-sm text-red-600 p-6">Failed to load dashboard</p>

  const s = (q.data?.summary ?? {}) as Record<string, number>
  const cashSummary = (q.data?.cash_summary ?? []) as any[]

  const quickLinks = [
    { label: 'Send Hawala', to: 'send-hawala', icon: PaperAirplaneIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Receive Hawala', to: 'receive-hawala', icon: ArrowDownLeftIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Deposit', to: 'deposits', icon: BanknotesIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Expense', to: 'expenses', icon: CreditCardIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Money Exchange', to: 'exchange', icon: ArrowsRightLeftIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Money Transfer', to: 'transfer', icon: CurrencyDollarIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Customer Ledger', to: 'customer-ledger', icon: UsersIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Agency Ledger', to: 'agency-ledger', icon: BuildingOfficeIcon, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ]

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your business performance and quick actions.</p>
      </div>

      {/* Quick Links */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${link.bg} transition-transform group-hover:scale-110`}>
              <link.icon className={`h-6 w-6 ${link.color}`} />
            </div>
            <span className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">{link.label}</span>
          </Link>
        ))}
      </section>

      {/* Primary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transactions Today</div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">{s.transactions_today ?? 0}</div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-5">
            <PaperAirplaneIcon className="h-full w-full" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Income Today</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{Number(s.income_today ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-5">
            <ArrowUpRightIcon className="h-full w-full" />
          </div>
        </div>
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all ${
          (s.pending_transactions ?? 0) > 0 
            ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20' 
            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
        }`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Pending Approval</div>
          <div className={`mt-2 text-3xl font-bold ${(s.pending_transactions ?? 0) > 0 ? 'text-amber-600 pulse' : 'text-slate-400'}`}>
            {s.pending_transactions ?? 0}
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-5">
            <ClockIcon className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Hawala Detailed Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />
            Send Hawala Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <ClockIcon className="h-4 w-4 text-amber-500" />
                Pending
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{s.send_hawala_pending ?? 0}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                Confirmed
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{s.send_hawala_confirmed ?? 0}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <ArrowDownLeftIcon className="h-5 w-5 text-emerald-500" />
            Receive Hawala Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <ClockIcon className="h-4 w-4 text-amber-500" />
                Pending
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{s.receive_hawala_pending ?? 0}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                Confirmed
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{s.receive_hawala_confirmed ?? 0}</div>
            </div>
          </div>
        </section>
      </div>

      {/* Cash & Bank Balances */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <BanknotesIcon className="h-5 w-5 text-indigo-500" />
            Cash Box Balances
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50">
                <tr>
                  <th className="px-4 py-4 font-semibold">Currency</th>
                  <th className="px-4 py-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashSummary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300">{row.currency_name}</td>
                    <td className={`px-4 py-4 text-right font-mono font-bold ${Number(row.cash_balance ?? 0) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {Number(row.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {cashSummary.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-slate-400 italic">No cash data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <BuildingOfficeIcon className="h-5 w-5 text-cyan-500" />
            Bank Balances
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50">
                <tr>
                  <th className="px-4 py-4 font-semibold">Currency</th>
                  <th className="px-4 py-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashSummary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300">{row.currency_name}</td>
                    <td className={`px-4 py-4 text-right font-mono font-bold ${Number(row.bank_balance ?? 0) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {Number(row.bank_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {cashSummary.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-slate-400 italic">No bank data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
