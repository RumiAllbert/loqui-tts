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
