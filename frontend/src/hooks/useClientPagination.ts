import { useMemo } from 'react'
import type { LaravelPaginationMeta } from '../lib/laravelPagination'

export function useClientPagination<T>(rows: T[], page: number, perPage: number) {
  return useMemo(() => {
    const total = rows.length
    const lastPage = Math.max(1, Math.ceil(total / perPage) || 1)
    const currentPage = Math.min(Math.max(1, page), lastPage)
    const start = (currentPage - 1) * perPage
    const slice = rows.slice(start, start + perPage)
    const from = total === 0 ? 0 : start + 1
    const to = total === 0 ? 0 : start + slice.length
    const meta: LaravelPaginationMeta = {
      current_page: currentPage,
      last_page: lastPage,
      per_page: perPage,
      total,
      from,
      to,
    }
    return { slice, meta }
  }, [rows, page, perPage])
}
