import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ColumnVisibilityMenu } from '@/components/ColumnVisibilityMenu'
import { TablePagination } from '@/components/TablePagination'
import { paginationMeta } from '@/lib/laravelPagination'
import type { LaravelPaginated } from '@/lib/laravelPagination'
import { useColumnVisibility } from '@/hooks/useColumnVisibility'

interface SendHawala {
  id: number
  hawala_no: number
  sender: string
  reciever: string
  sender_amount: number
  exchange_amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  date_confirm: string
  Agency?: string
  RCurrency?: string
  ECurrency?: string
}

const ALL_COLUMNS = [
  { key: 'hawala_no', label: 'شماره حواله' },
  { key: 'date_confirm', label: 'تاریخ' },
  { key: 'Agency', label: 'نمایندگی' },
  { key: 'sender', label: 'فرستنده' },
  { key: 'reciever', label: 'گیرنده' },
  { key: 'sender_amount', label: 'مبلغ' },
  { key: 'status', label: 'حالت' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
}

export default function SendHawalaList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const { visibility, toggle } = useColumnVisibility(ALL_COLUMNS)

  const { data, isLoading } = useQuery({
    queryKey: ['send-hawalas', page, perPage],
    queryFn: () =>
      api
        .get<LaravelPaginated<SendHawala>>('/send-hawala', { params: { page, per_page: perPage } })
        .then((r) => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.post(`/send-hawala/${id}/cancel`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['send-hawalas'] })
      toast.success('حواله لغو شد')
    },
    onError: () => toast.error('خطا در لغو حواله'),
  })

  const meta = paginationMeta(data)
  const rows = data?.data ?? []
  const visibleColumns = ALL_COLUMNS.filter((c) => visibility[c.key] !== false)

  return (
    <ProtectedRoute roles={['admin', 'user']}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">حواله های ارسالی</h1>
          <div className="flex items-center gap-2">
            <ColumnVisibilityMenu
              columns={ALL_COLUMNS}
              visibility={visibility}
              onToggle={toggle}
              lockedKeys={['actions']}
            />
            <Link
              to="/transactions/send-hawala/create"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + حواله جدید
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900">
                <tr>
                  {visibleColumns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-right">عملکرد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 1}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />{' '}
                      در حال بارگذاری...
                    </td>
                  </tr>
                )}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 1}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      هیچ رکوردی یافت نشد
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                  >
                    {visibleColumns.map((c) => (
                      <td key={c.key} className="px-4 py-4 text-slate-600 dark:text-slate-400">
                        {c.key === 'status' ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${STATUS_STYLES[row.status] ?? ''}`}
                          >
                            {row.status.toUpperCase()}
                          </span>
                        ) : (
                          String(row[c.key as keyof SendHawala] ?? '')
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {row.status === 'pending' && (
                          <>
                            <Link
                              to={`/transactions/send-hawala/${row.id}/confirm`}
                              className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400"
                            >
                              پرداخت
                            </Link>
                            <Link
                              to={`/transactions/send-hawala/${row.id}/edit`}
                              className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                            >
                              ویرایش
                            </Link>
                          </>
                        )}
                        {row.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (confirm('مطمئن هستید؟')) cancelMutation.mutate(row.id)
                            }}
                            disabled={cancelMutation.isPending}
                            className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                          >
                            لغو
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}
