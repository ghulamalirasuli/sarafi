import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SearchSelect } from '../../components/SearchSelect'
import { ColumnVisibilityMenu } from '../../components/ColumnVisibilityMenu'
import { TablePagination } from '../../components/TablePagination'
import { ToggleSwitch } from '../../components/ToggleSwitch'
import { useColumnVisibility } from '../../hooks/useColumnVisibility'
import { api } from '../../lib/api'
import { binaryDigit, isBinaryTruthy } from '../../lib/binaryDisplay'
import { formatRateDisplay } from '../../lib/formatRate'
import { errorMessage } from '../../lib/errorMessage'
import type { LaravelPaginated } from '../../lib/laravelPagination'
import { paginationMeta } from '../../lib/laravelPagination'

type Field = {
  key: string
  label: string
  type?: 'text' | 'number' | 'checkbox' | 'select'
  options?: { value: string; label: string }[]
  /** Shown in the grid with inline toggles; omitted from create/edit modal. */
  tableOnly?: boolean
}

type EntityConfig = {
  title: string
  apiPath: string
  /** Row field used in toast copy (e.g. branch name, person name). */
  recordLabelKey: string
  fields: Field[]
}

function rowDisplayName(row: Record<string, unknown>, labelKey: string, entityName?: string): string {
  if (entityName === 'agencies') {
    const res = String(row.agency_responsible ?? '').trim()
    const name = String(row.agency_name ?? '').trim()
    return `${res} (${name})`
  }
  const v = row[labelKey]
  const s = v != null ? String(v).trim() : ''
  if (s) return s
  return `Record #${String(row.id ?? '')}`
}

