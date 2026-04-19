import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '../../lib/api'

export function BranchDashboard() {
  const q = useQuery({
    queryKey: ['dashboard', 'branch'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/branch')
      return data as any
    },
  })

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>('/currencies?per_page=200')
      return data.data ?? []
    },
  })

  const curMap = useMemo(() => {
    const list = currencies.data ?? []
    return new Map(list.map(c => [c.id, c.currency_name]))
  }, [currencies.data])

  if (q.isLoading) return <div className="flex h-64 items-center justify-center"><p className="text-sm text-slate-500">Loading dashboard...</p></div>

  const data = q.data ?? {}
  const summary = data.summary ?? {}
  const cash = data.cash ?? []
  const staff = data.staff ?? []

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branch Dashboard</h1>
        <div className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Send Hawala</div>
          <div className="mt-1 text-3xl font-bold text-indigo-600">{summary.send_hawala ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Receive Hawala</div>
          <div className="mt-1 text-3xl font-bold text-blue-600">{summary.receive_hawala ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Exchanges</div>
          <div className="mt-1 text-3xl font-bold text-emerald-600">{summary.exchanges ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Cash Balances */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Cash Balances</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Currency</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cash.length === 0 ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">No balances found</td></tr>
                ) : (
                  cash.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold">{curMap.get(c.currency_id) || `Currency #${c.currency_id}`}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${Number(c.balance) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {Number(c.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Staff List */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Staff Members</h2>
          <div className="grid gap-3">
            {staff.map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <span className="text-xs font-bold">{s.fullname.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{s.fullname}</div>
                  <div className="text-[10px] text-slate-500">@{s.username} • {s.role.replace('_', ' ')}</div>
                </div>
                <div className={`h-2 w-2 rounded-full ${s.is_active ? 'bg-emerald-500 pulse' : 'bg-slate-300'}`} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Placeholder for Recent Activity if available */}
      {data.recent_customer_ledger && data.recent_customer_ledger.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Recent Activity</h2>
          {/* Table or list for ledger entries */}
        </section>
      )}
    </div>
  )
}
