export type ModelVariant = 'multilingual' | 'turbo' | 'standard'

export type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'loaded'
  | 'unloading'
  | 'error'

export interface ModelState {
  variant: ModelVariant
  status: ModelStatus
  error: string | null
  download_progress: number
}

export interface DeviceInfo {
  device: string
  name: string
  label: string
}

export interface GenerateResponse {
  id: string
  audio_url: string
  text: string
  model_variant: ModelVariant
  language: string | null
  duration_seconds: number
  generation_time_seconds: number
  sample_rate: number
}

export interface HistoryEntry {
  id: string
  text: string
  model_variant: ModelVariant
  language: string | null
  exaggeration: number | null
  cfg_weight: number | null
  duration_seconds: number
  generation_time_seconds: number
  audio_url: string
  created_at: string
}

export interface HistoryListResponse {
  items: HistoryEntry[]
  total: number
}

export interface WSMessage {
  event: string
  variant?: string
  status?: string
  error?: string
  [key: string]: unknown
}
