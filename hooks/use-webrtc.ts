"use client"

// Hook for managing WebRTC connections
import { useState, useEffect, useCallback, useRef } from "react"
import { WebRTCService } from "@/lib/webrtc"

export function useWebRTC(userId: string | undefined, peerId: string | undefined) {
  const [connectionState, setConnectionState] = useState<string>("disconnected")
  const [error, setError] = useState<string | null>(null)
  const webrtcRef = useRef<WebRTCService | null>(null)
  const onMessageCallbackRef = useRef<((message: string) => void) | null>(null)

  const connect = useCallback(
    async (isInitiator: boolean) => {
      if (!userId || !peerId) {
        setError("Missing user or peer ID")
        return
      }

      try {
        setError(null)
        setConnectionState("connecting")

        const webrtc = new WebRTCService(userId, peerId)
        webrtcRef.current = webrtc

        webrtc.onConnectionState((state) => {
          setConnectionState(state)
        })

        webrtc.onMessage((message) => {
          onMessageCallbackRef.current?.(message)
        })

        await webrtc.initConnection(isInitiator)
      } catch (err) {
        console.error("[v0] WebRTC connection error:", err)
        setError(err instanceof Error ? err.message : "Connection failed")
        setConnectionState("failed")
      }
    },
    [userId, peerId],
  )

  const sendMessage = useCallback((message: string) => {
    if (!webrtcRef.current) {
      throw new Error("WebRTC not initialized")
    }
    webrtcRef.current.sendMessage(message)
  }, [])

  const onMessage = useCallback((callback: (message: string) => void) => {
    onMessageCallbackRef.current = callback
  }, [])

  const disconnect = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.disconnect()
      webrtcRef.current = null
    }
    setConnectionState("disconnected")
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connectionState,
    error,
    connect,
    sendMessage,
    onMessage,
    disconnect,
  }
}
