import type { ModelVariant } from '../types'

export const MODEL_INFO: Record<ModelVariant, {
  label: string
  subtitle: string
  tooltip: string
  size: string
}> = {
  'turbo-fp16': {
    label: 'Large',
    subtitle: 'Best quality',
    tooltip: 'Chatterbox Turbo FP16 — Full precision, highest quality English TTS (~4GB)',
    size: '~4GB',
  },
  'turbo-8bit': {
    label: 'Medium',
    subtitle: 'Balanced',
    tooltip: 'Chatterbox Turbo 8-bit — Good quality with faster inference (~2GB)',
    size: '~2GB',
  },
  'turbo-4bit': {
    label: 'Small',
    subtitle: 'Fastest',
    tooltip: 'Chatterbox Turbo 4-bit — Smallest and fastest English model (~1GB)',
    size: '~1GB',
  },
  'qwen-0.6b': {
    label: 'Small',
    subtitle: 'Fast',
    tooltip: 'Qwen3-TTS 0.6B — Lightweight multilingual model, 10 languages (~1.2GB)',
    size: '~1.2GB',
  },
  'qwen-1.7b': {
    label: 'Large',
    subtitle: 'Best quality',
    tooltip: 'Qwen3-TTS 1.7B — Highest quality multilingual model, 10 languages (~3.4GB)',
    size: '~3.4GB',
  },
}

export const LANGUAGES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  ru: 'Russian',
  pt: 'Portuguese',
}

export const MAX_TEXT_LENGTH = 5000

export const isQwenVariant = (v: string) => v.startsWith('qwen')
