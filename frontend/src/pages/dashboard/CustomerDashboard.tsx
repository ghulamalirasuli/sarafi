import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function CustomerDashboard() {
  const q = useQuery({
    queryKey: ['dashboard', 'customer'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/customer')
      return data as any
    },
  })

  if (q.isLoading) return <div className="flex h-64 items-center justify-center"><p className="text-sm text-slate-500">Loading your dashboard...</p></div>

  const data = q.data ?? {}
  const ledger = data.ledger ?? []
  const summary = data.summary ?? []

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Account Overview</h1>
        <div className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
      </div>

      {/* Balance Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-slate-900/50">
            No active balances found for your account.
          </div>
        ) : (
          summary.map((s: any, i: number) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.currency_name} Balance</div>
              <div className={`mt-1 text-2xl font-bold ${Number(s.balance) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {Number(s.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Ledger */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recent Transactions</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ledger.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">No recent transactions to display</td></tr>
              ) : (
                ledger.map((r: any, i: number) => {
                  const amt = Number(r.credit) - Number(r.debit)
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{r.date || r.created_at?.split('T')[0]}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{r.reference_no}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.description}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${amt < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {amt > 0 ? '+' : ''}{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
