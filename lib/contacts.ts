// Contact management service
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { db } from "./firebase"
import type { UserKeys } from "./messaging"

export interface Contact {
  userId: string
  displayName: string
  photoURL?: string
  publicKey: string
  addedAt: number
  lastSeen?: number
  status?: string
  blocked?: boolean
}

export interface ContactRequest {
  id: string
  fromUserId: string
  fromDisplayName: string
  fromPhotoURL?: string
  toUserId: string
  status: "pending" | "accepted" | "rejected"
  timestamp: number
}

export class ContactsService {
  // Add a contact
  static async addContact(userId: string, contactData: UserKeys): Promise<void> {
    const contactRef = doc(db, "users", userId, "contacts", contactData.userId)
    await setDoc(contactRef, {
      userId: contactData.userId,
      displayName: contactData.displayName,
      photoURL: contactData.photoURL,
      publicKey: contactData.publicKey,
      addedAt: Date.now(),
      blocked: false,
    })
  }

  // Get all contacts for a user
  static async getContacts(userId: string): Promise<Contact[]> {
    const contactsRef = collection(db, "users", userId, "contacts")
    const querySnapshot = await getDocs(contactsRef)

    const contacts: Contact[] = []
    querySnapshot.forEach((doc) => {
      contacts.push(doc.data() as Contact)
    })

    return contacts.sort((a, b) => b.addedAt - a.addedAt)
  }

  // Subscribe to contacts changes
  static subscribeToContacts(userId: string, callback: (contacts: Contact[]) => void): Unsubscribe {
    const contactsRef = collection(db, "users", userId, "contacts")

    return onSnapshot(contactsRef, (snapshot) => {
      const contacts: Contact[] = []
      snapshot.forEach((doc) => {
        contacts.push(doc.data() as Contact)
      })
      callback(contacts.sort((a, b) => b.addedAt - a.addedAt))
    })
  }

  // Remove a contact
  static async removeContact(userId: string, contactId: string): Promise<void> {
    const contactRef = doc(db, "users", userId, "contacts", contactId)
    await deleteDoc(contactRef)
  }

  // Block a contact
  static async blockContact(userId: string, contactId: string): Promise<void> {
    const contactRef = doc(db, "users", userId, "contacts", contactId)
    await updateDoc(contactRef, {
      blocked: true,
    })
  }

  // Unblock a contact
  static async unblockContact(userId: string, contactId: string): Promise<void> {
    const contactRef = doc(db, "users", userId, "contacts", contactId)
    await updateDoc(contactRef, {
      blocked: false,
    })
  }

  // Send contact request
  static async sendContactRequest(
    fromUserId: string,
    fromDisplayName: string,
    fromPhotoURL: string | undefined,
    toUserId: string,
  ): Promise<void> {
    const requestRef = doc(collection(db, "contactRequests"))
    await setDoc(requestRef, {
      fromUserId,
      fromDisplayName,
      fromPhotoURL,
      toUserId,
      status: "pending",
      timestamp: Date.now(),
    })

    // Add to recipient's pending requests
    const userRef = doc(db, "users", toUserId)
    await updateDoc(userRef, {
      pendingRequests: arrayUnion(requestRef.id),
    })
  }

  // Get pending contact requests
  static async getPendingRequests(userId: string): Promise<ContactRequest[]> {
    const q = query(
      collection(db, "contactRequests"),
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
    )

    const querySnapshot = await getDocs(q)
    const requests: ContactRequest[] = []

    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data(),
      } as ContactRequest)
    })

    return requests.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Subscribe to pending requests
  static subscribeToPendingRequests(userId: string, callback: (requests: ContactRequest[]) => void): Unsubscribe {
    const q = query(
      collection(db, "contactRequests"),
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
    )

    return onSnapshot(q, (snapshot) => {
      const requests: ContactRequest[] = []
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
        } as ContactRequest)
      })
      callback(requests.sort((a, b) => b.timestamp - a.timestamp))
    })
  }

  // Accept contact request
  static async acceptContactRequest(requestId: string, userId: string, contactData: UserKeys): Promise<void> {
    // Update request status
    const requestRef = doc(db, "contactRequests", requestId)
    await updateDoc(requestRef, {
      status: "accepted",
    })

    // Add contact
    await this.addContact(userId, contactData)

    // Remove from pending requests
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      pendingRequests: arrayRemove(requestId),
    })
  }

  // Reject contact request
  static async rejectContactRequest(requestId: string, userId: string): Promise<void> {
    const requestRef = doc(db, "contactRequests", requestId)
    await updateDoc(requestRef, {
      status: "rejected",
    })

    // Remove from pending requests
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      pendingRequests: arrayRemove(requestId),
    })
  }

  // Update contact's last seen
  static async updateLastSeen(userId: string, contactId: string, lastSeen: number): Promise<void> {
    const contactRef = doc(db, "users", userId, "contacts", contactId)
    const contactDoc = await getDoc(contactRef)

    if (contactDoc.exists()) {
      await updateDoc(contactRef, {
        lastSeen,
      })
    }
  }
}
