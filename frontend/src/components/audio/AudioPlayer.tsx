import { useState, useCallback } from 'react'
import { Play, Pause, Download } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Waveform } from './Waveform'
import { formatDuration } from '../../utils/formatters'

export function AudioPlayer() {
  const lastGeneration = useAppStore((s) => s.lastGeneration)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), [])
  const onFinish = useCallback(() => { setIsPlaying(false); setCurrentTime(0) }, [])

  if (!lastGeneration) return null

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Output</span>
        <span className="text-xs text-stone-400 font-mono">
          {lastGeneration.generation_time_seconds.toFixed(1)}s
        </span>
      </div>

      <Waveform
        url={lastGeneration.audio_url}
        onReady={setDuration}
        onTimeUpdate={setCurrentTime}
        onFinish={onFinish}
        isPlaying={isPlaying}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <span className="text-xs text-stone-400 font-mono tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>
        <a
          href={lastGeneration.audio_url}
          download={`loqui-${lastGeneration.id}.wav`}
          className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>
    </div>
  )
}
