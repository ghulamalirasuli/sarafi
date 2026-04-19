import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SearchSelect } from '../../components/SearchSelect'
import { DEPOSIT_TYPE_OPTIONS } from '../../constants/selectOptions'
import { api } from '../../lib/api'
import { errorMessage } from '../../lib/errorMessage'
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useLocale } from '../../context/LocaleContext'
import { TransactionList } from '../../components/TransactionList'
import { PrintHeader } from '../../components/PrintHeader'
import { stripHtml } from '../../lib/html'

const targetTypeOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'agency', label: 'Agency' },
]

export function DepositPage() {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currencyFilter, setCurrencyFilter] = useState('')
  
  const [form, setForm] = useState({
    target_type: 'customer',
    customer_id: '',
    agency_id: '',
    bank_id: '',
    debit: '0',
    credit: '0',
    currency: 'USD',
    deposit_type: 'cash',
    status: 'pending',
    description: '',
  })

  const refQuery = useQuery({
    queryKey: ['ref', 'dp'],
    queryFn: async () => {
      const { data } = await api.get<{ reference_no: string }>('/references/deposit')
      return data.reference_no
    },
  })

  const customers = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/customers?per_page=500')
      return data.data ?? []
    },
  })

  const agencies = useQuery({
    queryKey: ['agencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/agencies?per_page=500')
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

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: number; currency_name: string }[] }>('/currencies?per_page=200')
      return data.data ?? []
    },
  })

  const customerOptions = useMemo(
    () => (Array.isArray(customers.data) ? customers.data.map((c: any) => ({ value: String(c.id), label: c.fullname })) : []),
    [customers.data],
  )

  const agencyOptions = useMemo(
    () => (Array.isArray(agencies.data) ? agencies.data.map((a: any) => ({ 
      value: String(a.id), 
      label: `${a.agency_responsible} (${a.agency_name})` 
    })) : []),
    [agencies.data],
  )

  const currencyOptions = useMemo(
    () => (Array.isArray(currencies.data) ? currencies.data.map((c) => ({ value: c.currency_name, label: c.currency_name })) : []),
    [currencies.data],
  )

  const bankOptions = useMemo(
    () => (Array.isArray(banks.data) ? banks.data.map((b: any) => ({
      value: String(b.id),
      label: `${b.bankname || ''} (${b.bankaccount || ''}) - ${b.accountnumber || ''}`.trim(),
    })) : []),
    [banks.data],
  )

  const depositTypeLabel = useMemo(() => {
    const m = new Map(DEPOSIT_TYPE_OPTIONS.map(o => [o.value, o.label]))
    return (v: string) => m.get(v) || v
  }, [])

  const depositColumns = useMemo(() => [
    {
      key: 'target',
      label: t('common.target'),
      format: (v: any, row: any) => {
        if (row.target_type === 'customer') {
          return row.customer?.fullname
        }
        if (row.target_type === 'agency') {
          return `${row.agency?.agency_name} (${row.agency?.agency_responsible})`
        }
        return '-'
      }
    },
    {
      key: 'deposit_type',
      label: t('common.depositType'),
      format: (v: string) => depositTypeLabel(v)
    },
    { key: 'currency', label: t('common.currency') },
    { key: 'debit', label: t('common.debit') },
    { key: 'credit', label: t('common.credit') },
    { key: 'description', label: t('common.description'), format: (v) => stripHtml(v) },
  ], [t, depositTypeLabel])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        customer_id: form.target_type === 'customer' ? Number(form.customer_id) : null,
        agency_id: form.target_type === 'agency' ? Number(form.agency_id) : null,
        bank_id: form.deposit_type === 'bank_transfer' ? (form.bank_id ? Number(form.bank_id) : null) : null,
        debit: Number(form.debit),
        credit: Number(form.credit),
      }
      if (editingId) {
        await api.put(`/deposits/${editingId}`, payload)
      } else {
        await api.post('/deposits', { ...payload, reference_no: refQuery.data })
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['deposits'] })
      void qc.invalidateQueries({ queryKey: ['cash-box'] })
      void qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
      void qc.invalidateQueries({ queryKey: ['reports', 'cashbox'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void refQuery.refetch()
      setOpen(false)
      resetForm()
      toast.success(editingId ? 'Deposit updated' : 'Deposit created')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/deposits/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['deposits'] })
      void qc.invalidateQueries({ queryKey: ['cash-box'] })
      void qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
      void qc.invalidateQueries({ queryKey: ['reports', 'cashbox'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Deposit deleted')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => 
      api.put(`/deposits/${id}`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['deposits'] })
      void qc.invalidateQueries({ queryKey: ['cash-box'] })
      void qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
      void qc.invalidateQueries({ queryKey: ['reports', 'cashbox'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Status updated')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const resetForm = () => {
    setForm({
      target_type: 'customer',
      customer_id: '',
      agency_id: '',
      bank_id: '',
      debit: '0',
      credit: '0',
      currency: 'USD',
      deposit_type: 'cash',
      status: 'pending',
      description: '',
    })
    setEditingId(null)
  }

  const openEdit = (row: any) => {
    setForm({
      target_type: row.target_type,
      customer_id: String(row.customer_id || ''),
      agency_id: String(row.agency_id || ''),
      bank_id: String(row.bank_id || ''),
      debit: String(row.debit || '0'),
      credit: String(row.credit || '0'),
      currency: row.currency || 'USD',
      deposit_type: row.deposit_type || 'cash',
      status: row.status,
      description: row.description || '',
    })
    setEditingId(row.id)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <PrintHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('nav.deposits')}</h1>
        <div className="flex items-center gap-4">
          <div className="no-print min-w-[12rem]">
            <SearchSelect
              options={[{ value: '', label: t('nav.currencies') }, ...currencyOptions]}
              value={currencyFilter}
              onChange={(v) => { setCurrencyFilter(v || ''); }}
              placeholder={t('nav.currencies')}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrencyFilter('')
              void qc.invalidateQueries({ queryKey: ['deposits'] })
            }}
            className="no-print rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.reset')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {t('common.print')}
          </button>
          <button
            onClick={() => { resetForm(); setOpen(true); }}
            className="no-print rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {t('common.add')} {t('nav.deposits')}
          </button>
        </div>
      </div>

      <TransactionList
        apiPath="deposits"
        title={t('nav.deposits')}
        columns={depositColumns}
        filters={{ currency: currencyFilter || undefined }}
        onEdit={openEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold">{editingId ? t('common.edit') : t('common.add')} {t('nav.deposits')}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              {!editingId && <p className="text-sm text-slate-500 sm:col-span-2">{t('common.reference')}: {refQuery.data ?? '…'}</p>}
              
              <label className="block">
                <span className="mb-1 block font-medium">{t('common.type')}</span>
                <SearchSelect
                  options={targetTypeOptions}
                  value={form.target_type}
                  onChange={(v) => setForm((s) => ({ ...s, target_type: v || 'customer', customer_id: '', agency_id: '' }))}
                />
              </label>

              {form.target_type === 'customer' ? (
                <label className="block">
                  <span className="mb-1 block font-medium">{t('nav.customers')}</span>
                  <SearchSelect
                    options={customerOptions}
                    value={form.customer_id}
                    onChange={(v) => setForm((s) => ({ ...s, customer_id: v }))}
                    placeholder={t('common.loading')}
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="mb-1 block font-medium">{t('nav.agencies')}</span>
                  <SearchSelect
                    options={agencyOptions}
                    value={form.agency_id}
                    onChange={(v) => setForm((s) => ({ ...s, agency_id: v }))}
                    placeholder={t('common.loading')}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block font-medium">{t('common.debit')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.debit}
                  onChange={(e) => setForm((s) => ({ ...s, debit: e.target.value, credit: '0' }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">{t('common.credit')}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.credit}
                  onChange={(e) => setForm((s) => ({ ...s, credit: e.target.value, debit: '0' }))}
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

              <label className="block">
                <span className="mb-1 block font-medium">{t('common.type')}</span>
                <SearchSelect
                  options={DEPOSIT_TYPE_OPTIONS}
                  value={form.deposit_type}
                  onChange={(v) => setForm((s) => ({ ...s, deposit_type: v || 'cash', bank_id: (v || 'cash') === 'bank_transfer' ? s.bank_id : '' }))}
                />
              </label>

              {form.deposit_type === 'bank_transfer' && (
                <label className="block">
                  <span className="mb-1 block font-medium">{t('nav.banks')}</span>
                  <SearchSelect
                    options={bankOptions}
                    value={form.bank_id}
                    onChange={(v) => setForm((s) => ({ ...s, bank_id: v || '' }))}
                    placeholder={t('common.loading')}
                  />
                </label>
              )}

              <label className="block sm:col-span-2">
                <span className="mb-1 block font-medium">{t('common.description')}</span>
                <textarea
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  rows={2}
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
                disabled={saveMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                onClick={() => void saveMutation.mutateAsync()}
              >
                {saveMutation.isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
