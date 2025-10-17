"use client"

// Hook for managing contacts
import { useState, useEffect } from "react"
import { ContactsService, type Contact } from "@/lib/contacts"
import { useAuth } from "@/lib/auth-context"

export function useContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = ContactsService.subscribeToContacts(user.uid, (updatedContacts) => {
      setContacts(updatedContacts)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { contacts, loading }
}
