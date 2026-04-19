import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { SearchSelect } from '../../components/SearchSelect'
import { api } from '../../lib/api'
import { TransactionList } from '../../components/TransactionList'
import { useLocale } from '../../context/LocaleContext'
import { PrintHeader } from '../../components/PrintHeader'

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------
type Lang = 'en' | 'fa'

const LABELS: Record<string, Record<Lang, string>> = {
  pageTitle:        { en: 'Receive Hawala',         fa: 'دریافت حواله' },
  addBtn:           { en: 'Add Receive Hawala',      fa: 'افزودن دریافت حواله' },
  editTitle:        { en: 'Edit Receive Hawala',     fa: 'ویرایش دریافت حواله' },
  addTitle:         { en: 'Add Receive Hawala',      fa: 'افزودن دریافت حواله' },
  agency:           { en: 'Select Agency',           fa: 'نمایندگی را انتخاب کنید' },
  selectAgency:     { en: 'Select Agency…',          fa: 'انتخاب نمایندگی…' },
  date:             { en: 'Date',                    fa: 'تاریخ' },
  sender:           { en: 'Sender',                  fa: 'فرستنده' },
  senderPh:         { en: 'Enter Sender Name',       fa: 'نام فرستنده' },
  reciever:         { en: 'Receiver',                fa: 'گیرنده' },
  recieverPh:       { en: 'Enter Receiver Name',     fa: 'نام گیرنده' },
  hawalaType:       { en: 'Hawala Type',             fa: 'نوع حواله' },
  simple:           { en: 'Simple',                  fa: 'ساده' },
  exchange:         { en: 'Exchange',                fa: 'تبادله' },
  recieverCurrency: { en: 'Receiver Currency',       fa: 'ارز دریافتی' },
  selectCurrency:   { en: 'Select Currency…',        fa: 'انتخاب ارز…' },
  recieverAmount:   { en: 'Receiver Amount',         fa: 'مقدار پول گیرنده' },
  commissionType:   { en: 'Commission',              fa: 'کمیشن' },
  manual:           { en: 'Manual',                  fa: 'دستی' },
  percentage:       { en: 'Percentage',              fa: 'فیصدی' },
  percentAmt:       { en: 'Percentage %',            fa: 'فیصدی' },
  commissionAmt:    { en: 'Commission Amount',       fa: 'مقدار کمیشن' },
  formula:          { en: 'Formula',                 fa: 'فرمول' },
  multiply:         { en: 'Multiply',                fa: 'ضرب' },
  division:         { en: 'Division',                fa: 'تقسیم' },
  exchangeCurrency: { en: 'Exchange Currency',       fa: 'ارز تبادله' },
  rate:             { en: 'Rate',                    fa: 'نرخ' },
  exchangeAmount:   { en: 'Exchange Amount',         fa: 'مبلغ تبادله' },
  comment:          { en: 'Comment',                 fa: 'تذکر' },
  description:      { en: 'Description',             fa: 'توضیحات' },
  save:             { en: 'Save',                    fa: 'ذخیره' },
  saving:           { en: 'Saving…',                 fa: 'در حال ذخیره…' },
  back:             { en: 'Back',                    fa: 'بازگشت' },
  print:            { en: 'Print',                   fa: 'چاپ' },
  reset:            { en: 'Reset',                   fa: 'بازنشانی' },
  currencies:       { en: 'Currencies',              fa: 'ارزها' },
  reference:        { en: 'Reference',               fa: 'مرجع' },
  id:               { en: 'ID',                      fa: 'شناسه' },
  amount:           { en: 'Amount',                  fa: 'مبلغ' },
  currency:         { en: 'Currency',                fa: 'ارز' },
  status:           { en: 'Status',                  fa: 'وضعیت' },
  actions:          { en: 'Actions',                 fa: 'عملیات' },
  edit:             { en: 'Edit',                    fa: 'ویرایش' },
  delete:           { en: 'Delete',                  fa: 'حذف' },
  details:          { en: 'Details',                 fa: 'جزئیات' },
  notes:            { en: 'Notes',                   fa: 'ملاحظات' },
  referenceAndDate: { en: 'Reference and Date',      fa: 'مرجع و تاریخ' },
  senderDetails:    { en: 'Sender Details',          fa: 'جزئیات فرستنده' },
  recieverDetails:  { en: 'Receiver Details',        fa: 'جزئیات گیرنده' },
  hawalaDetails:    { en: 'Hawala Details',          fa: 'جزئیات حواله' },
}

