import type { HistoryListResponse } from '../types'
import { apiFetch } from './client'

export function fetchHistory(limit = 50, offset = 0): Promise<HistoryListResponse> {
  return apiFetch(`/history/?limit=${limit}&offset=${offset}`)
}

export function deleteHistoryEntry(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/history/${id}`, { method: 'DELETE' })
}

export function clearHistory(): Promise<{ ok: boolean; deleted: number }> {
  return apiFetch('/history/', { method: 'DELETE' })
}
