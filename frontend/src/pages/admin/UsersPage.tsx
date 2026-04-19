import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SearchSelect } from '../../components/SearchSelect'
import { ColumnVisibilityMenu } from '../../components/ColumnVisibilityMenu'
import { TablePagination } from '../../components/TablePagination'
import { ToggleSwitch } from '../../components/ToggleSwitch'
import { useColumnVisibility } from '../../hooks/useColumnVisibility'
import { binaryDigit, isBinaryTruthy } from '../../lib/binaryDisplay'
import { api } from '../../lib/api'
import { errorMessage } from '../../lib/errorMessage'
import type { LaravelPaginated } from '../../lib/laravelPagination'
import { paginationMeta } from '../../lib/laravelPagination'

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
] as const

type RoleValue = (typeof roles)[number]['value']

type RoleTab = 'all' | RoleValue

type UsersIndexResponse = LaravelPaginated<Record<string, unknown>> & {
  role_counts?: Record<string, number>
}

const tabDefs: { id: RoleTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'admin', label: 'Admin' },
  { id: 'user', label: 'User' },
]

const USER_COLS = [
  { key: 'username', label: 'Username' },
  { key: 'fullname', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'active', label: 'Active' },
  { key: 'uid', label: 'UID' },
  { key: 'mobile', label: 'Mobile' },
] as const

const defaultUserVis: Record<string, boolean> = {
  username: true,
  fullname: true,
  role: true,
  active: true,
  uid: false,
  mobile: false,
  actions: true,
}

type ActiveFilter = 'all' | 'active' | 'inactive'

