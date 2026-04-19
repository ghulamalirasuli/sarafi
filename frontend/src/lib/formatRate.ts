/** Table display for monetary rates (4 decimal places). */
export function formatRateDisplay(value: unknown): string {
  if (value == null || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (Number.isNaN(n)) return String(value)
  return n.toFixed(4)
}
