import { useCallback, useRef, useState } from 'react'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const play = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audioRef.current = audio

    audio.onloadedmetadata = () => setDuration(audio.duration)
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
    audio.onended = () => setIsPlaying(false)
    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)

    audio.play()
  }, [])

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  return { play, toggle, stop, isPlaying, currentTime, duration }
}
