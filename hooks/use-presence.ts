"use client"

// Hook for managing user presence
import { useEffect, useState } from "react"
import { PresenceService } from "@/lib/presence"
import { useAuth } from "@/lib/auth-context"

export function usePresence() {
  const { user } = useAuth()
  const [status, setStatus] = useState<"online" | "away" | "busy">("online")

  useEffect(() => {
    if (!user) return

    // Set user as online when component mounts
    PresenceService.setOnline(user.uid)

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        PresenceService.updateStatus(user.uid, "away")
        setStatus("away")
      } else {
        PresenceService.updateStatus(user.uid, "online")
        setStatus("online")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      PresenceService.setOffline(user.uid)
      PresenceService.cleanup()
    }
  }, [user])

  const updateStatus = async (newStatus: "online" | "away" | "busy") => {
    if (!user) return
    await PresenceService.updateStatus(user.uid, newStatus)
    setStatus(newStatus)
  }

  return { status, updateStatus }
}
