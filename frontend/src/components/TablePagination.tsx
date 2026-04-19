import { useMemo } from 'react'
import type { LaravelPaginationMeta } from '../lib/laravelPagination'
import { SearchSelect } from './SearchSelect'

type Props = {
  meta: LaravelPaginationMeta | null
  perPageOptions?: number[]
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

function buildPageList(current: number, last: number): (number | 'gap')[] {
  if (last <= 1) return [1]
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = new Set<number>([1, last, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]
    if (i > 0 && p - (sorted[i - 1] ?? 0) > 1) out.push('gap')
    out.push(p)
  }
  return out
}

export function TablePagination({
  meta,
  perPageOptions = [5, 10, 25, 50],
  onPageChange,
  onPerPageChange,
}: Props) {
  if (!meta || meta.total === 0) return null

  const { current_page: cur, last_page: last, per_page: per, total, from, to } = meta
  const pages = buildPageList(cur, last)
  const perPageOpts = useMemo(
    () => perPageOptions.map((n) => ({ value: String(n), label: String(n) })),
    [perPageOptions],
  )

  return (
    <div className="no-print flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-slate-600 dark:text-slate-400">
        Showing{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">{from}</span> to{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">{to}</span> of{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span> results
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-slate-600 sm:flex-initial dark:text-slate-400">
          <span className="shrink-0">Per page</span>
          <div className="min-w-[4.5rem] max-w-[6rem] flex-1 sm:flex-initial">
            <SearchSelect
              size="compact"
              isClearable={false}
              options={perPageOpts}
              value={String(per)}
              onChange={(v) => onPerPageChange(Number(v || per))}
              placeholder={String(per)}
            />
          </div>
        </label>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            disabled={cur <= 1}
            className="rounded border border-slate-300 px-2 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
            onClick={() => onPageChange(cur - 1)}
          >
            Prev
          </button>
          {pages.map((p, i) =>
            p === 'gap' ? (
              <span key={`g-${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[2rem] rounded px-2 py-1 ${
                  p === cur
                    ? 'font-semibold text-orange-600 dark:text-orange-400'
                    : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={cur >= last}
            className="rounded border border-slate-300 px-2 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
            onClick={() => onPageChange(cur + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  )
}
