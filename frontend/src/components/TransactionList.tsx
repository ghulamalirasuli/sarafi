import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { errorMessage } from '../lib/errorMessage'
import { TablePagination } from './TablePagination'
import { paginationMeta } from '../lib/laravelPagination'
import type { LaravelPaginated } from '../lib/laravelPagination'
import { XCircleIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useLocale } from '../context/LocaleContext'
import { useDebounce } from '../hooks/useDebounce'

type TransactionListProps = {
  apiPath: string
  title: string
  columns: { key: string; label: string; format?: (v: any, row: any) => React.ReactNode }[]
  filters?: Record<string, any>
  onEdit?: (row: any) => void
  onDelete?: (id: number) => void
}

export function TransactionList({ apiPath, title, columns, filters = {}, onEdit, onDelete }: TransactionListProps) {
  const qc = useQueryClient()
  const { t } = useLocale()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, JSON.stringify(filters)])

  const { data, isLoading } = useQuery({
    queryKey: [apiPath, 'list', page, perPage, debouncedSearch, JSON.stringify(filters)],
    queryFn: async () => {
      const { data } = await api.get<LaravelPaginated<any>>(`/${apiPath}`, {
        params: { 
          page, 
          per_page: perPage, 
          search: debouncedSearch || undefined,
          ...filters 
        },
      })
      return data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async ({ row, status: newStatus }: { row: any; status: string }) => {
      await api.put(`/${apiPath}/${row.id}`, { ...row, status: newStatus })
    },
    onSuccess: (_, { status }) => {
      void qc.invalidateQueries({ queryKey: [apiPath] })
      if (status === 'confirmed') {
        toast.success(t('common.recordApproved'))
      } else {
        toast.success(t('common.recordPending'))
      }
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      if (onDelete) {
        onDelete(id)
      } else {
        await api.delete(`/${apiPath}/${id}`)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [apiPath] })
      toast.success(t('common.success'))
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const meta = paginationMeta(data)
  const rows = data?.data ?? []

  return (
    <div className="mt-8 space-y-4">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title} {t('nav.reports')}</h2>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
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
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setPage(1)
              setPerPage(10)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {t('common.reset')}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold"># {t('common.reference')}</th>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-center">{t('common.status')}</th>
                <th className="no-print px-4 py-3 font-semibold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={columns.length + 3} className="px-4 py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                       {t('common.loading')}...
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 3} className="px-4 py-10 text-center text-slate-500">
                    {t('common.error')}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                    {row.reference_no}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-4 text-slate-600 dark:text-slate-400">
                      {c.format ? c.format(row[c.key], row) : String(row[c.key] ?? '')}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => {
                        const next = row.status === 'confirmed' ? 'pending' : 'confirmed'
                        approveMutation.mutate({ row, status: next })
                      }}
                      disabled={approveMutation.isPending}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset transition-all active:scale-90 shadow-sm hover:shadow disabled:opacity-50 ${
                        row.status === 'confirmed' 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400'
                          : row.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-600 hover:text-white dark:bg-amber-500/10 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400'
                      }`}
                    >
                      {row.status.toUpperCase()}
                    </button>
                  </td>
                  <td className="no-print px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(t('common.confirmDelete'))) {
                            cancelMutation.mutate(row.id)
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
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
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
