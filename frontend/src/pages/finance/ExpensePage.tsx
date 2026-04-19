import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { TransactionList } from '../../components/TransactionList'
import { SearchSelect } from '../../components/SearchSelect'
import { useLocale } from '../../context/LocaleContext'
import { PrintHeader } from '../../components/PrintHeader'
import { stripHtml } from '../../lib/html'

export function ExpensePage() {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    amount: '',
    currency: 'USD',
    description: '',
  })
  const [open, setOpen] = useState(false)

  const refQuery = useQuery({
    queryKey: ['ref', 'ex'],
    queryFn: async () => {
      const { data } = await api.get<{ reference_no: string }>('/references/expense')
      return data.reference_no
    },
  })

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>('/currencies?per_page=200')
      return data.data ?? []
    },
  })

  const currencyOptions = useMemo(
    () => (Array.isArray(currencies.data) ? currencies.data.map((c) => ({ value: c.currency_name, label: c.currency_name })) : []),
    [currencies.data],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description,
        status: 'pending',
      }
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload)
      } else {
        await api.post('/expenses', { ...payload, reference_no: refQuery.data })
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses'] })
      void qc.invalidateQueries({ queryKey: ['cash-box'] })
      void qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
      void qc.invalidateQueries({ queryKey: ['reports', 'cashbox'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void refQuery.refetch()
      setOpen(false)
      setEditingId(null)
      setForm({
        amount: '',
        currency: 'USD',
        description: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const openEdit = (row: any) => {
    setForm({
      amount: String(row.amount),
      currency: row.currency,
      description: row.description || '',
    })
    setEditingId(row.id)
    setOpen(true)
  }

  const dateInputClass =
    'rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 cursor-pointer'

  return (
    <div className="space-y-6">
      <PrintHeader />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">{t('nav.expenses')}</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div className="no-print min-w-[12rem]">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('nav.currencies')}</span>
            <SearchSelect
              options={[{ value: '', label: t('nav.currencies') }, ...currencyOptions]}
              value={currencyFilter}
              onChange={(v) => setCurrencyFilter(v || '')}
              placeholder={t('nav.currencies')}
            />
          </div>
          <label className="no-print flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.from')}</span>
            <input
              type="date"
              className={dateInputClass}
              value={dateFrom}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="no-print flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.to')}</span>
            <input
              type="date"
              className={dateInputClass}
              value={dateTo}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setCurrencyFilter('')
              setDateFrom('')
              setDateTo('')
              void qc.invalidateQueries({ queryKey: ['expenses'] })
            }}
            className="no-print rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.reset')}
          </button>
          <button
            onClick={() => window.print()}
            className="no-print rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {t('common.print')}
          </button>
          <button
            onClick={() => {
              setEditingId(null)
              setForm({
                amount: '',
                currency: 'USD',
                description: '',
              })
              setOpen(true)
            }}
            className="no-print rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {t('common.add')} {t('nav.expenses')}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold">{t('common.add')} {t('nav.expenses')}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <p className="text-sm text-slate-500 sm:col-span-2">{t('common.reference')}: {refQuery.data ?? '…'}</p>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.debit')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.currency')}</span>
                <SearchSelect
                  options={currencyOptions}
                  value={form.currency}
                  onChange={(v) => setForm((s) => ({ ...s, currency: v || 'USD' }))}
                  placeholder="Select"
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
                disabled={mutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                onClick={() => void mutation.mutateAsync()}
              >
                {mutation.isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionList
        apiPath="expenses"
        title={t('nav.expenses')}
        filters={{ 
          currency: currencyFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }}
        onEdit={openEdit}
        onDelete={(id) => void deleteMutation.mutateAsync(id)}
        columns={[
          { key: 'amount', label: t('common.debit'), format: (v, r) => `${v} ${r.currency}` },
          { key: 'description', label: t('common.description'), format: (v) => stripHtml(v) },
        ]}
      />
    </div>
  )
}
