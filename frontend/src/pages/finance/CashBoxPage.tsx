import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { SearchSelect } from '../../components/SearchSelect'
import { api } from '../../lib/api'
import { TransactionList } from '../../components/TransactionList'
import { useLocale } from '../../context/LocaleContext'
import { stripHtml } from '../../lib/html'

export function CashBoxPage() {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [currencyId, setCurrencyId] = useState('')

  const [form, setForm] = useState({
    credit: '',
    debit: '',
    description: '',
    type: 'manual',
  })
  const [open, setOpen] = useState(false)

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>(
        '/currencies?per_page=200',
      )
      return data.data ?? []
    },
  })

  const balance = useQuery({
    queryKey: ['cashbox-balance', currencyId],
    queryFn: async () => {
      const { data } = await api.get<{ balances: any[] }>('/cashbox/balance', {
        params: { currency_id: currencyId || undefined },
      })
      return data.balances
    },
  })

  const curRows = useMemo(() => (Array.isArray(currencies.data) ? currencies.data : []), [currencies.data])

  const currencyOptionsAll = useMemo(
    () => [{ value: '', label: t('nav.currencies') }, ...curRows.map((c) => ({ value: String(c.id), label: c.currency_name }))],
    [curRows, t],
  )
  const currencyOptionsPick = useMemo(
    () => curRows.map((c) => ({ value: String(c.id), label: c.currency_name })),
    [curRows],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/cash-box', {
        currency_id: Number(currencyId),
        credit: form.credit ? Number(form.credit) : 0,
        debit: form.debit ? Number(form.debit) : 0,
        description: form.description,
        type: form.type,
        status: 'pending',
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cash-box'] })
      void balance.refetch()
      setOpen(false)
      setForm({
        credit: '',
        debit: '',
        description: '',
        type: 'manual',
      })
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('nav.cashBox')}</h1>
      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">{t('common.status')}</h2>
        <div className="mb-2 inline-block min-w-[12rem] max-w-xs align-top">
          <SearchSelect
            options={currencyOptionsAll}
            value={currencyId}
            onChange={(v) => setCurrencyId(v || '')}
            placeholder={t('nav.currencies')}
            isClearable={false}
          />
        </div>
        <button
          type="button"
          className="ml-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
          onClick={() => void balance.refetch()}
        >
          {t('common.loading')}...
        </button>
        <button
          type="button"
          className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => {
            setCurrencyId('')
            void qc.invalidateQueries({ queryKey: ['cash-box'] })
            void qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
            void balance.refetch()
          }}
        >
          {t('common.reset')}
        </button>
        {balance.data && balance.data.length > 0 && (
          <div className="mt-4 space-y-4">
            {balance.data.map((b: any) => (
              <div key={b.currency_id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{b.currency_name} {t('common.status')}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-950">
                    <div className="text-[10px] uppercase font-bold text-slate-500">{t('common.totalCredit')}</div>
                    <div className="text-lg font-bold text-emerald-600">{Number(b.credit_total).toLocaleString()} {b.currency_name}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-950">
                    <div className="text-[10px] uppercase font-bold text-slate-500">{t('common.totalDebit')}</div>
                    <div className="text-lg font-bold text-red-600">{Number(b.debit_total).toLocaleString()} {b.currency_name}</div>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-3 shadow-sm dark:bg-indigo-950/20">
                    <div className="text-[10px] uppercase font-bold text-slate-500">{t('common.netBalance')}</div>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{Number(b.balance).toLocaleString()} {b.currency_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{t('nav.ledger')}</h2>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          {t('common.add')} {t('common.type')}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold">{t('common.add')} {t('nav.cashBox')}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.currency')}</span>
                <SearchSelect
                  options={currencyOptionsPick}
                  value={currencyId}
                  onChange={(v) => setCurrencyId(v || '')}
                  placeholder={t('common.loading')}
                />
              </label>
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
        apiPath="cash-box"
        title={t('nav.cashBox')}
        filters={{ currency_id: currencyId || undefined }}
        columns={[
          { key: 'credit', label: t('common.credit'), format: (v) => <span className="text-emerald-600 font-bold">{v}</span> },
          { key: 'debit', label: t('common.debit'), format: (v) => <span className="text-red-600 font-bold">{v}</span> },
          { key: 'currency_id', label: t('common.currency'), format: (v) => curRows.find(c => c.id === v)?.currency_name || v },
          { key: 'description', label: t('common.description') },
          { key: 'description', label: t('common.description'), format: (v) => stripHtml(v) },
        ]}
      />
    </div>
  )
}
