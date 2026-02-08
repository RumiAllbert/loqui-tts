import { create } from 'zustand'
import type { DeviceInfo, GenerateResponse, HistoryEntry, ModelState, ModelVariant } from '../types'

interface AppState {
  // Device
  device: DeviceInfo | null
  setDevice: (d: DeviceInfo) => void

  // Models
  models: Record<ModelVariant, ModelState>
  selectedVariant: ModelVariant
  setSelectedVariant: (v: ModelVariant) => void
  updateModelState: (variant: ModelVariant, updates: Partial<ModelState>) => void
  setModels: (models: ModelState[]) => void

  // Form
  text: string
  setText: (t: string) => void
  language: string
  setLanguage: (l: string) => void
  exaggeration: number
  setExaggeration: (v: number) => void
  cfgWeight: number
  setCfgWeight: (v: number) => void
  temperature: number
  setTemperature: (v: number) => void
  referenceFile: File | null
  setReferenceFile: (f: File | null) => void

  // Generation
  isGenerating: boolean
  setIsGenerating: (v: boolean) => void
  lastGeneration: GenerateResponse | null
  setLastGeneration: (g: GenerateResponse | null) => void
  generationError: string | null
  setGenerationError: (e: string | null) => void

  // History
  history: HistoryEntry[]
  historyTotal: number
  setHistory: (items: HistoryEntry[], total: number) => void
  addHistoryEntry: (entry: HistoryEntry) => void
  removeHistoryEntry: (id: string) => void
  clearAllHistory: () => void
}

const defaultModelState = (variant: ModelVariant): ModelState => ({
  variant,
  status: 'not_downloaded',
  error: null,
  download_progress: 0,
})

export const useAppStore = create<AppState>((set) => ({
  device: null,
  setDevice: (device) => set({ device }),

  models: {
    multilingual: defaultModelState('multilingual'),
    turbo: defaultModelState('turbo'),
    standard: defaultModelState('standard'),
  },
  selectedVariant: 'turbo',
  setSelectedVariant: (v) => set({ selectedVariant: v }),
  updateModelState: (variant, updates) =>
    set((state) => ({
      models: {
        ...state.models,
        [variant]: { ...state.models[variant], ...updates },
      },
    })),
  setModels: (models) =>
    set((state) => {
      const updated = { ...state.models }
      for (const m of models) {
        updated[m.variant as ModelVariant] = m
      }
      return { models: updated }
    }),

  text: '',
  setText: (text) => set({ text }),
  language: 'en',
  setLanguage: (language) => set({ language }),
  exaggeration: 0.5,
  setExaggeration: (exaggeration) => set({ exaggeration }),
  cfgWeight: 0.5,
  setCfgWeight: (cfgWeight) => set({ cfgWeight }),
  temperature: 0.8,
  setTemperature: (temperature) => set({ temperature }),
  referenceFile: null,
  setReferenceFile: (referenceFile) => set({ referenceFile }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  lastGeneration: null,
  setLastGeneration: (lastGeneration) => set({ lastGeneration }),
  generationError: null,
  setGenerationError: (generationError) => set({ generationError }),

  history: [],
  historyTotal: 0,
  setHistory: (items, total) => set({ history: items, historyTotal: total }),
  addHistoryEntry: (entry) =>
    set((state) => ({
      history: [entry, ...state.history],
      historyTotal: state.historyTotal + 1,
    })),
  removeHistoryEntry: (id) =>
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
      historyTotal: state.historyTotal - 1,
    })),
  clearAllHistory: () => set({ history: [], historyTotal: 0 }),
}))
