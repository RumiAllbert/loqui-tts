import type { ModelVariant } from '../types'

export const MODEL_INFO: Record<ModelVariant, {
  label: string
  description: string
  size: string
}> = {
  'turbo-fp16': {
    label: 'Turbo FP16',
    description: 'Best quality English',
    size: '~4GB',
  },
  'turbo-8bit': {
    label: 'Turbo 8-bit',
    description: 'Good quality, faster',
    size: '~2GB',
  },
  'turbo-4bit': {
    label: 'Turbo 4-bit',
    description: 'Fastest, smallest',
    size: '~1GB',
  },
  multilingual: {
    label: 'Multilingual',
    description: '23 languages, requires ref audio',
    size: '~1GB',
  },
}

export const LANGUAGES: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  es: 'Spanish',
  fi: 'Finnish',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  ms: 'Malay',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ru: 'Russian',
  sv: 'Swedish',
  sw: 'Swahili',
  tr: 'Turkish',
  zh: 'Chinese',
}

export const MAX_TEXT_LENGTH = 5000
