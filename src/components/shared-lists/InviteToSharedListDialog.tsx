import { useState } from 'react'
import { UserPlus, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFriends } from '@/hooks/useFriends'
import { useInviteToSharedList } from '@/hooks/useSharedLists'
import { toast } from 'sonner'
import type { Friend } from '@/lib/types/friends'
import type { SharedList } from '@/lib/types/sharedLists'

interface InviteToSharedListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: SharedList
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function InviteToSharedListDialog({
  open,
  onOpenChange,
  list,
}: InviteToSharedListDialogProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friendSearch, setFriendSearch] = useState('')

  const { data: friends = [] } = useFriends()
  const { mutateAsync: invite, isPending } = useInviteToSharedList()

  // Filtrera bort vänner som redan är med i listan (case-insensitive trim)
  const memberNamesLower = list.member_names.map(n => n.toLowerCase().trim())
  const availableFriends = friends.filter(
    f => !memberNamesLower.includes(f.friend_name.toLowerCase().trim())
  )

  const filteredFriends = friendSearch.trim()
    ? availableFriends.filter(f => f.friend_name.toLowerCase().includes(friendSearch.toLowerCase()))
    : availableFriends

  function handleClose() {
    setSelectedFriend(null)
    setFriendSearch('')
    onOpenChange(false)
  }

  async function handleInvite() {
    if (!selectedFriend) return

    const result = await invite({
      sharedListId: list.id,
      friendUserId: selectedFriend.friend_id,
    })

    if (result?.success) {
      toast.success(`Inbjudan skickad till ${selectedFriend.friend_name}`)
      handleClose()
    } else {
      const msg =
        result?.error === 'already_a_member'
          ? `${selectedFriend.friend_name} är redan med i listan.`
          : result?.error === 'not_friends'
            ? 'Du måste vara vän med personen för att bjuda in dem.'
            : 'Kunde inte skicka inbjudan. Försök igen.'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Bjud in till &quot;{list.name}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {availableFriends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Alla dina vänner är redan med i listan.
            </p>
          ) : (
            <>
              <Input
                placeholder="Sök bland vänner..."
                value={friendSearch}
                onChange={e => setFriendSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                {filteredFriends.map(friend => (
                  <button
                    key={friend.friend_id}
                    type="button"
                    onClick={() =>
                      setSelectedFriend(
                        selectedFriend?.friend_id === friend.friend_id ? null : friend
                      )
                    }
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {getInitials(friend.friend_name)}
                    </div>
                    <span className="flex-1 text-left">{friend.friend_name}</span>
                    {selectedFriend?.friend_id === friend.friend_id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
                {filteredFriends.length === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Inga vänner hittades
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Avbryt
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!selectedFriend || isPending}
              className="flex-1"
            >
              {isPending ? 'Skickar...' : 'Skicka inbjudan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
