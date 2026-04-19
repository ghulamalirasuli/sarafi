import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { SearchSelect } from '../../components/SearchSelect'
import { TransactionList } from '../../components/TransactionList'
import { useLocale } from '../../context/LocaleContext'
import { api } from '../../lib/api'
import { stripHtml } from '../../lib/html'

export function BankBoxPage() {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [currencyId, setCurrencyId] = useState('')
  const [bankId, setBankId] = useState('')

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>(
        '/currencies?per_page=200',
      )
      return data.data ?? []
    },
  })

  const banks = useQuery({
    queryKey: ['banks', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/banks?per_page=500')
      return data.data ?? []
    },
  })

  const balance = useQuery({
    queryKey: ['cashbox-balance', 'bank', bankId, currencyId],
    queryFn: async () => {
      const { data } = await api.get<{ balances: any[] }>('/cashbox/balance', {
        params: { bank_id: bankId || undefined, currency_id: currencyId || undefined, type: 'deposit' },
      })
      return data.balances
    },
    enabled: !!bankId,
  })

  const curRows = useMemo(() => (Array.isArray(currencies.data) ? currencies.data : []), [currencies.data])
  const bankRows = useMemo(() => (Array.isArray(banks.data) ? banks.data : []), [banks.data])

  const currencyOptionsAll = useMemo(
    () => [{ value: '', label: t('nav.currencies') }, ...curRows.map((c) => ({ value: String(c.id), label: c.currency_name }))],
    [curRows, t],
  )
  const bankOptions = useMemo(
    () => bankRows.map((b: any) => ({
      value: String(b.id),
      label: `${b.bankname || ''} (${b.bankaccount || ''}) - ${b.accountnumber || ''}`.trim(),
    })),
    [bankRows],
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('nav.bankBox')}</h1>

      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">{t('common.status')}</h2>

        <div className="mb-2 inline-block min-w-[18rem] max-w-xl align-top">
          <SearchSelect
            options={bankOptions}
            value={bankId}
            onChange={(v) => setBankId(v || '')}
            placeholder={t('nav.banks')}
            isClearable={false}
          />
        </div>

        <div className="mb-2 ml-2 inline-block min-w-[12rem] max-w-xs align-top">
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
          className="ml-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
          onClick={() => void balance.refetch()}
          disabled={!bankId}
        >
          {t('common.loading')}...
        </button>
        <button
          type="button"
          className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => {
            setBankId('')
            setCurrencyId('')
            void qc.invalidateQueries({ queryKey: ['cash-box'] })
            void qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
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
                    <div className={`text-lg font-bold ${Number(b.balance) >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-red-700 dark:text-red-300'}`}>
                      {Number(b.balance).toLocaleString()} {b.currency_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {bankId ? (
        <TransactionList
          apiPath="cash-box"
          title={t('nav.bankBox')}
          filters={{ currency_id: currencyId || undefined, bank_id: bankId || undefined, type: 'deposit' }}
          columns={[
            { key: 'credit', label: t('common.credit'), format: (v) => <span className="text-emerald-600 font-bold">{v}</span> },
            { key: 'debit', label: t('common.debit'), format: (v) => <span className="text-red-600 font-bold">{v}</span> },
            { key: 'currency_id', label: t('common.currency'), format: (v) => curRows.find(c => c.id === v)?.currency_name || v },
            { key: 'description', label: t('common.description'), format: (v) => stripHtml(v) },
          ]}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Please select a bank to view Bank Transfer deposits.
        </div>
      )}
    </div>
  )
}
