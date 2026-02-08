import type { DeviceInfo, ModelState, ModelVariant } from '../types'
import { apiFetch } from './client'

export function fetchModels(): Promise<ModelState[]> {
  return apiFetch('/models/')
}

export function fetchDevice(): Promise<DeviceInfo> {
  return apiFetch('/models/device')
}

export function loadModel(variant: ModelVariant): Promise<ModelState> {
  return apiFetch(`/models/${variant}/load`, { method: 'POST' })
}

export function shutdownServer(): Promise<void> {
  return apiFetch('/models/shutdown', { method: 'POST' })
}

export interface SystemInfo {
  chip: string
  os: string
  cpu: {
    cores_physical: number
    cores_logical: number
    frequency_mhz: number | null
    usage_percent: number
  }
  memory: {
    total_gb: number
    available_gb: number
    used_gb: number
    percent: number
  }
  gpu: {
    cores: number | null
    neural_engine_cores: number | null
    metal_active_gb: number
    metal_peak_gb: number
    metal_cache_gb: number
  }
  disk: {
    total_gb: number
    free_gb: number
    percent: number
  }
  software: {
    python: string
    mlx: string
    mlx_audio: string
  }
  model: {
    loaded_variant: string | null
  }
}

export function fetchSystemInfo(): Promise<SystemInfo> {
  return apiFetch('/system/info')
}
