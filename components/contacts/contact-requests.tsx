"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ContactsService, type ContactRequest } from "@/lib/contacts"
import { MessagingService } from "@/lib/messaging"
import { useAuth } from "@/lib/auth-context"
import { Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ContactRequests() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const unsubscribe = ContactsService.subscribeToPendingRequests(user.uid, setRequests)
    return () => unsubscribe()
  }, [user])

  const handleAccept = async (request: ContactRequest) => {
    if (!user) return

    setLoading(request.id)
    try {
      // Get the sender's public key
      const senderKeys = await MessagingService.getUserKeys(request.fromUserId)
      if (!senderKeys) {
        throw new Error("Could not find user keys")
      }

      await ContactsService.acceptContactRequest(request.id, user.uid, senderKeys)

      // Also add the current user to the sender's contacts
      const currentUserKeys = await MessagingService.getUserKeys(user.uid)
      if (currentUserKeys) {
        await ContactsService.addContact(request.fromUserId, currentUserKeys)
      }

      toast({
        title: "Contact added",
        description: `${request.fromDisplayName} has been added to your contacts`,
      })
    } catch (error) {
      console.error("[v0] Error accepting request:", error)
      toast({
        title: "Error",
        description: "Could not accept contact request",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (request: ContactRequest) => {
    if (!user) return

    setLoading(request.id)
    try {
      await ContactsService.rejectContactRequest(request.id, user.uid)
      toast({
        title: "Request rejected",
        description: "Contact request has been rejected",
      })
    } catch (error) {
      console.error("[v0] Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Could not reject contact request",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contact Requests</CardTitle>
            <CardDescription>People who want to connect with you</CardDescription>
          </div>
          <Badge>{requests.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={request.fromPhotoURL || "/placeholder.svg"} alt={request.fromDisplayName} />
                  <AvatarFallback>{request.fromDisplayName.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{request.fromDisplayName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.timestamp).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAccept(request)}
                    disabled={loading === request.id}
                  >
                    {loading === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request)}
                    disabled={loading === request.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
