import { useCallback, useState } from 'react'
import { Upload, X, Mic } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { isQwenVariant } from '../../utils/constants'
import { InfoTip } from '../ui/InfoTip'

export function VoiceUpload() {
  const { referenceFile, setReferenceFile, selectedVariant, refText, setRefText } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const isQwen = isQwenVariant(selectedVariant)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|flac|ogg|m4a)$/i)) {
        setReferenceFile(file)
      }
    },
    [setReferenceFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-sm text-stone-600">Reference voice</label>
        <InfoTip text="Upload a short audio clip (5-15s) to clone a voice. The model will mimic the speaker's tone and style. WAV, MP3, FLAC supported. Optional for all models." />
      </div>
      {referenceFile ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200">
          <span className="text-sm text-stone-600 truncate flex-1">{referenceFile.name}</span>
          <button
            onClick={() => setReferenceFile(null)}
            className="p-0.5 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {isQwen && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200">
              <Mic className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-sm text-stone-500">Default voice</span>
              <span className="text-xs text-stone-400 ml-auto">or upload your own below</span>
            </div>
          )}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'audio/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleFile(file)
              }
              input.click()
            }}
            className={`
              flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed cursor-pointer
              transition-all duration-150
              ${isDragging
                ? 'border-stone-400 bg-stone-100'
                : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'}
            `}
          >
            <Upload className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-400">Drop audio or click to upload</span>
          </div>
        </div>
      )}
      {isQwen && referenceFile && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <label className="text-xs text-stone-500">Reference text</label>
            <InfoTip text="Type the exact words spoken in your reference audio. This helps the model align the voice more accurately. Optional but recommended." />
          </div>
          <textarea
            value={refText}
            onChange={(e) => setRefText(e.target.value)}
            placeholder="Transcript of the reference audio..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-xl bg-stone-50 border border-stone-200
              focus:outline-none focus:ring-1 focus:ring-stone-300 resize-none text-stone-700
              placeholder:text-stone-400"
          />
        </div>
      )}
    </div>
  )
}
