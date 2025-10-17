"use client"

// Hook for managing user encryption keys
import { useState, useEffect } from "react"
import { CryptoService } from "@/lib/crypto"
import { MessagingService } from "@/lib/messaging"
import { useAuth } from "@/lib/auth-context"

export function useEncryption() {
  const { user } = useAuth()
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const initKeys = async () => {
      try {
        // Check if keys exist in localStorage
        const storedPublicKey = localStorage.getItem(`publicKey_${user.uid}`)
        const storedPrivateKey = localStorage.getItem(`privateKey_${user.uid}`)

        if (storedPublicKey && storedPrivateKey) {
          setPublicKey(storedPublicKey)
          setPrivateKey(storedPrivateKey)
        } else {
          // Generate new keys
          const keys = await CryptoService.generateKeys()
          setPublicKey(keys.publicKey)
          setPrivateKey(keys.privateKey)

          // Store keys locally
          localStorage.setItem(`publicKey_${user.uid}`, keys.publicKey)
          localStorage.setItem(`privateKey_${user.uid}`, keys.privateKey)

          // Store public key in Firestore
          await MessagingService.storeUserKeys(
            user.uid,
            keys.publicKey,
            user.displayName || "Anonymous",
            user.photoURL || undefined,
          )
        }
      } catch (error) {
        console.error("[v0] Error initializing encryption keys:", error)
      } finally {
        setLoading(false)
      }
    }

    initKeys()
  }, [user])

  return { publicKey, privateKey, loading }
}
