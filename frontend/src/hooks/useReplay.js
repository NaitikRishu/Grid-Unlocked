import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'

export function useReplay(eventId) {
  const { startReplay, stopReplay, setReplayScores, setReplayProgress } = useAppStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState(null)
  
  const wsRef = useRef(null)

  const stop = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsPlaying(false)
    stopReplay()
  }

  const play = () => {
    if (!eventId) return
    stop() // close any active connection

    setIsPlaying(true)
    setError(null)
    startReplay()

    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || `${protocol}${window.location.host}/replay`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ event_id: eventId }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'SNAPSHOT') {
          if (msg.zone_scores) {
            setReplayScores(msg.zone_scores)
            setReplayProgress(msg.progress_percent ?? 0)
          }
        } else if (msg.type === 'COMPLETE') {
          stop()
        } else if (msg.type === 'ERROR') {
          setError(msg.message || 'Error occurred during playback.')
          stop()
        }
      } catch (err) {
        console.error('Failed to parse websocket message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err)
      setError('Connection failed. Make sure the Node server is running.')
      stop()
    }

    ws.onclose = () => {
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    isPlaying,
    error,
    play,
    stop
  }
}
export default useReplay
