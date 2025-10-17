"use client"

import { MessageSquare } from "lucide-react"

export function EmptyChat() {
  return (
    <div className="h-full flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center animate-in zoom-in duration-300 delay-100">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500 delay-200">
          <h2 className="text-2xl font-bold text-balance">Start a Conversation</h2>
          <p className="text-muted-foreground leading-relaxed text-pretty">
            Select a contact from the sidebar to begin chatting. All messages are end-to-end encrypted for your privacy.
          </p>
        </div>
      </div>
    </div>
  )
}
