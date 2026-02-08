import { useRef, useEffect, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface Props {
  url: string
  onReady?: (duration: number) => void
  onTimeUpdate?: (time: number) => void
  onFinish?: () => void
  isPlaying?: boolean
}

export function Waveform({ url, onReady, onTimeUpdate, onFinish, isPlaying }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d6d3d1',
      progressColor: '#1c1917',
      cursorColor: '#a8a29e',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 2,
      barRadius: 1,
      height: 48,
      normalize: true,
      backend: 'WebAudio',
    })

    ws.load(url)
    ws.on('ready', () => { setReady(true); onReady?.(ws.getDuration()) })
    ws.on('audioprocess', () => onTimeUpdate?.(ws.getCurrentTime()))
    ws.on('finish', () => onFinish?.())

    wsRef.current = ws
    return () => { ws.destroy(); wsRef.current = null; setReady(false) }
  }, [url])

  useEffect(() => {
    if (!wsRef.current || !ready) return
    if (isPlaying) wsRef.current.play()
    else wsRef.current.pause()
  }, [isPlaying, ready])

  return <div ref={containerRef} className="w-full cursor-pointer" />
}
