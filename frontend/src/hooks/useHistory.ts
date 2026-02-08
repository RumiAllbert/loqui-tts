import { useCallback, useEffect } from 'react'
import { clearHistory, deleteHistoryEntry, fetchHistory } from '../api/history'
import { useAppStore } from '../stores/appStore'

export function useHistory() {
  const { setHistory, removeHistoryEntry, clearAllHistory } = useAppStore()

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHistory()
      setHistory(data.items, data.total)
    } catch {
      // ignore
    }
  }, [setHistory])

  useEffect(() => {
    refresh()
  }, [refresh])

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        await deleteHistoryEntry(id)
        removeHistoryEntry(id)
      } catch {
        // ignore
      }
    },
    [removeHistoryEntry],
  )

  const clearAll = useCallback(async () => {
    try {
      await clearHistory()
      clearAllHistory()
    } catch {
      // ignore
    }
  }, [clearAllHistory])

  return { refresh, deleteEntry, clearAll }
}
