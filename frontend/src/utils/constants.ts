import type { ModelVariant } from '../types'

export const MODEL_INFO: Record<ModelVariant, {
  label: string
  description: string
  size: string
}> = {
  multilingual: {
    label: 'Multilingual',
    description: '23 languages, zero-shot cloning',
    size: '500M',
  },
  turbo: {
    label: 'Turbo',
    description: 'Fastest, paralinguistic tags',
    size: '350M',
  },
  standard: {
    label: 'Standard',
    description: 'CFG & exaggeration tuning',
    size: '500M',
  },
}

export const LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  pl: 'Polish',
  tr: 'Turkish',
  ru: 'Russian',
  nl: 'Dutch',
  cs: 'Czech',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  hi: 'Hindi',
  hu: 'Hungarian',
  fi: 'Finnish',
  vi: 'Vietnamese',
  uk: 'Ukrainian',
  el: 'Greek',
  ms: 'Malay',
  ro: 'Romanian',
  da: 'Danish',
  he: 'Hebrew',
  no: 'Norwegian',
}

export const MAX_TEXT_LENGTH = 5000
