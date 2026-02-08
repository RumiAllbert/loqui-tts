import type { WSMessage } from '../types'

export function createWebSocket(onMessage: (msg: WSMessage) => void): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WSMessage
      onMessage(msg)
    } catch {
      // ignore parse errors
    }
  }

  return ws
}
