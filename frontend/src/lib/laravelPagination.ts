export type LaravelPaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type LaravelPaginated<T> = {
  data: T[]
} & LaravelPaginationMeta

export function paginationMeta<T>(body: LaravelPaginated<T> | null | undefined): LaravelPaginationMeta | null {
  if (!body || typeof body.total !== 'number') return null
  return {
    current_page: body.current_page,
    last_page: body.last_page,
    per_page: body.per_page,
    total: body.total,
    from: body.from ?? null,
    to: body.to ?? null,
  }
}
