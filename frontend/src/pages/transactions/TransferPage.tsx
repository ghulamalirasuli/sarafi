import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { SearchSelect } from '../../components/SearchSelect'
import { api } from '../../lib/api'
import { TransactionList } from '../../components/TransactionList'
import { useLocale } from '../../context/LocaleContext'
import { PrintHeader } from '../../components/PrintHeader'
import { stripHtml } from '../../lib/html'

export function TransferPage() {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [form, setForm] = useState({
    from_customer: '',
    to_customer: '',
    currency: '',
    amount: '',
    billno1: '',
    billno2: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [open, setOpen] = useState(false)

  const refQuery = useQuery({
    queryKey: ['ref', 'mt'],
    queryFn: async () => {
      const { data } = await api.get<{ reference_no: string }>('/references/money-transfer')
      return data.reference_no
    },
  })

  const customers = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; fullname: string }[] }>('/customers?per_page=200')
      return data.data ?? []
    },
  })

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>(
        '/currencies?per_page=200',
      )
      return data.data ?? []
    },
  })

  const custRows = useMemo(() => (Array.isArray(customers.data) ? customers.data : []), [customers.data])
  const curRows = useMemo(() => (Array.isArray(currencies.data) ? currencies.data : []), [currencies.data])

  const fromCustomerOptions = useMemo(
    () => custRows.map((c) => ({ value: String(c.id), label: c.fullname })),
    [custRows],
  )

  const toCustomerOptions = useMemo(
    () => custRows
      .filter(c => String(c.id) !== form.from_customer)
      .map((c) => ({ value: String(c.id), label: c.fullname })),
    [custRows, form.from_customer],
  )

  const currencyOptions = useMemo(
    () => curRows.map((c) => ({ value: String(c.id), label: c.currency_name })),
    [curRows],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        reference_no: refQuery.data,
        from_customer: Number(form.from_customer),
        to_customer: Number(form.to_customer),
        amount: Number(form.amount),
        currency: Number(form.currency),
        billno1: form.billno1,
        billno2: form.billno2,
        description: form.description,
        date: form.date,
        status: 'pending',
      }
      await api.post('/money-transfers', payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['money-transfers'] })
      void refQuery.refetch()
      setOpen(false)
      setForm({
        from_customer: '',
        to_customer: '',
        amount: '',
        currency: '',
        billno1: '',
        billno2: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    },
  })

  return (
    <div className="space-y-6">
      <PrintHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('nav.transfer')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="no-print rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {t('common.print')}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="no-print rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {t('common.add')} {t('nav.transfer')}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold">{t('common.add')} {t('nav.transfer')}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <p className="text-sm text-slate-500 sm:col-span-2">{t('common.reference')}: {refQuery.data ?? '…'}</p>
              
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.date')}</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.date}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">{t('nav.customers')} (From)</span>
                <SearchSelect
                  options={fromCustomerOptions}
                  value={form.from_customer}
                  onChange={(v) => setForm((s) => ({ ...s, from_customer: v }))}
                  placeholder={t('common.loading')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('nav.customers')} (To)</span>
                <SearchSelect
                  options={toCustomerOptions}
                  value={form.to_customer}
                  onChange={(v) => setForm((s) => ({ ...s, to_customer: v }))}
                  placeholder={t('common.loading')}
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">{t('common.currency')}</span>
                <SearchSelect
                  options={currencyOptions}
                  value={form.currency}
                  onChange={(v) => setForm((s) => ({ ...s, currency: v }))}
                  placeholder={t('common.loading')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.amount')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">{t('common.fromCustomerBill')}</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.billno1}
                  onChange={(e) => setForm((s) => ({ ...s, billno1: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.toCustomerBill')}</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.billno2}
                  onChange={(e) => setForm((s) => ({ ...s, billno2: e.target.value }))}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.description')}</span>
                <textarea
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  rows={2}
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
        apiPath="money-transfers"
        title={t('nav.transfer')}
        columns={[
          { key: 'amount', label: t('common.amount'), format: (v, r) => `${v} ${curRows.find(c => c.id === r.currency_id)?.currency_name || ''}` },
          { key: 'from_customer', label: t('nav.customers') + ' (From)', format: (v) => custRows.find(c => c.id === v)?.fullname || v },
          { key: 'to_customer', label: t('nav.customers') + ' (To)', format: (v) => custRows.find(c => c.id === v)?.fullname || v },
          { key: 'bill_no1', label: t('common.fromCustomerBill') },
          { key: 'bill_no2', label: t('common.toCustomerBill') },
          { key: 'description', label: t('common.description'), format: (v) => stripHtml(v) },
        ]}
      />
    </div>
  )
}
