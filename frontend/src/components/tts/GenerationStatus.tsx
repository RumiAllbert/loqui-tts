import { useAppStore } from '../../stores/appStore'

export function GenerationStatus() {
  const error = useAppStore((s) => s.generationError)

  if (!error) return null

  return (
    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
      {error}
    </div>
  )
}
