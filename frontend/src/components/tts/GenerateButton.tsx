import { Loader2, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { generateSpeech } from '../../api/tts'
import { useHistory } from '../../hooks/useHistory'

export function GenerateButton() {
  const {
    text, selectedVariant, language, cfgWeight, exaggeration, temperature, referenceFile,
    models, isGenerating,
    setIsGenerating, setLastGeneration, setGenerationError,
  } = useAppStore()
  const { refresh: refreshHistory } = useHistory()

  const model = models[selectedVariant]
  const isLoaded = model.status === 'loaded'
  const needsRefAudio = selectedVariant === 'multilingual' && !referenceFile
  const canGenerate = text.trim().length > 0 && isLoaded && !isGenerating && !needsRefAudio

  const handleGenerate = async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const result = await generateSpeech({
        text: text.trim(),
        variant: selectedVariant,
        language: selectedVariant === 'multilingual' ? language : undefined,
        exaggeration,
        cfg_weight: cfgWeight,
        temperature,
        reference_audio: referenceFile || undefined,
      })
      setLastGeneration(result)
      refreshHistory()
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed')
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
      {needsRefAudio && isLoaded && (
        <p className="text-xs text-center text-amber-600 mt-2">
          Multilingual model requires a reference audio file
        </p>
      )}
    </div>
  )
}
