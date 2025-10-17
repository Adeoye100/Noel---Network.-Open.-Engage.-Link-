"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessagingService, type UserKeys } from "@/lib/messaging"
import { ContactsService } from "@/lib/contacts"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, UserPlus, Loader2 } from "lucide-react"

interface AddContactDialogProps {
  onContactAdded?: (contact: UserKeys) => void
}

export function AddContactDialog({ onContactAdded }: AddContactDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserKeys[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const results = await MessagingService.searchUsers(searchQuery)
      // Filter out current user
      setSearchResults(results.filter((u) => u.userId !== user?.uid))
    } catch (error) {
      console.error("[v0] Search error:", error)
      toast({
        title: "Search failed",
        description: "Could not search for users",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const handleAddContact = async (contact: UserKeys) => {
    if (!user) return

    setAdding(contact.userId)
    try {
      await ContactsService.addContact(user.uid, contact)

      toast({
        title: "Contact added",
        description: `${contact.displayName} has been added to your contacts`,
      })

      onContactAdded?.(contact)
      setOpen(false)
      setSearchQuery("")
      setSearchResults([])
    } catch (error) {
      console.error("[v0] Add contact error:", error)
      toast({
        title: "Error",
        description: "Could not add contact",
        variant: "destructive",
      })
    } finally {
      setAdding(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={result.photoURL || "/placeholder.svg"} alt={result.displayName} />
                    <AvatarFallback>{result.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{result.displayName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{result.userId}</p>
                  </div>
                  <Button size="sm" onClick={() => handleAddContact(result)} disabled={adding === result.userId}>
                    {adding === result.userId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
              {!searchQuery && (
                <p className="text-center text-muted-foreground py-8">Search for users to add them as contacts</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
