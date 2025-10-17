"use client"

// Hook for managing notifications
import { useEffect, useState } from "react"
import { NotificationService, type Notification } from "@/lib/notifications"
import { useAuth } from "@/lib/auth-context"

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    // Request notification permission
    NotificationService.requestPermission().then(setPermissionGranted)
  }, [])

  useEffect(() => {
    if (!user) return

    const unsubscribe = NotificationService.subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.read).length)

      // Show browser notification for new unread notifications
      if (permissionGranted && notifs.length > 0) {
        const latestUnread = notifs.find((n) => !n.read)
        if (latestUnread && document.hidden) {
          NotificationService.showBrowserNotification(latestUnread.title, latestUnread.body)
        }
      }
    })

    return () => unsubscribe()
  }, [user, permissionGranted])

  const markAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId)
  }

  const markAllAsRead = async () => {
    if (!user) return
    await NotificationService.markAllAsRead(user.uid)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    permissionGranted,
  }
}
