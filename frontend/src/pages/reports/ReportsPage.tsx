import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../lib/api'

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [diffDate, setDiffDate] = useState('')

  const currenciesQuery = useQuery({
    queryKey: ['currencies', 'reports-all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>(
        '/currencies?per_page=200',
      )
      return data.data ?? []
    },
  })

  const curRows = useMemo(() => (Array.isArray(currenciesQuery.data) ? currenciesQuery.data : []), [currenciesQuery.data])

  const cashbox = useQuery({
    queryKey: ['reports', 'cashbox'],
    queryFn: async () => {
      const { data } = await api.get('/reports/cashbox')
      return data
    },
  })

  const income = useQuery({
    queryKey: ['reports', 'income', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/reports/income', {
        params: { date_from: dateFrom || undefined, date_to: dateTo || undefined },
      })
      return data
    },
  })

  const diff = useQuery({
    queryKey: ['reports', 'diff', diffDate],
    queryFn: async () => {
      const { data } = await api.get('/reports/cashbox-diff', {
        params: { date: diffDate },
      })
      return data
    },
    enabled: !!diffDate,
  })

  const dateClass =
    'rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

  const formatCurrency = (amt: number | string | undefined) => {
    const n = Number(amt || 0)
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const renderTable = (data: any[] | undefined, columns: { key: string; label: string; format?: (v: any, row: any) => React.ReactNode }[]) => {
    if (!data || data.length === 0) return <p className="py-4 text-center text-sm text-slate-500">No data available</p>
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-3">
                    {c.format ? c.format(row[c.key], row) : String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-6">
      <PrintHeader />
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Reports</h1>
        <button
          onClick={() => window.print()}
          className="no-print rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Print Report
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 rounded-full bg-indigo-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cash Box Summary</h2>
        </div>
        {cashbox.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
             {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : (
          renderTable(cashbox.data?.data, [
            { key: 'currency_id', label: 'Currency', format: (id) => <span className="font-semibold text-slate-700 dark:text-slate-300">{curRows.find(c => c.id === id)?.currency_name || id}</span> },
            { key: 'credit_total', label: 'Total In', format: formatCurrency },
            { key: 'debit_total', label: 'Total Out', format: formatCurrency },
            { key: 'balance', label: 'Available Balance', format: (v) => (
              <span className={`font-mono font-bold ${Number(v) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(v)}
              </span>
            )},
          ])
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Income Analysis</h2>
          </div>
          <div className="no-print flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-2 dark:bg-slate-950">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">From</span>
              <input type="date" className={dateClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">To</span>
              <input type="date" className={dateClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            <button
              type="button"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
              onClick={() => void income.refetch()}
            >
              Filter
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                void income.refetch()
              }}
            >
              Reset
            </button>
          </div>
        </div>
        {income.isLoading ? (
           <div className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : (
          renderTable(income.data?.data, [
            { key: 'due_type', label: 'Source Type', format: (v) => <span className="capitalize">{String(v || 'N/A').replace('_', ' ')}</span> },
            { key: 'currency_id', label: 'Currency', format: (id) => <span className="font-semibold">{curRows.find(c => c.id === id)?.currency_name || id}</span> },
            { key: 'net', label: 'Net Profit', format: (v) => (
              <span className={`font-mono font-bold ${Number(v) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(v)}
              </span>
            )},
          ])
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full bg-amber-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cash Box Discrepancy</h2>
          </div>
          <div className="no-print flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-2 dark:bg-slate-950">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Snapshot Date</span>
              <input type="date" className={dateClass} value={diffDate} onChange={(e) => setDiffDate(e.target.value)} />
            </label>
            <button
              type="button"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
              onClick={() => void diff.refetch()}
            >
              Load Diff
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setDiffDate('')}
            >
              Reset
            </button>
          </div>
        </div>
        {diff.isLoading ? (
           <div className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : (
          renderTable(diff.data?.data, [
            { key: 'snapshot_date', label: 'Date' },
            { key: 'currency_id', label: 'Currency', format: (id) => <span>{curRows.find(c => c.id === id)?.currency_name || id}</span> },
            { key: 'expected_balance', label: 'Expected', format: formatCurrency },
            { key: 'actual_balance', label: 'Actual', format: formatCurrency },
            { key: 'difference', label: 'Difference', format: (v) => (
              <span className={`font-mono font-bold ${Number(v) === 0 ? 'text-slate-500' : 'text-red-600'}`}>
                {Number(v) > 0 ? `+${formatCurrency(v)}` : formatCurrency(v)}
              </span>
            )},
          ])
        )}
      </section>
    </div>
  )
}