export function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleTab, setRoleTab] = useState<RoleTab>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const { vis, setCol } = useColumnVisibility('sarafi-cols-users', defaultUserVis)

  useEffect(() => {
    setPage(1)
  }, [search, roleTab, activeFilter])

  const listQuery = useQuery({
    queryKey: ['users', search, roleTab, activeFilter, page, perPage],
    queryFn: async () => {
      const { data } = await api.get<UsersIndexResponse>('/users', {
        params: {
          search: search || undefined,
          page,
          per_page: perPage,
          ...(roleTab !== 'all' ? { role: roleTab } : {}),
          ...(activeFilter === 'active' ? { is_active: true } : {}),
          ...(activeFilter === 'inactive' ? { is_active: false } : {}),
        },
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
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k]
      })
      if (editing?.id) {
        payload.is_active = isBinaryTruthy(editing.is_active)
        await api.put(`/users/${editing.id}`, payload)
      } else {
        await api.post('/users', payload)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
      setEditing(null)
      setForm({})
      toast.success(editing?.id ? 'User updated' : 'User created')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted')
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
      await api.put(`/users/${id}`, payload)
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      const p = variables.payload
      const label = variables.recordLabel
      if (Object.prototype.hasOwnProperty.call(p, 'is_active')) {
        toast.success(p.is_active ? `${label} activated.` : `${label} deactivated.`)
      }
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const activeFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    [],
  )

  const roleSelectOptions = useMemo(() => roles.map((r) => ({ value: r.value, label: r.label })), [])

  const tabCounts = useMemo(() => {
    const rc = list?.role_counts ?? {}
    const total = typeof list?.total === 'number' ? list.total : rows.length
    const countFor = (id: RoleTab) => {
      if (id === 'all') return total
      const n = rc[id]
      return typeof n === 'number' ? n : 0
    }
    return Object.fromEntries(tabDefs.map((t) => [t.id, countFor(t.id)])) as Record<RoleTab, number>
  }, [list?.role_counts, list?.total, rows.length])

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row)
    setForm({
      fullname: String(row.fullname ?? ''),
      username: String(row.username ?? ''),
      email: String(row.email ?? ''),
      mobile: String(row.mobile ?? ''),
      role: String(row.role ?? 'user'),
      password: '',
    })
    setOpen(true)
  }

  const colSpan = useMemo(() => {
    let n = 0
    USER_COLS.forEach((c) => {
      if (vis[c.key]) n++
    })
    if (vis.actions !== false) n++
    return Math.max(n, 1)
  }, [vis])

  const renderCell = (key: string, row: Record<string, unknown>) => {
    if (key === 'active') {
      const on = isBinaryTruthy(row.is_active)
      const recordLabel =
        String(row.fullname ?? '').trim() ||
        String(row.username ?? '').trim() ||
        `User #${String(row.id)}`
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {binaryDigit(row.is_active)}
          </span>
          <ToggleSwitch
            checked={on}
            ariaLabel={`Active for ${String(row.username)}`}
            disabled={patchMutation.isPending || row.role === 'admin'}
            onChange={(next) =>
              void patchMutation.mutateAsync({
                id: Number(row.id),
                recordLabel,
                payload: { is_active: next },
              })
            }
          />
        </div>
      )
    }
    return String(row[key] ?? '')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Users</h1>
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
          onClick={() => {
            setEditing(null)
            setForm({ role: 'user' })
            setOpen(true)
          }}
        >
          Add user
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <input
          className="w-full max-w-md rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex min-w-[10rem] flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
          <span>Status</span>
          <SearchSelect
            isClearable={false}
            options={activeFilterOptions}
            value={activeFilter}
            onChange={(v) => setActiveFilter((v || 'all') as ActiveFilter)}
            placeholder="All"
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          onClick={() => {
            setSearch('')
            setActiveFilter('all')
            setRoleTab('all')
            setPage(1)
          }}
        >
          Reset
        </button>
        <ColumnVisibilityMenu
          columns={[...USER_COLS.map((c) => ({ key: c.key, label: c.label })), { key: 'actions', label: 'Actions' }]}
          visibility={vis}
          onToggle={setCol}
          lockedKeys={['actions']}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabDefs.map((t) => {
          const active = roleTab === t.id
          const c = tabCounts[t.id]
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setRoleTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
              <span className={active ? 'ml-1 text-indigo-100' : 'ml-1 text-slate-500 dark:text-slate-400'}>
                ({c})
              </span>
            </button>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                {USER_COLS.map((c) =>
                  vis[c.key] ? (
                    <th key={c.key} className="px-3 py-2">
                      {c.label}
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
                    No users in this view.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={String(row.id)} className="border-t border-slate-100 dark:border-slate-800">
                  {USER_COLS.map((c) =>
                    vis[c.key] ? (
                      <td key={c.key} className="px-3 py-2">
                        {renderCell(c.key, row)}
                      </td>
                    ) : null,
                  )}
                  {vis.actions !== false ? (
                    <td className="space-x-2 px-3 py-2">
                      <button type="button" className="text-indigo-600 hover:underline" onClick={() => openEdit(row)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline disabled:opacity-30 disabled:no-underline"
                        disabled={row.role === 'admin'}
                        onClick={() => {
                          if (confirm('Delete user?')) void deleteMutation.mutateAsync(Number(row.id))
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-semibold">{editing ? 'Edit user' : 'New user'}</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <label>
                Full name
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={form.fullname ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, fullname: e.target.value }))}
                />
              </label>
              <label>
                Username
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={form.username ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                />
              </label>
              <label>
                Mobile
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={form.mobile ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value }))}
                />
              </label>
              <label>
                Password {editing && '(leave blank to keep)'}
                <input
                  type="password"
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={form.password ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block">Role</span>
                <SearchSelect
                  isClearable={false}
                  options={roleSelectOptions}
                  value={form.role ?? 'user'}
                  isDisabled={editing?.role === 'admin'}
                  onChange={(v) => setForm((s) => ({ ...s, role: v || 'user' }))}
                  placeholder="Role"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-2" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending}
                className="rounded bg-indigo-600 px-3 py-2 text-white disabled:opacity-50"
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