function useLabel() {
  let lang: Lang = 'en'
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { locale } = useLocale() as { locale?: string }
    if (locale === 'fa' || locale === 'dari' || locale === 'pashto') lang = 'fa'
  } catch {
    // context not available
  }
  return (key: string) => LABELS[key]?.[lang] ?? key
}

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------
const defaultForm = () => ({
  agency: '',
  sender: '',
  reciever: '',
  reciever_amount: '',
  reciever_currency: '',
  hawala_type: 'Simple',
  comission: 'Manual',
  percent_amount: '',
  com_amount: '0',
  rate: '1',
  formula: '',
  exchange_currency: '',
  exchange_amount: '',
  date: new Date().toISOString().split('T')[0],
  comment: '',
  description: '',
})


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ReceiveHawalaPage() {
  const qc = useQueryClient()
  const L = useLabel()
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm())
  const [open, setOpen] = useState(false)

  // ---- Calculations (mirrors original JS functions) ----------------------
  useEffect(() => {
    const amount = parseFloat(form.reciever_amount) || 0
    const rate = parseFloat(form.rate) || 1
    let sellAmount = amount

    if (form.hawala_type === 'Exchange') {
      if (form.formula === 'Division') sellAmount = amount / rate
      else if (form.formula === 'Multiply') sellAmount = amount * rate
    }
    setForm(prev => ({ ...prev, exchange_amount: sellAmount.toFixed(2) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.reciever_amount, form.rate, form.formula, form.hawala_type])

  useEffect(() => {
    if (form.comission === 'Percentage') {
      const amount = parseFloat(form.reciever_amount) || 0
      const pct = parseFloat(form.percent_amount) || 0
      const com = (amount * pct) / 100
      setForm(prev => ({ ...prev, com_amount: com.toFixed(2) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.reciever_amount, form.percent_amount, form.comission])

  // ---- Queries -----------------------------------------------------------
  const refQuery = useQuery({
    queryKey: ['ref', 'receive-hawala'],
    queryFn: async () => {
      const { data } = await api.get<{ reference_no: string }>('/references/receive-hawala')
      return data.reference_no
    },
  })


  const agencies = useQuery({
    queryKey: ['agencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { uid: string; agency_name: string; agency_responsible: string }[] }>('/agencies?per_page=200')
      return data.data ?? []
    },
  })

  const currencies = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { uid: string; currency_name: string }[] }>('/currencies?per_page=200')
      return data.data ?? []
    },
  })

  // ---- Mutations ---------------------------------------------------------
  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        sender_agency: form.agency,
        sender: form.sender,
        reciever: form.reciever,
        reciever_amount: Number(form.reciever_amount),
        reciever_currency: form.reciever_currency,
        hawala_type: form.hawala_type,
        comission: form.comission === 'Percentage' ? Number(form.com_amount) : Number(form.com_amount),
        percent: form.comission === 'Percentage' ? Number(form.percent_amount) : null,
        rate: form.hawala_type === 'Exchange' ? Number(form.rate) : null,
        formula: form.hawala_type === 'Exchange' ? form.formula : null,
        exchange_currency: form.hawala_type === 'Exchange' ? form.exchange_currency : null,
        exchange_amount: form.hawala_type === 'Exchange' ? Number(form.exchange_amount) : null,
        date_confirm: form.date,
        comment: form.comment,
        description: form.description,
        status: 'pending',
      }
      if (editingId) {
        await api.put(`/receive-hawala/${editingId}`, payload)
      } else {
        await api.post('/receive-hawala', { ...payload, reference_no: refQuery.data })
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['receive-hawala'] })
      void refQuery.refetch()
      setOpen(false)
      setEditingId(null)
      setForm(defaultForm())
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/receive-hawala/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['receive-hawala'] }),
  })

  // ---- Options -----------------------------------------------------------
  const agencyOptions = useMemo(
    () => (Array.isArray(agencies.data) ? agencies.data.map(a => ({ value: a.uid, label: `${a.agency_name} - ${a.agency_responsible}` })) : []),
    [agencies.data],
  )
  const currencyOptions = useMemo(
    () => (Array.isArray(currencies.data) ? currencies.data.map(c => ({ value: c.uid, label: c.currency_name })) : []),
    [currencies.data],
  )

  // ---- Helpers -----------------------------------------------------------
  const set = (key: string) => (v: string) => setForm(s => ({ ...s, [key]: v }))
  const onChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(s => ({ ...s, [key]: e.target.value }))

  const openEdit = (row: any) => {
    setForm({
      agency: row.sender_agency || '',
      sender: row.sender || '',
      reciever: row.reciever || '',
      reciever_amount: String(row.reciever_amount),
      reciever_currency: row.reciever_currency || '',
      hawala_type: row.hawala_type || 'Simple',
      comission: row.percent ? 'Percentage' : 'Manual',
      percent_amount: String(row.percent || ''),
      com_amount: String(row.comission || '0'),
      rate: String(row.rate || '1'),
      formula: row.formulas || '',
      exchange_currency: row.exchange_currency || '',
      exchange_amount: String(row.exchange_amount || ''),
      date: row.date_confirm ? new Date(row.date_confirm).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      comment: row.comment || '',
      description: row.description || '',
    })
    setEditingId(row.id)
    setOpen(true)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm())
    setOpen(true)
  }

  // ---- Columns -----------------------------------------------------------
  const columns = [
    { key: 'id',               label: L('id') },
    { key: 'reference_no',     label: L('reference') },
    { key: 'date_confirm',     label: L('date') },
    { key: 'sender',           label: L('sender') },
    { key: 'reciever',         label: L('reciever') },
    { key: 'reciever_amount',  label: L('amount') },
    { key: 'reciever_currency',label: L('currency') },
    { key: 'status',           label: L('status') },
    {
      key: 'actions',
      label: L('actions'),
      format: (_v: any, row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="text-blue-500 hover:underline">{L('edit')}</button>
          <button onClick={() => deleteMutation.mutate(row.id)} className="text-red-500 hover:underline">{L('delete')}</button>
        </div>
      ),
    },
  ]

  // ---- Shared styles -----------------------------------------------------
  const inp = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
  const lbl = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

  // ========================================================================
  return (
    <div className="space-y-6">
      <PrintHeader />

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{L('pageTitle')}</h1>
        <div className="no-print flex flex-wrap items-center gap-3">
          <div className="min-w-[12rem]">
            <SearchSelect
              options={[{ value: '', label: L('currencies') }, ...currencyOptions]}
              value={currencyFilter}
              onChange={v => setCurrencyFilter(v || '')}
              placeholder={L('currencies')}
            />
          </div>
          <button
            type="button"
            onClick={() => { setCurrencyFilter(''); void qc.invalidateQueries({ queryKey: ['receive-hawala'] }) }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {L('reset')}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {L('print')}
          </button>
          <button
            onClick={openAdd}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {L('addBtn')}
          </button>
        </div>
      </div>

      {/* ================================================================
          Modal
      ================================================================ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">

            <h2 className="mb-5 text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingId ? L('editTitle') : L('addTitle')}
            </h2>

            <div className="space-y-5">

              {/* ── Section: Reference and Date ─────────────────────────── */}
              <h3 className="mb-3 text-base font-semibold text-slate-700 dark:text-slate-200">{L('referenceAndDate')}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={lbl}>{L('reference')}</label>
                  <input type="text" readOnly className={inp} value={refQuery.data ?? L('loading')} />
                </div>
                <div>
                  <label className={lbl}>{L('date')}</label>
                  <input type="date" className={inp} value={form.date} max={new Date().toISOString().split('T')[0]} onChange={onChange('date')} />
                </div>
              </div>

              {/* ── Section: Sender Details ──────────────────────────────── */}
              <h3 className="mb-3 text-base font-semibold text-slate-700 dark:text-slate-200">{L('senderDetails')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>{L('agency')}</label>
                  <SearchSelect options={agencyOptions} value={form.agency} onChange={set('agency')} placeholder={L('selectAgency')} />
                </div>
                <div>
                  <label className={lbl}>{L('sender')}</label>
                  <input type="text" className={inp} value={form.sender} onChange={onChange('sender')} placeholder={L('senderPh')} />
                </div>
              </div>

              {/* ── Section: Receiver Details ────────────────────────────── */}
              <h3 className="mb-3 text-base font-semibold text-slate-700 dark:text-slate-200">{L('recieverDetails')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>{L('reciever')}</label>
                  <input type="text" className={inp} value={form.reciever} onChange={onChange('reciever')} placeholder={L('recieverPh')} />
                </div>
                <div>
                  <label className={lbl}>{L('recieverCurrency')}</label>
                  <SearchSelect options={currencyOptions} value={form.reciever_currency} onChange={set('reciever_currency')} placeholder={L('selectCurrency')} />
                </div>
                <div>
                  <label className={lbl}>{L('recieverAmount')}</label>
                  <input type="number" className={inp} value={form.reciever_amount} onChange={onChange('reciever_amount')} />
                </div>
              </div>

              {/* ── Section: Hawala Details ──────────────────────────────── */}
              <h3 className="mb-3 text-base font-semibold text-slate-700 dark:text-slate-200">{L('hawalaDetails')}</h3>
              <div className="grid gap-4 sm:grid-cols-4 items-start">
                {/* Hawala Type */}
                <div>
                  <span className={lbl}>{L('hawalaType')}</span>
                  <div className="mt-1 space-y-2">
                    {(['Simple', 'Exchange'] as const).map(v => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hawala_type"
                          value={v}
                          checked={form.hawala_type === v}
                          onChange={() => setForm(s => ({ ...s, hawala_type: v }))}
                          className="accent-indigo-600"
                        />
                        <span className="text-sm">{L(v.toLowerCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Exchange section (conditional) */}
                {form.hawala_type === 'Exchange' && (
                  <div className="grid gap-4 sm:grid-cols-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30 col-span-3">
                    <div>
                      <label className={lbl}>{L('formula')}</label>
                      <SearchSelect
                        options={[
                          { value: '', label: '…' },
                          { value: 'Multiply', label: L('multiply') },
                          { value: 'Division', label: L('division') },
                        ]}
                        value={form.formula}
                        onChange={set('formula')}
                        placeholder={L('formula')}
                      />
                    </div>
                    <div>
                      <label className={lbl}>{L('exchangeCurrency')}</label>
                      <SearchSelect options={currencyOptions} value={form.exchange_currency} onChange={set('exchange_currency')} placeholder={L('selectCurrency')} />
                    </div>
                    <div>
                      <label className={lbl}>{L('rate')}</label>
                      <input type="number" step="0.01" className={inp} value={form.rate} onChange={onChange('rate')} />
                    </div>
                    <div>
                      <label className={lbl}>{L('exchangeAmount')}</label>
                      <input
                        type="text"
                        readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      value={form.exchange_amount}
                    />
                  </div>
                </div>
              )}

              {/* ── Row 5: Commission Type + Percentage + Amount ───────── */}
              <div className="grid gap-4 sm:grid-cols-4 items-start">
                {/* Commission Type */}
                <div>
                  <span className={lbl}>{L('commissionType')}</span>
                  <div className="mt-1 space-y-2">
                    {(['Manual', 'Percentage'] as const).map(v => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="comission"
                          value={v}
                          checked={form.comission === v}
                          onChange={() => setForm(s => ({ ...s, comission: v }))}
                          className="accent-indigo-600"
                        />
                        <span className="text-sm">{L(v.toLowerCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Percentage Amount (conditional) */}
                {form.comission === 'Percentage' && (
                  <div>
                    <label className={lbl}>{L('percentAmt')}</label>
                    <input type="number" step="0.01" className={inp} value={form.percent_amount} onChange={onChange('percent_amount')} />
                  </div>
                )}

                {/* Commission Amount */}
                <div>
                  <label className={lbl}>{L('commissionAmt')}</label>
                  <input type="number" step="0.01" className={inp} value={form.com_amount} onChange={onChange('com_amount')} />
                </div>
              </div>

              {/* ── Row 6: Comment + Description ───────────────────────── */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>{L('comment')}</label>
                  <input type="text" className={inp} value={form.comment} onChange={onChange('comment')} />
                </div>
                <div>
                  <label className={lbl}>{L('description')}</label>
                  <textarea className={inp} value={form.description} onChange={onChange('description')} rows={3} />
                </div>
              </div>
            </div>

              {/* ── Actions ──────────────────────────────────────────── */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setEditingId(null) }}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {L('back')}
                </button>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {mutation.isPending ? L('saving') : L('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <TransactionList
        apiPath="receive-hawala"
        title={L('pageTitle')}
        columns={columns}
        filters={{ currency: currencyFilter }}
        onEdit={openEdit}
        onDelete={id => deleteMutation.mutate(id)}
      />
    </div>
  )
}
