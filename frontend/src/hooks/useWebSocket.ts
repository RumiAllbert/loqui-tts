import { useEffect, useRef } from 'react'
import { createWebSocket } from '../api/websocket'
import { useAppStore } from '../stores/appStore'
import type { ModelVariant, WSMessage } from '../types'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const updateModelState = useAppStore((s) => s.updateModelState)
  const setSelectedVariant = useAppStore((s) => s.setSelectedVariant)

  useEffect(() => {
    const handleMessage = (msg: WSMessage) => {
      if (msg.event === 'model_status' && msg.variant) {
        const variant = msg.variant as ModelVariant
        const status = msg.status as string
        updateModelState(variant, {
          status: status as any,
          ...(msg.error ? { error: msg.error as string } : { error: null }),
        })
        // Auto-select variant when it finishes loading
        if (status === 'loaded') {
          setSelectedVariant(variant)
        }
      }
    }

    const connect = () => {
      wsRef.current = createWebSocket(handleMessage)
      wsRef.current.onclose = () => {
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => { wsRef.current?.close() }
  }, [updateModelState, setSelectedVariant])
}
