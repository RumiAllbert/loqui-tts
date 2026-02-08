import { Loader2, Download, Check, HardDrive } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useModels } from '../../hooks/useModels'
import { MODEL_INFO } from '../../utils/constants'
import { Tooltip } from '../ui/Tooltip'
import { InfoTip } from '../ui/InfoTip'
import type { ModelVariant } from '../../types'

const ENGLISH_VARIANTS: ModelVariant[] = ['turbo-fp16', 'turbo-8bit', 'turbo-4bit']
const MULTILINGUAL_VARIANTS: ModelVariant[] = ['qwen-0.6b', 'qwen-1.7b']

function StatusBadge({ status }: { status: string }) {
  if (status === 'loaded') {
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    )
  }
  if (status === 'downloaded') {
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full">
        <HardDrive className="w-2.5 h-2.5" />
        Ready
      </span>
    )
  }
  return null
}

function DownloadProgress({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100)
  return (
    <div className="w-full mt-1.5 px-0.5">
      <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <div className="text-[9px] text-stone-400 mt-0.5 text-center">
        {pct > 0 ? `${pct}%` : 'Starting...'}
      </div>
    </div>
  )
}

function VariantButton({ v }: { v: ModelVariant }) {
  const { models, selectedVariant } = useAppStore()
  const { selectAndLoad } = useModels()

  const info = MODEL_INFO[v]
  const state = models[v]
  const isSelected = selectedVariant === v
  const isLoaded = state.status === 'loaded'
  const isDownloading = state.status === 'downloading'
  const isLoading = state.status === 'loading'
  const isBusy = isDownloading || isLoading
  const isDownloaded = state.status === 'downloaded'
  const needsDownload = state.status === 'not_downloaded'

  return (
    <Tooltip text={info.tooltip}>
      <button
        onClick={() => selectAndLoad(v)}
        disabled={isBusy}
        className={`
          w-full px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative
          ${isSelected
            ? 'bg-stone-900 text-white shadow-sm'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'}
          ${isBusy ? 'opacity-70' : ''}
        `}
      >
        <div className="flex items-center justify-center gap-1.5">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
          {isDownloading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
          {needsDownload && !isSelected && <Download className="w-3 h-3 flex-shrink-0 opacity-50" />}
          {isDownloaded && !isSelected && <Check className="w-3 h-3 flex-shrink-0 text-stone-400" />}
          <span className="truncate">{info.label}</span>
          {isLoaded && isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          )}
        </div>
        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
          {isDownloading
            ? 'Downloading...'
            : isLoading
              ? 'Loading into memory...'
              : `${info.subtitle} · ${info.size}`}
        </div>
        {/* Download progress bar */}
        {isDownloading && (
          <DownloadProgress progress={state.download_progress} />
        )}
        {/* Status badge - positioned top-right */}
        {!isSelected && !isBusy && (isLoaded || isDownloaded) && (
          <div className="absolute -top-1.5 -right-1.5">
            <StatusBadge status={state.status} />
          </div>
        )}
      </button>
    </Tooltip>
  )
}

export function ModelSelector() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <label className="text-sm text-stone-600">Model</label>
        <InfoTip text="Choose a model variant. English models are optimized for English speech. Multilingual models support 10 languages. Hover each model for details." />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-stone-400 uppercase tracking-wide w-10 flex-shrink-0">EN</span>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {ENGLISH_VARIANTS.map((v) => <VariantButton key={v} v={v} />)}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-stone-400 uppercase tracking-wide w-10 flex-shrink-0">Multi</span>
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            {MULTILINGUAL_VARIANTS.map((v) => <VariantButton key={v} v={v} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
