type Col = { key: string; label: string }

type Props = {
  columns: Col[]
  visibility: Record<string, boolean>
  onToggle: (key: string, value: boolean) => void
  /** Keys that cannot be hidden (e.g. actions) — omitted from menu */
  lockedKeys?: string[]
}

export function ColumnVisibilityMenu({ columns, visibility, onToggle, lockedKeys = [] }: Props) {
  const toggleable = columns.filter((c) => !lockedKeys.includes(c.key))

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 [&::-webkit-details-marker]:hidden">
        Columns
      </summary>
      <div className="absolute right-0 z-40 mt-1 min-w-[12rem] rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 border-b border-slate-100 px-1 pb-1 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Visible columns
        </p>
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {toggleable.map((c) => (
            <li key={c.key}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={visibility[c.key] !== false}
                  onChange={(e) => onToggle(c.key, e.target.checked)}
                />
                <span>{c.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
