"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, CheckCheck, Lock } from "lucide-react"
import type { Message } from "@/lib/messaging"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  senderName?: string
  senderPhoto?: string
}

export function MessageBubble({ message, isOwn, senderName, senderPhoto }: MessageBubbleProps) {
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div
      className={cn(
        "flex gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-300",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderPhoto || "/placeholder.svg"} alt={senderName} />
          <AvatarFallback>{senderName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {!isOwn && <span className="text-xs text-muted-foreground px-3">{senderName}</span>}

        <div
          className={cn(
            "rounded-2xl px-4 py-2 break-words shadow-sm",
            isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        <div className="flex items-center gap-1 px-3">
          <span className="text-xs text-muted-foreground">{time}</span>
          {message.encrypted && <Lock className="h-3 w-3 text-muted-foreground" />}
          {isOwn && (
            <span className="text-muted-foreground">
              {message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
