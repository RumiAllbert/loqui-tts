import { Loader2, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { generateSpeech } from '../../api/tts'
import { useHistory } from '../../hooks/useHistory'
import { isQwenVariant } from '../../utils/constants'
import { toast } from '../ui/Toast'

export function GenerateButton() {
  const {
    text, selectedVariant, language, cfgWeight, exaggeration, temperature, speed, referenceFile, refText,
    models, isGenerating,
    setIsGenerating, setLastGeneration, setGenerationError,
  } = useAppStore()
  const { refresh: refreshHistory } = useHistory()

  const model = models[selectedVariant]
  const isLoaded = model.status === 'loaded'
  const isQwen = isQwenVariant(selectedVariant)
  const canGenerate = text.trim().length > 0 && isLoaded && !isGenerating

  const handleGenerate = async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const result = await generateSpeech({
        text: text.trim(),
        variant: selectedVariant,
        language: isQwen ? language : undefined,
        exaggeration,
        cfg_weight: cfgWeight,
        temperature,
        speed: isQwen ? speed : undefined,
        reference_audio: referenceFile || undefined,
        ref_text: isQwen && refText ? refText : undefined,
      })
      setLastGeneration(result)
      refreshHistory()
      toast({
        type: 'success',
        message: `Audio generated in ${result.generation_time_seconds.toFixed(1)}s (${result.duration_seconds.toFixed(1)}s)`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setGenerationError(message)
      toast({ type: 'error', message })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="pt-1">
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`
          w-full btn-primary py-3 text-sm flex items-center justify-center gap-2
          ${!canGenerate ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            Generate
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {!isLoaded && !isGenerating && (
        <p className="text-xs text-center text-stone-400 mt-2">
          Select a model above to begin
        </p>
      )}
    </div>
  )
}
