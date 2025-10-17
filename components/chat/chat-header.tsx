"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PresenceService, type PresenceStatus } from "@/lib/presence"

interface ChatHeaderProps {
  userId: string
  name: string
  photo?: string
  status?: string
  connectionState?: string
  onBack?: () => void
  onCall?: () => void
  onVideoCall?: () => void
  onClearChat?: () => void
}

export function ChatHeader({
  userId,
  name,
  photo,
  status,
  connectionState,
  onBack,
  onCall,
  onVideoCall,
  onClearChat,
}: ChatHeaderProps) {
  const [presence, setPresence] = useState<PresenceStatus | null>(null)

  useEffect(() => {
    const unsubscribe = PresenceService.subscribeToPresence(userId, setPresence)
    return () => unsubscribe()
  }, [userId])

  const getStatusText = () => {
    if (!presence) return status || "Offline"
    if (presence.online) {
      return presence.status === "away" ? "Away" : presence.status === "busy" ? "Busy" : "Online"
    }
    const lastSeen = new Date(presence.lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return lastSeen.toLocaleDateString()
  }

  const getConnectionBadge = () => {
    switch (connectionState) {
      case "connected":
        return <Badge className="bg-green-500 text-white">Connected</Badge>
      case "connecting":
        return <Badge variant="secondary">Connecting...</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  return (
    <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={photo || "/placeholder.svg"} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        {presence?.online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-card rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate">{name}</h2>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">{getStatusText()}</p>
          {connectionState && getConnectionBadge()}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onCall && (
          <Button variant="ghost" size="icon" onClick={onCall}>
            <Phone className="h-5 w-5" />
          </Button>
        )}
        {onVideoCall && (
          <Button variant="ghost" size="icon" onClick={onVideoCall}>
            <Video className="h-5 w-5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
            {onClearChat && <DropdownMenuItem onClick={onClearChat}>Clear Chat</DropdownMenuItem>}
            <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
