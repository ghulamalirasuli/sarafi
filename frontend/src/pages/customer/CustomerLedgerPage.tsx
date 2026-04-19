import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ColumnVisibilityMenu } from '../../components/ColumnVisibilityMenu'
import { TablePagination } from '../../components/TablePagination'
import { useClientPagination } from '../../hooks/useClientPagination'
import { useColumnVisibility } from '../../hooks/useColumnVisibility'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { stripHtml } from '../../lib/html'

const COLS = [
  { key: 'reference_no', label: 'Ref' },
  { key: 'bill_no', label: 'Bill' },
  { key: 'description', label: 'Description', format: (v: string) => stripHtml(v) },
  { key: 'credit', label: 'Credit' },
  { key: 'debit', label: 'Debit' },
  { key: 'balance', label: 'Balance' },
  { key: 'date', label: 'Date' },
] as const

const defaultVis: Record<string, boolean> = {
  reference_no: true,
  bill_no: true,
  description: true,
  credit: true,
  debit: true,
  balance: true,
  date: true,
}

export function CustomerLedgerPage() {
  const { user } = useAuth()
  const cid = user?.customer_id
  const [filterText, setFilterText] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const { vis, setCol } = useColumnVisibility('sarafi-cols-customer-ledger', defaultVis)

  const q = useQuery({
    queryKey: ['ledger', 'me', cid],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/ledger/customer/${cid}`)
      return data.data ?? []
    },
    enabled: !!cid,
  })

  const filtered = useMemo(() => {
    const rows = q.data ?? []
    const t = filterText.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((r) =>
      COLS.some((c) =>
        String(r[c.key] ?? '')
          .toLowerCase()
          .includes(t),
      ),
    )
  }, [q.data, filterText])

  const { slice, meta } = useClientPagination(filtered, page, perPage)

  const colSpan = useMemo(() => COLS.filter((c) => vis[c.key]).length || 1, [vis])

  if (!cid) {
    return <p className="text-sm text-red-600">No customer profile linked to this account.</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My ledger</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <input
          className="w-full max-w-md rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          placeholder="Filter rows…"
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value)
            setPage(1)
          }}
        />
        <ColumnVisibilityMenu columns={COLS.map((c) => ({ key: c.key, label: c.label }))} visibility={vis} onToggle={setCol} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase dark:bg-slate-900">
              <tr>
                {COLS.map((c) =>
                  vis[c.key] ? (
                    <th key={c.key} className="px-2 py-2">
                      {c.label}
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {q.isLoading && (
                <tr>
                  <td colSpan={colSpan} className="px-2 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!q.isLoading && slice.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-2 py-6 text-center text-slate-500">
                    No entries.
                  </td>
                </tr>
              )}
              {slice.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  {COLS.map((c) =>
                    vis[c.key] ? (
                      <td key={c.key} className="px-2 py-1">
                        {c.format ? c.format(r[c.key] as string) : String(r[c.key] ?? '')}
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
          perPageOptions={[5, 10, 25, 50]}
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
