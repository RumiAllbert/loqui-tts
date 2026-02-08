import { useAppStore } from '../../stores/appStore'

export function Header() {
  const device = useAppStore((s) => s.device)

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-semibold tracking-tight text-stone-900">Loqui</span>
          <span className="text-xs font-medium text-stone-400 tracking-wide uppercase">TTS</span>
        </div>
        {device && (
          <span className="text-xs text-stone-400 font-mono">{device.label}</span>
        )}
      </div>
    </header>
  )
}
