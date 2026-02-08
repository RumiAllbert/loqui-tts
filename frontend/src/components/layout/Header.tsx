import { useState } from 'react'
import { Power } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { shutdownServer } from '../../api/models'

export function Header() {
  const device = useAppStore((s) => s.device)
  const [showConfirm, setShowConfirm] = useState(false)
  const [shuttingDown, setShuttingDown] = useState(false)

  const handleShutdown = async () => {
    setShuttingDown(true)
    try {
      await shutdownServer()
    } catch {
      // Server will disconnect — expected
    }
  }

  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-semibold tracking-tight text-stone-900">Loqui</span>
            <span className="text-xs font-medium text-stone-400 tracking-wide uppercase">TTS</span>
          </div>
          <div className="flex items-center gap-3">
            {device && (
              <span className="text-xs text-stone-400 font-mono">{device.label}</span>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              title="Shut down server"
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Shutdown confirmation / goodbye modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          {shuttingDown ? (
            <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-8 max-w-sm mx-4 text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 mb-4">
                <Power className="w-5 h-5 text-stone-400" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-1">See you next time!</h3>
              <p className="text-sm text-stone-400">
                Loqui is shutting down gracefully...
              </p>
              <p className="text-xs text-stone-300 mt-3">
                You can close this tab now.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 max-w-sm mx-4 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-stone-900">Shut down Loqui?</h3>
                <p className="text-sm text-stone-500">
                  This will unload the model and stop the server. You'll need to restart from the terminal.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShutdown}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Shut down
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
