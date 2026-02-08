import type { GenerateResponse } from '../types'

export async function generateSpeech(params: {
  text: string
  variant: string
  language?: string
  exaggeration?: number
  cfg_weight?: number
  temperature?: number
  speed?: number
  reference_audio?: File
  ref_text?: string
}): Promise<GenerateResponse> {
  const form = new FormData()
  form.append('text', params.text)
  form.append('variant', params.variant)
  if (params.language) form.append('language', params.language)
  if (params.exaggeration !== undefined) form.append('exaggeration', String(params.exaggeration))
  if (params.cfg_weight !== undefined) form.append('cfg_weight', String(params.cfg_weight))
  if (params.temperature !== undefined) form.append('temperature', String(params.temperature))
  if (params.speed !== undefined) form.append('speed', String(params.speed))
  if (params.reference_audio) form.append('reference_audio', params.reference_audio)
  if (params.ref_text) form.append('ref_text', params.ref_text)

  const res = await fetch('/api/tts/generate', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || 'Generation failed')
  }
  return res.json()
}
