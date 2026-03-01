import { useState } from 'react'
import { Users, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFriends } from '@/hooks/useFriends'
import { useCreateSharedList } from '@/hooks/useSharedLists'
import { toast } from 'sonner'
import type { Friend } from '@/lib/types/friends'

interface CreateSharedListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (sharedListId: string) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function CreateSharedListDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSharedListDialogProps) {
  const [listName, setListName] = useState('')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friendSearch, setFriendSearch] = useState('')

  const { data: friends = [] } = useFriends()
  const { mutateAsync: createList, isPending } = useCreateSharedList()

  const filteredFriends = friendSearch.trim()
    ? friends.filter(f => f.friend_name.toLowerCase().includes(friendSearch.toLowerCase()))
    : friends

  function handleClose() {
    setListName('')
    setSelectedFriend(null)
    setFriendSearch('')
    onOpenChange(false)
  }

  async function handleCreate() {
    if (!listName.trim()) return

    const result = await createList({
      name: listName.trim(),
      friendUserId: selectedFriend?.friend_id,
    })

    if (result?.success) {
      const msg = selectedFriend
        ? `Lista "${listName.trim()}" skapad! Inbjudan skickad till ${selectedFriend.friend_name}.`
        : `Lista "${listName.trim()}" skapad`
      toast.success(msg)
      onCreated?.(result.shared_list_id!)
      handleClose()
    } else {
      const msg =
        result?.error === 'not_friends'
          ? 'Du och den valda personen är inte vänner.'
          : 'Kunde inte skapa listan. Försök igen.'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Skapa gemensam lista
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Listnamn */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Listnamn</label>
            <Input
              placeholder="T.ex. Proteinlista med Johan"
              value={listName}
              onChange={e => setListName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {/* Lägg till vän direkt (valfritt) */}
          {friends.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Bjud in vän <span className="font-normal">(valfritt)</span>
              </label>
              <Input
                placeholder="Sök bland vänner..."
                value={friendSearch}
                onChange={e => setFriendSearch(e.target.value)}
                className="mb-1"
              />
              <div className="max-h-40 overflow-y-auto rounded-md border divide-y">
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
            </div>
          )}

          {/* Åtgärdsknappar */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Avbryt
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!listName.trim() || isPending}
              className="flex-1"
            >
              {isPending ? 'Skapar...' : 'Skapa lista'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
