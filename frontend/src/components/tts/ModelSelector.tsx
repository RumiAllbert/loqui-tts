import { Loader2, Check } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useModels } from '../../hooks/useModels'
import { MODEL_INFO } from '../../utils/constants'
import type { ModelVariant } from '../../types'

export function ModelSelector() {
  const { models, selectedVariant } = useAppStore()
  const { selectAndLoad } = useModels()
  const variants: ModelVariant[] = ['turbo', 'multilingual', 'standard']

  return (
    <div className="space-y-2">
      <label className="text-sm text-stone-600">Model</label>
      <div className="flex gap-1.5">
        {variants.map((v) => {
          const info = MODEL_INFO[v]
          const state = models[v]
          const isSelected = selectedVariant === v
          const isLoaded = state.status === 'loaded'
          const isLoading = state.status === 'loading' || state.status === 'downloading'

          return (
            <button
              key={v}
              onClick={() => selectAndLoad(v)}
              disabled={isLoading}
              className={`
                flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isSelected
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'}
                ${isLoading ? 'opacity-70' : ''}
              `}
            >
              <div className="flex items-center justify-center gap-1.5">
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{info.label}</span>
                {isLoaded && isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
