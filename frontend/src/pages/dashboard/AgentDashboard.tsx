import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function UserDashboard() {
  const q = useQuery({
    queryKey: ['dashboard', 'user'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/user')
      return data as any
    },
  })

  const summary = q.data?.summary ?? {}

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/user/send-hawala" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Send Hawala
          </Link>
          <Link to="/user/receive-hawala" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-950 dark:text-white dark:ring-slate-800">
            Receive
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
           <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sent</div>
           <div className="mt-1 text-3xl font-bold text-indigo-600">{summary.send_hawala ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
           <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Received</div>
           <div className="mt-1 text-3xl font-bold text-blue-600">{summary.receive_hawala ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
           <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Exchanges</div>
           <div className="mt-1 text-3xl font-bold text-emerald-600">{summary.exchanges ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/user/exchange" className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-400">
          New Exchange
        </Link>
        <Link to="/user/transfer" className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-400">
          New Transfer
        </Link>
      </div>
    </div>
  )
}