const CONFIG: Record<string, EntityConfig> = {
  currencies: {
    title: 'Currencies',
    apiPath: 'currencies',
    recordLabelKey: 'currency_name',
    fields: [
      { key: 'currency_name', label: 'Name' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'status', label: 'Status', type: 'checkbox', tableOnly: true },
      { key: 'is_default', label: 'Default', type: 'checkbox', tableOnly: true },
    ],
  },
  agencies: {
    title: 'Agencies',
    apiPath: 'agencies',
    recordLabelKey: 'agency_name',
    fields: [
      { key: 'agency_name', label: 'Agency name' },
      { key: 'agency_responsible', label: 'Responsible' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'is_active', label: 'Active', type: 'checkbox', tableOnly: true },
    ],
  },
  banks: {
    title: 'Banks',
    apiPath: 'banks',
    recordLabelKey: 'bankname',
    fields: [
      { key: 'bankname', label: 'Bank name' },
      { key: 'bankaccount', label: 'Account name' },
      { key: 'accountnumber', label: 'Account number' },
      { key: 'is_active', label: 'Active', type: 'checkbox', tableOnly: true },
    ],
  },
  customers: {
    title: 'Customers',
    apiPath: 'customers',
    recordLabelKey: 'fullname',
    fields: [
      { key: 'fullname', label: 'Full name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'is_active', label: 'Active', type: 'checkbox', tableOnly: true },
    ],
  },
}

export function MasterEntity({ name }: { name: keyof typeof CONFIG }) {
  const cfg = CONFIG[name]
  if (!cfg) return null

  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const visibleFields = cfg.fields
  const formFields = useMemo(() => visibleFields.filter((f) => !f.tableOnly), [visibleFields])
  const displayFields = useMemo(() => visibleFields.filter((f) => f.key !== 'password'), [visibleFields])

  const defaultColumnVis = useMemo(() => {
    const o: Record<string, boolean> = { id: true, actions: true }
    displayFields.forEach((f, i) => {
      o[f.key] = i < 4
    })
    return o
  }, [displayFields])

  const { vis, setCol } = useColumnVisibility(`sarafi-cols-${name}`, defaultColumnVis)

  const columnMenuDefs = useMemo(
    () => [{ key: 'id', label: 'ID' }, ...displayFields.map((f) => ({ key: f.key, label: f.label })), { key: 'actions', label: 'Actions' }],
    [displayFields],
  )

  useEffect(() => {
    setPage(1)
  }, [search, cfg.apiPath])

  const listQuery = useQuery({
    queryKey: [cfg.apiPath, search, page, perPage],
    queryFn: async () => {
      const { data } = await api.get<LaravelPaginated<Record<string, unknown>>>(`/${cfg.apiPath}`, {
        params: { search: search || undefined, page, per_page: perPage },
      })
      return data
    },
  })

  const list = listQuery.data
  const meta = paginationMeta(list)
  const rows = list?.data ?? []

  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page))
    }
  }, [meta, page])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { ...form }
      if (payload.is_active === 'on' || payload.is_active === 'true') payload.is_active = true
      if (payload.is_default === 'on' || payload.is_default === 'true') payload.is_default = true
      if (payload.is_active === 'false') payload.is_active = false
      if (payload.is_default === 'false') payload.is_default = false
      if (payload.status === 'on' || payload.status === 'true') payload.status = '1'
      if (payload.status === 'false') payload.status = '0'
      
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k]
      })
      if (editing?.id) {
        for (const f of visibleFields) {
          if (!f.tableOnly) continue
          if (f.key === 'status') {
            payload.status = isBinaryTruthy(editing[f.key]) ? '1' : '0'
          } else if (f.type === 'checkbox') {
            payload[f.key] = isBinaryTruthy(editing[f.key])
          }
        }
      }
      if (editing?.id) {
        await api.put(`/${cfg.apiPath}/${editing.id}`, payload)
      } else {
        await api.post(`/${cfg.apiPath}`, payload)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [cfg.apiPath] })
      setOpen(false)
      setEditing(null)
      setForm({})
      toast.success(editing?.id ? `${cfg.title}: updated` : `${cfg.title}: created`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/${cfg.apiPath}/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [cfg.apiPath] })
      toast.success(`${cfg.title}: deleted`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const patchMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: Record<string, unknown>
      recordLabel: string
    }) => {
      await api.put(`/${cfg.apiPath}/${id}`, payload)
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [cfg.apiPath] })
      const p = variables.payload
      const label = variables.recordLabel
      if (Object.prototype.hasOwnProperty.call(p, 'is_active')) {
        toast.success(p.is_active ? `${label} activated.` : `${label} deactivated.`)
      }
      if (Object.prototype.hasOwnProperty.call(p, 'status')) {
        const on = isBinaryTruthy(p.status)
        toast.success(on ? `${label} activated.` : `${label} deactivated.`)
      }
      if (Object.prototype.hasOwnProperty.call(p, 'is_default')) {
        toast.success(
          p.is_default ? `${label} set as default currency.` : `${label} is no longer the default currency.`,
        )
      }
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const colSpan = useMemo(() => {
    let n = 0
    if (vis.id) n++
    displayFields.forEach((f) => {
      if (vis[f.key]) n++
    })
    if (vis.actions !== false) n++
    return Math.max(n, 1)
  }, [vis, displayFields])

  const openCreate = () => {
    setEditing(null)
    setForm({})
    setOpen(true)
  }

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row)
    const next: Record<string, string> = {}
    formFields.forEach((f) => {
      const v = row[f.key]
      if (f.type === 'checkbox') next[f.key] = isBinaryTruthy(v) ? 'true' : 'false'
      else if (v === true || v === false) next[f.key] = v ? 'true' : 'false'
      else if (v != null) next[f.key] = String(v)
    })
    setForm(next)
    setOpen(true)
  }

  const renderCell = (field: Field, row: Record<string, unknown>) => {
    if (field.type === 'checkbox') {
      const on = isBinaryTruthy(row[field.key])
      const recordLabel = rowDisplayName(row, cfg.recordLabelKey, name)
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {binaryDigit(row[field.key])}
          </span>
          <ToggleSwitch
            checked={on}
            ariaLabel={`${field.label} for row ${String(row.id)}`}
            disabled={patchMutation.isPending}
            onChange={(next) =>
              void patchMutation.mutateAsync({
                id: Number(row.id),
                recordLabel,
                payload: field.key === 'status' ? { status: next ? '1' : '0' } : { [field.key]: next },
              })
            }
          />
        </div>
      )
    }
    if (field.key === 'rate') {
      return (
        <span className="font-mono text-[13px] tabular-nums text-slate-800 dark:text-slate-200">
          {formatRateDisplay(row[field.key])}
        </span>
      )
    }
    if (name === 'agencies' && field.key === 'agency_name') {
      return `${row.agency_responsible} (${row.agency_name})`
    }
    return String(row[field.key] ?? '')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{cfg.title}</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ColumnVisibilityMenu
          columns={columnMenuDefs}
          visibility={vis}
          onToggle={setCol}
          lockedKeys={['actions']}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                {vis.id ? <th className="px-3 py-2">ID</th> : null}
                {displayFields.map((f) =>
                  vis[f.key] ? (
                    <th key={f.key} className="px-3 py-2">
                      {f.label}
                    </th>
                  ) : null,
                )}
                {vis.actions !== false ? <th className="px-3 py-2">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading && (
                <tr>
                  <td colSpan={colSpan} className="px-3 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-3 py-6 text-center text-slate-500">
                    No records.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={String(row.id)} className="border-t border-slate-100 dark:border-slate-800">
                  {vis.id ? <td className="px-3 py-2">{String(row.id)}</td> : null}
                  {displayFields.map((f) =>
                    vis[f.key] ? (
                      <td key={f.key} className="px-3 py-2">
                        {renderCell(f, row)}
                      </td>
                    ) : null,
                  )}
                  {vis.actions !== false ? (
                    <td className="space-x-2 px-3 py-2">
                      <button
                        type="button"
                        className="text-indigo-600 hover:underline"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => {
                          if (confirm('Delete this record?')) {
                            void deleteMutation.mutateAsync(Number(row.id))
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  ) : null}
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-semibold">{editing ? 'Edit' : 'Create'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {formFields.map((f) => (
                <label key={f.key} className={`block text-sm ${f.key === 'address' ? 'sm:col-span-2' : ''}`}>
                  <span className="mb-1 block text-slate-600 dark:text-slate-300">{f.label}</span>
                  <input
                    className="w-full rounded border border-slate-300 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending}
                className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => void saveMutation.mutateAsync()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
