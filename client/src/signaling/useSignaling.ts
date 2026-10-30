import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { initialRoomState, roomReducer } from './roomReducer'
import type { ClientMessage, ServerMessage, SignalData } from './types'

const RECONNECT_DELAY_MS = 3000

export type ConnectionState = 'connecting' | 'connected'

export function useSignaling(url: string) {
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [room, dispatch] = useReducer(roomReducer, initialRoomState)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let socket: WebSocket
    let retryTimer: number | undefined
    // set on cleanup, so a close caused by unmount does not trigger a reconnect
    let disposed = false

    const connect = () => {
      socket = new WebSocket(url)
      socketRef.current = socket

      socket.onopen = () => setConnection('connected')

      socket.onmessage = (event) => {
        const message = parseMessage(event.data)
        if (message) dispatch(message)
      }

      socket.onclose = () => {
        if (disposed) return
        dispatch({ type: 'disconnected' })
        setConnection('connecting')
        retryTimer = window.setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    connect()

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      socket.close()
    }
  }, [url])

  const sendSignal = useCallback((to: string, data: SignalData) => {
    const socket = socketRef.current
    if (socket?.readyState !== WebSocket.OPEN) return

    const message: ClientMessage = { type: 'signal', to, data }
    socket.send(JSON.stringify(message))
  }, [])

  return { connection, self: room.self, peers: room.peers, sendSignal }
}

function parseMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as ServerMessage
  } catch {
    console.warn('invalid message from signaling server', raw)
    return null
  }
}
