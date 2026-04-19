import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useLocale } from '../../context/LocaleContext'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type EntityBalance = {
  id: number
  name: string
  balances: {
    currency_id: number
    currency_name: string
    balance: number
  }[]
}

export function CustomerLedgerPage() {
  const { t } = useLocale()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['ledger', 'customer', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<{ data: EntityBalance[] }>('/ledger/summary/customer')
      return data.data
    },
  })

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>('/currencies?per_page=200')
      return data.data ?? []
    },
  })

  const filtered = useMemo(() => {
    if (!data) return []
    const s = search.toLowerCase().trim()
    if (!s) return data
    return data.filter((item) => item.name.toLowerCase().includes(s))
  }, [data, search])

  const curList = useMemo(() => currencies.data ?? [], [currencies.data])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">{t('nav.customerLedger')}</h1>
        <div className="relative max-w-sm w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
            placeholder={t('nav.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm rtl:text-right">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('nav.customers')}</th>
                {curList.map((c) => (
                  <th key={c.id} className="px-4 py-3 font-semibold text-center">
                    {c.currency_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={curList.length + 1} className="px-4 py-10 text-center text-slate-400">
                    {t('common.loading')}...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={curList.length + 1} className="px-4 py-10 text-center text-slate-400">
                    {t('common.noRows')}
                  </td>
                </tr>
              )}
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                    <Link to={`/admin/customer-ledger/${item.id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                      {item.name}
                    </Link>
                  </td>
                  {curList.map((c) => {
                    const b = item.balances.find((xb) => xb.currency_id === c.id)
                    const bal = b ? Number(b.balance) : 0
                    return (
                      <td key={c.id} className={`px-4 py-4 text-center font-mono font-bold ${bal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {bal.toLocaleString()}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
