import { useCallback, useEffect, useState } from 'react'

export function useColumnVisibility(storageKey: string, initial: Record<string, boolean>) {
  const [vis, setVis] = useState<Record<string, boolean>>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>
        return { ...initial, ...parsed }
      }
    } catch {
      /* ignore */
    }
    return initial
  })

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(vis))
  }, [storageKey, vis])

  const setCol = useCallback((key: string, value: boolean) => {
    setVis((s) => ({ ...s, [key]: value }))
  }, [])

  return { vis, setCol }
}
