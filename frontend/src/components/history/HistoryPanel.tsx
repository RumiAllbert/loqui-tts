import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useHistory } from '../../hooks/useHistory'
import { HistoryCard } from './HistoryCard'

export function HistoryPanel() {
  const { history, historyTotal } = useAppStore()
  const { deleteEntry, clearAll } = useHistory()

  return (
    <div>
      {history.length === 0 ? (
        <div className="py-16 text-center text-sm text-stone-400">
          Generations will appear here
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-400 font-mono">{historyTotal} generations</span>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {history.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
