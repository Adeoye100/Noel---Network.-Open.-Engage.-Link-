// Real-time presence tracking using Firebase Realtime Database
import { ref, onValue, set, onDisconnect, serverTimestamp, type Unsubscribe } from "firebase/database"
import { rtdb } from "./firebase"

export interface PresenceStatus {
  online: boolean
  lastSeen: number
  status?: "online" | "away" | "busy" | "offline"
}

export class PresenceService {
  private static presenceRef: any = null

  private static checkRtdb(): boolean {
    if (!rtdb) {
      console.warn("[Presence] Firebase Realtime Database is not configured. Presence features are disabled.")
      return false
    }
    return true
  }

  // Set user online status
  static async setOnline(userId: string): Promise<void> {
    if (!this.checkRtdb()) return

    const userStatusRef = ref(rtdb!, `presence/${userId}`)

    const presenceData = {
      online: true,
      lastSeen: serverTimestamp(),
      status: "online",
    }

    try {
      // Set user as online
      await set(userStatusRef, presenceData)

      // Set up disconnect handler to mark user as offline
      const disconnectRef = onDisconnect(userStatusRef)
      await disconnectRef.set({
        online: false,
        lastSeen: serverTimestamp(),
        status: "offline",
      })

      this.presenceRef = userStatusRef
    } catch (error: any) {
      if (error.code === "PERMISSION_DENIED") {
        console.error(
          "[v0] Permission denied when setting online status. Please update Firebase Realtime Database rules.",
        )
      } else {
        console.error("[v0] Error setting online status:", error)
      }
    }
  }

  // Set user offline status
  static async setOffline(userId: string): Promise<void> {
    if (!this.checkRtdb()) return

    const userStatusRef = ref(rtdb!, `presence/${userId}`)
    try {
      await set(userStatusRef, {
        online: false,
        lastSeen: serverTimestamp(),
        status: "offline",
      })
    } catch (error: any) {
      if (error.code === "PERMISSION_DENIED") {
        console.error(
          "[v0] Permission denied when setting offline status. Please update Firebase Realtime Database rules.",
        )
      } else {
        console.error("[v0] Error setting offline status:", error)
      }
    }
  }

  // Update user status
  static async updateStatus(userId: string, status: "online" | "away" | "busy"): Promise<void> {
    if (!this.checkRtdb()) return

    const userStatusRef = ref(rtdb!, `presence/${userId}`)
    try {
      await set(userStatusRef, {
        online: true,
        lastSeen: serverTimestamp(),
        status,
      })
    } catch (error: any) {
      if (error.code === "PERMISSION_DENIED") {
        console.error("[v0] Permission denied when updating status. Please update Firebase Realtime Database rules.")
      } else {
        console.error("[v0] Error updating status:", error)
      }
    }
  }

  // Subscribe to user presence
  static subscribeToPresence(userId: string, callback: (presence: PresenceStatus) => void): Unsubscribe {
    if (!this.checkRtdb()) {
      return () => {}
    }

    const userStatusRef = ref(rtdb!, `presence/${userId}`)

    return onValue(
      userStatusRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          callback({
            online: data.online || false,
            lastSeen: data.lastSeen || Date.now(),
            status: data.status || "offline",
          })
        } else {
          callback({
            online: false,
            lastSeen: Date.now(),
            status: "offline",
          })
        }
      },
      (error) => {
        // Some Error objects don't have a `code` property in TS's Error type.
        // Narrow safely before accessing it.
        const errAny = error as any
        if (errAny && typeof errAny.code === "string" && errAny.code === "PERMISSION_DENIED") {
          console.error("[v0] Permission denied when subscribing to presence.")
        } else {
          console.error("[v0] Error subscribing to presence:", error)
        }
      },
    )
  }

  // Subscribe to multiple users' presence
  static subscribeToMultiplePresence(
    userIds: string[],
    callback: (presenceMap: Map<string, PresenceStatus>) => void,
  ): Unsubscribe[] {
    if (!this.checkRtdb()) {
      return []
    }

    const unsubscribes: Unsubscribe[] = []
    const presenceMap = new Map<string, PresenceStatus>()

    userIds.forEach((userId) => {
      const unsubscribe = this.subscribeToPresence(userId, (presence) => {
        presenceMap.set(userId, presence)
        callback(new Map(presenceMap))
      })
      unsubscribes.push(unsubscribe)
    })

    return unsubscribes
  }

  // Clean up presence on app close
  static cleanup(): void {
    if (this.presenceRef) {
      this.presenceRef = null
    }
  }
}
