/** Normalizes API values to a boolean for toggles and to 1/0 for display. */
export function isBinaryTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (value === false || value === 0) return false
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    if (['1', 'true', 'on', 'yes', 'active'].includes(s)) return true
    if (['0', 'false', 'off', 'no', 'inactive', ''].includes(s)) return false
  }
  return false
}

export function binaryDigit(value: unknown): '1' | '0' {
  return isBinaryTruthy(value) ? '1' : '0'
}
