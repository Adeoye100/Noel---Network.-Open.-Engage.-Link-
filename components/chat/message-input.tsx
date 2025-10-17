"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"

interface MessageInputProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSend, disabled, placeholder = "Type a message..." }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending || disabled) return

    setSending(true)
    try {
      await onSend(message.trim())
      setMessage("")
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t border-border bg-card">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || sending}
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button type="submit" size="icon" disabled={!message.trim() || disabled || sending} className="flex-shrink-0">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  )
}
