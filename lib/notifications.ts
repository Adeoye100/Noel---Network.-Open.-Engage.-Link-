// Notification service for in-app and browser notifications
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs, // Make sure this is imported
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "./firebase"

export interface Notification {
  id: string
  userId: string
  type: "message" | "contact_request" | "system"
  title: string
  body: string
  data?: any
  read: boolean
  timestamp: number
}

export class NotificationService {
  // Request browser notification permission
  static async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("[v0] Browser doesn't support notifications")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }

  // Show browser notification
  static showBrowserNotification(title: string, body: string, icon?: string): void {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: icon || "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        tag: "p2p-chat",
      })
    }
  }

  // Create notification in Firestore
  static async createNotification(
    userId: string,
    type: "message" | "contact_request" | "system",
    title: string,
    body: string,
    data?: any,
  ): Promise<string> {
    const notificationData = {
      userId,
      type,
      title,
      body,
      data,
      read: false,
      timestamp: Date.now(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  }

  // Subscribe to user notifications
  static subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): Unsubscribe {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("timestamp", "desc"))

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = []
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification)
      })
      callback(notifications)
    })
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      read: true,
    })
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))

    // Use getDocs instead of snapshot.get()
    const snapshot = await getDocs(q)

    const promises = snapshot.docs.map((doc) => updateDoc(doc.ref, { read: true }))
    await Promise.all(promises)
  }
}
