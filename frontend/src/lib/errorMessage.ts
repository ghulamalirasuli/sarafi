import { isAxiosError } from 'axios'

export function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string; errors?: Record<string, string[]> }
      | undefined
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.error === 'string') return data.error
    if (data?.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors)[0]
      if (Array.isArray(first) && first[0]) return String(first[0])
    }
    if (error.response?.statusText) return error.response.statusText
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
