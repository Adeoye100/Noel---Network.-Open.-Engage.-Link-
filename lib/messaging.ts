// Message management and storage using Firestore
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  getDocs,
  limit,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore"
import { db } from "./firebase"
import { CryptoService } from "./crypto"

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  encrypted: boolean
  timestamp: number
  read: boolean
}

export interface UserKeys {
  userId: string
  publicKey: string
  displayName: string
  photoURL?: string
  lastSeen: number
}

export class MessagingService {
  static async storeUserKeys(userId: string, publicKey: string, displayName: string, photoURL?: string): Promise<void> {
    const userKeysRef = doc(db, "userKeys", userId)
    await setDoc(userKeysRef, {
      userId,
      publicKey,
      displayName,
      photoURL,
      lastSeen: Date.now(),
    })
  }

  static async getUserKeys(userId: string): Promise<UserKeys | null> {
    const userKeysRef = doc(db, "userKeys", userId)
    const docSnap = await getDoc(userKeysRef)

    if (docSnap.exists()) {
      return docSnap.data() as UserKeys
    }
    return null
  }

  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    receiverPublicKey?: string,
  ): Promise<string> {
    let encryptedContent = content
    let encrypted = false

    // Encrypt message if receiver's public key is available
    if (receiverPublicKey) {
      try {
        encryptedContent = await CryptoService.encryptMessage(content, receiverPublicKey)
        encrypted = true
      } catch (error) {
        console.error("[v0] Encryption failed:", error)
      }
    }

    const messageData = {
      senderId,
      receiverId,
      content: encryptedContent,
      encrypted,
      timestamp: Date.now(),
      read: false,
    }

    const docRef = await addDoc(collection(db, "messages"), messageData)
    return docRef.id
  }

  static async getMessages(userId: string, peerId: string, privateKey?: string): Promise<Message[]> {
    const q = query(
      collection(db, "messages"),
      where("senderId", "in", [userId, peerId]),
      where("receiverId", "in", [userId, peerId]),
      orderBy("timestamp", "asc"),
      limit(100),
    )

    const querySnapshot = await getDocs(q)
    const messages: Message[] = []

    for (const doc of querySnapshot.docs) {
      const data = doc.data()
      let content = data.content

      // Decrypt message if it's encrypted and we have the private key
      if (data.encrypted && privateKey && data.receiverId === userId) {
        try {
          content = await CryptoService.decryptMessage(data.content, privateKey)
        } catch (error) {
          console.error("[v0] Decryption failed:", error)
          content = "[Encrypted message]"
        }
      }

      messages.push({
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content,
        encrypted: data.encrypted,
        timestamp: data.timestamp,
        read: data.read,
      })
    }

    return messages
  }

  static subscribeToMessages(
    userId: string,
    peerId: string,
    privateKey: string | undefined,
    callback: (messages: Message[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, "messages"),
      where("senderId", "in", [userId, peerId]),
      where("receiverId", "in", [userId, peerId]),
      orderBy("timestamp", "asc"),
    )

    return onSnapshot(q, async (snapshot) => {
      const messages: Message[] = []

      for (const doc of snapshot.docs) {
        const data = doc.data()
        let content = data.content

        // Decrypt message if it's encrypted and we have the private key
        if (data.encrypted && privateKey && data.receiverId === userId) {
          try {
            content = await CryptoService.decryptMessage(data.content, privateKey)
          } catch (error) {
            console.error("[v0] Decryption failed:", error)
            content = "[Encrypted message]"
          }
        }

        messages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content,
          encrypted: data.encrypted,
          timestamp: data.timestamp,
          read: data.read,
        })
      }

      callback(messages)
    })
  }

  static async searchUsers(searchTerm: string): Promise<UserKeys[]> {
    const usersRef = collection(db, "userKeys")
    const querySnapshot = await getDocs(usersRef)

    const users: UserKeys[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserKeys
      if (
        data.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.userId.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        users.push(data)
      }
    })

    return users
  }
}
