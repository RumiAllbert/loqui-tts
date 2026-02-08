import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

export function VoiceUpload() {
  const { referenceFile, setReferenceFile } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)

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
      <label className="text-sm text-stone-600">Reference voice</label>
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
      )}
    </div>
  )
}
