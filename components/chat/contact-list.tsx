"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Contact as BaseContact } from "@/lib/contacts"
import { PresenceService, type PresenceStatus } from "@/lib/presence"

interface Contact extends BaseContact {
  lastMessage?: string
  lastMessageTime?: number
  unreadCount?: number
  online?: boolean
}

interface ContactListProps {
  contacts: Contact[]
  selectedContactId?: string
  onSelectContact: (contact: Contact) => void
}

export function ContactList({ contacts, selectedContactId, onSelectContact }: ContactListProps) {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(new Map())

  useEffect(() => {
    if (contacts.length === 0) return

    const userIds = contacts.map((c) => c.userId)
    const unsubscribes = PresenceService.subscribeToMultiplePresence(userIds, setPresenceMap)

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [contacts])

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {contacts.map((contact) => {
          const presence = presenceMap.get(contact.userId)
          const isOnline = presence?.online || false

          return (
            <button
              key={contact.userId}
              onClick={() => onSelectContact(contact)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left",
                selectedContactId === contact.userId && "bg-accent",
              )}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.photoURL || "/placeholder.svg"} alt={contact.displayName} />
                  <AvatarFallback>{contact.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-card rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">{contact.displayName}</h3>
                  {contact.lastMessageTime && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(contact.lastMessageTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">{contact.lastMessage || "No messages yet"}</p>
                  {contact.unreadCount && contact.unreadCount > 0 && (
                    <Badge className="ml-2 flex-shrink-0 h-5 min-w-5 flex items-center justify-center px-1.5">
                      {contact.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          )
        })}

        {contacts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No contacts yet</p>
            <p className="text-sm mt-2">Search for users to start chatting</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
