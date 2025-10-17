"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEncryption } from "@/hooks/use-encryption"
import { useContacts } from "@/hooks/use-contacts"
import { usePresence } from "@/hooks/use-presence"
import { MessagingService, type Message } from "@/lib/messaging"
import { ContactsService, type Contact } from "@/lib/contacts"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut, Menu } from "lucide-react"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageBubble } from "@/components/chat/message-bubble"
import { MessageInput } from "@/components/chat/message-input"
import { ContactList } from "@/components/chat/contact-list"
import { EmptyChat } from "@/components/chat/empty-chat"
import { AddContactDialog } from "@/components/contacts/add-contact-dialog"
import { ContactRequests } from "@/components/contacts/contact-requests"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ChatPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { publicKey, privateKey, loading: keysLoading } = useEncryption()
  const { contacts, loading: contactsLoading } = useContacts()
  const { status } = usePresence()
  const router = useRouter()
  const { toast } = useToast()

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && publicKey && !keysLoading) {
      MessagingService.storeUserKeys(user.uid, publicKey, user.displayName || "Anonymous", user.photoURL || undefined)
    }
  }, [user, publicKey, keysLoading])

  useEffect(() => {
    if (!user || !selectedContact) return

    const unsubscribe = MessagingService.subscribeToMessages(user.uid, selectedContact.userId, privateKey, (msgs) => {
      setMessages(msgs)
    })

    return () => unsubscribe()
  }, [user, selectedContact, privateKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedContact) return

    try {
      await MessagingService.sendMessage(user.uid, selectedContact.userId, content, selectedContact.publicKey)
    } catch (error) {
      console.error("[v0] Send message error:", error)
      toast({
        title: "Failed to send",
        description: "Could not send message",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async () => {
    if (!user || !selectedContact) return

    try {
      await ContactsService.removeContact(user.uid, selectedContact.userId)
      toast({
        title: "Contact removed",
        description: `${selectedContact.displayName} has been removed from your contacts`,
      })
      setSelectedContact(null)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("[v0] Delete contact error:", error)
      toast({
        title: "Error",
        description: "Could not remove contact",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  if (authLoading || keysLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const sidebar = (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-semibold truncate">{user.displayName || "User"}</h2>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <AddContactDialog onContactAdded={(contact) => setSidebarOpen(false)} />
      </div>

      <div className="p-4 border-b border-border">
        <ContactRequests />
      </div>

      <ContactList
        contacts={contacts}
        selectedContactId={selectedContact?.userId}
        onSelectContact={(contact) => {
          setSelectedContact(contact)
          setSidebarOpen(false)
        }}
      />
    </div>
  )

  return (
    <>
      <div className="h-screen flex bg-background">
        <div className="hidden md:block w-80 h-full">{sidebar}</div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80">
            {sidebar}
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col h-full">
          {selectedContact ? (
            <>
              <ChatHeader
                userId={selectedContact.userId}
                name={selectedContact.displayName}
                photo={selectedContact.photoURL}
                status={selectedContact.blocked ? "Blocked" : undefined}
                onBack={() => setSidebarOpen(true)}
                onClearChat={() => setDeleteDialogOpen(true)}
              />

              <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.senderId === user.uid}
                      senderName={
                        message.senderId === user.uid ? user.displayName || "You" : selectedContact.displayName
                      }
                      senderPhoto={
                        message.senderId === user.uid ? user.photoURL || undefined : selectedContact.photoURL
                      }
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <MessageInput onSend={handleSendMessage} disabled={selectedContact.blocked} />
            </>
          ) : (
            <>
              <div className="md:hidden p-4 border-b border-border bg-card">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <EmptyChat />
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedContact?.displayName} from your contacts? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </>
  )
}
