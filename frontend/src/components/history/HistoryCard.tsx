import { Play, Pause, Trash2, Download } from 'lucide-react'
import type { HistoryEntry } from '../../types'
import { truncateText, formatTimeAgo } from '../../utils/formatters'
import { MODEL_INFO } from '../../utils/constants'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'

interface Props {
  entry: HistoryEntry
  onDelete: (id: string) => void
}

export function HistoryCard({ entry, onDelete }: Props) {
  const { play, toggle, isPlaying } = useAudioPlayer()

  const handlePlay = () => {
    if (isPlaying) toggle()
    else play(entry.audio_url)
  }

  return (
    <div className="group flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      <button
        onClick={handlePlay}
        className="mt-0.5 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center shrink-0 transition-colors"
      >
        {isPlaying
          ? <Pause className="w-3 h-3 text-stone-600" />
          : <Play className="w-3 h-3 text-stone-600 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-700 leading-snug">{truncateText(entry.text, 80)}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-400">
          <span>{MODEL_INFO[entry.model_variant]?.label}</span>
          <span>&middot;</span>
          <span>{entry.duration_seconds.toFixed(1)}s</span>
          <span>&middot;</span>
          <span>{formatTimeAgo(entry.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a
          href={entry.audio_url}
          download
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
