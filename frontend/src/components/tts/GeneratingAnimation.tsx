import { useState, useEffect } from 'react'

const PHRASES = [
  'Synthesizing speech',
  'Processing text',
  'Generating audio',
  'Building waveform',
]

export function GeneratingAnimation() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Waveform bars */}
      <div className="flex items-end gap-[3px] h-8">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-stone-900"
            style={{
              animation: `waveBar 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
              height: '4px',
            }}
          />
        ))}
      </div>
      {/* Status text */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500 transition-opacity duration-300">
          {PHRASES[phraseIndex]}
        </span>
        <span className="text-xs text-stone-400 font-mono tabular-nums">{elapsed}s</span>
      </div>

      <style>{`
        @keyframes waveBar {
          0%, 100% { height: 4px; opacity: 0.4; }
          50% { height: 28px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
