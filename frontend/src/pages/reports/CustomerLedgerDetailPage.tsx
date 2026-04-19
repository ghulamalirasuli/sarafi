import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SearchSelect } from '../../components/SearchSelect'
import { ColumnVisibilityMenu } from '../../components/ColumnVisibilityMenu'
import { TablePagination } from '../../components/TablePagination'
import { useClientPagination } from '../../hooks/useClientPagination'
import { useColumnVisibility } from '../../hooks/useColumnVisibility'
import { api } from '../../lib/api'
import { useLocale } from '../../context/LocaleContext'
import { toast } from 'sonner'
import { errorMessage } from '../../lib/errorMessage'
import { PrintHeader } from '../../components/PrintHeader'
import { MagnifyingGlassIcon, ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { stripHtml } from '../../lib/html'

const LEDGER_COLS = [
  { key: 'reference_no', labelKey: 'common.ref' },
  { key: 'bill_no', labelKey: 'common.bill' },
  { key: 'description', labelKey: 'common.description', format: (v: string) => stripHtml(v) },
  { key: 'credit', labelKey: 'common.credit' },
  { key: 'debit', labelKey: 'common.debit' },
  { key: 'balance', labelKey: 'common.balance', format: (v: any, row: any) => `${Number(v).toLocaleString()} ${row.currency_name || ''}` },
  { key: 'source', labelKey: 'common.source' },
  { key: 'date', labelKey: 'common.date' },
] as const

const defaultVis: Record<string, boolean> = {
  reference_no: true,
  bill_no: true,
  description: true,
  credit: true,
  debit: true,
  balance: true,
  source: false,
  date: true,
}

export function CustomerLedgerDetailPage() {
  const { id } = useParams()
  const { t } = useLocale()
  const qc = useQueryClient()
  const [currencyId, setCurrencyId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterText, setFilterText] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    credit: '',
    debit: '',
    description: '',
    bill_no: '',
    currency_id: '',
    date_confirm: new Date().toISOString().split('T')[0],
  })

  // Set default currency in form when opening modal
  useEffect(() => {
    if (open) {
      setForm((s) => ({
        ...s,
        currency_id: currencyId || '',
        credit: '',
        debit: '',
        description: '',
        bill_no: '',
        date_confirm: new Date().toISOString().split('T')[0],
      }))
    }
  }, [open, currencyId])

  const { vis, setCol } = useColumnVisibility('sarafi-cols-customer-ledger-detail', defaultVis)

  const customerQuery = useQuery({
    queryKey: ['ledger', 'customer', 'detail', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: any[], customer: { fullname: string } }>(`/ledger/customer/${id}`)
      return data
    },
    enabled: !!id,
  })

  const currenciesQuery = useQuery({
    queryKey: ['currencies', 'ledger-filter'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>(
        '/currencies?per_page=200',
      )
      return data.data ?? []
    },
  })

  const curRows = useMemo(() => (Array.isArray(currenciesQuery.data) ? currenciesQuery.data : []), [currenciesQuery.data])
  const currencyOptions = useMemo(() => curRows.map((c) => ({ value: String(c.id), label: c.currency_name })), [curRows])

  const balancesQuery = useQuery({
    queryKey: ['ledger', 'customer', 'balances', id],
    queryFn: async () => {
      const { data } = await api.get<{ balances: any[] }>(`/ledger/balances/customer/${id}`)
      return data.balances
    },
    enabled: !!id,
  })

  const q = useQuery({
    queryKey: ['ledger', 'customer', id, currencyId, dateFrom, dateTo],
    queryFn: async () => {
      if (!id) return { data: [] as Record<string, unknown>[] }
      const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/ledger/customer/${id}`, {
        params: {
          currency_id: currencyId || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      return data
    },
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/customer-ledgers', {
        customer_id: Number(id),
        currency_id: Number(form.currency_id),
        credit: form.credit ? Number(form.credit) : 0,
        debit: form.debit ? Number(form.debit) : 0,
        description: form.description,
        bill_no: form.bill_no,
        date_confirm: form.date_confirm,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ledger', 'customer'] })
      void qc.invalidateQueries({ queryKey: ['ledger', 'customer', 'balances'] })
      setOpen(false)
      setForm({
        credit: '',
        debit: '',
        description: '',
        bill_no: '',
        currency_id: '',
        date_confirm: new Date().toISOString().split('T')[0],
      })
      toast.success(t('common.success'))
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const rows = useMemo(() => q.data?.data ?? [], [q.data])

  const filtered = useMemo(() => {
    const term = filterText.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      LEDGER_COLS.some((c) =>
        String(r[c.key] ?? '')
          .toLowerCase()
          .includes(term),
      ),
    )
  }, [rows, filterText])

  const { slice, meta } = useClientPagination(filtered, page, perPage)

  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page))
    }
  }, [meta, page])

  const colSpan = useMemo(() => LEDGER_COLS.filter((c) => vis[c.key]).length || 1, [vis])

  const exportCsv = () => {
    const header = LEDGER_COLS.map((c) => c.key)
    const lines = [header.join(',')]
    filtered.forEach((r) => {
      lines.push(
        header
          .map((h) => {
            const v = r[h]
            const s = v == null ? '' : String(v).replaceAll('"', '""')
            return `"${s}"`
          })
          .join(','),
      )
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-customer-${id}-${customerQuery.data?.customer?.fullname || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dateInputClass =
    'rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 cursor-pointer'

  const displayBalances = useMemo(() => {
    if (!balancesQuery.data) return []
    if (!currencyId) return balancesQuery.data
    return balancesQuery.data.filter((b: any) => String(b.id) === currencyId)
  }, [balancesQuery.data, currencyId])

  return (
    <div className="print-area space-y-4">
      <PrintHeader />
      <nav className="no-print flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 sm:space-x-4">
          <li>
            <div className="flex items-center">
              <Link to="../.." className="text-slate-400 hover:text-slate-500">
                <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">Dashboard</span>
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              <Link to=".." className="ml-2 sm:ml-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                {t('nav.customerLedger')}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              <span className="ml-2 sm:ml-4 text-sm font-medium text-slate-900 dark:text-slate-100" aria-current="page">
                {customerQuery.data?.customer?.fullname} - {t('nav.ledger')}
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <div className="no-print flex flex-wrap items-end gap-2">
        <h1 className="mr-auto text-xl font-semibold">
          {customerQuery.data?.customer?.fullname} - {t('nav.ledger')}
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {t('common.add')} {t('nav.ledger')}
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => window.print()}
        >
          {t('common.print')}
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={exportCsv}
        >
          {t('common.statement')}
        </button>
      </div>

      <div className="no-print flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem]">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.currency')}</span>
          <SearchSelect
            options={currencyOptions}
            value={currencyId}
            onChange={(v) => {
              setCurrencyId(v)
              setPage(1)
              setFilterText('')
            }}
            placeholder={t('common.currency')}
          />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.from')}</span>
          <input
            type="date"
            className={dateInputClass}
            value={dateFrom}
            onClick={(e) => e.currentTarget.showPicker()}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
              setFilterText('')
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.to')}</span>
          <input
            type="date"
            className={dateInputClass}
            value={dateTo}
            onClick={(e) => e.currentTarget.showPicker()}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
              setFilterText('')
            }}
          />
        </label>
        <div className="relative flex-1 min-w-[12rem]">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('nav.search')}</span>
          <div className="pointer-events-none absolute bottom-0 left-0 flex items-center pl-3 pb-2.5">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          </div>
          <input
            className="w-full rounded border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder={t('nav.search') + '...'}
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <ColumnVisibilityMenu
          columns={LEDGER_COLS.map((c) => ({ key: c.key, label: t(c.labelKey) }))}
          visibility={vis}
          onToggle={setCol}
        />
      </div>

      {displayBalances.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 no-print">
          {displayBalances.map((b: any) => (
            <div key={b.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{b.currency_name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Number(b.balance) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {Number(b.balance) >= 0 ? 'Cr' : 'Dr'}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">{t('common.netBalance')}</div>
                  <div className={`text-lg font-bold ${Number(b.balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Math.abs(Number(b.balance)).toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <div>Cr: {Number(b.total_credit).toLocaleString()}</div>
                  <div>Dr: {Number(b.total_debit).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm rtl:text-right">
            <thead className="bg-slate-100 text-xs uppercase dark:bg-slate-900">
              <tr>
                {LEDGER_COLS.map((c) =>
                    vis[c.key] ? (
                      <th key={c.key} className="px-4 py-3 font-semibold">
                        {t(c.labelKey)}
                      </th>
                    ) : null,
                  )}
              </tr>
            </thead>
            <tbody>
              {q.isLoading && (
                <tr>
                  <td colSpan={colSpan} className="px-2 py-6 text-center text-slate-500">
                    {t('common.loading')}...
                  </td>
                </tr>
              )}
              {!q.isLoading && slice.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-2 py-6 text-center text-slate-500">
                    {t('common.noRows')}
                  </td>
                </tr>
              )}
              {slice.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      {LEDGER_COLS.map((c) =>
                        vis[c.key] ? (
                          <td key={c.key} className="px-4 py-4">
                            {c.format ? c.format(r[c.key] as string, r) : String(r[c.key] ?? '')}
                          </td>
                        ) : null,
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          meta={meta}
          onPageChange={setPage}
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold">{t('common.add')} {t('nav.ledger')}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.currency')}</span>
                <SearchSelect
                  options={currencyOptions}
                  value={form.currency_id}
                  onChange={(v) => setForm((s) => ({ ...s, currency_id: v }))}
                  placeholder={t('common.currency')}
                />
              </div>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.credit')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="0.00"
                  value={form.credit}
                  onChange={(e) => setForm((s) => ({ ...s, credit: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.debit')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="0.00"
                  value={form.debit}
                  onChange={(e) => setForm((s) => ({ ...s, debit: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.bill')}</span>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.bill_no}
                  onChange={(e) => setForm((s) => ({ ...s, bill_no: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.date')}</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 cursor-pointer"
                  value={form.date_confirm}
                  onClick={(e) => e.currentTarget.showPicker()}
                  onChange={(e) => setForm((s) => ({ ...s, date_confirm: e.target.value }))}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.description')}</span>
                <textarea
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={mutation.isPending || !form.currency_id}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                onClick={() => void mutation.mutateAsync()}
              >
                {mutation.isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
