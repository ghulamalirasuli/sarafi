import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { SearchSelect } from '../../components/SearchSelect'
import { api } from '../../lib/api'
import { TransactionList } from '../../components/TransactionList'
import { useLocale } from '../../context/LocaleContext'
import { PrintHeader } from '../../components/PrintHeader'
import { stripHtml } from '../../lib/html'

export function ExchangePage() {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [form, setForm] = useState({
    pay_type: 'cash',
    customer_id: '',
    from_currency_id: '',
    to_currency_id: '',
    amount: '',
    rate: '',
    market_rate: '',
    action: 'Mul',
    rate_amount: '',
    market_amount: '',
    benefit: '',
    description: '',
  })
  const [open, setOpen] = useState(false)

  const customers = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; fullname: string }[] }>('/customers?per_page=200')
      return data.data ?? []
    },
  })

  const customerOptions = useMemo(
    () => (Array.isArray(customers.data) ? customers.data.map((c) => ({ value: String(c.id), label: c.fullname })) : []),
    [customers.data],
  )

  const refQuery = useQuery({
    queryKey: ['ref', 'fx'],
    queryFn: async () => {
      const { data } = await api.get<{ reference_no: string }>('/references/money-exchange')
      return data.reference_no
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

  const curRows = useMemo(() => (Array.isArray(currencies.data) ? currencies.data : []), [currencies.data])

  const currencyOptions = useMemo(
    () => curRows.map((c) => ({ value: String(c.id), label: c.currency_name })),
    [curRows],
  )

  useEffect(() => {
    const amount = parseFloat(form.amount) || 0
    const rate = parseFloat(form.rate) || 0
    const marketRate = parseFloat(form.market_rate) || 0
    const action = form.action

    let sellAmount = 0
    let marketSellAmount = 0

    if (action === 'Mul') {
      sellAmount = amount * rate
      marketSellAmount = amount * marketRate
    } else if (action === 'Div') {
      sellAmount = rate !== 0 ? amount / rate : 0
      marketSellAmount = marketRate !== 0 ? amount / marketRate : 0
    }

    const benefit = sellAmount - marketSellAmount

    setForm((s) => ({
      ...s,
      rate_amount: sellAmount.toFixed(2),
      market_amount: marketSellAmount.toFixed(2),
      benefit: benefit.toFixed(2),
    }))
  }, [form.amount, form.rate, form.market_rate, form.action])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        reference_no: refQuery.data,
        paytype: form.pay_type === 'cash' ? 'Cash' : 'Customer',
        customer: form.pay_type === 'customer' ? Number(form.customer_id) : null,
        from_currency: Number(form.from_currency_id),
        to_currency: Number(form.to_currency_id),
        buy_amount: Number(form.amount),
        rate: form.rate ? Number(form.rate) : null,
        market_rate: form.market_rate ? Number(form.market_rate) : null,
        action: form.action,
        sell_amount: Number(form.rate_amount),
        market_sell_amount: Number(form.market_amount),
        benefit: Number(form.benefit),
        description: form.description,
        status: 'Pending',
      }
      await api.post('/money-exchanges', payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['money-exchanges'] })
      void refQuery.refetch()
      setOpen(false)
      setForm({
        pay_type: 'cash',
        customer_id: '',
        from_currency_id: '',
        to_currency_id: '',
        amount: '',
        rate: '',
        market_rate: '',
        action: 'Mul',
        rate_amount: '',
        market_amount: '',
        benefit: '',
        description: '',
      })
    },
  })

  return (
    <div className="space-y-6">
      <PrintHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('nav.exchange')}</h1>
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
            {t('common.add')} {t('nav.exchange')}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold">{t('common.add')} {t('nav.exchange')}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <p className="text-sm text-slate-500 sm:col-span-2">{t('common.reference')}: {refQuery.data ?? '…'}</p>
              
              <div className="sm:col-span-2 flex items-center gap-6 py-2">
                <span className="font-medium">{t('common.type')}:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    checked={form.pay_type === 'cash'}
                    onChange={() => setForm(s => ({ ...s, pay_type: 'cash', customer_id: '' }))}
                  />
                  <span>{t('common.cash')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    checked={form.pay_type === 'customer'}
                    onChange={() => setForm(s => ({ ...s, pay_type: 'customer' }))}
                  />
                  <span>{t('common.customer')}</span>
                </label>
              </div>

              {form.pay_type === 'customer' && (
                <label className="block sm:col-span-2">
                  <span className="mb-1 block font-medium">{t('common.customer')}</span>
                  <SearchSelect
                    options={customerOptions}
                    value={form.customer_id}
                    onChange={(v) => setForm((s) => ({ ...s, customer_id: v }))}
                    placeholder={t('common.loading')}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block font-medium">{t('common.buyCurrency')}</span>
                <SearchSelect
                  options={currencyOptions}
                  value={form.from_currency_id}
                  onChange={(v) => setForm((s) => ({ ...s, from_currency_id: v }))}
                  placeholder={t('common.loading')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.sellCurrency')}</span>
                <SearchSelect
                  options={currencyOptions}
                  value={form.to_currency_id}
                  onChange={(v) => setForm((s) => ({ ...s, to_currency_id: v }))}
                  placeholder={t('common.loading')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.buyAmount')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.rate')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.rate}
                  onChange={(e) => setForm((s) => ({ ...s, rate: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.marketRate')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.market_rate}
                  onChange={(e) => setForm((s) => ({ ...s, market_rate: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.action')}</span>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.action}
                  onChange={(e) => setForm((s) => ({ ...s, action: e.target.value }))}
                >
                  <option value="Mul">{t('common.mul')}</option>
                  <option value="Div">{t('common.div')}</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.marketSellAmount')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none dark:border-slate-700 dark:bg-slate-800"
                  value={form.market_amount}
                  readOnly
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.sellAmount')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none dark:border-slate-700 dark:bg-slate-800"
                  value={form.rate_amount}
                  readOnly
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.benefit')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none dark:border-slate-700 dark:bg-slate-800"
                  value={form.benefit}
                  readOnly
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
        apiPath="money-exchanges"
        title={t('nav.exchange')}
        columns={[
          { key: 'pay_type', label: t('common.type'), format: (v) => v },
          { key: 'amount', label: t('common.buyAmount'), format: (v, r) => `${v} ${curRows.find(c => c.id === r.from_currency)?.currency_name || ''}` },
          { key: 'rate_amount', label: t('common.sellAmount'), format: (v, r) => `${v} ${curRows.find(c => c.id === r.to_currency)?.currency_name || ''}` },
          { key: 'rate', label: t('common.rate') },
          { key: 'benefit', label: t('common.benefit') },
          { key: 'description', label: t('common.description'), format: (v) => stripHtml(v) },
        ]}
      />
    </div>
  )
}
